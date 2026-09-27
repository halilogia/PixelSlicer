import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameExportWorkerClient } from './FrameExportWorkerClient';
import type { FrameExportRequest, FrameExportResponse } from './FrameExportProtocol';
import type { Frame } from '@domain/FrameLogic';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';
import { FakeConvertibleCanvas } from '../testUtils/canvasFixtures';

type Listener = (event: { data?: unknown; message?: string }) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];
  static shouldThrow = false;

  listeners = new Map<string, Listener[]>();
  posted: FrameExportRequest[] = [];
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

  postMessage(message: FrameExportRequest): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(type: string, event: { data?: unknown; message?: string }): void {
    (this.listeners.get(type) ?? []).forEach(listener => listener(event));
  }

  respond(response: FrameExportResponse): void {
    this.emit('message', { data: response });
  }

  fail(message: string): void {
    this.emit('error', { message });
  }
}

function frame(index: number, isActive = true): Frame {
  return { x: index * 8, y: 0, w: 8, h: 8, index, isActive };
}

function buffer(width = 32, height = 8): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(255);
  return { width, height, data };
}

beforeEach(() => {
  FakeWorker.instances = [];
  FakeWorker.shouldThrow = false;
  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FrameExportWorkerClient.isSupported', () => {
  it('requires workers and OffscreenCanvas', () => {
    expect(FrameExportWorkerClient.isSupported()).toBe(true);
    vi.stubGlobal('Worker', undefined);
    expect(FrameExportWorkerClient.isSupported()).toBe(false);
  });
});

describe('FrameExportWorkerClient.export', () => {
  it('sends the request and resolves with the worker blob', async () => {
    const client = new FrameExportWorkerClient();
    const promise = client.export(buffer(), [frame(0), frame(1)], 'gif', { fps: 12 });

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.posted[0]).toMatchObject({ mode: 'gif', fps: 12 });
    expect(worker.posted[0].frames).toHaveLength(2);
    expect(worker.posted[0].buffer.width).toBe(32);

    const blob = new Blob(['gif']);
    worker.respond({ id: worker.posted[0].id, blob });

    await expect(promise).resolves.toBe(blob);
    client.dispose();
  });

  it('passes the activeOnly flag for a zip export', async () => {
    const client = new FrameExportWorkerClient();
    const promise = client.export(buffer(), [frame(0)], 'zip', { activeOnly: false });

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    expect(worker.posted[0].activeOnly).toBe(false);

    worker.respond({ id: worker.posted[0].id, blob: new Blob(['zip']) });
    await promise;
    client.dispose();
  });

  it('falls back to the main thread when the worker cannot be created', async () => {
    FakeWorker.shouldThrow = true;
    const client = new FrameExportWorkerClient();

    const blob = await client.export(buffer(), [frame(0), frame(1)], 'gif', { fps: 10 });
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe('image/gif');
    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a');
    client.dispose();
  });

  it('falls back to the main thread when the worker crashes', async () => {
    const client = new FrameExportWorkerClient();
    const promise = client.export(buffer(), [frame(0)], 'zip');

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    FakeWorker.instances[0].fail('boom');

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
    client.dispose();
  });

  it('rejects when the worker reports an error and the retry fails too', async () => {
    const client = new FrameExportWorkerClient();
    const promise = client.export(buffer(), [frame(0, false)], 'gif');

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    FakeWorker.instances[0].respond({
      id: FakeWorker.instances[0].posted[0].id,
      error: 'no frames',
    });

    await expect(promise).rejects.toThrow(/No active frames/);
    client.dispose();
  });

  it('terminates the worker on dispose', async () => {
    const client = new FrameExportWorkerClient();
    const promise = client.export(buffer(), [frame(0)], 'gif');

    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    worker.respond({ id: worker.posted[0].id, blob: new Blob(['gif']) });
    await promise;

    client.dispose();
    expect(worker.terminated).toBe(true);
  });
});
