// Infrastructure Layer - Background removal
// The pixel walk runs in a worker when OffscreenCanvas is available, with an
// inline fallback for browsers without it.

import type { PixelBuffer } from '@domain/atlas/AtlasTypes';
import { createAtlasCanvas, toNativeImageData, type AtlasSourceImage } from './atlas/AtlasRenderer';
import { readSourceBuffer } from './ExportService';

interface Pending {
  resolve: (buffer: PixelBuffer) => void;
  reject: (error: Error) => void;
}

interface Response {
  id: number;
  buffer?: PixelBuffer;
  error?: string;
}

let worker: Worker | null = null;
let workerFailed = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function isSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

function ensureWorker(): Worker | null {
  if (workerFailed || !isSupported()) return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL('../workers/backgroundWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', (event: MessageEvent<Response>) => {
      const response = event.data;
      const entry = pending.get(response.id);
      if (!entry) return;
      pending.delete(response.id);

      if (response.error || !response.buffer) {
        entry.reject(new Error(response.error ?? 'The background worker returned nothing.'));
        return;
      }
      entry.resolve(response.buffer);
    });
    worker.addEventListener('error', event => {
      workerFailed = true;
      const error = new Error(event.message || 'Background worker crashed.');
      pending.forEach(entry => entry.reject(error));
      pending.clear();
      worker?.terminate();
      worker = null;
    });
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

export interface RemoveColorOptions {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}

/** Clear every pixel within `tolerance` of the given colour. */
export function clearColorRange(
  buffer: PixelBuffer,
  options: RemoveColorOptions
): PixelBuffer {
  const { r: targetR, g: targetG, b: targetB, tolerance } = options;
  const data = buffer.data;

  for (let i = 0; i < data.length; i += 4) {
    if (
      Math.abs(data[i] - targetR) <= tolerance &&
      Math.abs(data[i + 1] - targetG) <= tolerance &&
      Math.abs(data[i + 2] - targetB) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }

  return buffer;
}

function bufferToCanvas(buffer: PixelBuffer): AtlasSourceImage {
  const canvas = createAtlasCanvas(buffer.width, buffer.height);
  const ctx = canvas.getContext('2d') as unknown as {
    putImageData(data: ImageData, x: number, y: number): void;
  };
  ctx.putImageData(
    toNativeImageData({ data: buffer.data, width: buffer.width, height: buffer.height } as ImageData),
    0,
    0
  );
  return canvas;
}

async function runOnMainThread(
  image: AtlasSourceImage,
  options: RemoveColorOptions
): Promise<AtlasSourceImage> {
  const buffer = clearColorRange(readSourceBuffer(image), options);
  return bufferToCanvas(buffer);
}

/**
 * Return a copy of the image with the background colour made transparent.
 * The returned value can be drawn on a canvas like the original image.
 */
export async function removeBackgroundColor(
  image: AtlasSourceImage,
  r: number,
  g: number,
  b: number,
  tolerance: number
): Promise<AtlasSourceImage> {
  const options: RemoveColorOptions = { r, g, b, tolerance };
  const active = ensureWorker();

  if (!active) {
    return runOnMainThread(image, options);
  }

  const id = nextId++;
  const buffer = readSourceBuffer(image);

  try {
    const cleaned = await new Promise<PixelBuffer>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      active.postMessage({ id, buffer, options });
    });
    return bufferToCanvas(cleaned);
  } catch {
    return runOnMainThread(image, options);
  }
}

/** Test hook: forget the worker so the next call re-evaluates support. */
export function disposeBackgroundWorker(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
