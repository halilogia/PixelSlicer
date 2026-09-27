// Test setup shared by every suite.
// Node-only suites get the browser shims the domain code expects to exist.

import { afterEach, vi } from 'vitest';

// Node has no canvas, the infrastructure fallbacks use OffscreenCanvas.
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  globalThis.OffscreenCanvas = class {} as unknown as typeof OffscreenCanvas;
}

// Nothing else should leak between files.
afterEach(() => {
  vi.clearAllMocks();
});
