import { describe, expect, it } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { DEFAULT_ATLAS_PACK_OPTIONS, type AtlasLayout, type AtlasPackOptions } from '@domain/atlas/AtlasTypes';
import { frame, pixelBuffer } from '../../testUtils/pixelFixtures';
import {
  atlasGuid,
  buildPhaserJson,
  buildStarlingJson,
  buildStarlingXml,
  buildUnityJson,
  buildUnityNativeAssets,
  type AtlasExportInput,
} from './AtlasMetadataExporters';
import { readAtlasDescriptor } from './AtlasReader';

function options(overrides: Partial<AtlasPackOptions> = {}): AtlasPackOptions {
  return { ...DEFAULT_ATLAS_PACK_OPTIONS, ...overrides };
}

function exportInput(overrides: Partial<AtlasPackOptions> = {}): AtlasExportInput {
  const buffer = pixelBuffer(32, 16, (x, y) => (x % 16 >= 3 && y >= 3 && y < 13 ? [255, 0, 0, 255] : null));
  const layout = buildAtlasLayout({
    frames: [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1)],
    buffer,
    options: options(overrides),
  });

  return { layout, pageFileName: () => 'atlas.png', pretty: false };
}

/** A layout with a rotated sprite, injected to test the metadata mapping. */
function rotatedLayout(): AtlasLayout {
  return {
    pages: [{ index: 0, width: 64, height: 64 }],
    sprites: [
      {
        name: 'tall',
        frameIndex: 0,
        order: 0,
        page: 0,
        rotated: true,
        source: { x: 0, y: 0, width: 12, height: 40 },
        trimmed: { x: 0, y: 0, width: 12, height: 40 },
        offset: { x: 0, y: 0 },
        pivot: { x: 0.5, y: 0.5 },
        wasTrimmed: true,
        box: { x: 0, y: 0, width: 40, height: 12 },
        atlas: { x: 0, y: 0, width: 40, height: 12 },
      },
    ],
    occupancy: 0.2,
    savedPixels: 100,
    warnings: [],
  };
}

describe('rotated metadata', () => {
  const input: AtlasExportInput = {
    layout: rotatedLayout(),
    pageFileName: () => 'atlas.png',
    pretty: false,
  };

  it('reports the transposed extent to Phaser', () => {
    const json = JSON.parse(buildPhaserJson(input, 0));
    const entry = json.frames.tall;

    expect(entry.rotated).toBe(true);
    // Stored 40x12 for a 12x40 sprite.
    expect(entry.frame).toEqual({ x: 0, y: 0, w: 12, h: 40 });
    expect(entry.spriteSourceSize).toEqual({ x: 0, y: 0, w: 12, h: 40 });
    expect(entry.sourceSize).toEqual({ w: 12, h: 40 });
  });

  it('reports the transposed extent to Unity', () => {
    const json = JSON.parse(buildUnityJson(input, 0));
    const entry = json.frames['tall.png'];

    expect(entry.rotated).toBe(true);
    expect(entry.frame.w).toBe(12);
    expect(entry.frame.h).toBe(40);
  });

  it('keeps the rotation visible in the Starling xml', () => {
    const xml = buildStarlingXml(input, 0);

    expect(xml).toContain('rotation="90"');
    expect(xml).toContain('width="12" height="40"');
    expect(xml).toContain('frameWidth="12" frameHeight="40"');
  });
});

describe('Starling exporters', () => {
  const input = exportInput();

  it('writes a texture atlas element with the page size', () => {
    const xml = buildStarlingXml(input, 0);

    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(xml).toContain('<TextureAtlas imagePath="atlas.png"');
    expect(xml).toContain('</TextureAtlas>');
    expect(xml).toContain('name="frame_0001"');
  });

  it('reports an upright sprite as unrotated', () => {
    const xml = buildStarlingXml(input, 0);
    expect(xml).toContain('rotation="0"');
  });

  it('writes the JSON flavour with metadata', () => {
    const json = JSON.parse(buildStarlingJson(input, 0));

    expect(json.metadata.image).toBe('atlas.png');
    expect(json.frames.frame_0001.rotated).toBe(false);
    expect(json.frames.frame_0001.sourceSize).toEqual({ w: 16, h: 16 });
  });
});

