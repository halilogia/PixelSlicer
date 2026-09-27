// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoFrameGridService } from './VideoFrameGridService';
import { VideoUploadService } from './VideoUploadService';
import type { ExtractedFrame } from './VideoFrameExtractor';
import { FakeContext } from '../../testUtils/canvasFixtures';

function extractedFrame(index: number, width = 16, height = 16): ExtractedFrame {
  return {
    id: index,
    imageData: {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
      colorSpace: 'srgb',
    } as ImageData,
    timestamp: index / 10,
  };
}

function videoFile(name = 'clip.mp4', type = 'video/mp4', size = 1024): File {
  return { name, type, size } as File;
}

/** A <video> element that reports metadata and seeks synchronously. */
class FakeVideoElement {
  videoWidth = 320;
  videoHeight = 180;
  duration = 2;
  currentTime = 0;
  src = '';
  muted = true;
  crossOrigin: string | null = null;
  preload = '';
  readyState = 1;

  onloadedmetadata: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onended: (() => void) | null = null;

  private playCount = 0;

  get currentSrc(): string {
    return this.src;
  }

  get paused(): boolean {
    return true;
  }

  canPlayType(): string {
    return 'probably';
  }

  load(): void {
    queueMicrotask(() => this.onloadedmetadata?.());
  }

  play(): Promise<void> {
    this.playCount++;
    return Promise.resolve();
  }

  pause(): void {
    this.playCount--;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  removeAttribute(): void {}
  setAttribute(): void {}
}

let createdVideos = 0;

beforeEach(() => {
  createdVideos = 0;
  const context = new FakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  // happy-dom has no canvas backend, so the encoder is stubbed too.
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
  // Only the video element is faked, the rest of happy-dom stays intact.
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'video') {
      createdVideos++;
      return new FakeVideoElement() as unknown as HTMLVideoElement;
    }
    return createElement(tag);
  });
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:video',
    revokeObjectURL: () => undefined,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('VideoFrameGridService.calculateOptimalGrid', () => {
  it('prefers a square grid', () => {
    const grid = VideoFrameGridService.calculateOptimalGrid(16, 32, 32);

    expect(grid.columns).toBe(4);
    expect(grid.rows).toBe(4);
    expect(grid.frameWidth).toBe(32);
  });

  it('never exceeds the canvas width', () => {
    const grid = VideoFrameGridService.calculateOptimalGrid(100, 64, 64, 256);

    expect(grid.columns).toBeLessThanOrEqual(4);
    expect(grid.columns * grid.rows).toBeGreaterThanOrEqual(100);
  });

  it('never uses more columns than there are frames', () => {
    expect(VideoFrameGridService.calculateOptimalGrid(2, 32, 32).columns).toBe(2);
  });

  it('adds a row for an incomplete last line', () => {
    const grid = VideoFrameGridService.calculateOptimalGrid(10, 32, 32);

    expect(grid.columns * grid.rows).toBeGreaterThanOrEqual(10);
  });
});

describe('VideoFrameGridService.createSpriteSheetFromFrames', () => {
  it('rejects an empty frame list', async () => {
    await expect(VideoFrameGridService.createSpriteSheetFromFrames([])).rejects.toThrow(
      /No frames provided/
    );
  });

  it('releases the frame buffers on cleanup', () => {
    const frames = [0, 1].map(index => extractedFrame(index));
    frames[0].canvas = { width: 8, height: 8 } as HTMLCanvasElement;

    VideoFrameGridService.cleanupFrames(frames);

    expect((frames[0].canvas as unknown as { width: number }).width).toBe(0);
    expect(frames[0].imageData).toBeNull();
  });

  it('rejects when the canvas cannot be encoded into an image', async () => {
    await expect(
      VideoFrameGridService.canvasToImage({
        toDataURL: () => {
          throw new Error('Failed to convert canvas to image');
        },
      } as unknown as HTMLCanvasElement)
    ).rejects.toThrow(/Failed to convert/);
  });
});

describe('VideoUploadService', () => {
  it('rejects a file that is too large', async () => {
    const service = new VideoUploadService();
    const result = await service.validateVideo(videoFile('big.mp4', 'video/mp4', 600 * 1024 * 1024));

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('FILE_TOO_LARGE');
  });

  it('rejects an unsupported container', async () => {
    const service = new VideoUploadService();
    const result = await service.validateVideo(videoFile('clip.webm', 'video/webm'));

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_FORMAT');
  });
});
