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
  src = '';
  muted = true;
  crossOrigin: string | null = null;
  preload = '';
  readyState = 1;

  onloadedmetadata: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onended: (() => void) | null = null;

  private time = 0;

  /** Seeking resolves through onseeked, which the thumbnail helper waits for. */
  get currentTime(): number {
    return this.time;
  }

  set currentTime(value: number) {
    this.time = value;
    queueMicrotask(() => this.onseeked?.());
  }

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
    return Promise.resolve();
  }

  pause(): void {}

  addEventListener(): void {}
  removeEventListener(): void {}
  removeAttribute(): void {}
  setAttribute(): void {}
  /** The validation helpers call remove() while cleaning up. */
  remove(): void {}
}

let createdVideos = 0;

/** Only the canvas backend is faked here, the rest of happy-dom stays real. */
function stubCanvasBackend(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    new FakeContext() as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA');
}

/** Additionally, <video> is a fake so metadata and seeking resolve. */
function stubVideoElement(): void {
  createdVideos = 0;
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
}

beforeEach(() => {
  stubCanvasBackend();
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
    expect(grid.frameHeight).toBe(32);
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

  it('lays the frames out on a square grid sized from the first frame', async () => {
    const frames = [0, 1, 2, 3].map(index => extractedFrame(index, 16, 16));
    const sheet = await VideoFrameGridService.createSpriteSheetFromFrames(frames, 256);

    expect(sheet.totalFrames).toBe(4);
    expect(sheet.config.columns).toBe(2);
    expect(sheet.config.rows).toBe(2);
    expect((sheet.spriteSheet as HTMLCanvasElement).width).toBe(32);
    expect((sheet.spriteSheet as HTMLCanvasElement).height).toBe(32);
  });

  it('falls back to the image data when a frame has no canvas', async () => {
    const frames = [0, 1].map(index => extractedFrame(index, 8, 8));
    const sheet = await VideoFrameGridService.createSpriteSheetFromFrames(frames, 256);

    expect((sheet.spriteSheet as HTMLCanvasElement).width).toBe(16);
  });

  it('prefers the per frame canvas size over the image data size', async () => {
    const frames = [extractedFrame(0, 8, 8)];
    frames[0].canvas = { width: 24, height: 24 } as HTMLCanvasElement;

    const sheet = await VideoFrameGridService.createSpriteSheetFromFrames(frames, 256);

    expect(sheet.config.frameWidth).toBe(24);
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

describe('VideoUploadService file validation', () => {
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

  it('accepts mp4 and mov', async () => {
    stubVideoElement();
    const service = new VideoUploadService();

    expect((await service.validateVideo(videoFile())).valid).toBe(true);
    expect((await service.validateVideo(videoFile('a.mov', 'video/quicktime'))).valid).toBe(true);
    expect(createdVideos).toBeGreaterThanOrEqual(2);
  });

  it('rejects a codec the browser cannot play', async () => {
    stubVideoElement();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'video') {
        const video = new FakeVideoElement() as unknown as FakeVideoElement;
        video.canPlayType = () => '';
        return video as unknown as HTMLVideoElement;
      }
      return document.body.ownerDocument.createElement(tag);
    });

    const result = await new VideoUploadService().validateVideo(videoFile());

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_CODEC');
  });
});

describe('VideoUploadService upload simulation', () => {
  beforeEach(() => {
    stubVideoElement();
    // The upload is a timed simulation, the clock is driven explicitly so the
    // test does not wait for the real progress animation.
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports progress and resolves with the video file', async () => {
    const service = new VideoUploadService();
    const percentages: number[] = [];

    const promise = service.uploadVideo(videoFile(), {
      onProgress: state => percentages.push(state.percentage),
    });
    await vi.advanceTimersByTimeAsync(30_000);
    const video = await promise;

    expect(video.name).toBe('clip.mp4');
    expect(video.type).toBe('video/mp4');
    expect(video.metadata?.duration).toBe(2);
    expect(percentages[0]).toBe(0);
    expect(percentages[percentages.length - 1]).toBe(100);
  });

  it('can be cancelled while uploading', async () => {
    const service = new VideoUploadService();
    // The upload can reject from two places at once, so the outcome is
    // captured instead of leaving a rejection unhandled.
    const outcome = service.uploadVideo(videoFile()).then(
      () => null,
      (error: Error) => error
    );

    await vi.advanceTimersByTimeAsync(60);
    service.cancelAllUploads();
    await vi.advanceTimersByTimeAsync(30_000);

    const error = await outcome;
    // The service rejects with a plain object carrying the code and the message.
    expect(error).not.toBeNull();
    expect(String(error?.message ?? '')).toMatch(/cancel/i);
  });

  it('cancels a single upload by id', async () => {
    const service = new VideoUploadService();
    const completed: string[] = [];
    const promise = service.uploadVideo(videoFile(), {
      onComplete: video => completed.push(video.id),
    });
    await vi.advanceTimersByTimeAsync(60);
    // The service tracks uploads by the id it generates, unknown ids are a no-op.
    service.cancelUpload('does-not-exist');
    await vi.advanceTimersByTimeAsync(30_000);

    const video = await promise;
    expect(completed).toEqual([video.id]);
  });
});
