// Background removal worker
// Walks every pixel of the sheet off the main thread.

import { clearColorRange, type RemoveColorOptions } from '@infrastructure/BackgroundRemoval';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';

interface Request {
  id: number;
  buffer: PixelBuffer;
  options: RemoveColorOptions;
}

interface Response {
  id: number;
  buffer?: PixelBuffer;
  error?: string;
}

/** `self` is typed by the DOM lib, so the worker scope is described locally. */
interface WorkerScope {
  postMessage(message: Response, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<Request>) => void): void;
}

const scope = self as unknown as WorkerScope;

scope.addEventListener('message', event => {
  const { id, buffer, options } = event.data;

  try {
    scope.postMessage({ id, buffer: clearColorRange(buffer, options) }, [buffer.data.buffer]);
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
