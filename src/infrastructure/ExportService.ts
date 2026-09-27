// Infrastructure Layer - Export services
// Canvas access + Blob management, delegating the encoding to ExportPipeline

import type { Frame } from '@domain/FrameLogic';
import { createAtlasCanvas, canvasToBlob, sourceSize, toNativeImageData, type AtlasSourceImage } from './atlas/AtlasRenderer';
// The encoding pipeline is loaded on demand: it is only needed when an export
// actually runs, and the worker has its own copy of it.
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';

/** Read the source image into RGBA pixels once, so the export never redraws. */
function readSourceBufferInternal(image: AtlasSourceImage): PixelBuffer {
  const { width, height } = sourceSize(image);
  const canvas = createAtlasCanvas(width, height);
  const ctx = canvas.getContext('2d') as unknown as {
    drawImage(image: CanvasImageSource, dx: number, dy: number): void;
    getImageData(x: number, y: number, w: number, h: number): ImageData;
  };

  ctx.drawImage(image as CanvasImageSource, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  return { width, height, data: imageData.data };
}

async function encodePng(imageData: ImageData): Promise<Blob> {
  const canvas = createAtlasCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d') as unknown as {
    putImageData(data: ImageData, x: number, y: number): void;
  };
  ctx.putImageData(toNativeImageData(imageData), 0, 0);
  return canvasToBlob(canvas, 'image/png');
}

/** Read the sheet into RGBA pixels, for the worker based export path. */
export function readSourceBuffer(image: AtlasSourceImage): PixelBuffer {
  return readSourceBufferInternal(image);
}

/**
 * Export frames as individual PNG files in a ZIP
 */
export async function exportAsZip(
  image: AtlasSourceImage,
  frames: readonly Frame[],
  activeOnly: boolean = true
): Promise<Blob> {
  const { cropFrame, encodeFramesAsZip, selectFrames } = await import('./ExportPipeline');
  const selected = selectFrames(frames, activeOnly);
  if (selected.length === 0) {
    throw new Error('No active frames to export');
  }

  const buffer = readSourceBuffer(image);
  return encodeFramesAsZip(frames, frame => encodePng(cropFrame(buffer, frame)), { activeOnly });
}

/**
 * Export frames as a sprite sheet
 */
export async function exportAsSpriteSheet(
  image: AtlasSourceImage,
  frames: readonly Frame[],
  columns: number,
  activeOnly: boolean = true
): Promise<Blob> {
  const filteredFrames = activeOnly 
    ? frames.filter(f => f.isActive) 
    : frames;
  
  if (filteredFrames.length === 0) {
    throw new Error('No active frames to export');
  }
  
  const rows = Math.ceil(filteredFrames.length / columns);
  
  // Calculate max dimensions of a single frame
  let maxFrameWidth = 0;
  let maxFrameHeight = 0;
  
  for (const frame of filteredFrames) {
    maxFrameWidth = Math.max(maxFrameWidth, frame.w);
    maxFrameHeight = Math.max(maxFrameHeight, frame.h);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = maxFrameWidth * columns;
  canvas.height = maxFrameHeight * rows;
  
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw frames in sprite sheet layout
  for (let i = 0; i < filteredFrames.length; i++) {
    const frame = filteredFrames[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    
    // Center the frame within its grid cell if it's smaller than the max dimensions
    const destX = col * maxFrameWidth + (maxFrameWidth - frame.w) / 2;
    const destY = row * maxFrameHeight + (maxFrameHeight - frame.h) / 2;
    
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      destX, destY, frame.w, frame.h
    );
  }
  
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Export a single frame as PNG
 */
export async function exportSingleFrame(
  image: AtlasSourceImage,
  frame: Frame
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = frame.w;
  canvas.height = frame.h;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    frame.x, frame.y, frame.w, frame.h,
    0, 0, frame.w, frame.h
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Export frames as an animated GIF
 */
export async function exportAsGif(
  image: AtlasSourceImage,
  frames: readonly Frame[],
  fps: number,
  activeOnly: boolean = true
): Promise<Blob> {
  const { composeFrameCell, encodeGif, maxFrameSize, selectFrames } = await import('./ExportPipeline');
  const selected = selectFrames(frames, activeOnly);
  if (selected.length === 0) {
    throw new Error('No active frames to export');
  }

  const buffer = readSourceBuffer(image);
  const { width, height } = maxFrameSize(selected);

  // Per frame palette with a per frame cell: the transparent pixels of a small
  // sprite stay transparent even when a bigger frame defines the GIF size.
  return encodeGif(frames, frame => composeFrameCell(buffer, frame, width, height), { fps });
}
/**
 * Trigger file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}