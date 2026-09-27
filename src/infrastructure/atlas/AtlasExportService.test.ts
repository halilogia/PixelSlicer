import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import { frame, pixelBuffer } from '../../testUtils/pixelFixtures';
import { FakeConvertibleCanvas } from '../../testUtils/canvasFixtures';
import type { AtlasPageImage } from './AtlasRenderer';
import { atlasPageFileName, exportAtlasZip, type AtlasBundleInput } from './AtlasExportService';

function fakePage(): AtlasPageImage {
  return new FakeConvertibleCanvas(8, 8) as unknown as AtlasPageImage;
}

function bundleInput(formats: AtlasBundleInput['formats'], pages = 1): AtlasBundleInput {
  const buffer = pixelBuffer(32, 16, (x, y) => (x % 16 >= 3 && y >= 3 && y < 13 ? [255, 0, 0, 255] : null));
  const frames = [
    frame(0, 0, 16, 16, 0),
    frame(16, 0, 16, 16, 1),
  ];
  const layout = buildAtlasLayout({
    frames,
    buffer,
    options: { ...DEFAULT_ATLAS_PACK_OPTIONS, padding: 0, maxPageSize: 64 },
  });

  return {
    layout,
    formats,
    pages: Array.from({ length: pages }, () => fakePage()),
    pageFileName: page => atlasPageFileName(page, layout.pages.length),
    fps: 8,
    pretty: false,
  };
}

async function listEntries(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  // JSZip also materializes the implicit folder entries.
  return Object.keys(zip.files)
    .filter(name => !zip.files[name].dir)
    .sort();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('atlasPageFileName', () => {
  it('numbers pages only when there is more than one', () => {
    expect(atlasPageFileName(0, 1)).toBe('atlas.png');
    expect(atlasPageFileName(1, 4)).toBe('atlas_1.png');
  });
});

describe('exportAtlasZip', () => {
  it('bundles the texture, every descriptor and the readme', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
    vi.stubGlobal('HTMLCanvasElement', FakeConvertibleCanvas);

    const blob = await exportAtlasZip(bundleInput(['phaser', 'godot', 'unity']));
    const entries = await listEntries(blob);

    expect(entries).toEqual(
      expect.arrayContaining([
        'README.txt',
        'Unity/PixelSlicerAtlas.cs',
        'atlas.png',
        'godot.json',
        'godot/frame_0001.tres',
        'godot/spriteframes.tres',
        'phaser-array.json',
        'phaser.json',
        'unity.json',
      ])
    );
  });

  it('only writes the selected formats', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
    vi.stubGlobal('HTMLCanvasElement', FakeConvertibleCanvas);

    const entries = await listEntries(await exportAtlasZip(bundleInput(['unity'])));
    expect(entries).toEqual([
      'PixelSlicerAtlas.spriteatlas',
      'README.txt',
      'Unity/PixelSlicerAtlas.cs',
      'atlas.png',
      'atlas.png.meta',
      'unity.json',
    ]);
  });

  it('writes the Starling descriptors and xml', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
    vi.stubGlobal('HTMLCanvasElement', FakeConvertibleCanvas);

    const entries = await listEntries(await exportAtlasZip(bundleInput(['starling'])));
    expect(entries).toEqual(['README.txt', 'atlas.png', 'atlas.xml', 'starling.json']);
  });

  it('numbers the pages of a multi page atlas', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
    vi.stubGlobal('HTMLCanvasElement', FakeConvertibleCanvas);

    const input = bundleInput(['phaser']);
    const multiPage = {
      ...input,
      layout: {
        ...input.layout,
        pages: [
          { index: 0, width: 32, height: 32 },
          { index: 1, width: 32, height: 32 },
        ],
        sprites: [
          { ...input.layout.sprites[0], page: 0, order: 0 },
          { ...input.layout.sprites[1], page: 1, order: 1 },
        ],
      },
      pages: [fakePage(), fakePage()],
      pageFileName: (page: number) => atlasPageFileName(page, 2),
    };

    const entries = await listEntries(await exportAtlasZip(multiPage));
    expect(entries).toEqual([
      'README.txt',
      'atlas_0.png',
      'atlas_1.png',
      'phaser-array_0.json',
      'phaser-array_1.json',
      'phaser_0.json',
      'phaser_1.json',
    ]);
  });

  it('refuses to export an empty layout', async () => {
    await expect(
      exportAtlasZip({
        ...bundleInput(['phaser']),
        layout: { pages: [], sprites: [], occupancy: 0, savedPixels: 0, warnings: [] },
      })
    ).rejects.toThrow(/No active frames/);
  });
});
