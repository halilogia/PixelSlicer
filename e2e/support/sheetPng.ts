// Generates the fixture sheet for the end to end tests, so no binary has to be
// committed. A 4x2 grid of 32x32 cells (the editor's default grid) with an
// opaque 24x24 core inside a transparent border: auto-trim has something to
// trim and the default slicer settings need no interaction.

import { deflateSync } from 'node:zlib';

const CELL = 32;
const COLS = 4;
const ROWS = 2;
const CORE = 24;
const INSET = (CELL - CORE) / 2;

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

/** RGBA pixels: one hue per cell, transparent borders. */
function pixels(): Buffer {
  const width = COLS * CELL;
  const height = ROWS * CELL;
  const raw = Buffer.alloc(height * (width * 4 + 1));

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter: none

    for (let x = 0; x < width; x++) {
      const cellX = x % CELL;
      const cellY = y % CELL;
      const opaque = cellX >= INSET && cellX < INSET + CORE && cellY >= INSET && cellY < INSET + CORE;
      const cellIndex = Math.floor(y / CELL) * COLS + Math.floor(x / CELL);
      const offset = rowStart + 1 + x * 4;

      raw[offset] = (cellIndex * 31) % 256;
      raw[offset + 1] = (cellIndex * 67) % 256;
      raw[offset + 2] = (cellIndex * 97) % 256;
      raw[offset + 3] = opaque ? 255 : 0;
    }
  }

  return raw;
}

export function createSheetPng(): Buffer {
  const width = COLS * CELL;
  const height = ROWS * CELL;

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels())),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export const SHEET_CELLS = COLS * ROWS;
export const SHEET_CELL_SIZE = CELL;
export const SHEET_CORE_SIZE = CORE;
