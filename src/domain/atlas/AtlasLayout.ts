// Domain Layer - Atlas layout builder
// Ties trimming, pivots and the bin packer together. Still DOM free.

import type { Frame } from '@domain/FrameLogic';
import { packRects, type PackInput } from './AtlasPacker';
import { resolvePivot, trimOffset } from './AtlasPivot';
import { resolveTrimRect } from './AtlasTrim';
import type {
  AtlasLayout,
  AtlasPackOptions,
  AtlasPage,
  AtlasSprite,
  PixelBuffer,
  Pivot,
  Rect,
} from './AtlasTypes';

export interface BuildAtlasInput {
  frames: readonly Frame[];
  /** Source pixels. Without it, trimming is skipped and full frames are packed. */
  buffer?: PixelBuffer | null;
  options: AtlasPackOptions;
  /** Per frame pivot override, keyed by frame index. */
  pivots?: Record<number, Pivot>;
  /** Optional explicit names, otherwise `frame_0001` style names are generated. */
  names?: readonly string[];
  /** Skip frames flagged as inactive. */
  activeOnly?: boolean;
}

function defaultName(index: number): string {
  return `frame_${String(index + 1).padStart(4, '0')}`;
}

/** Exported metadata is keyed by name, so duplicates have to be disambiguated. */
function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${name}_${suffix}`;
    suffix++;
  }
  used.add(candidate);
  return candidate;
}

function toRect(frame: Frame): Rect {
  return {
    x: Math.floor(frame.x),
    y: Math.floor(frame.y),
    width: Math.max(1, Math.floor(frame.w)),
    height: Math.max(1, Math.floor(frame.h)),
  };
}

/**
 * Measure every frame, pack them and resolve the atlas coordinates.
 * `gap` (padding + extrude) is baked into every packed box so two sprites can
 * never touch, whatever the source layout looks like.
 */
export function buildAtlasLayout(input: BuildAtlasInput): AtlasLayout {
  const { buffer = null, options, pivots = {}, activeOnly = false } = input;

  const frames = activeOnly ? input.frames.filter(frame => frame.isActive) : input.frames;
  if (frames.length === 0) {
    return { pages: [], sprites: [], occupancy: 0, savedPixels: 0 };
  }

  const gap = Math.max(0, Math.round(options.padding + options.extrude));
  const used = new Set<string>();

  const measured = frames.map((frame, position) => {
    const source = toRect(frame);
    const content = resolveTrimRect(buffer, source, options.trim, options.alphaThreshold);
    // Pivots are keyed by the position inside the frame list, because grid and
    // manual frames share the same `index` values.
    const pivot = pivots?.[position] ?? resolvePivot(options.pivotMode, options.customPivot);

    return {
      order: position,
      name: uniqueName(input.names?.[position] ?? defaultName(position), used),
      source,
      trimmed: content,
      offset: trimOffset(source, content),
      pivot,
      wasTrimmed: content.width !== source.width || content.height !== source.height,
    };
  });

  const inputs: PackInput[] = measured.map((sprite, index) => ({
    id: index,
    width: sprite.trimmed.width + gap * 2,
    height: sprite.trimmed.height + gap * 2,
  }));

  const pages = packRects(inputs, {
    powerOfTwo: options.powerOfTwo,
    maxPageSize: options.maxPageSize,
  });

  const sprites: AtlasSprite[] = [];
  const pageList: AtlasPage[] = pages.map((page, index) => ({
    index,
    width: page.width,
    height: page.height,
  }));

  let usedPixels = 0;
  let totalPixels = 0;
  let savedPixels = 0;

  pages.forEach((page, pageIndex) => {
    totalPixels += page.width * page.height;

    for (const box of page.boxes) {
      const source = measured[box.id];
      usedPixels += box.width * box.height;
      savedPixels +=
        source.source.width * source.source.height -
        source.trimmed.width * source.trimmed.height;

      sprites.push({
        ...source,
        frameIndex: frames[box.id].index,
        page: pageIndex,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        atlas: {
          x: box.x + gap,
          y: box.y + gap,
          width: source.trimmed.width,
          height: source.trimmed.height,
        },
      });
    }
  });

  return {
    pages: pageList,
    sprites: sprites.sort((a, b) => a.order - b.order),
    occupancy: totalPixels > 0 ? usedPixels / totalPixels : 0,
    savedPixels: Math.max(0, savedPixels),
  };
}
