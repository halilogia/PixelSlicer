// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Frame } from '../domain/FrameLogic';
import { useFrameThumbnails } from './useFrameThumbnails';
import { FakeContext } from '../testUtils/canvasFixtures';

let revoked: string[] = [];
let created: number = 0;
let encode: (canvas: HTMLCanvasElement) => void;

function frame(index: number, isActive = true): Frame {
  return { x: index * 32, y: 0, w: 32, h: 32, index, isActive };
}

function fakeImage(): HTMLImageElement {
  return { naturalWidth: 256, naturalHeight: 64, width: 256, height: 64 } as HTMLImageElement;
}

// One stable image for the whole file: a new instance on every render would
// look like a sheet change and restart the batches.
const image = fakeImage();

beforeEach(() => {
  revoked = [];
  created = 0;
  encode = () => undefined;

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    new FakeContext() as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback
  ) {
    encode(this);
    callback(new Blob(['thumbnail'], { type: 'image/png' }));
  });
  vi.stubGlobal('URL', {
    createObjectURL: () => `blob:thumb-${created++}`,
    revokeObjectURL: (url: string) => revoked.push(url),
  });

  // Run the idle batches on demand so the test stays deterministic.
  const queue: Array<IdleRequestCallback> = [];
  vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
    queue.push(callback);
    return queue.length;
  });
  vi.stubGlobal('cancelIdleCallback', () => undefined);
  (globalThis as unknown as { runIdle: () => void }).runIdle = () => {
    const pending = queue.splice(0, queue.length);
    pending.forEach(callback => callback({ didTimeout: false, timeRemaining: () => 16 } as IdleDeadline));
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (globalThis as unknown as { runIdle?: () => void }).runIdle;
});

/** Run the queued idle batches and let the encoder promises settle. */
async function flush(): Promise<void> {
  await act(async () => {
    (globalThis as unknown as { runIdle: () => void }).runIdle();
  });
}

describe('useFrameThumbnails', () => {
  it('hands back object URLs, never data URLs', async () => {
    const frames = [frame(0), frame(1)];
    const { result } = renderHook(() => useFrameThumbnails(image, frames));

    await flush();

    expect(result.current.size).toBe(2);
    result.current.forEach(url => expect(url.startsWith('blob:')).toBe(true));
  });

  it('revokes the previous URL when a frame is replaced', async () => {
    const modelFrames = [frame(0), frame(1)];
    const { result, rerender } = renderHook(
      ({ frames }: { frames: Frame[] }) => useFrameThumbnails(image, frames),
      { initialProps: { frames: modelFrames } }
    );

    await flush();
    const firstUrl = result.current.get(0);
    expect(revoked).toEqual([]);

    // Same slot, different geometry -> a new thumbnail, the old URL must go.
    rerender({ frames: [frame(0, false), frame(1)] });
    await flush();

    const secondUrl = result.current.get(0);
    expect(secondUrl).not.toBe(firstUrl);
    expect(revoked).toEqual([firstUrl]);
  });

  it('revokes everything on unmount', async () => {
    const frames = [frame(0), frame(1)];
    const { result, unmount } = renderHook(() => useFrameThumbnails(image, frames));

    await flush();
    const urls = [...result.current.values()];
    expect(urls).toHaveLength(2);

    unmount();
    expect(revoked.sort()).toEqual(urls.sort());
  });

  it('revokes the thumbnails of a previous image', async () => {
    const first = fakeImage();
    const second = { ...fakeImage() } as HTMLImageElement;
    const frames = [frame(0)];

    const { result, rerender } = renderHook(
      ({ image }: { image: HTMLImageElement }) => useFrameThumbnails(image, frames),
      { initialProps: { image: first } }
    );
    await flush();
    const firstUrl = result.current.get(0)!;

    rerender({ image: second });
    await flush();

    expect(revoked).toContain(firstUrl);
    expect(result.current.get(0)).not.toBe(firstUrl);
  });

  it('skips invalid frames without failing the batch', async () => {
    const frames = [frame(0), { ...frame(1), w: 0 }, frame(2)];
    const { result } = renderHook(() => useFrameThumbnails(image, frames));

    await flush();

    expect(result.current.size).toBe(2);
    expect(result.current.has(1)).toBe(false);
  });

  it('rejects a frame when the encoder produces nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback: BlobCallback) => callback(null as unknown as Blob)
    );
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = renderHook(() => useFrameThumbnails(image, [frame(0)]));
    await flush();

    expect(result.current.size).toBe(0);
    quiet.mockRestore();
  });

  it('returns an empty map without an image', async () => {
    const { result } = renderHook(() => useFrameThumbnails(null, [frame(0)]));
    expect(result.current.size).toBe(0);
  });
});
