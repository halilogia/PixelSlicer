import { describe, expect, it } from 'vitest';
import {
  calculateGridFrames,
  calculateSpriteSheet,
  createManualFrame,
  framesOverlap,
  getResizeHandleAt,
  isFrameInBounds,
  resizeFrame,
  type Frame,
  type GridConfig,
} from './FrameLogic';

function config(overrides: Partial<GridConfig> = {}): GridConfig {
  return { cols: 4, rows: 2, offsetX: 0, offsetY: 0, padding: 0, ...overrides };
}

function frame(x: number, y: number, w: number, h: number, index = 0): Frame {
  return { x, y, w, h, index, isActive: true };
}

describe('calculateGridFrames', () => {
  it('splits the image into cols x rows cells', () => {
    const frames = calculateGridFrames({ width: 128, height: 64 }, config());

    expect(frames).toHaveLength(8);
    expect(frames[0]).toEqual({ x: 0, y: 0, w: 32, h: 32, index: 0, isActive: true });
    expect(frames[1]).toEqual({ x: 32, y: 0, w: 32, h: 32, index: 1, isActive: true });
    expect(frames[4]).toEqual({ x: 0, y: 32, w: 32, h: 32, index: 4, isActive: true });
    expect(frames[7]).toEqual({ x: 96, y: 32, w: 32, h: 32, index: 7, isActive: true });
  });

  it('floors the cell size so a remainder never overflows the image', () => {
    const frames = calculateGridFrames({ width: 100, height: 50 }, config({ cols: 3, rows: 3 }));
    frames.forEach(f => {
      expect(f.x + f.w).toBeLessThanOrEqual(100);
      expect(f.y + f.h).toBeLessThanOrEqual(50);
    });
  });

  it('applies the offsets to every cell', () => {
    const frames = calculateGridFrames(
      { width: 64, height: 64 },
      config({ cols: 2, rows: 2, offsetX: 3, offsetY: 5 })
    );

    expect(frames.map(f => f.x)).toEqual([3, 35, 3, 35]);
    expect(frames.map(f => f.y)).toEqual([5, 5, 37, 37]);
  });

  it('shrinks every cell by the padding on all sides', () => {
    const frames = calculateGridFrames({ width: 64, height: 64 }, config({ cols: 2, rows: 2, padding: 4 }));

    expect(frames.map(f => [f.x, f.y, f.w, f.h])).toEqual([
      [4, 4, 24, 24],
      [36, 4, 24, 24],
      [4, 36, 24, 24],
      [36, 36, 24, 24],
    ]);
  });

  it('numbers the cells row by row', () => {
    const frames = calculateGridFrames({ width: 64, height: 32 }, config({ cols: 4, rows: 2 }));
    expect(frames.map(f => f.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('produces frames every frame toggles as active', () => {
    const frames = calculateGridFrames({ width: 16, height: 16 }, config({ cols: 2, rows: 2 }));
    expect(frames.every(f => f.isActive)).toBe(true);
  });
});

describe('framesOverlap', () => {
  it('detects intersecting frames', () => {
    expect(framesOverlap(frame(0, 0, 10, 10), frame(5, 5, 10, 10))).toBe(true);
    expect(framesOverlap(frame(0, 0, 10, 10), frame(2, 2, 2, 2))).toBe(true);
  });

  it('allows touching but not overlapping frames', () => {
    expect(framesOverlap(frame(0, 0, 10, 10), frame(10, 0, 10, 10))).toBe(false);
    expect(framesOverlap(frame(0, 0, 10, 10), frame(0, 10, 10, 10))).toBe(false);
    expect(framesOverlap(frame(0, 0, 10, 10), frame(20, 20, 10, 10))).toBe(false);
  });

  it('never reports a frame as overlapping itself', () => {
    expect(framesOverlap(frame(0, 0, 10, 10), frame(0, 0, 10, 10))).toBe(true);
  });
});

describe('isFrameInBounds', () => {
  const dims = { width: 100, height: 50 };

  it('accepts a frame that fits', () => {
    expect(isFrameInBounds(frame(10, 10, 20, 20), dims)).toBe(true);
    expect(isFrameInBounds(frame(0, 0, 100, 50), dims)).toBe(true);
  });

  it('rejects a frame that sticks out', () => {
    expect(isFrameInBounds(frame(90, 0, 20, 20), dims)).toBe(false);
    expect(isFrameInBounds(frame(0, 40, 20, 20), dims)).toBe(false);
    expect(isFrameInBounds(frame(-1, 0, 20, 20), dims)).toBe(false);
  });
});

describe('createManualFrame', () => {
  it('normalizes a drag that goes right and down', () => {
    expect(createManualFrame(10, 20, 30, 60, 0)).toEqual({
      x: 10,
      y: 20,
      w: 20,
      h: 40,
      index: 0,
      isActive: true,
    });
  });

  it('normalizes a drag that goes left and up', () => {
    expect(createManualFrame(30, 60, 10, 20, 3)).toEqual({
      x: 10,
      y: 20,
      w: 20,
      h: 40,
      index: 3,
      isActive: true,
    });
  });

  it('floors fractional coordinates', () => {
    expect(createManualFrame(10.7, 20.2, 15.9, 30.4, 0)).toMatchObject({
      x: 10,
      y: 20,
      w: 5,
      h: 10,
    });
  });

  it('allows a zero sized frame (the editor filters it later)', () => {
    expect(createManualFrame(5, 5, 5, 5, 0)).toMatchObject({ w: 0, h: 0 });
  });
});

describe('resizeFrame', () => {
  const source = frame(20, 20, 40, 40, 2);

  it('moves the left edge and grows the width', () => {
    expect(resizeFrame(source, 'tl', 5, 5)).toMatchObject({ x: 25, y: 25, w: 35, h: 35 });
  });

  it('grows towards the right and bottom', () => {
    expect(resizeFrame(source, 'br', 10, -10)).toMatchObject({ x: 20, y: 20, w: 50, h: 30 });
  });

  it('moves only the horizontal edge for a top handle', () => {
    expect(resizeFrame(source, 'tr', 8, 0)).toMatchObject({ x: 20, y: 20, w: 48, h: 40 });
  });

  it('moves only the vertical edge for a left handle', () => {
    expect(resizeFrame(source, 'bl', 0, 4)).toMatchObject({ x: 20, y: 20, w: 40, h: 44 });
    expect(resizeFrame(source, 'bl', 0, -4)).toMatchObject({ x: 20, y: 20, w: 40, h: 36 });
  });

  it('enforces the minimum size', () => {
    const resized = resizeFrame(source, 'tl', 100, 100);
    expect(resized.w).toBe(5);
    expect(resized.h).toBe(5);
  });

  it('honours a custom minimum size', () => {
    expect(resizeFrame(source, 'br', -100, -100, 12)).toMatchObject({ w: 12, h: 12 });
  });

  it('never mutates the source frame', () => {
    resizeFrame(source, 'tl', 5, 5);
    expect(source).toEqual({ x: 20, y: 20, w: 40, h: 40, index: 2, isActive: true });
  });

  it('keeps the pivot while resizing', () => {
    const withPivot: Frame = { ...source, pivot: { x: 0.25, y: 0.75 } };
    expect(resizeFrame(withPivot, 'br', 4, 4).pivot).toEqual({ x: 0.25, y: 0.75 });
  });
});

describe('getResizeHandleAt', () => {
  const target = frame(20, 20, 40, 40);

  it('detects every corner', () => {
    expect(getResizeHandleAt(20, 20, target)).toBe('tl');
    expect(getResizeHandleAt(60, 20, target)).toBe('tr');
    expect(getResizeHandleAt(20, 60, target)).toBe('bl');
    expect(getResizeHandleAt(60, 60, target)).toBe('br');
  });

  it('allows the handle size as tolerance', () => {
    expect(getResizeHandleAt(25, 24, target)).toBe('tl');
    expect(getResizeHandleAt(30, 20, target)).toBe('tl');
    expect(getResizeHandleAt(35, 20, target)).toBeNull();
  });

  it('respects a custom handle size', () => {
    expect(getResizeHandleAt(40, 20, target, 30)).toBe('tl');
  });

  it('returns null away from the corners', () => {
    expect(getResizeHandleAt(40, 40, target)).toBeNull();
    expect(getResizeHandleAt(0, 0, target)).toBeNull();
  });
});

describe('calculateSpriteSheet', () => {
  it('uses the biggest frame as the cell size', () => {
    // 64x16 and 32x32 -> cells of 64x32, two columns, one row.
    const sheet = calculateSpriteSheet([frame(0, 0, 32, 32), frame(0, 0, 64, 16)], 2);
    expect(sheet).toEqual({ width: 128, height: 32 });
  });

  it('adds a row for an incomplete last line', () => {
    expect(calculateSpriteSheet([frame(0, 0, 10, 10), frame(0, 0, 10, 10), frame(0, 0, 10, 10)], 2)).toEqual({
      width: 20,
      height: 20,
    });
  });

  it('returns an empty sheet for no frames', () => {
    expect(calculateSpriteSheet([], 4)).toEqual({ width: 0, height: 0 });
  });
});
