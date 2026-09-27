import { describe, expect, it } from 'vitest';
import {
  composeFrameCell,
  cropFrame,
  encodeFramesAsZip,
  encodeGif,
  frameFileName,
  maxFrameSize,
  selectFrames,
} from './ExportPipeline';
import type { PixelBuffer } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';

function frame(x: number, y: number, w: number, h: number, index = 0, isActive = true): Frame {
  return { x, y, w, h, index, isActive };
}

/** 4x2 buffer, every pixel identified by its own red value. */
function buffer(): PixelBuffer {
  const data = new Uint8ClampedArray(4 * 2 * 4);
  for (let i = 0; i < 4 * 2; i++) {
    data[i * 4] = i + 1;
    data[i * 4 + 3] = 255;
  }
  return { width: 4, height: 2, data };
}

describe('selectFrames', () => {
  it('keeps only the active frames when asked', () => {
    const frames = [frame(0, 0, 1, 1, 0), frame(0, 0, 1, 1, 1, false)];
    expect(selectFrames(frames, true)).toHaveLength(1);
  });

  it('copies the list when inactive frames are allowed', () => {
    const frames = [frame(0, 0, 1, 1, 0), frame(0, 0, 1, 1, 1, false)];
    const selected = selectFrames(frames, false);

    expect(selected).toHaveLength(2);
    expect(selected).not.toBe(frames);
  });
});

describe('frameFileName', () => {
  it('pads the index to four digits', () => {
    expect(frameFileName(0)).toBe('frame_0001.png');
    expect(frameFileName(123)).toBe('frame_0124.png');
  });
});

describe('cropFrame', () => {
  it('copies the requested rect', () => {
    const cropped = cropFrame(buffer(), frame(1, 0, 2, 1));

    expect(cropped.width).toBe(2);
    expect(cropped.height).toBe(1);
    // Red values of the source pixels 1 and 2
    expect(Array.from(cropped.data)).toEqual([2, 0, 0, 255, 3, 0, 0, 255]);
  });

  it('leaves the pixels outside the buffer transparent', () => {
    const cropped = cropFrame(buffer(), frame(3, 1, 2, 2));

    expect(Array.from(cropped.data)).toEqual([8, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('handles a rect that starts outside the buffer', () => {
    const cropped = cropFrame(buffer(), frame(-1, 0, 2, 1));

    expect(Array.from(cropped.data)).toEqual([0, 0, 0, 0, 1, 0, 0, 255]);
  });
});

describe('composeFrameCell', () => {
  it('centres the frame inside the cell', () => {
    const cell = composeFrameCell(buffer(), frame(0, 0, 1, 1), 3, 3);

    expect(cell.width).toBe(3);
    expect(cell.height).toBe(3);
    // top-left cell is empty, the pixel lands in the middle
    expect(cell.data[(1 * 3 + 1) * 4]).toBe(1);
    expect(cell.data[3]).toBe(0);
  });

  it('floors the offset for an odd remainder', () => {
    const cell = composeFrameCell(buffer(), frame(0, 0, 2, 2), 5, 5);
    // floor((5-2)/2) = 1
    expect(cell.data[(1 * 5 + 1) * 4]).toBe(1);
  });
});

describe('maxFrameSize', () => {
  it('returns the largest frame', () => {
    expect(maxFrameSize([frame(0, 0, 8, 4), frame(0, 0, 16, 9), frame(0, 0, 4, 32)])).toEqual({
      width: 16,
      height: 32,
    });
  });

  it('returns zero for an empty list', () => {
    expect(maxFrameSize([])).toEqual({ width: 0, height: 0 });
  });
});

describe('encodeFramesAsZip', () => {
  it('encodes every active frame through the callback', async () => {
    const encoded: number[] = [];
    const frames = [frame(0, 0, 1, 1, 0), frame(1, 0, 1, 1, 1, false), frame(2, 0, 1, 1, 2)];

    await encodeFramesAsZip(frames, async (_selected, index) => {
      encoded.push(index);
      return new Blob([new Uint8Array([index + 1])]);
    });

    expect(encoded).toEqual([0, 1]);
  });

  it('passes the selected frame to the encoder', async () => {
    const seen: number[] = [];
    await encodeFramesAsZip([frame(7, 0, 1, 1, 0)], async selected => {
      seen.push(selected.x);
      return new Blob([]);
    });

    expect(seen).toEqual([7]);
  });

  it('refuses an empty selection', async () => {
    await expect(
      encodeFramesAsZip([frame(0, 0, 1, 1, 0, false)], async () => new Blob([]))
    ).rejects.toThrow(/No active frames/);
  });
});

describe('encodeGif', () => {
  it('writes a GIF with the trailing terminator', async () => {
    const blob = await encodeGif(
      [frame(0, 0, 2, 2, 0), frame(2, 0, 2, 2, 1)],
      selected => cropFrame(buffer(), selected),
      { fps: 10 }
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a');
    expect(bytes[bytes.length - 1]).toBe(0x3b);
  });

  it('is deterministic for the same pixels', async () => {
    const frames = [frame(0, 0, 2, 2, 0), frame(2, 0, 2, 2, 1)];
    const read = (selected: Frame) => cropFrame(buffer(), selected);

    const first = new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer());
    const second = new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer());

    expect(second).toEqual(first);
  });

  it('changes the delay with the frame rate', async () => {
    const frames = [frame(0, 0, 2, 2, 0), frame(2, 0, 2, 2, 1)];
    const read = (selected: Frame) => cropFrame(buffer(), selected);

    const slow = new Uint8Array(await (await encodeGif(frames, read, { fps: 5 })).arrayBuffer());
    const fast = new Uint8Array(await (await encodeGif(frames, read, { fps: 25 })).arrayBuffer());

    expect(slow).not.toEqual(fast);
  });

  it('refuses an empty selection', async () => {
    await expect(
      encodeGif([frame(0, 0, 1, 1, 0, false)], () => cropFrame(buffer(), frame(0, 0, 1, 1)), { fps: 10 })
    ).rejects.toThrow(/No active frames/);
  });
});
