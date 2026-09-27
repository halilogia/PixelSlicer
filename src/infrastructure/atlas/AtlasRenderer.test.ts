import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import {
  canvasToBlob,
  createAtlasCanvas,
  drawAtlasPage,
  readPixelBuffer,
  sourceSize,
  type AtlasCanvas,
  type AtlasSourceImage,
} from './AtlasRenderer';
import { buildAtlasPages } from './AtlasPipeline';
import { frame } from '../../testUtils/pixelFixtures';
import { FakeCanvas, FakeConvertibleCanvas } from '../../testUtils/canvasFixtures';

function fakeCanvas(): FakeCanvas {
  return new FakeCanvas();
}

function layoutFixture(frames = [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1)]) {
  return buildAtlasLayout({
    frames,
    buffer: { width: 32, height: 16, data: new Uint8ClampedArray(32 * 16 * 4) },
    options: { ...DEFAULT_ATLAS_PACK_OPTIONS, trim: false, padding: 2, extrude: 0 },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sourceSize', () => {
  it('prefers the natural size of an HTMLImageElement', () => {
    const image = { naturalWidth: 64, naturalHeight: 32, width: 300, height: 150 };
    expect(sourceSize(image as unknown as AtlasSourceImage)).toEqual({ width: 64, height: 32 });
  });

  it('falls back to the pixel size of a canvas or bitmap', () => {
    expect(sourceSize({ width: 8, height: 4 } as unknown as AtlasSourceImage)).toEqual({
      width: 8,
      height: 4,
    });
  });
});

describe('createAtlasCanvas', () => {
  it('prefers OffscreenCanvas when the browser supports it', () => {
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    expect(createAtlasCanvas(12, 6)).toBeInstanceOf(FakeCanvas);
  });

  it('falls back to a DOM canvas', () => {
    vi.stubGlobal(
      'document',
      { createElement: () => new FakeCanvas() }
    );
    expect(createAtlasCanvas(12, 6)).toBeInstanceOf(FakeCanvas);
  });
});

describe('readPixelBuffer', () => {
  it('copies the source into an RGBA buffer of the same size', () => {
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    const buffer = readPixelBuffer({ width: 4, height: 2 } as unknown as AtlasSourceImage);

    expect(buffer.width).toBe(4);
    expect(buffer.height).toBe(2);
    expect(buffer.data).toHaveLength(4 * 2 * 4);
  });
});

describe('drawAtlasPage', () => {
  it('sizes the canvas and clears it before drawing', () => {
    const canvas = fakeCanvas();
    const layout = layoutFixture();
    const page = layout.pages[0];

    drawAtlasPage(canvas as unknown as AtlasCanvas, fakeCanvas() as unknown as AtlasSourceImage, layout.sprites, page, {
      extrude: 0,
    });

    expect(canvas.width).toBe(page.width);
    expect(canvas.height).toBe(page.height);
    expect(canvas.context.cleared[0].args).toEqual([0, 0, page.width, page.height]);
    expect(canvas.context.saved).toBe(1);
    expect(canvas.context.restored).toBe(1);
  });

  it('copies every sprite from its trimmed rect to its atlas rect', () => {
    const canvas = fakeCanvas();
    const layout = layoutFixture();
    const page = layout.pages[0];

    drawAtlasPage(canvas as unknown as AtlasCanvas, fakeCanvas() as unknown as AtlasSourceImage, layout.sprites, page, {
      extrude: 0,
    });

    expect(canvas.context.calls).toHaveLength(layout.sprites.length);
    layout.sprites.forEach((sprite, i) => {
      expect(canvas.context.calls[i].args).toEqual([
        sprite.trimmed.x,
        sprite.trimmed.y,
        sprite.trimmed.width,
        sprite.trimmed.height,
        sprite.atlas.x,
        sprite.atlas.y,
        sprite.atlas.width,
        sprite.atlas.height,
      ]);
    });
  });

  it('replicates the border into the extrude ring without leaving the box', () => {
    const canvas = fakeCanvas();
    const layout = buildAtlasLayout({
      frames: [frame(0, 0, 16, 16, 0)],
      buffer: { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4) },
      options: { ...DEFAULT_ATLAS_PACK_OPTIONS, trim: false, padding: 0, extrude: 2 },
    });
    const page = layout.pages[0];
    const sprite = layout.sprites[0];

    drawAtlasPage(canvas as unknown as AtlasCanvas, fakeCanvas() as unknown as AtlasSourceImage, layout.sprites, page, {
      extrude: 2,
    });

    // Content + 4 edges + 4 corners.
    expect(canvas.context.calls).toHaveLength(9);

    canvas.context.calls.forEach(call => {
      const [sx, sy, sw, sh, dx, dy] = call.args;
      expect(sx).toBeGreaterThanOrEqual(sprite.trimmed.x);
      expect(sy).toBeGreaterThanOrEqual(sprite.trimmed.y);
      expect(sx + sw).toBeLessThanOrEqual(sprite.trimmed.x + sprite.trimmed.width);
      expect(sy + sh).toBeLessThanOrEqual(sprite.trimmed.y + sprite.trimmed.height);
      expect(dx).toBeGreaterThanOrEqual(sprite.box.x);
      expect(dy).toBeGreaterThanOrEqual(sprite.box.y);
      expect(dx + call.args[6]).toBeLessThanOrEqual(sprite.box.x + sprite.box.width);
      expect(dy + call.args[7]).toBeLessThanOrEqual(sprite.box.y + sprite.box.height);
    });
  });

  it('disables image smoothing for pixel art', () => {
    const canvas = fakeCanvas();
    const layout = layoutFixture();
    drawAtlasPage(canvas as unknown as AtlasCanvas, fakeCanvas() as unknown as AtlasSourceImage, layout.sprites, layout.pages[0], {
      extrude: 0,
    });
    expect(canvas.context.imageSmoothingEnabled).toBe(false);
  });
});

describe('buildAtlasPages', () => {
  it('returns one canvas per page', () => {
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    const frames = [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1), frame(0, 16, 16, 16, 2)];
    const source = { width: 32, height: 32 } as unknown as AtlasSourceImage;

    const { layout, pages } = buildAtlasPages(source, frames, {
      ...DEFAULT_ATLAS_PACK_OPTIONS,
      maxPageSize: 32,
    });

    expect(pages).toHaveLength(layout.pages.length);
    pages.forEach((page, index) => {
      expect((page as unknown as FakeCanvas).width).toBe(layout.pages[index].width);
      expect((page as unknown as FakeCanvas).height).toBe(layout.pages[index].height);
    });
  });
});

describe('canvasToBlob', () => {
  it('encodes an OffscreenCanvas through convertToBlob', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);

    const blob = await canvasToBlob(new FakeConvertibleCanvas(4, 4) as unknown as AtlasCanvas);
    expect(blob.type).toBe('image/png');
    expect(await blob.text()).toBe('atlas');
  });

  it('draws a worker ImageBitmap into a scratch canvas first', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
    vi.stubGlobal('HTMLCanvasElement', FakeCanvas);

    const blob = await canvasToBlob({ width: 2, height: 2 } as unknown as ImageBitmap);
    expect(await blob.text()).toBe('atlas');
  });
});
