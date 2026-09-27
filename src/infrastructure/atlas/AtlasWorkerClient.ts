// Infrastructure Layer - Atlas worker client
// Prefers an OffscreenCanvas worker and transparently falls back to the main
// thread when Web Workers or OffscreenCanvas are unavailable.

import type { AtlasPackOptions, Pivot } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';
import { buildAtlasPages, type AtlasBuildResult } from './AtlasPipeline';
import type { AtlasSourceImage } from './AtlasRenderer';
import type { AtlasWorkerRequest, AtlasWorkerResponse } from './AtlasWorkerProtocol';

interface Pending {
  resolve: (result: AtlasBuildResult) => void;
  reject: (error: Error) => void;
}

export class AtlasWorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private workerFailed = false;

  /** True when the browser can run the atlas build inside a worker. */
  static isSupported(): boolean {
    return (
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      typeof createImageBitmap === 'function'
    );
  }

  private ensureWorker(): Worker | null {
    if (this.workerFailed || !AtlasWorkerClient.isSupported()) return null;
    if (this.worker) return this.worker;

    try {
      const worker = new Worker(new URL('../../workers/atlasWorker.ts', import.meta.url), {
        type: 'module',
      });

      worker.addEventListener('message', (event: MessageEvent<AtlasWorkerResponse>) => {
        const response = event.data;
        const entry = this.pending.get(response.id);
        if (!entry) return;
        this.pending.delete(response.id);

        if (response.error) {
          entry.reject(new Error(response.error));
          return;
        }
        entry.resolve({ layout: response.layout, pages: response.pages, usedWorker: true });
      });

      worker.addEventListener('error', event => {
        this.workerFailed = true;
        const error = new Error(event.message || 'Atlas worker crashed.');
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

  private buildOnMainThread(
    source: AtlasSourceImage,
    frames: readonly Frame[],
    options: AtlasPackOptions,
    pivots?: Record<number, Pivot>
  ): AtlasBuildResult {
    const { layout, pages } = buildAtlasPages(source, frames, options, pivots);
    return { layout, pages, usedWorker: false };
  }

  /** Trim, pack and rasterize the given frames into atlas pages. */
  async build(
    source: AtlasSourceImage,
    frames: readonly Frame[],
    options: AtlasPackOptions,
    pivots?: Record<number, Pivot>
  ): Promise<AtlasBuildResult> {
    const worker = this.ensureWorker();
    if (!worker) {
      return this.buildOnMainThread(source, frames, options, pivots);
    }

    const id = this.nextId++;
    const request: AtlasWorkerRequest = {
      id,
      source: await createImageBitmap(source),
      frames: frames.map(frame => ({ ...frame })),
      options,
      pivots,
    };

    try {
      return await new Promise<AtlasBuildResult>((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        worker.postMessage(request, [request.source]);
      });
    } catch {
      // A worker failure must never block the export: redo the work inline.
      return this.buildOnMainThread(source, frames, options, pivots);
    }
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
