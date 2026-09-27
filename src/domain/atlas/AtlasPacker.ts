// Domain Layer - Bin packing
// MaxRects with the Best-Short-Side-Fit heuristic, power-of-two growth and
// multi-page support. Pure integer math, so it is fully unit testable.

import type { Rect } from './AtlasTypes';

export interface PackInput {
  id: number;
  width: number;
  height: number;
}

export interface PackedBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PackedPage {
  width: number;
  height: number;
  boxes: PackedBox[];
}

export interface PackRectsOptions {
  /** Gap kept between two sprites, already included in the input sizes. */
  powerOfTwo: boolean;
  /** Upper bound for a single page edge. */
  maxPageSize: number;
}

interface FreeRect extends Rect {}

export function nextPowerOfTwo(value: number): number {
  let result = 1;
  while (result < value) result *= 2;
  return result;
}

function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/** Split a free rect around a used one, MaxRects style. */
function splitFree(free: FreeRect, used: Rect): FreeRect[] {
  if (!intersects(free, used)) return [free];

  const result: FreeRect[] = [];

  if (used.x > free.x) {
    result.push({
      x: free.x,
      y: free.y,
      width: used.x - free.x,
      height: free.height,
    });
  }

  const freeRight = free.x + free.width;
  const usedRight = used.x + used.width;
  if (usedRight < freeRight) {
    result.push({
      x: usedRight,
      y: free.y,
      width: freeRight - usedRight,
      height: free.height,
    });
  }

  if (used.y > free.y) {
    result.push({
      x: free.x,
      y: free.y,
      width: free.width,
      height: used.y - free.y,
    });
  }

  const freeBottom = free.y + free.height;
  const usedBottom = used.y + used.height;
  if (usedBottom < freeBottom) {
    result.push({
      x: free.x,
      y: usedBottom,
      width: free.width,
      height: freeBottom - usedBottom,
    });
  }

  return result.filter(rect => rect.width > 0 && rect.height > 0);
}

/** Drop free rects fully covered by another one. */
function pruneFreeRects(free: Rect[]): FreeRect[] {
  const result: FreeRect[] = [];

  for (let i = 0; i < free.length; i++) {
    let contained = false;
    for (let j = 0; j < free.length; j++) {
      if (i === j) continue;
      if (
        free[j].width * free[j].height > free[i].width * free[i].height &&
        rectContains(free[j], free[i])
      ) {
        contained = true;
        break;
      }
    }
    if (!contained) result.push(free[i]);
  }

  return result;
}

interface Placement {
  x: number;
  y: number;
  shortSide: number;
  longSide: number;
}

/** Best Short Side Fit, ties broken by the long side. */
function findBestPlacement(free: Rect[], width: number, height: number): Placement | null {
  let best: Placement | null = null;

  for (const rect of free) {
    if (rect.width < width || rect.height < height) continue;

    const leftoverX = rect.width - width;
    const leftoverY = rect.height - height;
    const shortSide = Math.min(leftoverX, leftoverY);
    const longSide = Math.max(leftoverX, leftoverY);

    if (
      best === null ||
      shortSide < best.shortSide ||
      (shortSide === best.shortSide && longSide < best.longSide)
    ) {
      best = { x: rect.x, y: rect.y, shortSide, longSide };
    }
  }

  return best;
}

/** Try to fit every input into a single page of the given size. */
export function packIntoPage(
  inputs: PackInput[],
  width: number,
  height: number
): PackedBox[] | null {
  let free: FreeRect[] = [{ x: 0, y: 0, width, height }];
  const boxes: PackedBox[] = [];

  for (const input of inputs) {
    if (input.width > width || input.height > height) return null;

    const placement = findBestPlacement(free, input.width, input.height);
    if (!placement) return null;

    const used: Rect = {
      x: placement.x,
      y: placement.y,
      width: input.width,
      height: input.height,
    };
    boxes.push({ id: input.id, ...used });

    const next: FreeRect[] = [];
    for (const rect of free) {
      next.push(...splitFree(rect, used));
    }
    free = pruneFreeRects(next);
  }

  return boxes;
}