describe('Unity native assets', () => {
  const input = exportInput();

  it('writes a meta per page and one sprite atlas', () => {
    const files = buildUnityNativeAssets(input);
    const paths = files.map(file => file.path);

    expect(paths).toEqual(['atlas.png.meta', 'PixelSlicerAtlas.spriteatlas']);
  });

  it('declares the sprite sheet with a custom pivot', () => {
    const meta = buildUnityNativeAssets(input)[0].content;

    expect(meta.startsWith('fileFormatVersion: 2')).toBe(true);
    expect(meta).toContain('spriteMode: 2');
    expect(meta).toContain('alignment: 1');
    expect(meta).toContain('pivot: {x: 0.5, y: 0.5}');
    expect(meta).toContain('name: frame_0001');
    expect(meta).toContain(`guid: ${atlasGuid('atlas.png:texture')}`);
  });

  it('references every sprite by its deterministic GUID', () => {
    const atlas = buildUnityNativeAssets(input)[1].content;

    expect(atlas).toContain('%YAML 1.1');
    expect(atlas).toContain('SpriteAtlas:');
    expect(atlas).toContain(`guid: ${atlasGuid('atlas.png:frame_0001')}`);
    expect(atlas).toContain(`guid: ${atlasGuid('atlas.png:frame_0002')}`);
    expect(atlas).toContain('enableRotation: 0');
  });

  it('produces stable GUIDs', () => {
    expect(atlasGuid('atlas.png:frame_0001')).toBe(atlasGuid('atlas.png:frame_0001'));
    expect(atlasGuid('atlas.png:frame_0001')).not.toBe(atlasGuid('atlas.png:frame_0002'));
    expect(atlasGuid('x')).toHaveLength(32);
  });
});

describe('readAtlasDescriptor', () => {
  it('reads a Phaser JSON Hash back into frames', () => {
    const input = exportInput();
    const imported = readAtlasDescriptor('phaser.json', buildPhaserJson(input, 0));

    expect(imported.frames).toHaveLength(2);
    const sprite = input.layout.sprites[0];
    expect(imported.frames[0]).toEqual({
      x: sprite.atlas.x - sprite.offset.x,
      y: sprite.atlas.y - sprite.offset.y,
      w: sprite.source.width,
      h: sprite.source.height,
      index: 0,
      isActive: true,
    });
  });

  it('reads a Phaser JSON Array', () => {
    const input = exportInput();
    const arrayJson = JSON.parse(buildPhaserJson(input, 0));
    const asArray = { frames: Object.values(arrayJson.frames as Record<string, unknown>) };
    const imported = readAtlasDescriptor('phaser.json', JSON.stringify(asArray));

    expect(imported.frames).toHaveLength(2);
  });

  it('reads the Godot descriptor with its margins', () => {
    const input = exportInput();
    const layout = input.layout;
    const godot = {
      size: { width: layout.pages[0].width, height: layout.pages[0].height },
      frames: Object.fromEntries(
        layout.sprites.map(sprite => [
          sprite.name,
          {
            region: {
              x: sprite.atlas.x,
              y: sprite.atlas.y,
              width: sprite.atlas.width,
              height: sprite.atlas.height,
            },
            margin: {
              left: sprite.offset.x,
              top: sprite.offset.y,
              right: sprite.source.width - sprite.offset.x - sprite.atlas.width,
              bottom: sprite.source.height - sprite.offset.y - sprite.atlas.height,
            },
            size: { width: sprite.source.width, height: sprite.source.height },
          },
        ])
      ),
    };

    const imported = readAtlasDescriptor('godot.json', JSON.stringify(godot));
    expect(imported.frames).toHaveLength(2);
    expect(imported.width).toBe(layout.pages[0].width);
    expect(imported.frames[0].w).toBe(16);
  });

  it('rejects invalid JSON', () => {
    expect(() => readAtlasDescriptor('phaser.json', 'nope')).toThrow(/not valid JSON/);
  });

  it('rejects a descriptor without frames', () => {
    expect(() => readAtlasDescriptor('phaser.json', '{"frames":{}}')).toThrow(/does not contain/);
    expect(() => readAtlasDescriptor('phaser.json', '{}')).toThrow(/does not look like/);
  });

  it('warns about a rotated sprite', () => {
    const input: AtlasExportInput = {
      layout: rotatedLayout(),
      pageFileName: () => 'atlas.png',
      pretty: false,
    };
    const imported = readAtlasDescriptor('phaser.json', buildPhaserJson(input, 0));

    expect(imported.warnings[0]).toMatch(/rotated/);
    // The import is always upright.
    expect(imported.frames[0]).toMatchObject({ w: 12, h: 40 });
  });
});
