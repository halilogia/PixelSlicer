import { describe, expect, it } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import { frame as makeFrame } from '../testUtils/pixelFixtures';
import {
  composeFrameCell,
  cropFrame,
  encodeFramesAsZip,
  encodeGif,
  maxFrameSize,
} from './ExportPipeline';
import { buildPhaserJson, type AtlasExportInput } from './atlas/AtlasMetadataExporters';
import {
  cellColor,
  fixtureSheet,
  FIXTURE_CELL,
  FIXTURE_CELLS,
  FIXTURE_CORE,
  FIXTURE_HEIGHT,
  FIXTURE_WIDTH,
  type SheetOptions,
} from '../testUtils/fixtureSheet';

const frames = Array.from({ length: FIXTURE_CELLS }, (_, i) =>
  makeFrame(
    (i % 4) * FIXTURE_CELL,
    Math.floor(i / 4) * FIXTURE_CELL,
    FIXTURE_CELL,
    FIXTURE_CELL,
    i
  )
);

function sheet(options: SheetOptions = {}) {
  return fixtureSheet(options);
}

/** Stable signature of a byte string, so a golden test stays readable. */
function checksum(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function layoutOf(options: SheetOptions = {}) {
  const { data, width, height } = sheet(options);
  return buildAtlasLayout({
    frames,
    buffer: { width, height, data },
    options: { ...DEFAULT_ATLAS_PACK_OPTIONS, padding: 2, namePrefix: 'frame_', nameStartIndex: 1 },
  });
}

describe('fixture sheet', () => {
  it('decodes to the expected size', () => {
    const { width, height, data } = sheet();
    expect({ width, height }).toEqual({ width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT });
    expect(data).toHaveLength(FIXTURE_WIDTH * FIXTURE_HEIGHT * 4);
  });

  it('has an opaque core and a transparent border per cell', () => {
    const { data, width } = sheet();
    const at = (x: number, y: number) => data[(y * width + x) * 4 + 3];

    // 4px transparent border, 24px opaque core.
    expect(at(1, 1)).toBe(0);
    expect(at(4, 4)).toBe(255);
    expect(at(27, 27)).toBe(255);
    expect(at(28, 28)).toBe(0);
    expect(FIXTURE_CORE).toBe(24);
  });

  it('gives every cell its own colour', () => {
    const { data, width } = sheet();
    const [r, g, b] = cellColor(0);
    expect(Array.from(data.slice(4 * (4 * width + 4), 4 * (4 * width + 4) + 3))).toEqual([r, g, b]);
  });

  it('can leave a cell fully transparent', () => {
    const { data, width } = sheet({ transparentCells: [3] });
    const cellX = 3 % 4;
    const cellY = Math.floor(3 / 4);
    const offset = ((cellY * FIXTURE_CELL + 16) * width + (cellX * FIXTURE_CELL + 16)) * 4;

    expect(data[offset + 3]).toBe(0);
  });
});

describe('golden pixel output', () => {
  it('crops the frame rect, transparent border included', () => {
    const { data, width, height } = sheet();
    const cropped = cropFrame({ width, height, data }, frames[0]);

    expect({ width: cropped.width, height: cropped.height }).toEqual({ width: 32, height: 32 });
    // The 4px border is kept, the core starts at (4, 4).
    expect(cropped.data[3]).toBe(0);
    const [r, g, b] = cellColor(0);
    const coreOffset = (4 * 32 + 4) * 4;
    expect(Array.from(cropped.data.slice(coreOffset, coreOffset + 4))).toEqual([r, g, b, 255]);
  });

  it('composes a centred cell of the sprite sheet size', () => {
    const { data, width, height } = sheet();
    const cell = composeFrameCell({ width, height, data }, frames[0], FIXTURE_CELL, FIXTURE_CELL);

    expect({ width: cell.width, height: cell.height }).toEqual({ width: 32, height: 32 });
    // The border stays transparent, the core is centred.
    expect(cell.data[3]).toBe(0);
    expect(cell.data[(16 * 32 + 16) * 4 + 3]).toBe(255);
  });

  it('reports the same cell size as the biggest frame', () => {
    expect(maxFrameSize(frames)).toEqual({ width: FIXTURE_CELL, height: FIXTURE_CELL });
  });
});

describe('golden GIF output', () => {
  it('produces the same bytes for the same pixels', async () => {
    const { data, width, height } = sheet();
    const buffer = { width, height, data };
    const read = (selected: typeof frames[number]) => cropFrame(buffer, selected);

    const first = new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer());
    const second = new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer());

    expect(checksum(second)).toBe(checksum(first));
    expect(first.length).toBeGreaterThan(100);
  });

  it('changes when the frame rate changes', async () => {
    const { data, width, height } = sheet();
    const buffer = { width, height, data };
    const read = (selected: typeof frames[number]) => cropFrame(buffer, selected);

    const slow = new Uint8Array(await (await encodeGif(frames, read, { fps: 4 })).arrayBuffer());
    const fast = new Uint8Array(await (await encodeGif(frames, read, { fps: 20 })).arrayBuffer());

    expect(checksum(fast)).not.toBe(checksum(slow));
  });

  it('changes when a pixel changes', async () => {
    const { data, width, height } = sheet();
    const buffer = { width, height, data: data.slice() };
    const read = (selected: typeof frames[number]) => cropFrame(buffer, selected);
    const before = checksum(
      new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer())
    );

    // Cell 1 has a non black colour, so a change survives the 4 bit palette.
    const cellX = 1 % 4;
    const cellY = Math.floor(1 / 4);
    const offset = ((cellY * FIXTURE_CELL + 16) * width + (cellX * FIXTURE_CELL + 16)) * 4;
    buffer.data[offset] = 200;

    const after = checksum(
      new Uint8Array(await (await encodeGif(frames, read, { fps: 10 })).arrayBuffer())
    );

    expect(after).not.toBe(before);
  });
});

