// Performance baseline for the editor state layer.
//   npm run bench
//
// `read frames` is the path React takes on every render, so its cost decides
// whether a large sheet stays interactive.

import { bench, describe } from 'vitest';
import { calculateGridFrames } from '@domain/FrameLogic';
import { EditorViewModel } from '@presentation/EditorViewModel';

const FRAME_SIZE = 32;
const FRAME_COUNTS = [100, 500, 1000];

function fakeImage(width: number, height: number): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height, width, height } as HTMLImageElement;
}

function seededModel(count: number): EditorViewModel {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const model = new EditorViewModel();

  model.setImage(fakeImage(cols * FRAME_SIZE, rows * FRAME_SIZE));
  model.setGridConfig({ cols, rows });
  return model;
}

describe('editor state', () => {
  for (const count of FRAME_COUNTS) {
    const model = seededModel(count);

    bench(`read the frame list of ${count} frames`, () => {
      model.getFrames().length;
    });

    bench(`read the active frame list of ${count} frames`, () => {
      model.getActiveFrames().length;
    });

    bench(`toggle one frame in a ${count} frame sheet`, () => {
      model.toggleFrameActive(0);
    });
  }

  bench('calculate a 50x20 grid', () => {
    calculateGridFrames({ width: 1600, height: 640 }, {
      cols: 50,
      rows: 20,
      offsetX: 0,
      offsetY: 0,
      padding: 0,
    });
  });
});
