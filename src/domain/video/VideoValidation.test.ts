import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractVideoMetadata,
  generateThumbnail,
  validateFileFormat,
  validateFileSize,
  validateVideoCodec,
} from './VideoValidation';
import { MAX_FILE_SIZE } from './Video';

class FakeVideo {
  preload = '';
  muted = false;
  crossOrigin: string | null = null;
  videoWidth = 640;
  videoHeight = 480;
  duration = 12.5;
  canPlay = 'maybe';
  removed = false;

  onloadedmetadata: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  onerror: (() => void) | null = null;

  private time = 0;

  get currentTime(): number {
    return this.time;
  }

  set currentTime(value: number) {
    this.time = value;
    // Seeking resolves synchronously in the fake, the real element is async.
    queueMicrotask(() => this.onseeked?.());
  }

  canPlayType(): string {
    return this.canPlay;
  }

  load(): void {
    queueMicrotask(() => this.onloadedmetadata?.());
  }

  remove(): void {
    this.removed = true;
  }
}

class FakeCanvas {
  width = 0;
  height = 0;
  removed = false;
  drawn: Array<[number, number, number, number]> = [];

  getContext(): { drawImage: (...args: unknown[]) => void } {
    return {
      // The first argument is the video element, only the geometry is asserted.
      drawImage: (...args: unknown[]) =>
        this.drawn.push(args.slice(1) as [number, number, number, number]),
    };
  }

  toDataURL(): string {
    return 'data:image/jpeg;base64,AAAA';
  }

  remove(): void {
    this.removed = true;
  }
}

let lastVideo: FakeVideo | null = null;
let lastCanvas: FakeCanvas | null = null;
let createVideo: () => FakeVideo = () => new FakeVideo();
const revoked: string[] = [];

/** Force the video element the code under test will receive. */
function withVideo(video: FakeVideo): void {
  createVideo = () => video;
}

function fakeFile(name: string, type: string, size = 1024): File {
  const file = { name, type, size } as File;
  return file;
}

beforeEach(() => {
  lastVideo = null;
  lastCanvas = null;
  createVideo = () => new FakeVideo();
  revoked.length = 0;
  vi.stubGlobal('URL', {
    createObjectURL: () => {
      const url = `blob:video-${revoked.length + 1}`;
      return url;
    },
    revokeObjectURL: (url: string) => revoked.push(url),
  });
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag === 'video') {
        lastVideo = createVideo();
        return lastVideo;
      }
      lastCanvas = new FakeCanvas();
      return lastCanvas;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('validateFileSize', () => {
  it('accepts a file at the limit', () => {
    expect(validateFileSize(fakeFile('a.mp4', 'video/mp4', MAX_FILE_SIZE))).toEqual({ valid: true });
  });

  it('rejects an oversized file with a readable message', () => {
    const result = validateFileSize(fakeFile('a.mp4', 'video/mp4', MAX_FILE_SIZE + 1));
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('FILE_TOO_LARGE');
    expect(result.error?.message).toMatch(/500MB/);
  });
});

describe('validateFileFormat', () => {
  it('accepts the allowed MIME types', () => {
    expect(validateFileFormat(fakeFile('a.mp4', 'video/mp4')).valid).toBe(true);
    expect(validateFileFormat(fakeFile('a.mov', 'video/quicktime')).valid).toBe(true);
  });

  it('falls back to the extension when the MIME type is missing', () => {
    expect(validateFileFormat(fakeFile('clip.MP4', '')).valid).toBe(true);
    expect(validateFileFormat(fakeFile('clip.MOV', 'application/octet-stream')).valid).toBe(true);
  });

  it('rejects anything else', () => {
    const result = validateFileFormat(fakeFile('clip.webm', 'video/webm'));
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_FORMAT');
  });
});

describe('validateVideoCodec', () => {
  it('accepts a codec the browser can play and releases the URL', async () => {
    const video = new FakeVideo();
    video.canPlay = 'probably';
    withVideo(video);

    await expect(validateVideoCodec(fakeFile('a.mp4', 'video/mp4'))).resolves.toEqual({ valid: true });
    expect(revoked).toHaveLength(1);
  });

  it('rejects a codec the browser cannot decode', async () => {
    const video = new FakeVideo();
    video.canPlay = '';
    withVideo(video);

    const result = await validateVideoCodec(fakeFile('a.mp4', 'video/mp4'));
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_CODEC');
    expect(result.error?.message).toMatch(/H.264/);
    expect(revoked).toHaveLength(1);
  });

  it('revokes the object URL even when the element errors', async () => {
    const video = new FakeVideo();
    video.load = () => queueMicrotask(() => video.onerror?.());
    withVideo(video);

    const result = await validateVideoCodec(fakeFile('a.mp4', 'video/mp4'));
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_CODEC');
    expect(result.error?.message).toMatch(/corrupted/);
    expect(revoked).toHaveLength(1);
  });

  it('gives up after the timeout', async () => {
    vi.useFakeTimers();
    try {
      const video = new FakeVideo();
      // Metadata never arrives.
      video.load = () => undefined;
      withVideo(video);

      const pending = validateVideoCodec(fakeFile('a.mp4', 'video/mp4'));
      await vi.advanceTimersByTimeAsync(10000);
      const result = await pending;

      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(revoked).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('extractVideoMetadata', () => {
  it('reads the dimensions and estimates the bitrate', async () => {
    const metadata = await extractVideoMetadata(fakeFile('a.mp4', 'video/mp4', 1_000_000));

    expect(metadata).toEqual({
      duration: 12.5,
      width: 640,
      height: 480,
      fps: 30,
      codec: 'H.264',
      bitrate: Math.round((1_000_000 * 8) / 12.5),
    });
    expect(revoked).toHaveLength(1);
  });

  it('rejects when the element errors', async () => {
    const video = new FakeVideo();
    video.load = () => queueMicrotask(() => video.onerror?.());
    withVideo(video);

    await expect(extractVideoMetadata(fakeFile('a.mp4', 'video/mp4'))).rejects.toThrow(
      /Failed to load video metadata/
    );
    expect(revoked).toHaveLength(1);
  });
});

describe('generateThumbnail', () => {
  it('seeks to the middle by default and returns a data URL', async () => {
    const url = await generateThumbnail(fakeFile('a.mp4', 'video/mp4'));

    expect(url).toMatch(/^data:image\/jpeg/);
    expect(lastVideo?.currentTime).toBe(6.25);
    expect(lastCanvas?.drawn).toEqual([[0, 0, 640, 480]]);
    expect(revoked).toHaveLength(1);
  });

  it('seeks to an explicit time', async () => {
    await generateThumbnail(fakeFile('a.mp4', 'video/mp4'), 3);
    expect(lastVideo?.currentTime).toBe(3);
  });

  it('rejects when the video errors', async () => {
    const video = new FakeVideo();
    video.load = () => queueMicrotask(() => video.onerror?.());
    withVideo(video);

    await expect(generateThumbnail(fakeFile('a.mp4', 'video/mp4'))).rejects.toThrow(
      /Failed to generate thumbnail/
    );
    expect(revoked).toHaveLength(1);
  });
});
