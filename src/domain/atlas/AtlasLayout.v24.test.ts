import { describe, expect, it } from 'vitest';
import { buildAtlasLayout } from './AtlasLayout';
import { packIntoPage, packRects, type PackInput } from './AtlasPacker';
import { DEFAULT_ATLAS_PACK_OPTIONS, type AtlasPackOptions } from './AtlasTypes';
import { frame, pixelBuffer } from '../../testUtils/pixelFixtures';

function options(overrides: Partial<AtlasPackOptions> = {}): AtlasPackOptions {
  return { ...DEFAULT_ATLAS_PACK_OPTIONS, ...overrides };
}

describe('rotation', () => {
  it('is refused unless it is enabled', () => {
    // 40x12 only fits a page that is 12 wide and 40 tall once turned.
    expect(packIntoPage([{ id: 0, width: 40, height: 12 }], 20, 40)).toBeNull();

    const rotated = packIntoPage([{ id: 0, width: 40, height: 12 }], 20, 40, true);
    expect(rotated).not.toBeNull();
    expect(rotated![0]).toEqual({ id: 0, x: 0, y: 0, width: 12, height: 40, rotated: true });
  });

  it('keeps the upright orientation when both score the same', () => {
    // A 30x10 sprite fits a 64x64 page either way, upright wins the tie.
    const boxes = packIntoPage([{ id: 0, width: 30, height: 10 }], 64, 64, true);
    expect(boxes![0]).toEqual({ id: 0, x: 0, y: 0, width: 30, height: 10, rotated: false });
  });

  it('reports the rotated extent when it is used', () => {
    // A tall page only accepts the sprite turned by 90 degrees.
    const boxes = packIntoPage([{ id: 0, width: 40, height: 12 }], 16, 48, true);
    expect(boxes![0].width).toBe(12);
    expect(boxes![0].height).toBe(40);
  });

  it('never rotates a square', () => {
    const boxes = packIntoPage([{ id: 0, width: 16, height: 16 }], 64, 64, true);
    expect(boxes![0].rotated).toBe(false);
  });

  it('still packs everything when rotation is on', () => {
    const inputs: PackInput[] = Array.from({ length: 8 }, (_, id) => ({ id, width: 40, height: 12 }));
    const pages = packRects(inputs, {
      powerOfTwo: true,
      maxPageSize: 256,
      allowRotation: true,
    });

    expect(pages.flatMap(page => page.boxes)).toHaveLength(8);
    expect(pages.some(page => page.boxes.some(box => box.rotated))).toBe(true);
  });

  it('keeps the content rect inside the packed box', () => {
    const frames = [frame(0, 0, 40, 12, 0), frame(0, 16, 40, 12, 1)];
    const layout = buildAtlasLayout({
      frames,
      buffer: null,
      options: options({ trim: false, padding: 2, maxPageSize: 128 }),
    });

    layout.sprites.forEach(sprite => {
      expect(sprite.atlas.width + 4).toBe(sprite.box.width);
      expect(sprite.atlas.height + 4).toBe(sprite.box.height);
    });
  });
});

describe('animation groups', () => {
  const inputs: PackInput[] = Array.from({ length: 24 }, (_, id) => ({ id, width: 32, height: 32 }));

  it('keeps each animation on one page', () => {
    const pages = packRects(inputs, {
      powerOfTwo: true,
      maxPageSize: 128,
      framesPerGroup: 8,
    });

    // A 128x128 page holds 16 sprites, so the three groups of eight land as
    // 16 + 8: no group is ever split.
    pages.forEach(page => expect(page.boxes.length % 8).toBe(0));
    expect(pages.flatMap(page => page.boxes)).toHaveLength(24);
  });

  it('fills the biggest page when the content does not fit anywhere', () => {
    const pages = packRects(inputs, {
      powerOfTwo: true,
      maxPageSize: 64,
      framesPerGroup: 0,
    });

    // 32x32 sprites in a 64x64 page: four per page, six pages for 24.
    expect(pages).toHaveLength(6);
    pages.forEach(page => {
      expect(page.width).toBe(64);
      expect(page.boxes).toHaveLength(4);
    });
  });

  it('packs everything on one page when it fits', () => {
    const pages = packRects(inputs.slice(0, 4), {
      powerOfTwo: true,
      maxPageSize: 256,
      framesPerGroup: 4,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0].boxes).toHaveLength(4);
  });

  it('keeps the input order inside a group', () => {
    const pages = packRects(inputs.slice(0, 4), {
      powerOfTwo: true,
      maxPageSize: 256,
      framesPerGroup: 4,
    });

    expect(pages[0].boxes.map(box => box.id)).toEqual([0, 1, 2, 3]);
  });

  it('splits a group that cannot fit a whole page', () => {
    const huge: PackInput[] = Array.from({ length: 5 }, (_, id) => ({ id, width: 32, height: 32 }));
    const pages = packRects(huge, {
      powerOfTwo: true,
      maxPageSize: 32,
      framesPerGroup: 5,
    });

    expect(pages.flatMap(page => page.boxes)).toHaveLength(5);
  });

  it('places every input exactly once', () => {
    const pages = packRects(inputs, {
      powerOfTwo: true,
      maxPageSize: 64,
      framesPerGroup: 4,
    });
    const placed = pages.flatMap(page => page.boxes.map(box => box.id));

    expect(new Set(placed).size).toBe(24);
    expect(placed.sort((a, b) => a - b)).toEqual(inputs.map(input => input.id));
  });
});

describe('naming', () => {
  it('uses the prefix and the start index', () => {
    const frames = [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)];
    const layout = buildAtlasLayout({
      frames,
      buffer: null,
      options: options({ namePrefix: 'hero_', nameStartIndex: 7 }),
    });

    expect(layout.sprites.map(sprite => sprite.name)).toEqual(['hero_0007', 'hero_0008']);
  });

  it('lets an explicit name win', () => {
    const frames = [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)];
    const layout = buildAtlasLayout({
      frames,
      buffer: null,
      options: options(),
      names: ['walk_01', 'walk_01'],
    });

    expect(layout.sprites.map(sprite => sprite.name)).toEqual(['walk_01', 'walk_01_2']);
  });
});

describe('warnings', () => {
  it('reports a fully transparent frame', () => {
    const buffer = pixelBuffer(32, 16);
    const layout = buildAtlasLayout({
      frames: [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1)],
      buffer,
      options: options(),
    });

    expect(layout.warnings).toHaveLength(2);
    layout.warnings.forEach(warning => {
      expect(warning.kind).toBe('empty');
      expect(warning.message).toMatch(/1x1 placeholder/);
    });
  });

  it('reports duplicated areas once', () => {
    const layout = buildAtlasLayout({
      frames: [frame(0, 0, 16, 16, 0), frame(0, 0, 16, 16, 1)],
      buffer: null,
      options: options(),
    });

    const duplicates = layout.warnings.filter(warning => warning.kind === 'duplicate');
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].message).toMatch(/same area/);
  });

  it('stays quiet for a normal sheet', () => {
    const buffer = pixelBuffer(32, 16, (x, y) => (x < 16 || y < 16 ? [255, 0, 0, 255] : null));
    const layout = buildAtlasLayout({
      frames: [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1)],
      buffer,
      options: options(),
    });

    expect(layout.warnings).toEqual([]);
  });
});
