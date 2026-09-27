// Domain Layer - Pivot / origin resolution
// Every engine expresses the sprite origin differently, so we resolve it once here.

import type { Pivot, PivotMode, Point, Rect } from './AtlasTypes';

/** Minimal frame shape needed to collect pivots (avoids a dependency cycle). */
export interface PivotCarrier {
  pivot?: Pivot;
}

/**
 * Collect the pivots picked by the user, keyed by frame position.
 * Frames without a pick are simply absent from the map.
 */
export function collectFramePivots(frames: readonly PivotCarrier[]): Record<number, Pivot> {
  const pivots: Record<number, Pivot> = {};
  frames.forEach((frame, position) => {
    if (frame.pivot) pivots[position] = frame.pivot;
  });
  return pivots;
}


export const PIVOT_MODE_LABELS: Record<PivotMode, string> = {
  topLeft: 'Top Left',
  topCenter: 'Top Center',
  center: 'Center',
  bottomCenter: 'Bottom Center',
  custom: 'Custom',
};

/** Named presets, normalized inside the (trimmed) sprite rect. */
export const PIVOT_PRESETS: Record<Exclude<PivotMode, 'custom'>, Pivot> = {
  topLeft: { x: 0, y: 0 },
  topCenter: { x: 0.5, y: 0 },
  center: { x: 0.5, y: 0.5 },
  bottomCenter: { x: 0.5, y: 1 },
};

/** Clamp to the 0..1 range and guard against NaN coming from the UI. */
export function normalizePivot(pivot: Pivot): Pivot {
  const clamp = (value: number): number =>
    Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;

  return { x: clamp(pivot.x), y: clamp(pivot.y) };
}

/**
 * Resolve the normalized origin of a sprite.
 * `custom` mode falls back to the center when no custom point was picked.
 */
export function resolvePivot(mode: PivotMode, custom: Pivot | null = null): Pivot {
  if (mode === 'custom') {
    return custom ? normalizePivot(custom) : { ...PIVOT_PRESETS.center };
  }
  return { ...PIVOT_PRESETS[mode] };
}

/**
 * Pixel position of the origin inside the untrimmed frame.
 * Godot (`AtlasTexture.offset`) and Unity (`spriteAlignment`) both need this.
 */
export function pivotInSourceFrame(frame: Rect, pivot: Pivot): Point {
  return {
    x: frame.x + pivot.x * frame.width,
    y: frame.y + pivot.y * frame.height,
  };
}

/**
 * Offset that re-aligns a trimmed sprite with its original frame.
 * Positive values mean the content was cut from the top/left side.
 */
export function trimOffset(frame: Rect, trimmed: Rect): Point {
  return {
    x: trimmed.x - frame.x,
    y: trimmed.y - frame.y,
  };
}

/** Convert a click inside a frame to a normalized pivot. */
export function pivotFromPoint(frame: Rect, point: Point): Pivot {
  if (frame.width <= 0 || frame.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }
  return normalizePivot({
    x: (point.x - frame.x) / frame.width,
    y: (point.y - frame.y) / frame.height,
  });
}
