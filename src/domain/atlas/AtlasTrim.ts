// Domain Layer - Auto trim (transparent border removal)
// Pure pixel math, no DOM required so it runs identically in a worker and in tests.

import type { PixelBuffer, Rect } from './AtlasTypes';

/**
 * Find the bounding box of the pixels above `alphaThreshold` inside `rect`.
 * Returns null when the region is fully transparent.
 */
export function computeAlphaBounds(
  buffer: PixelBuffer,
  rect: Rect,
  alphaThreshold: number = 0
): Rect | null {
  const startX = Math.max(0, Math.floor(rect.x));
  const startY = Math.max(0, Math.floor(rect.y));
  const endX = Math.min(buffer.width, Math.floor(rect.x + rect.width));
  const endY = Math.min(buffer.height, Math.floor(rect.y + rect.height));

  if (endX <= startX || endY <= startY) return null;

  let minX = endX;
  let minY = endY;
  let maxX = -1;
  let maxY = -1;

  for (let y = startY; y < endY; y++) {
    const rowOffset = y * buffer.width;
    for (let x = startX; x < endX; x++) {
      const alpha = buffer.data[(rowOffset + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Grow a trimmed rect by `padding` pixels, never leaving the original frame.
 * Padding keeps rotated / filtered sampling from bleeding into the neighbour.
 */
export function inflateRect(rect: Rect, limit: Rect, padding: number): Rect {
  if (padding <= 0) return { ...rect };

  const minX = Math.max(limit.x, rect.x - padding);
  const minY = Math.max(limit.y, rect.y - padding);
  const maxX = Math.min(limit.x + limit.width, rect.x + rect.width + padding);
  const maxY = Math.min(limit.y + limit.height, rect.y + rect.height + padding);

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Decide which part of a frame has to be stored in the atlas.
 * Without pixel data (or with trimming disabled) the full frame is kept.
 */
export function resolveTrimRect(
  buffer: PixelBuffer | null,
  frame: Rect,
  trim: boolean,
  alphaThreshold: number
): Rect {
  const full: Rect = {
    x: Math.floor(frame.x),
    y: Math.floor(frame.y),
    width: Math.max(1, Math.floor(frame.width)),
    height: Math.max(1, Math.floor(frame.height)),
  };

  if (!trim || !buffer) return full;

  const bounds = computeAlphaBounds(buffer, full, alphaThreshold);
  if (!bounds) {
    // Fully transparent frame: keep a 1x1 placeholder so the name stays in the atlas.
    return { x: full.x, y: full.y, width: 1, height: 1 };
  }

  return bounds;
}
