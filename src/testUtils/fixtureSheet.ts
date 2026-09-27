// Shared fixture sheet, used by the unit tests (decoded to real pixels) and by
// the Playwright suite (uploaded as a real PNG). Encoding and decoding live
// together so the fixture can never drift apart.

import { deflateSync, inflateSync } from 'node:zlib';

export const FIXTURE_CELL = 32;
export const FIXTURE_COLS = 4;
export const FIXTURE_ROWS = 2;
export const FIXTURE_CORE = 24;
export const FIXTURE_CELLS = FIXTURE_COLS * FIXTURE_ROWS;
export const FIXTURE_WIDTH = FIXTURE_COLS * FIXTURE_CELL;
export const FIXTURE_HEIGHT = FIXTURE_ROWS * FIXTURE_CELL;

const INSET = (FIXTURE_CELL - FIXTURE_CORE) / 2;

export interface FixtureSheet {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface SheetOptions {
  /** Cells that stay fully transparent, to exercise the empty frame warning. */
  transparentCells?: number[];
}

/** The colour of one cell, so tests can assert against the same values. */
export function cellColor(cellIndex: number): [number, number, number] {
  return [(cellIndex * 31) % 256, (cellIndex * 67) % 256, (cellIndex * 97) % 256];
}

// ---------------------------------------------------------------------------
// Encoding (for the browser upload)
// ---------------------------------------------------------------------------

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function rawPixels(options: SheetOptions): Buffer {
  const raw = Buffer.alloc(FIXTURE_HEIGHT * (FIXTURE_WIDTH * 4 + 1));
  const transparent = options.transparentCells ?? [];

  for (let y = 0; y < FIXTURE_HEIGHT; y++) {
    const rowStart = y * (FIXTURE_WIDTH * 4 + 1);
    raw[rowStart] = 0; // filter: none

    for (let x = 0; x < FIXTURE_WIDTH; x++) {
      const cellX = x % FIXTURE_CELL;
      const cellY = y % FIXTURE_CELL;
      const cellIndex = Math.floor(y / FIXTURE_CELL) * FIXTURE_COLS + Math.floor(x / FIXTURE_CELL);
      const inside =
        cellX >= INSET && cellX < INSET + FIXTURE_CORE && cellY >= INSET && cellY < INSET + FIXTURE_CORE;
      const [r, g, b] = cellColor(cellIndex);
      const offset = rowStart + 1 + x * 4;

      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = inside && !transparent.includes(cellIndex) ? 255 : 0;
    }
  }

  return raw;
}

export function createSheetPng(options: SheetOptions = {}): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(FIXTURE_WIDTH, 0);
  header.writeUInt32BE(FIXTURE_HEIGHT, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rawPixels(options))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Decoding (for pixel level assertions)
// ---------------------------------------------------------------------------

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/**
 * Decode a non interlaced 8 bit PNG. Only the filters this fixture uses have to
 * work, but all five are implemented so the decoder stays honest.
 */
export function decodePng(png: Buffer): FixtureSheet {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i++) {
    if (png[i] !== signature[i]) throw new Error('Not a PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const dataChunks: Buffer[] = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      colorType = body[9];
    } else if (type === 'IDAT') {
      dataChunks.push(body);
    } else if (type === 'IEND') {
      break;
    }

    offset += length + 12;
  }

  if (colorType !== 6) throw new Error(`Only RGBA PNGs are supported, got color type ${colorType}`);

  const raw = inflateSync(Buffer.concat(dataChunks));
  const channels = 4;
  const stride = width * channels;
  const out = new Uint8ClampedArray(width * height * channels);
  let previous = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const row = new Uint8Array(stride);

    for (let x = 0; x < stride; x++) {
      const value = raw[rowStart + 1 + x];
      const left = x >= channels ? row[x - channels] : 0;
      const up = previous[x];
      const upLeft = x >= channels ? previous[x - channels] : 0;

      switch (filter) {
        case 0:
          row[x] = value;
          break;
        case 1:
          row[x] = (value + left) & 0xff;
          break;
        case 2:
          row[x] = (value + up) & 0xff;
          break;
        case 3:
          row[x] = (value + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          row[x] = (value + paeth(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unknown PNG filter ${filter}`);
      }
    }

    out.set(row, y * stride);
    previous = row;
  }

  return { width, height, data: out };
}

/** The fixture as raw pixels, ready for the domain layer. */
export function fixtureSheet(options: SheetOptions = {}): FixtureSheet {
  return decodePng(createSheetPng(options));
}
