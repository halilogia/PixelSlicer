import { describe, expect, it } from 'vitest';
import { buildAtlasLayout } from './AtlasLayout';
import { nextPowerOfTwo } from './AtlasPacker';
import { DEFAULT_ATLAS_PACK_OPTIONS, type AtlasPackOptions } from './AtlasTypes';
import { frame, pixelBuffer, paintRect } from '../../testUtils/pixelFixtures';

/** 64x32 sheet, 4x2 grid of 16x16 cells, each cell has a 10x10 opaque core. */
function gridSheet() {
  const buffer = pixelBuffer(64, 32, (x, y) => {
    const cellX = Math.floor(x / 16);
    const cellY = Math.floor(y / 16);
    const insideX = x % 16;
    const insideY = y % 16;
    const core = insideX >= 3 && insideX < 13 && insideY >= 3 && insideY < 13;
    return core ? ([cellX * 40, cellY * 40, 255, 255] as const) : null;
  });

  const frames = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      frames.push(frame(col * 16, row * 16, 16, 16, row * 4 + col));
    }
  }

  return { buffer, frames };
}

function options(overrides: Partial<AtlasPackOptions> = {}): AtlasPackOptions {
  return { ...DEFAULT_ATLAS_PACK_OPTIONS, ...overrides };
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

describe('buildAtlasLayout', () => {
  it('returns an empty layout for an empty frame list', () => {
    const layout = buildAtlasLayout({ frames: [], buffer: null, options: options() });
    expect(layout).toEqual({ pages: [], sprites: [], occupancy: 0, savedPixels: 0, warnings: [] });
  });

  it('trims the transparent borders and reports the offset', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ padding: 0 }) });

    expect(layout.sprites).toHaveLength(8);
    layout.sprites.forEach(sprite => {
      expect(sprite.trimmed).toEqual({ x: sprite.source.x + 3, y: sprite.source.y + 3, width: 10, height: 10 });
      expect(sprite.offset).toEqual({ x: 3, y: 3 });
      expect(sprite.wasTrimmed).toBe(true);
      expect(sprite.atlas.width).toBe(10);
      expect(sprite.atlas.height).toBe(10);
    });
    expect(layout.savedPixels).toBe(8 * (16 * 16 - 10 * 10));
  });

  it('keeps the full frame when trimming is disabled', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ trim: false, padding: 0 }) });

    expect(layout.sprites[0].wasTrimmed).toBe(false);
    expect(layout.sprites[0].atlas.width).toBe(16);
    expect(layout.savedPixels).toBe(0);
  });

  it('reserves the padding around every sprite', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ padding: 3, extrude: 0 }) });

    layout.sprites.forEach(sprite => {
      expect(sprite.box.x).toBe(sprite.atlas.x - 3);
      expect(sprite.box.y).toBe(sprite.atlas.y - 3);
      expect(sprite.box.width).toBe(sprite.atlas.width + 6);
      expect(sprite.box.height).toBe(sprite.atlas.height + 6);
    });
  });

  it('adds the extrude ring on top of the padding', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ padding: 2, extrude: 4 }) });

    layout.sprites.forEach(sprite => {
      expect(sprite.box.x).toBe(sprite.atlas.x - 6);
      expect(sprite.box.width).toBe(sprite.atlas.width + 12);
    });
  });

  it('never lets two sprites touch', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ padding: 2 }) });

    layout.pages.forEach(page => {
      const sprites = layout.sprites.filter(sprite => sprite.page === page.index);
      for (let i = 0; i < sprites.length; i++) {
        for (let j = i + 1; j < sprites.length; j++) {
          // The padding ring belongs to the box, so boxes may touch.
          expect(boxesOverlap(sprites[i].box, sprites[j].box)).toBe(false);

          // The visible pixels are inset by the padding: 2px each side = 4px gutter.
          const a = sprites[i].atlas;
          const b = sprites[j].atlas;
          expect(boxesOverlap(a, b)).toBe(false);
          const gapX = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
          const gapY = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
          expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(4);
        }
      }
    });
  });

  it('keeps every sprite inside its page', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options() });

    layout.sprites.forEach(sprite => {
      const page = layout.pages[sprite.page];
      expect(sprite.box.x).toBeGreaterThanOrEqual(0);
      expect(sprite.box.y).toBeGreaterThanOrEqual(0);
      expect(sprite.box.x + sprite.box.width).toBeLessThanOrEqual(page.width);
      expect(sprite.box.y + sprite.box.height).toBeLessThanOrEqual(page.height);
    });
  });

  it('rounds pages up to a power of two when asked', () => {
    const { buffer, frames } = gridSheet();

    const pot = buildAtlasLayout({ frames, buffer, options: options({ powerOfTwo: true }) });
    expect(pot.pages).toHaveLength(1);
    pot.pages.forEach(page => {
      expect(nextPowerOfTwo(page.width)).toBe(page.width);
      expect(nextPowerOfTwo(page.height)).toBe(page.height);
    });

    const exact = buildAtlasLayout({ frames, buffer, options: options({ powerOfTwo: false }) });
    expect(exact.sprites).toHaveLength(8);
    expect(exact.occupancy).toBeGreaterThan(0.5);
    exact.pages.forEach(page => {
      expect(page.width).toBeGreaterThanOrEqual(14);
      expect(page.height).toBeGreaterThanOrEqual(14);
    });
  });

  it('reports a sane occupancy', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options({ padding: 0 }) });

    expect(layout.occupancy).toBeGreaterThan(0);
    expect(layout.occupancy).toBeLessThanOrEqual(1);
  });

  it('keeps the frame order and generates stable names', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer, options: options() });

    expect(layout.sprites.map(sprite => sprite.name)).toEqual(
      Array.from({ length: 8 }, (_, i) => `frame_${String(i + 1).padStart(4, '0')}`)
    );
    expect(layout.sprites.map(sprite => sprite.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('disambiguates duplicated names', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({
      frames,
      buffer,
      options: options(),
      names: frames.map(() => 'hero'),
    });

    expect(layout.sprites.map(sprite => sprite.name)).toEqual([
      'hero',
      'hero_2',
      'hero_3',
      'hero_4',
      'hero_5',
      'hero_6',
      'hero_7',
      'hero_8',
    ]);
  });

  it('applies the pivot mode by default', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({
      frames,
      buffer,
      options: options({ pivotMode: 'bottomCenter' }),
    });

    layout.sprites.forEach(sprite => {
      expect(sprite.pivot).toEqual({ x: 0.5, y: 1 });
    });
  });

  it('applies per frame pivots by position, not by frame index', () => {
    // Grid frames and manual frames share the same `index` values.
    const { buffer, frames } = gridSheet();
    const mixed = [frames[0], frames[1], frame(0, 0, 16, 16, 0)];

    const layout = buildAtlasLayout({
      frames: mixed,
      buffer,
      options: options({ pivotMode: 'topLeft' }),
      pivots: { 0: { x: 0.1, y: 0.2 }, 1: { x: 0.9, y: 0.8 } },
    });

    expect(layout.sprites[0].pivot).toEqual({ x: 0.1, y: 0.2 });
    expect(layout.sprites[1].pivot).toEqual({ x: 0.9, y: 0.8 });
    // The third frame shares index 0 with the first one but has no pick.
    expect(layout.sprites[2].pivot).toEqual({ x: 0, y: 0 });
  });

  it('can skip inactive frames', () => {
    const { buffer, frames } = gridSheet();
    const withInactive = frames.map((f, i) => ({ ...f, isActive: i !== 0 }));

    const layout = buildAtlasLayout({
      frames: withInactive,
      buffer,
      options: options(),
      activeOnly: true,
    });

    expect(layout.sprites).toHaveLength(7);
    expect(layout.sprites[0].name).toBe('frame_0001');
  });

  it('splits into multiple pages when the page limit is small', () => {
    const { buffer, frames } = gridSheet();
    const layout = buildAtlasLayout({
      frames,
      buffer,
      options: options({ maxPageSize: 32 }),
    });

    expect(layout.pages.length).toBeGreaterThan(1);
    layout.pages.forEach(page => {
      expect(page.width).toBeLessThanOrEqual(32);
      expect(page.height).toBeLessThanOrEqual(32);
    });
    expect(layout.sprites).toHaveLength(8);
  });

  it('keeps a placeholder for fully transparent frames', () => {
    const buffer = pixelBuffer(16, 16);
    const layout = buildAtlasLayout({
      frames: [frame(0, 0, 16, 16)],
      buffer,
      options: options(),
    });

    expect(layout.sprites[0].atlas.width).toBe(1);
    expect(layout.sprites[0].atlas.height).toBe(1);
  });

  it('packs without pixel data by keeping whole frames', () => {
    const { frames } = gridSheet();
    const layout = buildAtlasLayout({ frames, buffer: null, options: options() });

    expect(layout.sprites).toHaveLength(8);
    layout.sprites.forEach(sprite => {
      expect(sprite.atlas.width).toBe(16);
      expect(sprite.wasTrimmed).toBe(false);
    });
  });

  it('throws when a frame cannot fit a page', () => {
    const buffer = pixelBuffer(64, 64, paintRect(0, 0, 64, 64));
    expect(() =>
      buildAtlasLayout({
        frames: [frame(0, 0, 64, 64)],
        buffer,
        options: options({ maxPageSize: 32 }),
      })
    ).toThrow(/does not fit/);
  });
});
