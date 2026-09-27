// Infrastructure Layer - Frame export protocol

import type { Frame } from '@domain/FrameLogic';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';

export type ExportMode = 'zip' | 'gif';

export interface FrameExportRequest {
  id: number;
  /** RGBA pixels of the sheet, read once on the main thread. */
  buffer: PixelBuffer;
  frames: Frame[];
  mode: ExportMode;
  /** ZIP only. */
  activeOnly?: boolean;
  /** GIF only. */
  fps?: number;
}

export interface FrameExportResponse {
  id: number;
  blob?: Blob;
  error?: string;
}
