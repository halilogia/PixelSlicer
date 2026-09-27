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
export const ATLAS_APP_VERSION = '2.5.0';

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
      // A rotated sprite reports the rotated extent, as Phaser expects.
      w: sprite.rotated ? sprite.atlas.height : sprite.atlas.width,
      h: sprite.rotated ? sprite.atlas.width : sprite.atlas.height,
    },
    rotated: sprite.rotated,
    trimmed: sprite.wasTrimmed,
    // Offset of the trimmed content inside the original frame.
    spriteSourceSize: {
      x: round(sprite.offset.x),
      y: round(sprite.offset.y),
      w: sprite.rotated ? sprite.atlas.height : sprite.atlas.width,
      h: sprite.rotated ? sprite.atlas.width : sprite.atlas.height,
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
    const width = sprite.rotated ? sprite.atlas.height : sprite.atlas.width;
    const height = sprite.rotated ? sprite.atlas.width : sprite.atlas.height;
    const region = {
      x: sprite.atlas.x,
      y: sprite.atlas.y,
      width,
      height,
    };

    frames[sprite.name] = {
      texture: input.pageFileName(page),
      region,
      // Godot's AtlasTexture cannot rotate a region, so the rotation is only
      // reported here: the sprite has to be drawn turned by the consumer.
      rotated: sprite.rotated,
      // Restores the untrimmed sprite size once applied to an AtlasTexture.
      margin: {
        left: sprite.offset.x,
        top: sprite.offset.y,
        right: sprite.source.width - sprite.offset.x - width,
        bottom: sprite.source.height - sprite.offset.y - height,
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
    const width = sprite.rotated ? sprite.atlas.height : sprite.atlas.width;
    const height = sprite.rotated ? sprite.atlas.width : sprite.atlas.height;

    frames[`${sprite.name}.png`] = {
      frame: {
        x: sprite.atlas.x,
        y: sprite.atlas.y,
        w: width,
        h: height,
      },
      rotated: sprite.rotated,
      trimmed: sprite.wasTrimmed,
      spriteSourceSize: {
        x: round(sprite.offset.x),
        y: round(sprite.offset.y),
        w: width,
        h: height,
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

// ---------------------------------------------------------------------------
// Starling
// ---------------------------------------------------------------------------

function starlingSubTexture(sprite: AtlasSprite): string {
  const width = sprite.rotated ? sprite.atlas.height : sprite.atlas.width;
  const height = sprite.rotated ? sprite.atlas.width : sprite.atlas.height;
  const frameX = sprite.atlas.x - sprite.offset.x;
  const frameY = sprite.atlas.y - sprite.offset.y;
  const rotation = sprite.rotated ? 90 : 0;

  return [
    `    <SubTexture name="${sprite.name}" x="${frameX}" y="${frameY}"`,
    `        width="${width}" height="${height}" frameX="${frameX}" frameY="${frameY}"`,
    `        rotation="${rotation}" frameWidth="${sprite.source.width}" frameHeight="${sprite.source.height}"/>`,
  ].join('\n');
}

/**
 * Starling `atlas.xml`. Starling trims by reading `frameX`/`frameY`, so the
 * untrimmed frame is restored through those two attributes.
 */
export function buildStarlingXml(input: AtlasExportInput, page: number): string {
  const pageEntry = input.layout.pages[page];
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<TextureAtlas imagePath="' + input.pageFileName(page) + '" width="' + pageEntry.width +
      '" height="' + pageEntry.height + '">',
  ];

  spritesOfPage(input, page).forEach(sprite => {
    lines.push(starlingSubTexture(sprite));
  });

  lines.push('</TextureAtlas>');
  return `${lines.join('\n')}\n`;
}

/** Starling texture atlas in the JSON form the Starling tooling accepts. */
export function buildStarlingJson(input: AtlasExportInput, page: number): string {
  const pageEntry = input.layout.pages[page];
  const frames: Record<string, unknown> = {};

  spritesOfPage(input, page).forEach(sprite => {
    const width = sprite.rotated ? sprite.atlas.height : sprite.atlas.width;
    const height = sprite.rotated ? sprite.atlas.width : sprite.atlas.height;

    frames[sprite.name] = {
      frame: { x: sprite.atlas.x, y: sprite.atlas.y, w: width, h: height },
      rotated: sprite.rotated,
      trimmed: sprite.wasTrimmed,
      spriteSourceSize: {
        x: round(sprite.offset.x),
        y: round(sprite.offset.y),
        w: width,
        h: height,
      },
      sourceSize: { w: sprite.source.width, h: sprite.source.height },
    };
  });

  return toJson(
    {
      frames,
      metadata: {
        image: input.pageFileName(page),
        size: { w: pageEntry.width, h: pageEntry.height },
        scale: '1',
        format: 'RGBA8888',
        generator: `${ATLAS_APP_NAME} ${ATLAS_APP_VERSION}`,
      },
    },
    input.pretty
  );
}

// ---------------------------------------------------------------------------
// Unity native assets
// ---------------------------------------------------------------------------

/** Deterministic GUID so re-exporting the same atlas keeps the same identity. */
export function atlasGuid(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const tail = (hash >>> 0).toString(16).padStart(8, '0');
  return `${tail}${tail}${tail}${tail}`.slice(0, 32);
}

function unityMetaFor(input: AtlasExportInput, page: number): string {
  const texturePath = input.pageFileName(page);
  const textureGuid = atlasGuid(`${texturePath}:texture`);
  const sprites = spritesOfPage(input, page);
  const spriteBlock = sprites
    .map(sprite => {
      const width = sprite.rotated ? sprite.atlas.height : sprite.atlas.width;
      const height = sprite.rotated ? sprite.atlas.width : sprite.atlas.height;
      return [
        '    - serializedVersion: 2',
        `      name: ${sprite.name}`,
        `      rect: serializedVersion: 2`,
        '        serializedVersion: 2',
        `        x: ${sprite.atlas.x}`,
        `        y: ${sprite.atlas.y}`,
        `        width: ${width}`,
        `        height: ${height}`,
        `      alignment: 1`,
        `      pivot: {x: ${round(sprite.pivot.x)}, y: ${round(sprite.pivot.y)}}`,
        `      spriteID: ${atlasGuid(`${texturePath}:${sprite.name}`)}`,
        '      borders: []',
        `      pixelsToUnits: 100`,
        '      alphaIsTransparency: 1',
        '    ',
      ].join('\n');
    })
    .join('\n');

  return [
    'fileFormatVersion: 2',
    `guid: ${textureGuid}`,
    'TextureImporter:',
    '  internalIDToNameTable: []',
    '  externalObjects: {}',
    '  serializedVersion: 12',
    '  mipmaps:',
    '    mipMapMode: 0',
    '    enableMipMap: 0',
    '  spriteMode: 2',
    `  spritePixelsToUnits: 100`,
    '  spriteBorder: {left: 0, bottom: 0, right: 0, top: 0}',
    '  spriteGenerateFallbackPhysicsShape: 1',
    `  spritePackingTag: ${ATLAS_APP_NAME.toLowerCase()}`,
    '  spriteSheet:',
    '    serializedVersion: 2',
    '    sprites:',
    spriteBlock,
    '    outline: []',
    '    physicsShape: []',
    '    bones: []',
    '    spriteID:',
    `  spriteRect: serializedVersion: 2`,
    '    serializedVersion: 2',
    '    x: 0',
    '    y: 0',
    '    width: 0',
    '    height: 0',
    '  assetBundleName: ',
    '  assetBundleVariant: ',
    '',
  ].join('\n');
}

function unitySpriteAtlas(input: AtlasExportInput, pages: number): string {
  const spriteRefs = Array.from({ length: pages }, (_, page) =>
    spritesOfPage(input, page)
      .map(
        sprite =>
          `  - {fileID: 21300000, guid: ${atlasGuid(`${input.pageFileName(page)}:${sprite.name}`)}, type: 3}`
      )
      .join('\n')
  )
    .filter(line => line.length > 0)
    .join('\n');

  return [
    '%YAML 1.1',
    '%TAG !u! tag:unity3d.com,2011:',
    '--- !u!687078895 &1',
    'SpriteAtlas:',
    '  m_ObjectHideFlags: 0',
    '  m_CorrespondingSourceObject: {fileID: 0}',
    '  m_PrefabInstance: {fileID: 0}',
    '  m_PrefabAsset: {fileID: 0}',
    '  m_Name: PixelSlicerAtlas',
    '  m_EditorClassIdentifier: ',
    '  m_Sprites:',
    spriteRefs,
    '  m_Atlas: []',
    '  m_UseSpriteReplacement: 0',
    '  m_PackingSettings:',
    '    serializedVersion: 2',
    '    padding: 2',
    '    enableRotation: 0',
    '    enableTightPacking: 0',
    '    filterMode: 1',
    '  m_NameFormat: 0',
    '  m_Variant: false',
    '  m_SpritePackingTag: PixelSlicer',
    '',
  ].join('\n');
}

/**
 * The `.meta` + `.spriteatlas` pair that turns the exported PNG into real
 * Unity sprites. Regenerated on export, so an existing asset is overwritten.
 *
 * If Unity rewrites the `.meta` (it does that for invalid importer settings)
 * the bundled `Unity/PixelSlicerAtlas.cs` remains the reliable path.
 */
export function buildUnityNativeAssets(
  input: AtlasExportInput
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  for (let page = 0; page < input.layout.pages.length; page++) {
    files.push({ path: `${input.pageFileName(page)}.meta`, content: unityMetaFor(input, page) });
  }

  files.push({ path: 'PixelSlicerAtlas.spriteatlas', content: unitySpriteAtlas(input, input.layout.pages.length) });
  return files;
}

// ---------------------------------------------------------------------------
// Unity editor scripts
// ---------------------------------------------------------------------------

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
