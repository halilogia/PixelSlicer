// Frame export worker
// Encodes the ZIP/GIF export off the main thread on an OffscreenCanvas.

import { createAtlasCanvas, canvasToBlob } from '@infrastructure/atlas/AtlasRenderer';
import { composeFrameCell, cropFrame, encodeFramesAsZip, encodeGif, maxFrameSize } from '@infrastructure/ExportPipeline';
import type {
  FrameExportRequest,
  FrameExportResponse,
} from '@infrastructure/FrameExportProtocol';

/** `self` is typed by the DOM lib, so the worker scope is described locally. */
interface WorkerScope {
  postMessage(message: FrameExportResponse, transfer?: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<FrameExportRequest>) => void
  ): void;
}

const scope = self as unknown as WorkerScope;

async function encodePng(imageData: ImageData): Promise<Blob> {
  const canvas = createAtlasCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d') as unknown as {
    putImageData(data: ImageData, x: number, y: number): void;
  };
  ctx.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas, 'image/png');
}

async function runExport(request: FrameExportRequest): Promise<Blob> {
  const { buffer, frames } = request;

  if (request.mode === 'zip') {
    return encodeFramesAsZip(frames, frame => encodePng(cropFrame(buffer, frame)), {
      activeOnly: request.activeOnly ?? true,
    });
  }

  const active = frames.filter(frame => frame.isActive);
  const { width, height } = maxFrameSize(active);
  return encodeGif(frames, frame => composeFrameCell(buffer, frame, width, height), {
    fps: request.fps ?? 10,
  });
}

scope.addEventListener('message', event => {
  const request = event.data;
  runExport(request).then(
    blob => scope.postMessage({ id: request.id, blob }),
    (error: unknown) => {
      scope.postMessage({
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  );
});
