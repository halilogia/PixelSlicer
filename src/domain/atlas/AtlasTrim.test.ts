import { describe, expect, it } from 'vitest';
import { computeAlphaBounds, inflateRect, resolveTrimRect } from './AtlasTrim';
import { pixelBuffer, paintRect } from '../../testUtils/pixelFixtures';

describe('computeAlphaBounds', () => {
  it('returns null for a fully transparent region', () => {
    const buffer = pixelBuffer(8, 8);
    expect(computeAlphaBounds(buffer, { x: 0, y: 0, width: 8, height: 8 })).toBeNull();
  });

  it('finds the tight bounding box of the content', () => {
    const buffer = pixelBuffer(8, 8, paintRect(3, 4, 5, 6));
    expect(computeAlphaBounds(buffer, { x: 0, y: 0, width: 8, height: 8 })).toEqual({
      x: 3,
      y: 4,
      width: 2,
      height: 2,
    });
  });

  it('never looks outside the requested region', () => {
    const buffer = pixelBuffer(8, 8, paintRect(0, 0, 8, 8));
    const bounds = computeAlphaBounds(buffer, { x: 2, y: 3, width: 4, height: 2 });
    expect(bounds).toEqual({ x: 2, y: 3, width: 4, height: 2 });
  });

  it('clamps regions that overflow the buffer', () => {
    const buffer = pixelBuffer(4, 4, paintRect(0, 0, 2, 2));
    const bounds = computeAlphaBounds(buffer, { x: -10, y: -10, width: 100, height: 100 });
    expect(bounds).toEqual({ x: 0, y: 0, width: 2, height: 2 });
  });

  it('honours the alpha threshold', () => {
    const buffer = pixelBuffer(4, 4, (x, y) =>
      x === 0 && y === 0 ? [0, 0, 0, 1] : x === 1 && y === 0 ? [0, 0, 0, 255] : null
    );
    const region = { x: 0, y: 0, width: 4, height: 4 };

    expect(computeAlphaBounds(buffer, region, 0)).toEqual({
      x: 0,
      y: 0,
      width: 2,
      height: 1,
    });
    expect(computeAlphaBounds(buffer, region, 10)).toEqual({
      x: 1,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('returns null for an empty region', () => {
    const buffer = pixelBuffer(8, 8, paintRect(0, 0, 8, 8));
    expect(computeAlphaBounds(buffer, { x: 4, y: 4, width: 0, height: 4 })).toBeNull();
  });
});

describe('inflateRect', () => {
  const limit = { x: 0, y: 0, width: 32, height: 32 };

  it('grows on every side', () => {
    expect(inflateRect({ x: 10, y: 10, width: 4, height: 4 }, limit, 2)).toEqual({
      x: 8,
      y: 8,
      width: 8,
      height: 8,
    });
  });

  it('never leaves the limit rect', () => {
    expect(inflateRect({ x: 0, y: 0, width: 4, height: 4 }, limit, 3)).toEqual({
      x: 0,
      y: 0,
      width: 7,
      height: 7,
    });
  });

  it('is a no-op without padding', () => {
    const rect = { x: 4, y: 4, width: 4, height: 4 };
    expect(inflateRect(rect, limit, 0)).toEqual(rect);
  });
});

describe('resolveTrimRect', () => {
  const region = { x: 0, y: 0, width: 16, height: 16 };

  it('keeps the whole frame when trimming is disabled', () => {
    const buffer = pixelBuffer(16, 16, paintRect(4, 4, 8, 8));
    expect(resolveTrimRect(buffer, region, false, 0)).toEqual({
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    });
  });

  it('keeps the whole frame without pixel data', () => {
    expect(resolveTrimRect(null, region, true, 0)).toEqual({
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    });
  });

  it('trims to the content bounds', () => {
    const buffer = pixelBuffer(16, 16, paintRect(4, 6, 12, 14));
    expect(resolveTrimRect(buffer, region, true, 0)).toEqual({
      x: 4,
      y: 6,
      width: 8,
      height: 8,
    });
  });

  it('keeps a 1x1 placeholder for fully transparent frames', () => {
    const buffer = pixelBuffer(16, 16);
    expect(resolveTrimRect(buffer, region, true, 0)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('clips a frame that sticks out of the buffer', () => {
    const buffer = pixelBuffer(8, 8, paintRect(4, 4, 8, 8));
    expect(resolveTrimRect(buffer, { x: 4, y: 4, width: 32, height: 32 }, true, 0)).toEqual({
      x: 4,
      y: 4,
      width: 4,
      height: 4,
    });
  });
});
