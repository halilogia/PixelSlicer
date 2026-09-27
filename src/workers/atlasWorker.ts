// Atlas builder worker
// Runs trim + pack + rasterize off the main thread on an OffscreenCanvas.

import type { AtlasLayout } from '@domain/atlas/AtlasTypes';
import { buildAtlasPages } from '@infrastructure/atlas/AtlasPipeline';
import type {
  AtlasWorkerRequest,
  AtlasWorkerResponse,
} from '@infrastructure/atlas/AtlasWorkerProtocol';

/** `self` is typed by the DOM lib, so the worker scope is described locally. */
interface WorkerScope {
  postMessage(message: AtlasWorkerResponse, transfer?: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<AtlasWorkerRequest>) => void
  ): void;
}

const scope = self as unknown as WorkerScope;

const EMPTY_LAYOUT: AtlasLayout = {
  pages: [],
  sprites: [],
  occupancy: 0,
  savedPixels: 0,
  warnings: [],
};

function buildAtlas(request: AtlasWorkerRequest): AtlasWorkerResponse {
  const { layout, pages } = buildAtlasPages(
    request.source,
    request.frames,
    request.options,
    request.pivots,
    request.names
  );

  const bitmaps = pages.map(page => (page as OffscreenCanvas).transferToImageBitmap());
  return { id: request.id, layout, pages: bitmaps };
}

scope.addEventListener('message', event => {
  const request = event.data;
  try {
    const response = buildAtlas(request);
    scope.postMessage(response, response.pages);
  } catch (error) {
    scope.postMessage({
      id: request.id,
      layout: EMPTY_LAYOUT,
      pages: [],
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
