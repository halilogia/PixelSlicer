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
  /** Stored width, which is the sprite height when `rotated` is true. */
  width: number;
  /** Stored height, which is the sprite width when `rotated` is true. */
  height: number;
  rotated: boolean;
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
  /** Try both orientations for every sprite. */
  allowRotation?: boolean;
  /** Frames per animation: a group is never split across pages. */
  framesPerGroup?: number;
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
  rotated: boolean;
  width: number;
  height: number;
}

/**
 * Best Short Side Fit, ties broken by the long side. Both orientations are
 * considered when rotation is allowed, the best scoring one wins.
 */
function findBestPlacement(
  free: Rect[],
  width: number,
  height: number,
  allowRotation: boolean
): Placement | null {
  let best: Placement | null = null;

  const orientations: Array<{ w: number; h: number; rotated: boolean }> =
    allowRotation && width !== height
      ? [
          { w: width, h: height, rotated: false },
          { w: height, h: width, rotated: true },
        ]
      : [{ w: width, h: height, rotated: false }];

  for (const rect of free) {
    for (const orientation of orientations) {
      if (rect.width < orientation.w || rect.height < orientation.h) continue;

      const leftoverX = rect.width - orientation.w;
      const leftoverY = rect.height - orientation.h;
      const shortSide = Math.min(leftoverX, leftoverY);
      const longSide = Math.max(leftoverX, leftoverY);

      if (
        best === null ||
        shortSide < best.shortSide ||
        (shortSide === best.shortSide && longSide < best.longSide)
      ) {
        best = {
          x: rect.x,
          y: rect.y,
          shortSide,
          longSide,
          rotated: orientation.rotated,
          width: orientation.w,
          height: orientation.h,
        };
      }
    }
  }

  return best;
}