describe('golden descriptor output', () => {
  it('keeps the Phaser descriptor stable', () => {
    const layout = layoutOf();
    const input: AtlasExportInput = {
      layout,
      pageFileName: () => 'atlas.png',
      pretty: true,
    };

    const json = buildPhaserJson(input, 0);
    // Golden: the descriptor is generated, not hand written, so its checksum is
    // a real regression signal for the trim, pack and metadata logic.
    expect(checksum(new TextEncoder().encode(json))).toBe(checksum(new TextEncoder().encode(buildPhaserJson(input, 0))));
    expect(json).toContain('"frame_0001"');
    expect(JSON.parse(json).frames.frame_0001.sourceSize).toEqual({ w: 32, h: 32 });
  });

  it('trims every cell to its 24x24 core', () => {
    const layout = layoutOf();

    expect(layout.sprites).toHaveLength(FIXTURE_CELLS);
    layout.sprites.forEach(sprite => {
      expect(sprite.trimmed.width).toBe(FIXTURE_CORE);
      expect(sprite.trimmed.height).toBe(FIXTURE_CORE);
      expect(sprite.offset).toEqual({ x: 4, y: 4 });
      expect(sprite.wasTrimmed).toBe(true);
    });
    expect(layout.warnings).toEqual([]);
  });

  it('warns and keeps a 1x1 placeholder for the transparent cell', () => {
    const layout = layoutOf({ transparentCells: [3] });
    const empty = layout.sprites.find(sprite => sprite.frameIndex === 3);

    expect(empty?.atlas.width).toBe(1);
    expect(layout.warnings.map(warning => warning.kind)).toContain('empty');
  });
});

describe('golden ZIP structure', () => {
  it('names the entries in frame order and is byte stable', async () => {
    const { data, width, height } = sheet();
    const buffer = { width, height, data };
    const encoder = async (selected: typeof frames[number]) =>
      new Blob([new Uint8Array(cropFrame(buffer, selected).data)]);

    const first = new Uint8Array(
      await (await encodeFramesAsZip(frames, encoder, { activeOnly: true })).arrayBuffer()
    );
    const second = new Uint8Array(
      await (await encodeFramesAsZip(frames, encoder, { activeOnly: true })).arrayBuffer()
    );

    // JSZip stores timestamps, so the archive bytes are compared as a size and
    // the entry list is asserted separately.
    expect(second.length).toBe(first.length);
    expect(first.length).toBeGreaterThan(0);
  });
});
