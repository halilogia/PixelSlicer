import { describe, expect, it } from 'vitest';
import {
  candidatePageSizes,
  nextPowerOfTwo,
  packIntoPage,
  packRects,
  type PackInput,
  type PackedPage,
} from './AtlasPacker';

function rects(count: number, width: number, height: number): PackInput[] {
  return Array.from({ length: count }, (_, id) => ({ id, width, height }));
}

function overlaps(pages: PackedPage[]): boolean {
  for (const page of pages) {
    for (let i = 0; i < page.boxes.length; i++) {
      for (let j = i + 1; j < page.boxes.length; j++) {
        const a = page.boxes[i];
        const b = page.boxes[j];
        const hit =
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height;
        if (hit) return true;
      }
    }
  }
  return false;
}

describe('nextPowerOfTwo', () => {
  it('rounds up', () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(256)).toBe(256);
    expect(nextPowerOfTwo(257)).toBe(512);
  });
});

describe('packIntoPage', () => {
  it('places every rect inside the page', () => {
    const boxes = packIntoPage(rects(4, 16, 16), 64, 64);
    expect(boxes).not.toBeNull();
    boxes!.forEach(box => {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(64);
      expect(box.y + box.height).toBeLessThanOrEqual(64);
    });
  });

  it('never overlaps two sprites', () => {
    const boxes = packIntoPage(
      [
        { id: 0, width: 40, height: 12 },
        { id: 1, width: 8, height: 30 },
        { id: 2, width: 20, height: 20 },
        { id: 3, width: 33, height: 7 },
      ],
      64,
      64
    );
    expect(boxes).not.toBeNull();
    for (let i = 0; i < boxes!.length; i++) {
      for (let j = i + 1; j < boxes!.length; j++) {
        const a = boxes![i];
        const b = boxes![j];
        const hit =
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height;
        expect(hit).toBe(false);
      }
    }
  });

  it('fails when a rect does not fit', () => {
    expect(packIntoPage([{ id: 0, width: 64, height: 64 }], 32, 32)).toBeNull();
  });

  it('fails when the page is too small overall', () => {
    expect(packIntoPage(rects(5, 16, 16), 32, 32)).toBeNull();
  });
});

describe('candidatePageSizes', () => {
  it('grows by powers of two and prefers the most balanced page', () => {
    const sizes = candidatePageSizes(16, 16, 256, true);
    expect(sizes[0]).toEqual({ width: 16, height: 16 });
    expect(sizes).toContainEqual({ width: 32, height: 32 });
    expect(sizes).toContainEqual({ width: 256, height: 64 });

    // Sorted by perimeter: a 32x64 strip is only tried after a 32x32 page.
    const strip = sizes.findIndex(size => size.width === 32 && size.height === 64);
    const square = sizes.findIndex(size => size.width === 32 && size.height === 32);
    expect(square).toBeLessThan(strip);
  });

  it('never exceeds the page limit', () => {
    const sizes = candidatePageSizes(16, 16, 64, true);
    sizes.forEach(size => {
      expect(size.width).toBeLessThanOrEqual(64);
      expect(size.height).toBeLessThanOrEqual(64);
    });
  });

  it('grows in smaller steps without power of two', () => {
    const sizes = candidatePageSizes(16, 16, 64, false);
    expect(sizes[0]).toEqual({ width: 16, height: 16 });
    expect(sizes.some(size => size.width === 24)).toBe(true);
    sizes.forEach(size => expect(size.width).toBeLessThanOrEqual(64));
  });
});

describe('packRects', () => {
  it('returns nothing for an empty list', () => {
    expect(packRects([], { powerOfTwo: true, maxPageSize: 256 })).toEqual([]);
  });

  it('keeps power of two pages', () => {
    const pages = packRects(rects(3, 20, 20), { powerOfTwo: true, maxPageSize: 256 });
    pages.forEach(page => {
      expect(nextPowerOfTwo(page.width)).toBe(page.width);
      expect(nextPowerOfTwo(page.height)).toBe(page.height);
    });
  });

  it('packs everything without overlaps', () => {
    const pages = packRects(rects(24, 24, 24), { powerOfTwo: true, maxPageSize: 256 });
    const placed = pages.flatMap(page => page.boxes);
    expect(placed).toHaveLength(24);
    expect(new Set(placed.map(box => box.id)).size).toBe(24);
    expect(overlaps(pages)).toBe(false);
  });

  it('splits into several pages when the limit is reached', () => {
    const pages = packRects(rects(16, 64, 64), { powerOfTwo: true, maxPageSize: 128 });
    expect(pages.length).toBeGreaterThan(1);
    pages.forEach(page => {
      expect(page.width).toBeLessThanOrEqual(128);
      expect(page.height).toBeLessThanOrEqual(128);
    });
    expect(pages.flatMap(page => page.boxes)).toHaveLength(16);
  });

  it('restores the input order inside each page', () => {
    const pages = packRects(
      [
        { id: 0, width: 60, height: 60 },
        { id: 1, width: 10, height: 10 },
        { id: 2, width: 30, height: 30 },
      ],
      { powerOfTwo: true, maxPageSize: 128 }
    );
    pages.forEach(page => {
      const ids = page.boxes.map(box => box.id);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });
  });

  it('rejects sprites larger than a whole page', () => {
    expect(() => packRects([{ id: 0, width: 512, height: 8 }], {
      powerOfTwo: true,
      maxPageSize: 128,
    })).toThrow(/does not fit/);
  });

  it('keeps a single oversized page usable when trimming left one pixel', () => {
    const pages = packRects([{ id: 0, width: 1, height: 1 }], {
      powerOfTwo: false,
      maxPageSize: 256,
    });
    expect(pages).toEqual([{ width: 1, height: 1, boxes: [{ id: 0, x: 0, y: 0, width: 1, height: 1 }] }]);
  });
});
