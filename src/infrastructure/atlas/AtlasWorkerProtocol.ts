// Infrastructure Layer - Worker protocol
// Structured-clone safe request/response shapes shared by the client and worker.

import type { AtlasLayout, AtlasPackOptions, Pivot } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';

export interface AtlasWorkerRequest {
  id: number;
  source: ImageBitmap;
  frames: Frame[];
  options: AtlasPackOptions;
  pivots?: Record<number, Pivot>;
}

export interface AtlasWorkerResponse {
  id: number;
  layout: AtlasLayout;
  pages: ImageBitmap[];
  error?: string;
}