/** Ascending page sizes to try, cheapest area first. */
export function candidatePageSizes(
  minWidth: number,
  minHeight: number,
  maxPageSize: number,
  powerOfTwo: boolean
): Array<{ width: number; height: number }> {
  const limit = Math.max(1, Math.floor(maxPageSize));
  const growth = powerOfTwo ? 2 : 1.5;
  const round = (value: number): number =>
    powerOfTwo ? Math.min(limit, nextPowerOfTwo(Math.ceil(value))) : Math.min(limit, Math.ceil(value));

  const widths: number[] = [];
  let width = round(minWidth);
  while (width <= limit) {
    if (widths[widths.length - 1] !== width) widths.push(width);
    const grown = round(width * growth);
    if (grown <= width) break;
    width = grown;
  }

  const heights: number[] = [];
  let height = round(minHeight);
  while (height <= limit) {
    if (heights[heights.length - 1] !== height) heights.push(height);
    const grown = round(height * growth);
    if (grown <= height) break;
    height = grown;
  }

  const combos: Array<{ width: number; height: number }> = [];
  for (const w of widths) {
    for (const h of heights) {
      combos.push({ width: w, height: h });
    }
  }

  // Smallest perimeter first: a balanced page wastes far less texture space
  // than a very long strip with the same area.
  combos.sort(
    (a, b) =>
      a.width + a.height - (b.width + b.height) ||
      a.width * a.height - b.width * b.height
  );

  return combos;
}

/**
 * Pack every input, splitting into as many pages as needed.
 * Inputs are sorted by area (descending) while packing and restored to the
 * original order in the result, so exported metadata stays deterministic.
 */
export function packRects(inputs: PackInput[], options: PackRectsOptions): PackedPage[] {
  const { powerOfTwo, maxPageSize } = options;

  if (inputs.length === 0) return [];

  const oversized = inputs.filter(
    input => input.width > maxPageSize || input.height > maxPageSize
  );
  if (oversized.length > 0) {
    throw new Error(
      `Sprite #${oversized[0].id} (${oversized[0].width}x${oversized[0].height}) does not fit a ${maxPageSize}px page.`
    );
  }

  const ordered = [...inputs].sort(
    (a, b) =>
      b.width * b.height - a.width * a.height ||
      Math.max(b.width, b.height) - Math.max(a.width, a.height) ||
      a.id - b.id
  );

  const minWidth = ordered.reduce((max, input) => Math.max(max, input.width), 0);
  const minHeight = ordered.reduce((max, input) => Math.max(max, input.height), 0);
  const candidates = candidatePageSizes(minWidth, minHeight, maxPageSize, powerOfTwo);

  const pages: PackedPage[] = [];
  let remaining = ordered;
  let guard = 0;

  while (remaining.length > 0) {
    if (++guard > inputs.length + 1) break;

    const totalArea = remaining.reduce((sum, input) => sum + input.width * input.height, 0);
    let placed: PackedBox[] | null = null;
    let pageWidth = 0;
    let pageHeight = 0;

    for (const candidate of candidates) {
      if (candidate.width * candidate.height < totalArea) continue;
      const boxes = packIntoPage(remaining, candidate.width, candidate.height);
      if (boxes) {
        placed = boxes;
        pageWidth = candidate.width;
        pageHeight = candidate.height;
        break;
      }
    }

    if (!placed) {
      // A single sprite may not fit any page by itself: give it a dedicated page.
      const single = remaining[0];
      const width = powerOfTwo ? nextPowerOfTwo(single.width) : single.width;
      const height = powerOfTwo ? nextPowerOfTwo(single.height) : single.height;
      placed = [{ id: single.id, x: 0, y: 0, width: single.width, height: single.height }];
      pageWidth = Math.min(maxPageSize, width);
      pageHeight = Math.min(maxPageSize, height);
    }

    const placedIds = new Set(placed.map(box => box.id));
    pages.push({ width: pageWidth, height: pageHeight, boxes: placed });

    const rest = remaining.filter(input => !placedIds.has(input.id));
    if (rest.length === remaining.length) break;
    remaining = rest;
  }

  // Restore the caller's ordering inside each page.
  const order = new Map(inputs.map((input, index) => [input.id, index]));
  for (const page of pages) {
    page.boxes.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  return pages;
}
