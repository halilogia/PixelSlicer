// Performance baseline for the atlas pipeline.
//   npm run bench
//
// Every number here is a regression gate for the roadmap's performance work:
// run it before and after a change, not as a pass/fail test.

import { bench, describe } from 'vitest';
import { buildAtlasLayout } from '@domain/atlas/AtlasLayout';
import { packRects, type PackInput } from '@domain/atlas/AtlasPacker';
import {
  buildPhaserJson,
  type AtlasExportInput,
} from '@infrastructure/atlas/AtlasMetadataExporters';
import { DEFAULT_ATLAS_PACK_OPTIONS } from '@domain/atlas/AtlasTypes';
import type { Frame } from '@domain/FrameLogic';

const FRAME_SIZE = 32;
const FRAME_COUNTS = [100, 500, 1000];

function gridFrames(count: number): { frames: Frame[]; width: number; height: number } {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const frames: Frame[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    frames.push({
      x: col * FRAME_SIZE,
      y: row * FRAME_SIZE,
      w: FRAME_SIZE,
      h: FRAME_SIZE,
      index: i,
      isActive: true,
    });
  }

  return { frames, width: cols * FRAME_SIZE, height: rows * FRAME_SIZE };
}

/** Synthetic sheet where every frame has a 24x24 opaque core. */
function sheet(count: number): { buffer: { width: number; height: number; data: Uint8ClampedArray }; frames: Frame[] } {
  const { frames, width, height } = gridFrames(count);
  const data = new Uint8ClampedArray(width * height * 4);
  const inset = (FRAME_SIZE - 24) / 2;

  for (const frame of frames) {
    for (let y = inset; y < FRAME_SIZE - inset; y++) {
      for (let x = inset; x < FRAME_SIZE - inset; x++) {
        const offset = ((frame.y + y) * width + (frame.x + x)) * 4;
        data[offset] = 255;
        data[offset + 1] = 128;
        data[offset + 2] = 64;
        data[offset + 3] = 255;
      }
    }
  }

  return { buffer: { width, height, data }, frames };
}

describe('atlas pipeline', () => {
  for (const count of FRAME_COUNTS) {
    const { buffer, frames } = sheet(count);

    bench(`measure + pack ${count} frames`, () => {
      buildAtlasLayout({ frames, buffer, options: DEFAULT_ATLAS_PACK_OPTIONS });
    });

    bench(`pack only ${count} frames`, () => {
      const inputs: PackInput[] = frames.map((frame, id) => ({ id, width: frame.w, height: frame.h }));
      packRects(inputs, { powerOfTwo: true, maxPageSize: 4096 });
    });
  }

  const { buffer, frames } = sheet(1000);
  const layout = buildAtlasLayout({ frames, buffer, options: DEFAULT_ATLAS_PACK_OPTIONS });
  const exportInput: AtlasExportInput = {
    layout,
    pageFileName: page => `atlas_${page}.png`,
    pretty: false,
  };

  bench('write the Phaser JSON for 1000 sprites', () => {
    for (let page = 0; page < layout.pages.length; page++) {
      buildPhaserJson(exportInput, page);
    }
  });
});
