import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtlasWorkerClient } from './AtlasWorkerClient';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import type { AtlasWorkerRequest, AtlasWorkerResponse } from './AtlasWorkerProtocol';
import { frame } from '../../testUtils/pixelFixtures';
import { FakeCanvas } from '../../testUtils/canvasFixtures';

type Listener = (event: { data?: unknown; message?: string }) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];
  static shouldThrow = false;

  listeners = new Map<string, Listener[]>();
  posted: Array<{ message: AtlasWorkerRequest; transfer: unknown[] }> = [];
  terminated = false;

  constructor(public url: string, public options: { type?: string }) {
    if (FakeWorker.shouldThrow) throw new Error('blocked by CSP');
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  removeEventListener(): void {}

  postMessage(message: AtlasWorkerRequest, transfer: unknown[]): void {
    this.posted.push({ message, transfer });
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(type: string, event: { data?: unknown; message?: string }): void {
    (this.listeners.get(type) ?? []).forEach(listener => listener(event));
  }

  respond(response: AtlasWorkerResponse): void {
    this.emit('message', { data: response });
  }

  fail(message: string): void {
    this.emit('error', { message });
  }
}

const source = { width: 32, height: 16 } as unknown as HTMLImageElement;
const frames = [frame(0, 0, 16, 16, 0), frame(16, 0, 16, 16, 1)];

beforeEach(() => {
  FakeWorker.instances = [];
  FakeWorker.shouldThrow = false;
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('createImageBitmap', async () => ({ width: 32, height: 16 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AtlasWorkerClient.isSupported', () => {
  it('requires workers, OffscreenCanvas and createImageBitmap', () => {
    expect(AtlasWorkerClient.isSupported()).toBe(true);

    vi.stubGlobal('Worker', undefined);
    expect(AtlasWorkerClient.isSupported()).toBe(false);
  });
});

describe('AtlasWorkerClient.build', () => {
  it('sends the bitmap as a transferable and resolves with the worker pages', async () => {
    const client = new AtlasWorkerClient();
    const promise = client.build(source, frames, DEFAULT_ATLAS_PACK_OPTIONS);

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];

    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.posted).toHaveLength(1);
    expect(worker.posted[0].transfer).toEqual([worker.posted[0].message.source]);
    expect(worker.posted[0].message.frames).toEqual(frames);
    expect(worker.posted[0].message.options).toEqual(DEFAULT_ATLAS_PACK_OPTIONS);

    const pages = [{ width: 64, height: 32 } as ImageBitmap];
    worker.respond({
      id: worker.posted[0].message.id,
      layout: {
        pages: [{ index: 0, width: 64, height: 32 }],
        sprites: [],
        occupancy: 0.5,
        savedPixels: 10,
        warnings: [],
      },
      pages,
    });

    const result = await promise;
    expect(result.usedWorker).toBe(true);
    expect(result.pages).toEqual(pages);
    expect(result.layout.savedPixels).toBe(10);

    client.dispose();
  });

  it('falls back to the main thread when the worker cannot be created', async () => {
    FakeWorker.shouldThrow = true;

    const client = new AtlasWorkerClient();
    const result = await client.build(source, frames, DEFAULT_ATLAS_PACK_OPTIONS);

    expect(result.usedWorker).toBe(false);
    expect(result.layout.sprites).toHaveLength(2);
    expect(result.pages).toHaveLength(result.layout.pages.length);

    client.dispose();
  });

  it('falls back to the main thread when the worker reports an error', async () => {
    const client = new AtlasWorkerClient();
    const promise = client.build(source, frames, DEFAULT_ATLAS_PACK_OPTIONS);

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    FakeWorker.instances[0].fail('boom');

    const result = await promise;
    expect(result.usedWorker).toBe(false);
    expect(result.layout.sprites).toHaveLength(2);

    client.dispose();
  });

  it('rejects the pending build with the worker error payload', async () => {
    const client = new AtlasWorkerClient();
    const promise = client.build(source, frames, {
      ...DEFAULT_ATLAS_PACK_OPTIONS,
      // The main thread retry hits the same wall, so the error reaches the caller.
      trim: false,
      maxPageSize: 8,
    });

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    worker.respond({
      id: worker.posted[0].message.id,
      layout: { pages: [], sprites: [], occupancy: 0, savedPixels: 0, warnings: [] },
      pages: [],
      error: 'sprite does not fit',
    });

    // The main thread retry fails the same way, so the caller sees the message.
    await expect(promise).rejects.toThrow(/does not fit/);
    client.dispose();
  });

  it('passes the picked pivots to the worker', async () => {
    const client = new AtlasWorkerClient();
    const promise = client.build(source, frames, DEFAULT_ATLAS_PACK_OPTIONS, {
      1: { x: 0.25, y: 0.75 },
    });

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    expect(worker.posted[0].message.pivots).toEqual({ 1: { x: 0.25, y: 0.75 } });

    worker.respond({
      id: worker.posted[0].message.id,
      layout: { pages: [], sprites: [], occupancy: 0, savedPixels: 0, warnings: [] },
      pages: [],
    });

    await promise;
    client.dispose();
  });

  it('terminates the worker on dispose', async () => {
    const client = new AtlasWorkerClient();
    const promise = client.build(source, frames, DEFAULT_ATLAS_PACK_OPTIONS);

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    worker.respond({
      id: worker.posted[0].message.id,
      layout: { pages: [], sprites: [], occupancy: 0, savedPixels: 0, warnings: [] },
      pages: [],
    });
    await promise;

    client.dispose();
    expect(worker.terminated).toBe(true);
  });
});
