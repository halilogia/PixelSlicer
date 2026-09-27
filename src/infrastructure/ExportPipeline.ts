// Infrastructure Layer - Export pipeline
// The pixel and encoding half of the ZIP/GIF export, free of any canvas
// access, so the main thread and the Web Worker run exactly the same code.

import JSZip from 'jszip';
import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import type { Frame } from '@domain/FrameLogic';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';

/** Produces the encoded bytes of one frame. */
export type FrameEncoder = (frame: Frame, index: number) => Promise<Blob>;

/** Produces the raw pixels of one frame, already placed in its final cell. */
export type FrameReader = (frame: Frame, index: number) => ImageData;

export interface ZipOptions {
  activeOnly?: boolean;
}

export function selectFrames(frames: readonly Frame[], activeOnly: boolean): Frame[] {
  return activeOnly ? frames.filter(frame => frame.isActive) : [...frames];
}

export function frameFileName(index: number): string {
  return `frame_${String(index + 1).padStart(4, '0')}.png`;
}

function createImageData(width: number, height: number): ImageData {
  return { data: new Uint8ClampedArray(width * height * 4), width, height, colorSpace: 'srgb' } as ImageData;
}

/** Copy one frame out of the sheet, clipped to the buffer. */
export function cropFrame(buffer: PixelBuffer, frame: Frame): ImageData {
  const image = createImageData(frame.w, frame.h);

  for (let y = 0; y < frame.h; y++) {
    const sourceY = frame.y + y;
    if (sourceY < 0 || sourceY >= buffer.height) continue;
    for (let x = 0; x < frame.w; x++) {
      const sourceX = frame.x + x;
      if (sourceX < 0 || sourceX >= buffer.width) continue;
      const from = (sourceY * buffer.width + sourceX) * 4;
      const to = (y * frame.w + x) * 4;
      image.data[to] = buffer.data[from];
      image.data[to + 1] = buffer.data[from + 1];
      image.data[to + 2] = buffer.data[from + 2];
      image.data[to + 3] = buffer.data[from + 3];
    }
  }

  return image;
}

/** Copy one frame into a fixed size cell, centred, transparent elsewhere. */
export function composeFrameCell(
  buffer: PixelBuffer,
  frame: Frame,
  cellWidth: number,
  cellHeight: number
): ImageData {
  const cell = createImageData(cellWidth, cellHeight);
  const offsetX = Math.floor((cellWidth - frame.w) / 2);
  const offsetY = Math.floor((cellHeight - frame.h) / 2);

  for (let y = 0; y < frame.h; y++) {
    const sourceY = frame.y + y;
    const destY = offsetY + y;
    if (sourceY < 0 || sourceY >= buffer.height || destY < 0 || destY >= cellHeight) continue;
    for (let x = 0; x < frame.w; x++) {
      const sourceX = frame.x + x;
      const destX = offsetX + x;
      if (sourceX < 0 || sourceX >= buffer.width || destX < 0 || destX >= cellWidth) continue;
      const from = (sourceY * buffer.width + sourceX) * 4;
      const to = (destY * cellWidth + destX) * 4;
      cell.data[to] = buffer.data[from];
      cell.data[to + 1] = buffer.data[from + 1];
      cell.data[to + 2] = buffer.data[from + 2];
      cell.data[to + 3] = buffer.data[from + 3];
    }
  }

  return cell;
}

/** Largest frame in the list, used as the GIF cell size. */
export function maxFrameSize(frames: readonly Frame[]): { width: number; height: number } {
  let width = 0;
  let height = 0;

  for (const frame of frames) {
    width = Math.max(width, frame.w);
    height = Math.max(height, frame.h);
  }

  return { width, height };
}

/** Pack the encoded frames into a ZIP blob. */
export async function encodeFramesAsZip(
  frames: readonly Frame[],
  encodeFrame: FrameEncoder,
  options: ZipOptions = {}
): Promise<Blob> {
  const selected = selectFrames(frames, options.activeOnly ?? true);
  if (selected.length === 0) {
    throw new Error('No active frames to export');
  }

  const zip = new JSZip();

  for (let i = 0; i < selected.length; i++) {
    // ArrayBuffer keeps JSZip on the same code path in the browser and in Node.
    const blob = await encodeFrame(selected[i], i);
    zip.file(frameFileName(i), await blob.arrayBuffer());
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Encode the frames as an animated GIF with a per frame palette, which is what
 * keeps fully transparent pixels transparent.
 */
export async function encodeGif(
  frames: readonly Frame[],
  readFrame: FrameReader,
  options: { fps: number }
): Promise<Blob> {
  const selected = selectFrames(frames, true);
  if (selected.length === 0) {
    throw new Error('No active frames to export');
  }

  const { width, height } = maxFrameSize(selected);
  const delay = Math.round(1000 / Math.max(1, options.fps));
  const gif = GIFEncoder();

  for (let i = 0; i < selected.length; i++) {
    const { data } = readFrame(selected[i], i);
    const palette = quantize(data, 256, {
      format: 'rgba4444',
      clearAlpha: true,
      clearAlphaThreshold: 0,
      clearAlphaColor: 0x00,
    });
    const index = applyPalette(data, palette, 'rgba4444');

    // Transparent index is 0 because clearAlphaColor is 0x00
    gif.writeFrame(index, width, height, { palette, delay, transparent: true, transparentIndex: 0 });
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}
