import { describe, expect, it } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import { frame, pixelBuffer } from '../../testUtils/pixelFixtures';
import {
  buildGodotAtlasTextureResources,
  buildGodotJson,
  buildGodotSpriteFramesResource,
  buildPhaserArrayJson,
  buildPhaserJson,
  buildUnityJson,
  type AtlasExportInput,
} from './AtlasMetadataExporters';
import { atlasPageFileName, buildAtlasMetadataFiles } from './AtlasExportService';

function singlePageInput(overrides: Partial<AtlasExportInput> = {}): AtlasExportInput {
  // 32x32 sheet, three 16x16 cells, each cell keeps a 10x10 core inset by 3px.
  const buffer = pixelBuffer(32, 32, (x, y) => {
    const insideX = x % 16;
    const insideY = y % 16;
    return insideX >= 3 && insideX < 13 && insideY >= 3 && insideY < 13
      ? [255, 255, 255, 255]
      : null;
  });
  const layout = buildAtlasLayout({
    frames: [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1), frame(0, 16, 16, 16, 2)],
    buffer,
    options: { ...DEFAULT_ATLAS_PACK_OPTIONS, padding: 0, pivotMode: 'bottomCenter' },
  });

  return {
    layout,
    pageFileName: page => atlasPageFileName(page, layout.pages.length),
    pretty: false,
    ...overrides,
  };
}

function multiPageInput(): AtlasExportInput {
  const buffer = pixelBuffer(32, 32, (x, y) => (x < 16 && y < 16 ? [255, 0, 0, 255] : null));
  const frames = [0, 1, 2, 3, 4, 5].map(i => frame((i % 2) * 16, Math.floor(i / 2) * 16, 16, 16, i));

  const layout = buildAtlasLayout({
    frames,
    buffer,
    options: { ...DEFAULT_ATLAS_PACK_OPTIONS, padding: 0, maxPageSize: 16 },
  });

  expect(layout.pages.length).toBeGreaterThan(1);
  return {
    layout,
    pageFileName: page => atlasPageFileName(page, layout.pages.length),
    pretty: false,
  };
}

describe('page file naming', () => {
  it('uses a plain name for a single page', () => {
    expect(atlasPageFileName(0, 1)).toBe('atlas.png');
  });

  it('numbers the pages of a multi page atlas', () => {
    expect(atlasPageFileName(0, 3)).toBe('atlas_0.png');
    expect(atlasPageFileName(2, 3)).toBe('atlas_2.png');
  });
});

describe('Phaser exporters', () => {
  it('writes a JSON Hash with one entry per sprite', () => {
    const input = singlePageInput();
    const json = JSON.parse(buildPhaserJson(input, 0));

    expect(Object.keys(json.frames)).toEqual(['frame_0001', 'frame_0002', 'frame_0003']);
    expect(json.meta.image).toBe('atlas.png');
    expect(json.meta.format).toBe('RGBA8888');
    expect(json.meta.size).toEqual({ w: input.layout.pages[0].width, h: input.layout.pages[0].height });

    const first = json.frames.frame_0001;
    const sprite = input.layout.sprites[0];
    expect(first.frame).toEqual({
      x: sprite.atlas.x,
      y: sprite.atlas.y,
      w: sprite.atlas.width,
      h: sprite.atlas.height,
    });
    expect(first.trimmed).toBe(true);
    expect(first.rotated).toBe(false);
    expect(first.sourceSize).toEqual({ w: 16, h: 16 });
    expect(first.spriteSourceSize).toEqual({ x: 3, y: 3, w: 10, h: 10 });
    expect(first.pivot).toEqual({ x: 0.5, y: 1 });
  });

  it('writes a JSON Array carrying the frame name', () => {
    const input = singlePageInput();
    const json = JSON.parse(buildPhaserArrayJson(input, 0));

    expect(Array.isArray(json.frames)).toBe(true);
    expect(json.frames.map((frame: { filename: string }) => frame.filename)).toEqual([
      'frame_0001',
      'frame_0002',
      'frame_0003',
    ]);
    expect(json.frames[0].frame.w).toBe(10);
  });

  it('writes one file per page for a multi page atlas', () => {
    const input = multiPageInput();
    const first = JSON.parse(buildPhaserJson(input, 0));
    const second = JSON.parse(buildPhaserJson(input, 1));

    expect(first.meta.image).toBe('atlas_0.png');
    expect(second.meta.image).toBe('atlas_1.png');

    const firstIds = Object.keys(first.frames);
    const secondIds = Object.keys(second.frames);
    expect(firstIds.filter(id => secondIds.includes(id))).toEqual([]);
  });
});

