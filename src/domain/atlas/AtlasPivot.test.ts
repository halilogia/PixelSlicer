import { describe, expect, it } from 'vitest';
import {
  collectFramePivots,
  normalizePivot,
  pivotFromPoint,
  pivotInSourceFrame,
  PIVOT_PRESETS,
  resolvePivot,
  trimOffset,
} from './AtlasPivot';

describe('collectFramePivots', () => {
  it('keys the picks by frame position', () => {
    const pivots = collectFramePivots([
      { pivot: { x: 0, y: 0 } },
      {},
      { pivot: { x: 1, y: 0.5 } },
    ]);

    expect(pivots).toEqual({ 0: { x: 0, y: 0 }, 2: { x: 1, y: 0.5 } });
  });

  it('returns an empty map when nothing was picked', () => {
    expect(collectFramePivots([{}, {}])).toEqual({});
  });
});

describe('resolvePivot', () => {
  it('resolves every named preset', () => {
    expect(resolvePivot('topLeft')).toEqual({ x: 0, y: 0 });
    expect(resolvePivot('topCenter')).toEqual({ x: 0.5, y: 0 });
    expect(resolvePivot('center')).toEqual({ x: 0.5, y: 0.5 });
    expect(resolvePivot('bottomCenter')).toEqual({ x: 0.5, y: 1 });
  });

  it('uses the picked point in custom mode', () => {
    expect(resolvePivot('custom', { x: 0.25, y: 0.75 })).toEqual({ x: 0.25, y: 0.75 });
  });

  it('falls back to the center in custom mode without a pick', () => {
    expect(resolvePivot('custom', null)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('keeps presets immutable', () => {
    const pivot = resolvePivot('center');
    pivot.x = 0;
    expect(PIVOT_PRESETS.center).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('normalizePivot', () => {
  it('clamps outside values', () => {
    expect(normalizePivot({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 });
  });

  it('replaces non finite values with a centered pivot', () => {
    expect(normalizePivot({ x: Number.NaN, y: Number.POSITIVE_INFINITY })).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });
});

describe('pivotFromPoint', () => {
  const region = { x: 10, y: 20, width: 40, height: 80 };

  it('normalizes a click inside the frame', () => {
    expect(pivotFromPoint(region, { x: 30, y: 60 })).toEqual({ x: 0.5, y: 0.5 });
    expect(pivotFromPoint(region, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
    expect(pivotFromPoint(region, { x: 50, y: 100 })).toEqual({ x: 1, y: 1 });
  });

  it('clamps clicks outside the frame', () => {
    expect(pivotFromPoint(region, { x: -100, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('survives a zero sized frame', () => {
    expect(pivotFromPoint({ x: 0, y: 0, width: 0, height: 0 }, { x: 4, y: 4 })).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });
});

describe('trimOffset and pivotInSourceFrame', () => {
  const source = { x: 0, y: 0, width: 32, height: 32 };
  const trimmed = { x: 4, y: 2, width: 20, height: 10 };

  it('reports where the content was cut from', () => {
    expect(trimOffset(source, trimmed)).toEqual({ x: 4, y: 2 });
  });

  it('maps the pivot back into the untrimmed frame', () => {
    expect(pivotInSourceFrame(trimmed, { x: 0.5, y: 0.5 })).toEqual({ x: 14, y: 7 });
  });

  it('places the bottom center pivot on the baseline', () => {
    const point = pivotInSourceFrame(trimmed, resolvePivot('bottomCenter'));
    expect(point).toEqual({ x: 14, y: 12 });
  });
});
