// Test fixtures for the domain layer (no DOM required).

import type { PixelBuffer } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';

export function frame(x: number, y: number, w: number, h: number, index = 0): Frame {
  return { x, y, w, h, index, isActive: true };
}

/** Create an RGBA buffer from a per pixel painter. `null` means transparent. */
export function pixelBuffer(
  width: number,
  height: number,
  paint?: (x: number, y: number) => [number, number, number, number] | null
): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  if (!paint) return { width, height, data };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const color = paint(x, y);
      if (!color) continue;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = color[3];
    }
  }

  return { width, height, data };
}

/** Paint an opaque rectangle, everything else stays transparent. */
export function paintRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: [number, number, number, number] = [255, 255, 255, 255]
): (x: number, y: number) => [number, number, number, number] | null {
  return (x, y) => (x >= x0 && x < x1 && y >= y0 && y < y1 ? color : null);
}
