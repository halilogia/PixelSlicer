// Infrastructure Layer - Frame export worker client
// Sends the sheet to a worker when possible and falls back to the main thread.

import type { Frame } from '@domain/FrameLogic';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';
import { createAtlasCanvas } from './atlas/AtlasRenderer';
import type { ExportMode, FrameExportRequest, FrameExportResponse } from './FrameExportProtocol';

export interface FrameExportOptions {
  activeOnly?: boolean;
  fps?: number;
}

interface Pending {
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
}

export class FrameExportWorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private workerFailed = false;
  private readonly pending = new Map<number, Pending>();

  static isSupported(): boolean {
    return (
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      typeof Blob !== 'undefined'
    );
  }

  private ensureWorker(): Worker | null {
    if (this.workerFailed || !FrameExportWorkerClient.isSupported()) return null;
    if (this.worker) return this.worker;

    try {
      const worker = new Worker(new URL('../workers/frameExportWorker.ts', import.meta.url), {
        type: 'module',
      });

      worker.addEventListener('message', (event: MessageEvent<FrameExportResponse>) => {
        const response = event.data;
        const entry = this.pending.get(response.id);
        if (!entry) return;
        this.pending.delete(response.id);

        if (response.error || !response.blob) {
          entry.reject(new Error(response.error ?? 'The export worker returned nothing.'));
          return;
        }
        entry.resolve(response.blob);
      });

      worker.addEventListener('error', event => {
        this.workerFailed = true;
        const error = new Error(event.message || 'Export worker crashed.');
        this.pending.forEach(entry => entry.reject(error));
        this.pending.clear();
        this.worker?.terminate();
        this.worker = null;
      });

      this.worker = worker;
      return worker;
    } catch {
      this.workerFailed = true;
      return null;
    }
  }

  private async encodePng(imageData: ImageData): Promise<Blob> {
    const canvas = createAtlasCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d') as unknown as {
      putImageData(data: ImageData, x: number, y: number): void;
    };
    ctx.putImageData(imageData, 0, 0);

    if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob({ type: 'image/png' });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode the frame as PNG.'));
      }, 'image/png');
    });
  }

  /** Run the export on the main thread: identical code, just not in a worker. */
  private async runOnMainThread(
    buffer: PixelBuffer,
    frames: readonly Frame[],
    mode: ExportMode,
    options: FrameExportOptions
  ): Promise<Blob> {
    // Loaded on demand so JSZip and gifenc stay out of the main bundle.
    const pipeline = await import('./ExportPipeline');

    if (mode === 'zip') {
      return pipeline.encodeFramesAsZip(
        frames,
        frame => this.encodePng(pipeline.cropFrame(buffer, frame)),
        { activeOnly: options.activeOnly ?? true }
      );
    }

    const active = frames.filter(frame => frame.isActive);
    const { width, height } = pipeline.maxFrameSize(active);
    return pipeline.encodeGif(
      frames,
      frame => pipeline.composeFrameCell(buffer, frame, width, height),
      { fps: options.fps ?? 10 }
    );
  }

  async export(
    buffer: PixelBuffer,
    frames: readonly Frame[],
    mode: ExportMode,
    options: FrameExportOptions = {}
  ): Promise<Blob> {
    const worker = this.ensureWorker();
    if (!worker) {
      return this.runOnMainThread(buffer, frames, mode, options);
    }

    const id = this.nextId++;
    const request: FrameExportRequest = {
      id,
      buffer,
      frames: frames.map(frame => ({ ...frame })),
      mode,
      activeOnly: options.activeOnly,
      fps: options.fps,
    };

    try {
      return await new Promise<Blob>((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        worker.postMessage(request);
      });
    } catch (error) {
      // A failing worker must never cost the user their export.
      return this.runOnMainThread(buffer, frames, mode, options);
    }
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