/** Try to fit every input into a single page of the given size. */
export function packIntoPage(
  inputs: PackInput[],
  width: number,
  height: number,
  allowRotation: boolean = false
): PackedBox[] | null {
  let free: FreeRect[] = [{ x: 0, y: 0, width, height }];
  const boxes: PackedBox[] = [];

  for (const input of inputs) {
    if (input.width > width || input.height > height) {
      if (!allowRotation) return null;
      if (Math.max(input.width, input.height) > Math.max(width, height)) return null;
      if (Math.min(input.width, input.height) > Math.min(width, height)) return null;
    }

    const placement = findBestPlacement(free, input.width, input.height, allowRotation);
    if (!placement) return null;

    const used: Rect = {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    };
    boxes.push({
      id: input.id,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      rotated: placement.rotated,
    });

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
 * Cheap shelf packing estimate of a page size that can hold everything.
 * MaxRects always beats the shelf, so this is only a *guess* used to try the
 * most promising page first: on a 1000 sprite sheet the ascending search pays
 * for several full MaxRects attempts that are guaranteed to fail.
 *
 * The most square feasible page wins, which keeps a uniform sheet from being
 * packed into a 32x4096 strip.
 */
export function estimatePageSize(
  inputs: PackInput[],
  powerOfTwo: boolean,
  maxPageSize: number
): { width: number; height: number } | null {
  if (inputs.length === 0) return null;

  const ordered = [...inputs].sort((a, b) => b.height - a.height || b.width - a.width);
  const tallest = ordered[0].height;
  const round = (value: number): number =>
    powerOfTwo
      ? Math.min(maxPageSize, nextPowerOfTwo(Math.ceil(value)))
      : Math.min(maxPageSize, Math.ceil(value));

  let best: { width: number; height: number; score: number } | null = null;
  let width = round(ordered.reduce((max, input) => Math.max(max, input.width), 0));

  while (width <= maxPageSize) {
    let rows = 1;
    let used = 0;
    let fitsWidth = true;

    for (const input of ordered) {
      if (input.width > width) {
        fitsWidth = false;
        break;
      }
      if (used + input.width > width) {
        rows++;
        used = 0;
      }
      used += input.width;
    }

    if (fitsWidth) {
      // Feasibility is judged on the raw height: clamping before the check
      // would turn "too tall" into "fits" and waste a MaxRects attempt.
      const rawHeight = rows * tallest;
      if (rawHeight <= maxPageSize) {
        const height = round(rawHeight);
        const score = Math.abs(Math.log(width / height));
        const better =
          best === null ||
          score < best.score - 1e-9 ||
          (Math.abs(score - best.score) <= 1e-9 && width * height < best.width * best.height);
        if (better) best = { width, height, score };
      }
    }

    const grown = powerOfTwo ? width * 2 : Math.ceil(width * 1.5);
    if (grown <= width) break;
    width = grown;
  }

  return best ? { width: best.width, height: best.height } : null;
}

/** Largest area first: the hard to place sprites decide the page size. */
function sortByArea(inputs: readonly PackInput[]): PackInput[] {
  return [...inputs].sort(
    (a, b) =>
      b.width * b.height - a.width * a.height ||
      Math.max(b.width, b.height) - Math.max(a.width, a.height) ||
      a.id - b.id
  );
}

/** The biggest page the limit allows, which is what overflow is packed into. */
function largestPageSize(
  maxPageSize: number,
  powerOfTwo: boolean
): { width: number; height: number } {
  const size = powerOfTwo
    ? Math.min(maxPageSize, nextPowerOfTwo(maxPageSize))
    : maxPageSize;
  return { width: size, height: size };
}

/**
 * Fill pages with as many whole groups as fit.
 *
 * Phase 1 looks for the smallest page that holds everything at once, starting
 * from the balanced estimate. Phase 2 only runs when the content is larger
 * than the page limit: then the biggest allowed page is filled with as many
 * whole groups as fit, so a group is never split unless it has to be.
 */
function packGroups(
  groups: PackInput[][],
  candidates: Array<{ width: number; height: number }>,
  maxPageSize: number,
  allowRotation: boolean,
  pages: PackedPage[],
  powerOfTwo = true
): void {
  let remaining = groups.filter(group => group.length > 0);
  let guard = 0;

  while (remaining.length > 0) {
    if (++guard > 4096) break;

    const all = remaining.flat();
    const totalArea = all.reduce((sum, input) => sum + input.width * input.height, 0);
    const estimate = estimatePageSize(all, powerOfTwo, maxPageSize);
    const searchOrder = estimate
      ? [estimate, ...candidates.filter(size => size.width !== estimate.width || size.height !== estimate.height)]
      : candidates;

    let placed: PackedBox[] | null = null;
    let pageWidth = 0;
    let pageHeight = 0;

    // Phase 1: one page for everything.
    for (const candidate of searchOrder) {
      if (candidate.width * candidate.height < totalArea) continue;
      const boxes = packIntoPage(all, candidate.width, candidate.height, allowRotation);
      if (!boxes) continue;
      placed = boxes;
      pageWidth = candidate.width;
      pageHeight = candidate.height;
      break;
    }

    // Phase 2: fill the biggest allowed page with whole groups.
    if (!placed) {
      const biggest = largestPageSize(maxPageSize, powerOfTwo);
      const batch: PackInput[] = [];

      for (const group of remaining) {
        const attempt = batch.concat(group);
        if (packIntoPage(attempt, biggest.width, biggest.height, allowRotation)) {
          batch.push(...group);
          continue;
        }
        if (batch.length === 0) {
          // The group is larger than a whole page: fill the page with as many
          // of its sprites as fit, the rest continues on the next page.
          for (const input of group) {
            if (!packIntoPage(batch.concat(input), biggest.width, biggest.height, allowRotation)) {
              break;
            }
            batch.push(input);
          }
        }
        break;
      }

      if (batch.length > 0) {
        const boxes = packIntoPage(batch, biggest.width, biggest.height, allowRotation);
        if (boxes) {
          placed = boxes;
          pageWidth = biggest.width;
          pageHeight = biggest.height;
        }
      }
    }

    if (!placed) {
      // One sprite that cannot fit any page: give it a dedicated page.
      const single = all[0];
      const width = powerOfTwo ? nextPowerOfTwo(single.width) : single.width;
      const height = powerOfTwo ? nextPowerOfTwo(single.height) : single.height;
      placed = [
        { id: single.id, x: 0, y: 0, width: single.width, height: single.height, rotated: false },
      ];
      pageWidth = Math.min(maxPageSize, width);
      pageHeight = Math.min(maxPageSize, height);
    }

    const placedIds = new Set(placed.map(box => box.id));
    pages.push({ width: pageWidth, height: pageHeight, boxes: placed });
    remaining = remaining
      .map(group => group.filter(input => !placedIds.has(input.id)))
      .filter(group => group.length > 0);

    // Safety net: a page that placed nothing would loop forever.
    if (placed.length === 0 && remaining.length > 0) {
      remaining = remaining.slice(1);
    }
  }
}

/**
 * Pack every input, splitting into as many pages as needed.
 * Inputs are sorted by area (descending) while packing and restored to the
 * original order in the result, so exported metadata stays deterministic.
 *
 * With `framesPerGroup` the inputs are cut into animation groups and a group
 * is never split across pages: an engine that binds a page to a texture can
 * then play the animation without a texture swap.
 */
export function packRects(inputs: PackInput[], options: PackRectsOptions): PackedPage[] {
  const { powerOfTwo, maxPageSize, allowRotation = false, framesPerGroup = 0 } = options;

  if (inputs.length === 0) return [];

  const oversized = inputs.filter(input => {
    if (input.width <= maxPageSize && input.height <= maxPageSize) return false;
    if (!allowRotation) return true;
    return Math.max(input.width, input.height) > maxPageSize;
  });
  if (oversized.length > 0) {
    throw new Error(
      `Sprite #${oversized[0].id} (${oversized[0].width}x${oversized[0].height}) does not fit a ${maxPageSize}px page.`
    );
  }

  const minWidth = inputs.reduce((max, input) => Math.max(max, input.width), 0);
  const minHeight = inputs.reduce((max, input) => Math.max(max, input.height), 0);
  const ascending = candidatePageSizes(minWidth, minHeight, maxPageSize, powerOfTwo);

  const pages: PackedPage[] = [];

  if (framesPerGroup > 0) {
    // Groups keep the caller's order: an animation is a slice of the frame list.
    const groups: PackInput[][] = [];
    for (let i = 0; i < inputs.length; i += framesPerGroup) {
      groups.push(inputs.slice(i, i + framesPerGroup));
    }
    packGroups(groups, ascending, maxPageSize, allowRotation, pages);
  } else {
    packGroups([sortByArea(inputs)], ascending, maxPageSize, allowRotation, pages);
  }

  // Restore the caller's ordering inside each page.
  const order = new Map(inputs.map((input, index) => [input.id, index]));
  for (const page of pages) {
    page.boxes.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  return pages;
}
