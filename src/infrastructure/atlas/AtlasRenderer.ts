// Infrastructure Layer - Atlas renderer
// Shared by the OffscreenCanvas worker and the main thread fallback, so it
// must not touch `document` at module scope.

import type { AtlasSprite, PixelBuffer } from '@domain/atlas/AtlasTypes';

export type AtlasSourceImage = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
export type AtlasCanvas = OffscreenCanvas | HTMLCanvasElement;
/** A finished atlas page: an OffscreenCanvas, a DOM canvas or a worker ImageBitmap. */
export type AtlasPageImage = AtlasCanvas | ImageBitmap;

/** Minimal 2D context surface used by both canvas flavours. */
interface Ctx2D {
  drawImage(image: CanvasImageSource, dx: number, dy: number): void;
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  getImageData(x: number, y: number, w: number, h: number): ImageData;
  save(): void;
  restore(): void;
  imageSmoothingEnabled: boolean;
}

export interface DrawAtlasOptions {
  /** Width of the border ring replicated around every sprite. */
  extrude: number;
}

function context2d(canvas: AtlasCanvas): Ctx2D {
  const ctx = canvas.getContext('2d') as unknown as Ctx2D | null;
  if (!ctx) throw new Error('Could not acquire a 2D context for the atlas canvas.');
  return ctx;
}

/** Natural pixel size of any supported image source. */
export function sourceSize(source: AtlasSourceImage): { width: number; height: number } {
  const image = source as HTMLImageElement;
  if (typeof image.naturalWidth === 'number' && image.naturalWidth > 0) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

/** Create an OffscreenCanvas when available, otherwise a regular canvas. */
export function createAtlasCanvas(width: number, height: number): AtlasCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error('No canvas implementation available.');
}

/** Copy an image source into RGBA pixels (used for auto-trim). */
export function readPixelBuffer(source: AtlasSourceImage): PixelBuffer {
  const { width, height } = sourceSize(source);
  const canvas = createAtlasCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source as CanvasImageSource, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);

  return { width, height, data: imageData.data };
}

/** PNG blob for canvases and for the ImageBitmaps returned by the worker. */
export async function canvasToBlob(
  page: AtlasPageImage,
  type: string = 'image/png'
): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined' && page instanceof OffscreenCanvas) {
    return page.convertToBlob({ type });
  }

  if (typeof HTMLCanvasElement !== 'undefined' && page instanceof HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => {
      page.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode the atlas canvas as PNG.'));
      }, type);
    });
  }

  // ImageBitmap (worker output): draw it once into a scratch canvas first.
  const scratch = createAtlasCanvas(page.width, page.height);
  const ctx = context2d(scratch);
  ctx.drawImage(page as CanvasImageSource, 0, 0);
  return canvasToBlob(scratch, type);
}

/**
 * Replicate the sprite border into the extrude ring so linear filtering can
 * never sample the neighbour sprite.
 */
function drawExtrudedBorder(
  ctx: Ctx2D,
  source: AtlasSourceImage,
  sprite: AtlasSprite,
  ring: number
): void {
  const src = sprite.trimmed;
  const box = sprite.box;
  const dst = sprite.atlas;
  const srcImage = source as CanvasImageSource;

  // Horizontal edges (full width) then vertical edges (inner width).
  ctx.drawImage(
    srcImage,
    src.x, src.y, src.width, ring,
    dst.x, box.y, dst.width, ring
  );
  ctx.drawImage(
    srcImage,
    src.x, src.y + src.height - ring, src.width, ring,
    dst.x, dst.y + dst.height, dst.width, ring
  );
  ctx.drawImage(
    srcImage,
    src.x, src.y, ring, src.height,
    box.x, dst.y, ring, dst.height
  );
  ctx.drawImage(
    srcImage,
    src.x + src.width - ring, src.y, ring, src.height,
    dst.x + dst.width, dst.y, ring, dst.height
  );

  // Corners.
  const corners: Array<[number, number, number, number]> = [
    [src.x, src.y, box.x, box.y],
    [src.x + src.width - ring, src.y, dst.x + dst.width, box.y],
    [src.x, src.y + src.height - ring, box.x, dst.y + dst.height],
    [src.x + src.width - ring, src.y + src.height - ring, dst.x + dst.width, dst.y + dst.height],
  ];
  for (const [sx, sy, dx, dy] of corners) {
    ctx.drawImage(srcImage, sx, sy, ring, ring, dx, dy, ring, ring);
  }
}

/** Render one atlas page onto a canvas. */
export function drawAtlasPage(
  canvas: AtlasCanvas,
  source: AtlasSourceImage,
  sprites: readonly AtlasSprite[],
  page: { width: number; height: number },
  options: DrawAtlasOptions
): void {
  canvas.width = page.width;
  canvas.height = page.height;

  const ctx = context2d(canvas);
  ctx.clearRect(0, 0, page.width, page.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const ring = options.extrude;

  for (const sprite of sprites) {
    const src = sprite.trimmed;
    const dst = sprite.atlas;

    ctx.drawImage(
      source as CanvasImageSource,
      src.x, src.y, src.width, src.height,
      dst.x, dst.y, dst.width, dst.height
    );

    if (ring > 0) drawExtrudedBorder(ctx, source, sprite, ring);
  }

  ctx.restore();
}
