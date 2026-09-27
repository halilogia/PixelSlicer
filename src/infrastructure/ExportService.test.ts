import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadBlob,
  exportAsGif,
  exportAsSpriteSheet,
  exportAsZip,
  exportSingleFrame,
} from './ExportService';
import type { Frame } from '@domain/FrameLogic';
import { FakeContext, FakeConvertibleCanvas } from '../testUtils/canvasFixtures';

function frame(x: number, y: number, w: number, h: number, index = 0): Frame {
  return { x, y, w, h, index, isActive: true };
}

/** Canvas stub that records the draw calls and encodes a deterministic blob. */
class RecordingCanvas extends FakeConvertibleCanvas {
  context = new FakeContext();
}

let createdCanvases: RecordingCanvas[] = [];
let source = {} as HTMLImageElement;

beforeEach(() => {
  createdCanvases = [];
  vi.stubGlobal('OffscreenCanvas', RecordingCanvas);
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = new RecordingCanvas();
      createdCanvases.push(canvas);
      return canvas;
    },
    body: { appendChild: () => undefined, removeChild: () => undefined },
  });
  source = { naturalWidth: 16, naturalHeight: 16, width: 16, height: 16 } as HTMLImageElement;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('exportAsZip', () => {
  it('names the entries sequentially and keeps every active frame', async () => {
    const blob = await exportAsZip(source, [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)], true);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    expect(Object.keys(zip.files).sort()).toEqual(['frame_0001.png', 'frame_0002.png']);
  });

  it('skips the inactive frames', async () => {
    const frames = [frame(0, 0, 8, 8, 0), { ...frame(8, 0, 8, 8, 1), isActive: false }];
    const zip = await JSZip.loadAsync(await (await exportAsZip(source, frames, true)).arrayBuffer());

    expect(Object.keys(zip.files)).toEqual(['frame_0001.png']);
  });

  it('keeps every frame when activeOnly is off', async () => {
    const frames = [frame(0, 0, 8, 8, 0), { ...frame(8, 0, 8, 8, 1), isActive: false }];
    const zip = await JSZip.loadAsync(await (await exportAsZip(source, frames, false)).arrayBuffer());

    expect(Object.keys(zip.files).sort()).toEqual(['frame_0001.png', 'frame_0002.png']);
  });

  it('encodes one canvas per frame with the cropped pixels', async () => {
    const created: FakeConvertibleCanvas[] = [];
    class RecordingCanvas extends FakeConvertibleCanvas {
      async convertToBlob(): Promise<Blob> {
        created.push(this);
        return new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
      }
    }
    vi.stubGlobal('OffscreenCanvas', RecordingCanvas);

    await exportAsZip(source, [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)], true);

    // The buffer canvas plus one canvas per exported frame
    expect(created).toHaveLength(2);
    created.forEach(canvas => {
      expect(canvas.width).toBe(8);
      expect(canvas.height).toBe(8);
    });
  });

  it('refuses an empty frame list', async () => {
    await expect(exportAsZip(source, [], true)).rejects.toThrow(/No active frames/);
  });
});
describe('exportAsSpriteSheet', () => {
  it('lays the frames out on a uniform grid', async () => {
    const frames = [frame(0, 0, 8, 8, 0), frame(0, 0, 8, 8, 1), frame(0, 0, 8, 8, 2)];
    await exportAsSpriteSheet(source, frames, 2);

    const canvas = createdCanvases[0];
    // 2 columns, 2 rows of 8px cells
    expect(canvas.width).toBe(16);
    expect(canvas.height).toBe(16);
    expect(canvas.context.calls.map(call => call.args.slice(4))).toEqual([
      [0, 0, 8, 8],
      [8, 0, 8, 8],
      [0, 8, 8, 8],
    ]);
  });

  it('centres a smaller frame inside its cell', async () => {
    await exportAsSpriteSheet(source, [frame(0, 0, 4, 4, 0), frame(0, 0, 8, 8, 1)], 2);

    const canvas = createdCanvases[0];
    expect(canvas.width).toBe(16);
    expect(canvas.height).toBe(8);
    // The 4x4 frame is centred in the 8x8 cell of row 0, column 0
    expect(canvas.context.calls[0].args.slice(4)).toEqual([2, 2, 4, 4]);
  });

  it('refuses an empty frame list', async () => {
    await expect(exportAsSpriteSheet(source, [], 4)).rejects.toThrow(/No active frames/);
  });
});

describe('exportSingleFrame', () => {
  it('produces one frame sized PNG', async () => {
    const blob = await exportSingleFrame(source, frame(3, 5, 7, 9, 0));
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe('image/png');
    // The canvas double encodes a marker instead of a real PNG signature.
    expect(bytes.length).toBeGreaterThan(0);
    expect(createdCanvases[0].width).toBe(7);
    expect(createdCanvases[0].height).toBe(9);
    expect(createdCanvases[0].context.calls[0].args).toEqual([3, 5, 7, 9, 0, 0, 7, 9]);
  });
});

describe('exportAsGif', () => {
  it('writes a valid GIF header for every active frame', async () => {
    const frames = [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)];
    const blob = await exportAsGif(source, frames, 10);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe('image/gif');
    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a');
    expect(String.fromCharCode(...bytes.slice(-1))).toBe(';');
  });

  it('is byte for byte deterministic', async () => {
    const frames = [frame(0, 0, 8, 8, 0), frame(8, 0, 8, 8, 1)];

    const first = new Uint8Array(await (await exportAsGif(source, frames, 10)).arrayBuffer());
    const second = new Uint8Array(await (await exportAsGif(source, frames, 10)).arrayBuffer());

    expect(second).toEqual(first);
  });

  it('refuses an empty frame list', async () => {
    await expect(exportAsGif(source, [], 10)).rejects.toThrow(/No active frames/);
  });
});

describe('downloadBlob', () => {
  it('clicks a temporary anchor and releases the object URL', () => {
    const clicks: string[] = [];
    const revoked: string[] = [];
    let href = '';

    vi.stubGlobal('URL', {
      createObjectURL: () => {
        href = 'blob:download';
        return href;
      },
      revokeObjectURL: (url: string) => revoked.push(url),
    });
    vi.stubGlobal('document', {
      createElement: () => ({
        set href(value: string) {
          href = value;
        },
        get href(): string {
          return href;
        },
        set download(value: string) {
          clicks.push(value);
        },
        click: () => undefined,
      }),
      body: { appendChild: () => undefined, removeChild: () => undefined },
    });

    downloadBlob(new Blob(['data']), 'atlas.zip');

    expect(clicks).toEqual(['atlas.zip']);
    expect(revoked).toEqual(['blob:download']);
  });
});