describe('Godot exporters', () => {
  it('describes the region, the margins and the pivot', () => {
    const input = singlePageInput();
    const json = JSON.parse(buildGodotJson(input, 0));
    const entry = json.frames.frame_0001;

    expect(json.page).toBe('atlas.png');
    expect(entry.region.width).toBe(10);
    expect(entry.size).toEqual({ width: 16, height: 16 });
    // Left + right margin restore the trimmed 16px width.
    expect(entry.margin.left + entry.margin.right + entry.region.width).toBe(16);
    expect(entry.margin.top + entry.margin.bottom + entry.region.height).toBe(16);
    expect(entry.margin.left).toBe(3);
    expect(entry.margin.top).toBe(3);
    expect(entry.pivot).toEqual({ x: 0.5, y: 1 });
    expect(entry.trimmed).toBe(true);
  });

  it('writes one importable AtlasTexture resource per sprite', () => {
    const input = singlePageInput();
    const resources = buildGodotAtlasTextureResources(input);

    expect(resources).toHaveLength(3);
    expect(resources[0].path).toBe('godot/frame_0001.tres');

    const sprite = input.layout.sprites[0];
    const content = resources[0].content;
    expect(content.startsWith('[gd_resource type="AtlasTexture" load_steps=2 format=3]')).toBe(true);
    expect(content).toContain('[ext_resource type="Texture2D" path="res://atlas.png" id="1_tex0"]');
    expect(content).toContain('atlas = ExtResource("1_tex0")');
    expect(content).toContain(
      `region = Rect2(${sprite.atlas.x}, ${sprite.atlas.y}, ${sprite.atlas.width}, ${sprite.atlas.height})`
    );
  });

  it('writes a SpriteFrames resource with one sub resource per sprite', () => {
    const input = singlePageInput({ fps: 12 });
    const content = buildGodotSpriteFramesResource(input);

    expect(content.startsWith('[gd_resource type="SpriteFrames" load_steps=5 format=3]')).toBe(true);
    expect(content.match(/\[sub_resource type="AtlasTexture"/g)).toHaveLength(3);
    expect(content).toContain('"name": &"default"');
    expect(content).toContain('"speed": 12.0');
    expect(content).toContain('"texture": SubResource("AtlasTexture_frame_0001")');
    expect(content).toContain('"loop": true');
  });

  it('uses the requested animation name and a safe default speed', () => {
    const content = buildGodotSpriteFramesResource(
      singlePageInput({ animationName: 'walk', fps: 0 })
    );
    expect(content).toContain('"name": &"walk"');
    expect(content).toContain('"speed": 8.0');
  });

  it('references every page from the SpriteFrames resource', () => {
    const input = multiPageInput();
    const content = buildGodotSpriteFramesResource(input);

    input.layout.pages.forEach((_, page) => {
      expect(content).toContain(`id="1_tex${page}"`);
    });
  });
});

describe('Unity exporter', () => {
  it('writes TexturePacker compatible entries with a custom pivot', () => {
    const input = singlePageInput();
    const json = JSON.parse(buildUnityJson(input, 0));

    expect(json.meta.image).toBe('atlas.png');
    expect(json.meta.scale).toBe('1');

    const entry = json.frames['frame_0001.png'];
    expect(entry.frame.w).toBe(10);
    expect(entry.frame.h).toBe(10);
    expect(entry.pivot).toEqual({ x: 0.5, y: 1 });
    expect(entry.sourceSize).toEqual({ w: 16, h: 16 });
    expect(entry.spriteSourceSize).toEqual({ x: 3, y: 3, w: 10, h: 10 });
    expect(entry.rotated).toBe(false);
  });
});

describe('buildAtlasMetadataFiles', () => {
  it('writes every requested format for a single page atlas', () => {
    const input = singlePageInput();
    const files = buildAtlasMetadataFiles({ ...input, formats: ['phaser', 'godot', 'unity'], pages: [] });
    const paths = files.map(file => file.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        'phaser.json',
        'phaser-array.json',
        'godot.json',
        'unity.json',
        'godot/frame_0001.tres',
        'godot/spriteframes.tres',
        'Unity/PixelSlicerAtlas.cs',
        'README.txt',
      ])
    );
  });

  it('omits the formats that were not selected', () => {
    const input = singlePageInput();
    const files = buildAtlasMetadataFiles({ ...input, formats: ['unity'], pages: [] });
    const paths = files.map(file => file.path);

    expect(paths).toContain('unity.json');
    expect(paths).not.toContain('phaser.json');
    expect(paths).not.toContain('godot/frame_0001.tres');
  });

  it('numbers the metadata of a multi page atlas', () => {
    const input = multiPageInput();
    const files = buildAtlasMetadataFiles({ ...input, formats: ['phaser', 'unity'], pages: [] });
    const paths = files.map(file => file.path);

    input.layout.pages.forEach((_, page) => {
      expect(paths).toContain(`phaser_${page}.json`);
      expect(paths).toContain(`unity_${page}.json`);
    });
  });

  it('documents the engine specific steps in the readme', () => {
    const input = singlePageInput();
    const files = buildAtlasMetadataFiles({ ...input, formats: ['phaser', 'godot', 'unity'], pages: [] });
    const readme = files.find(file => file.path === 'README.txt')!.content;

    expect(readme).toContain('load.atlas');
    expect(readme).toContain('spriteframes.tres');
    expect(readme).toContain('Tools > PixelSlicer');
    expect(readme).toContain('Occupancy');
  });
});
