// Infrastructure Layer - Atlas pipeline
// One implementation of trim + pack + rasterize, shared by the OffscreenCanvas
// worker and the main thread fallback so both always produce the same result.

import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import type { AtlasLayout, AtlasPackOptions, Pivot } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';
import {
  createAtlasCanvas,
  drawAtlasPage,
  readPixelBuffer,
  type AtlasCanvas,
  type AtlasPageImage,
  type AtlasSourceImage,
} from './AtlasRenderer';

export interface AtlasBuildResult {
  layout: AtlasLayout;
  /** One page per atlas entry: OffscreenCanvas / DOM canvas / worker ImageBitmap. */
  pages: AtlasPageImage[];
  /** False when the work had to happen on the main thread. */
  usedWorker: boolean;
}

/** Measure, pack and rasterize every frame. */
export function buildAtlasPages(
  source: AtlasSourceImage,
  frames: readonly Frame[],
  options: AtlasPackOptions,
  pivots?: Record<number, Pivot>,
  names?: readonly string[]
): { layout: AtlasLayout; pages: AtlasCanvas[] } {
  const buffer = readPixelBuffer(source);
  const layout = buildAtlasLayout({ frames, options, buffer, pivots, names });

  const pages = layout.pages.map(page => {
    const canvas = createAtlasCanvas(page.width, page.height);
    drawAtlasPage(
      canvas,
      source,
      layout.sprites.filter(sprite => sprite.page === page.index),
      page,
      { extrude: options.extrude }
    );
    return canvas;
  });

  return { layout, pages };
}
