// Infrastructure Layer - Atlas metadata exporters
// Pure string builders for Phaser / Godot / Unity so they can be unit tested
// without a DOM or a zip library.
//
// One metadata file is written per texture page. Multi page atlases therefore
// stay compatible with the classic single `meta` object layout that every
// engine importer expects.

import type { AtlasLayout, AtlasSprite } from '@domain/atlas/AtlasTypes';

export const ATLAS_APP_NAME = 'PixelSlicer';
/** Keep in sync with the `version` field in package.json. */
export const ATLAS_APP_VERSION = '2.2.0';

export interface AtlasExportInput {
  layout: AtlasLayout;
  /** File name of a texture page, e.g. `atlas_0.png`. */
  pageFileName: (page: number) => string;
  /** Frames per second, used by the Godot SpriteFrames resource. */
  fps?: number;
  /** Name of the animation written in the Godot SpriteFrames resource. */
  animationName?: string;
  /** Pretty print the JSON payloads. */
  pretty?: boolean;
}

function toJson(value: unknown, pretty = true): string {
  return JSON.stringify(value, null, pretty ? 2 : 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function spritesOfPage(input: AtlasExportInput, page: number): AtlasSprite[] {
  return input.layout.sprites.filter(sprite => sprite.page === page);
}

function pageSize(input: AtlasExportInput, page: number) {
  const size = input.layout.pages[page];
  return { w: size.width, h: size.height };
}

// ---------------------------------------------------------------------------
// Phaser 3
// ---------------------------------------------------------------------------

function phaserFrame(sprite: AtlasSprite) {
  return {
    frame: {
      x: sprite.atlas.x,
      y: sprite.atlas.y,
      w: sprite.atlas.width,
      h: sprite.atlas.height,
    },
    rotated: false,
    trimmed: sprite.wasTrimmed,
    // Offset of the trimmed content inside the original frame.
    spriteSourceSize: {
      x: round(sprite.offset.x),
      y: round(sprite.offset.y),
      w: sprite.atlas.width,
      h: sprite.atlas.height,
    },
    sourceSize: {
      w: sprite.source.width,
      h: sprite.source.height,
    },
    pivot: {
      x: round(sprite.pivot.x),
      y: round(sprite.pivot.y),
    },
  };
}

function phaserMeta(input: AtlasExportInput, page: number) {
  return {
    app: ATLAS_APP_NAME,
    version: ATLAS_APP_VERSION,
    image: input.pageFileName(page),
    format: 'RGBA8888',
    size: pageSize(input, page),
    scale: '1',
  };
}

/** Phaser 3 "JSON Hash" loader format. */
export function buildPhaserJson(input: AtlasExportInput, page: number): string {
  const frames: Record<string, unknown> = {};
  spritesOfPage(input, page).forEach(sprite => {
    frames[sprite.name] = phaserFrame(sprite);
  });

  return toJson({ frames, meta: phaserMeta(input, page) }, input.pretty);
}

/** Phaser 3 "JSON Array" loader format (frame names stored per entry). */
export function buildPhaserArrayJson(input: AtlasExportInput, page: number): string {
  const frames = spritesOfPage(input, page).map(sprite => ({
    filename: sprite.name,
    ...phaserFrame(sprite),
  }));

  return toJson({ frames, meta: phaserMeta(input, page) }, input.pretty);
}

// ---------------------------------------------------------------------------
// Godot 4
// ---------------------------------------------------------------------------

/** Machine readable atlas description for Godot side scripts / importers. */
export function buildGodotJson(input: AtlasExportInput, page: number): string {
  const frames: Record<string, unknown> = {};

  spritesOfPage(input, page).forEach(sprite => {
    frames[sprite.name] = {
      texture: input.pageFileName(page),
      region: {
        x: sprite.atlas.x,
        y: sprite.atlas.y,
        width: sprite.atlas.width,
        height: sprite.atlas.height,
      },
      // Restores the untrimmed sprite size once applied to an AtlasTexture.
      margin: {
        left: sprite.offset.x,
        top: sprite.offset.y,
        right: sprite.source.width - sprite.offset.x - sprite.atlas.width,
        bottom: sprite.source.height - sprite.offset.y - sprite.atlas.height,
      },
      size: { width: sprite.source.width, height: sprite.source.height },
      pivot: { x: round(sprite.pivot.x), y: round(sprite.pivot.y) },
      trimmed: sprite.wasTrimmed,
    };
  });

  return toJson(
    {
      generator: `${ATLAS_APP_NAME} ${ATLAS_APP_VERSION}`,
      page: input.pageFileName(page),
      size: pageSize(input, page),
      frames,
    },
    input.pretty
  );
}

function godotExtResources(input: AtlasExportInput, sprites: AtlasSprite[]): string {
  const pages = [...new Set(sprites.map(sprite => sprite.page))].sort((a, b) => a - b);
  return pages
    .map(page => `[ext_resource type="Texture2D" path="res://${input.pageFileName(page)}" id="1_tex${page}"]`)
    .join('\n');
}

function godotSubResourceId(sprite: AtlasSprite): string {
  // Sprite names are unique, and Godot ids only allow a restricted charset.
  return `AtlasTexture_${sprite.name.replace(/[^A-Za-z0-9_]/g, '_')}`;
}

function godotAtlasTextureBlock(sprite: AtlasSprite): string {
  return [
    `[sub_resource type="AtlasTexture" id="${godotSubResourceId(sprite)}"]`,
    `atlas = ExtResource("1_tex${sprite.page}")`,
    `region = Rect2(${sprite.atlas.x}, ${sprite.atlas.y}, ${sprite.atlas.width}, ${sprite.atlas.height})`,
    'margin = Rect2(0, 0, 0, 0)',
  ].join('\n');
}

/** One importable `AtlasTexture` resource per sprite. */
export function buildGodotAtlasTextureResources(
  input: AtlasExportInput
): Array<{ path: string; content: string }> {
  const { layout } = input;

  return layout.sprites.map(sprite => ({
    path: `godot/${sprite.name}.tres`,
    content: [
      '[gd_resource type="AtlasTexture" load_steps=2 format=3]',
      '',
      godotExtResources(input, [sprite]),
      '',
      '[resource]',
      `atlas = ExtResource("1_tex${sprite.page}")`,
      `region = Rect2(${sprite.atlas.x}, ${sprite.atlas.y}, ${sprite.atlas.width}, ${sprite.atlas.height})`,
      'margin = Rect2(0, 0, 0, 0)',
      'filter_clip = false',
      '',
    ].join('\n'),
  }));
}

/**
 * A ready to animate `SpriteFrames` resource holding every frame in order.
 * All sprites land in a single animation named `default` (or `animationName`).
 */
export function buildGodotSpriteFramesResource(input: AtlasExportInput): string {
  const { layout } = input;
  const fps = input.fps && input.fps > 0 ? input.fps : 8;
  const animation = input.animationName ?? 'default';

  const subResources = layout.sprites.map(sprite => godotAtlasTextureBlock(sprite)).join('\n\n');
  const frameEntries = layout.sprites
    .map(
      sprite =>
        `{\n"duration": 1.0,\n"texture": SubResource("${godotSubResourceId(sprite)}")\n}`
    )
    .join(',\n');

  const loadSteps = 1 + layout.pages.length + layout.sprites.length;

  return [
    `[gd_resource type="SpriteFrames" load_steps=${loadSteps} format=3]`,
    '',
    godotExtResources(input, layout.sprites),
    '',
    subResources,
    '',
    '[resource]',
    'animations = [{',
    `"frames": [\n${frameEntries}\n],`,
    '"loop": true,',
    `"name": &"${animation}",`,
    `"speed": ${fps}.0`,
    '}]',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Unity
// ---------------------------------------------------------------------------

/** TexturePacker compatible "Unity3D JSON" descriptor. */
export function buildUnityJson(input: AtlasExportInput, page: number): string {
  const frames: Record<string, unknown> = {};

  spritesOfPage(input, page).forEach(sprite => {
    frames[`${sprite.name}.png`] = {
      frame: {
        x: sprite.atlas.x,
        y: sprite.atlas.y,
        w: sprite.atlas.width,
        h: sprite.atlas.height,
      },
      rotated: false,
      trimmed: sprite.wasTrimmed,
      spriteSourceSize: {
        x: round(sprite.offset.x),
        y: round(sprite.offset.y),
        w: sprite.atlas.width,
        h: sprite.atlas.height,
      },
      sourceSize: {
        w: sprite.source.width,
        h: sprite.source.height,
      },
      // Normalized origin, imported as `SpriteAlignment.Custom`.
      pivot: {
        x: round(sprite.pivot.x),
        y: round(sprite.pivot.y),
      },
    };
  });

  return toJson(
    {
      frames,
      meta: {
        app: ATLAS_APP_NAME,
        version: ATLAS_APP_VERSION,
        image: input.pageFileName(page),
        format: 'RGBA8888',
        size: pageSize(input, page),
        scale: '1',
        smartupdate: '',
      },
    },
    input.pretty
  );
}

/**
 * Editor scripts that turn the exported PNG + JSON into real Unity sprites.
 * Drop both files in `Assets/`, then use `Tools > PixelSlicer`.
 * Requires `com.unity.nuget.newtonsoft-json` (bundled with Unity 2020.3+),
 * because UnityEngine.JsonUtility cannot read the `frames` dictionary.
 */
export const UNITY_IMPORTER_CS = `// PixelSlicer atlas importer.
// Place this file next to the exported atlas PNG + JSON, inside Assets/.
// The postprocessor reads "<atlas>.json" and creates one Sprite per atlas entry,
// then "Tools > PixelSlicer > Create SpriteAtlas From Selection" packs them.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.U2D;

namespace PixelSlicer.EditorTools
{
    [System.Serializable]
    public class PixelSlicerRect
    {
        public float x;
        public float y;
        public float w;
        public float h;
    }

    [System.Serializable]
    public class PixelSlicerPivot
    {
        public float x;
        public float y;
    }

    [System.Serializable]
    public class PixelSlicerFrame
    {
        public PixelSlicerRect frame;
        public bool trimmed;
        public PixelSlicerPivot pivot;
    }

    [System.Serializable]
    public class PixelSlicerMeta
    {
        public string image;
    }

    [System.Serializable]
    public class PixelSlicerDescriptor
    {
        public Dictionary<string, PixelSlicerFrame> frames;
        public List<PixelSlicerMeta> meta;
    }

    /// <summary>Turns a PixelSlicer JSON descriptor into a SpriteSheet.</summary>
    public class PixelSlicerAtlasPostprocessor : AssetPostprocessor
    {
        private const string MenuRoot = "Tools/PixelSlicer/";

        private void OnPostprocessTexture()
        {
            string jsonPath = Path.ChangeExtension(assetPath, ".json");
            if (!File.Exists(jsonPath)) return;

            var descriptor = PixelSlicerAtlasJson.Read(jsonPath);
            if (descriptor == null) return;
            if (!descriptor.meta.Any(m => m.image == Path.GetFileName(assetPath))) return;

            var importer = (TextureImporter)assetImporter;
            var settings = new TextureImporterSettings();
            importer.ReadTextureSettings(settings);
            if (settings.textureType != TextureImporterType.Sprite) return;

            importer.spritesheet = PixelSlicerAtlasJson.BuildSheet(descriptor);
        }

        [MenuItem(MenuRoot + "Create SpriteAtlas From Selection", true)]
        private static bool ValidateSelection()
        {
            return Selection.objects.Any(obj => obj is Sprite);
        }

        [MenuItem(MenuRoot + "Create SpriteAtlas From Selection")]
        private static void CreateSpriteAtlas()
        {
            var sprites = Selection.objects.OfType<Sprite>().ToArray();
            if (sprites.Length == 0)
            {
                EditorUtility.DisplayDialog("PixelSlicer", "Select the generated sprites first.", "OK");
                return;
            }

            string path = EditorUtility.SaveFilePanelInProject(
                "Create SpriteAtlas", "PixelSlicerAtlas", "spriteatlas", "Choose where to save the atlas.");
            if (string.IsNullOrEmpty(path)) return;

            var atlas = AssetDatabase.LoadAssetAtPath<SpriteAtlas>(path);
            if (atlas == null)
            {
                atlas = ScriptableObject.CreateInstance<SpriteAtlas>();
                AssetDatabase.CreateAsset(atlas, path);
            }

            atlas.Remove(atlas.sprites);
            foreach (var sprite in sprites)
            {
                atlas.Add(new SpriteAtlasEntry { sprite = sprite, spritePackingTag = "PixelSlicer" });
            }

            var packing = atlas.GetPackingSettings();
            packing.padding = 2;
            packing.enableRotation = false;
            packing.enableTightPacking = false;
            packing.filterMode = FilterMode.Bilinear;
            atlas.SetPackingSettings(packing);

            EditorUtility.SetDirty(atlas);
            AssetDatabase.SaveAssets();
            Selection.activeObject = atlas;
        }
    }

    /// <summary>Reader for the JSON produced by PixelSlicer.</summary>
    public static class PixelSlicerAtlasJson
    {
        public static PixelSlicerDescriptor Read(string jsonPath)
        {
            var descriptor = JsonConvert.DeserializeObject<PixelSlicerDescriptor>(File.ReadAllText(jsonPath));
            if (descriptor == null || descriptor.frames == null || descriptor.meta == null) return null;
            return descriptor;
        }

        /// <summary>Builds the Unity sprite sheet for one texture page.</summary>
        public static SpriteMetaData[] BuildSheet(PixelSlicerDescriptor descriptor)
        {
            var metas = new List<SpriteMetaData>();
            foreach (var pair in descriptor.frames.OrderBy(p => p.Key, System.StringComparer.Ordinal))
            {
                var frame = pair.Value;
                if (frame?.frame == null) continue;

                metas.Add(new SpriteMetaData
                {
                    name = Path.GetFileNameWithoutExtension(pair.Key),
                    rect = new Rect(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h),
                    alignment = 1, // SpriteAlignment.Custom
                    pivot = new Vector2(
                        frame.pivot != null ? frame.pivot.x : 0.5f,
                        frame.pivot != null ? frame.pivot.y : 0.5f),
                    alphaIsTransparency = true,
                });
            }
            return metas.ToArray();
        }
    }
}
`;
