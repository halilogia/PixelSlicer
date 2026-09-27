import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorViewModel } from './EditorViewModel';
import type { Frame } from '@domain/FrameLogic';
import { FakeCanvas } from '../testUtils/canvasFixtures';

function fakeImage(width = 128, height = 64): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height, width, height } as HTMLImageElement;
}

function seedImage(model: EditorViewModel, width?: number, height?: number): void {
  model.setImage(fakeImage(width, height));
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => new FakeCanvas() });
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  // The animation loop is covered by EditorViewModel.animation.test.ts, here
  // only the presence of the scheduler matters.
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditorViewModel image lifecycle', () => {
  it('stores the image and derives the grid frames', () => {
    const model = new EditorViewModel();
    seedImage(model);

    const state = model.getState();
    expect(state.isImageLoaded).toBe(true);
    expect(state.imageDimensions).toEqual({ width: 128, height: 64 });
    expect(state.frames).toHaveLength(8);
    expect(state.frames[0]).toMatchObject({ x: 0, y: 0, w: 32, h: 32, isActive: true });
  });

  it('recalculates the frames when the grid changes', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setGridConfig({ cols: 2, rows: 1 });

    expect(model.getState().frames).toHaveLength(2);
    expect(model.getState().frames[0].w).toBe(64);
  });

  it('resets everything on clear', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 10, 10);
    model.setPivotMode('bottomCenter');
    model.togglePivotPicking();

    model.clearImage();
    const state = model.getState();

    expect(state.image).toBeNull();
    expect(state.isImageLoaded).toBe(false);
    expect(state.frames).toEqual([]);
    expect(state.manualFrames).toEqual([]);
    expect(state.isPivotPicking).toBe(false);
    // The chosen mode is a preference, it survives an empty canvas.
    expect(state.pivotMode).toBe('bottomCenter');
  });

  it('stops the animation when the image is cleared', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.startAnimation();
    expect(model.getState().isPlaying).toBe(true);

    model.clearImage();
    expect(model.getState().isPlaying).toBe(false);
  });
});

describe('EditorViewModel grid config', () => {
  it('resets the fine tune offsets', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setGridConfig({ offsetX: 7, offsetY: 9, padding: 3 });

    model.resetFineTune();
    expect(model.getState().gridConfig).toMatchObject({ offsetX: 0, offsetY: 0, padding: 0 });
  });
});

describe('EditorViewModel manual frames', () => {
  it('toggles manual mode without touching the grid frames', () => {
    const model = new EditorViewModel();
    seedImage(model);

    model.toggleManualMode();
    expect(model.getState().isManualMode).toBe(true);
    expect(model.getActiveFrames()).toEqual([]);
  });

  it('adds and counts manual frames', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(30, 0, 50, 20);

    const manual = model.getState().manualFrames;
    expect(manual).toHaveLength(2);
    expect(manual[0]).toMatchObject({ x: 0, y: 0, w: 20, h: 20, index: 0 });
    expect(manual[1]).toMatchObject({ x: 30, y: 0, w: 20, h: 20, index: 1 });
  });

  it('ignores manual frames when there is no image', () => {
    const model = new EditorViewModel();
    model.addManualFrame(0, 0, 10, 10);
    expect(model.getState().manualFrames).toEqual([]);
  });

  it('normalizes a drag that goes up and left', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.startDrawing(40, 40);
    model.updateDrawing(20, 10);
    model.endDrawing();

    expect(model.getState().manualFrames[0]).toMatchObject({ x: 20, y: 10, w: 20, h: 30 });
  });

  it('drops a frame that is too small to be useful', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.startDrawing(10, 10);
    model.updateDrawing(12, 11);
    model.endDrawing();

    expect(model.getState().manualFrames).toEqual([]);
  });

  it('keeps overlapping manual frames (the export clips the source rect)', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(5, 5, 25, 25);

    expect(model.getState().manualFrames).toHaveLength(2);
  });

  it('floors a fractional manual frame', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(10.6, 20.4, 25.9, 30.1);

    expect(model.getState().manualFrames[0]).toMatchObject({ x: 10, y: 20, w: 15, h: 9 });
  });

  it('removes the incomplete frame when the drawing is cancelled', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.startDrawing(10, 10);
    model.cancelDrawing();

    expect(model.getState().manualFrames).toEqual([]);
    expect(model.getState().isDrawing).toBe(false);
  });

  it('re-indexes the remaining frames after a delete', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(30, 0, 50, 20);
    model.addManualFrame(60, 0, 80, 20);

    model.deleteManualFrame(1);
    expect(model.getState().manualFrames.map(f => f.index)).toEqual([0, 1]);
  });

  it('keeps the selection pointing at the same frame after a delete', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(30, 0, 50, 20);
    model.addManualFrame(60, 0, 80, 20);
    model.selectManualFrame(2);

    model.deleteManualFrame(0);
    expect(model.getState().selectedManualFrameIndex).toBe(1);
  });

  it('clears the selection when the selected frame is deleted', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(30, 0, 50, 20);
    model.selectManualFrame(1);

    model.deleteManualFrame(1);
    expect(model.getState().selectedManualFrameIndex).toBe(-1);
  });

  it('clears every manual frame and the selection', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.selectManualFrame(0);

    model.clearManualFrames();
    expect(model.getState().manualFrames).toEqual([]);
    expect(model.getState().selectedManualFrameIndex).toBe(-1);
  });

  it('resizes the selected frame from a handle', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(20, 20, 60, 60);
    model.selectManualFrame(0);

    model.resizeManualFrame(0, 'br', 5, 10);
    expect(model.getState().manualFrames[0]).toMatchObject({ x: 20, y: 20, w: 45, h: 50 });
  });

  it('only offers a resize handle while a frame is selected', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(20, 20, 40, 40);

    expect(model.getResizeHandle(20, 20)).toBeNull();
    model.selectManualFrame(0);
    expect(model.getResizeHandle(20, 20)).toBe('tl');
  });
});

describe('EditorViewModel frame activation', () => {
  it('toggles a grid frame', () => {
    const model = new EditorViewModel();
    seedImage(model);

    model.toggleFrameActive(0);
    expect(model.getState().frames[0].isActive).toBe(false);
    expect(model.getState().frames[1].isActive).toBe(true);

    model.toggleFrameActive(0);
    expect(model.getState().frames[0].isActive).toBe(true);
  });

  it('toggles a manual frame without disturbing the grid', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);

    const gridCount = model.getState().frames.length;
    model.toggleFrameActive(gridCount);

    expect(model.getState().manualFrames[0].isActive).toBe(false);
    expect(model.getState().frames.every(f => f.isActive)).toBe(true);
  });

  it('ignores an out of range index', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.toggleFrameActive(99);
    expect(model.getState().frames.every(f => f.isActive)).toBe(true);
  });

  it('hides the grid frames in manual mode', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.toggleManualMode();

    expect(model.getActiveFrames()).toEqual(model.getState().manualFrames);
  });
});

describe('EditorViewModel zoom and export settings', () => {
  it('clamps the zoom into a usable range', () => {
    const model = new EditorViewModel();
    model.setZoom(100);
    expect(model.getState().zoom).toBe(10);

    model.setZoom(0);
    expect(model.getState().zoom).toBe(0.1);

    model.zoomIn();
    model.zoomOut();
    model.zoomOut();
    expect(model.getState().zoom).toBe(0.1);
  });

  it('accepts any sheet column count but at least one', () => {
    const model = new EditorViewModel();
    model.setSheetColumns(16);
    expect(model.getState().sheetColumns).toBe(16);

    model.setSheetColumns(0);
    expect(model.getState().sheetColumns).toBe(1);
  });

  it('accepts the auto fit preview zoom marker', () => {
    const model = new EditorViewModel();
    model.setPreviewZoom(-1);
    expect(model.getState().previewZoom).toBe(-1);
  });
});

describe('EditorViewModel pivots and atlas settings', () => {
  it('stores a pivot on a grid frame and switches to custom mode', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setPivotMode('center');

    model.setFramePivot(0, { x: 0.1, y: 0.2 });

    expect(model.getState().frames[0].pivot).toEqual({ x: 0.1, y: 0.2 });
    expect(model.getState().pivotMode).toBe('custom');
    expect(model.getPickedPivotCount()).toBe(1);
  });

  it('clamps an out of range pivot', () => {
    const model = new EditorViewModel();
    seedImage(model);

    model.setFramePivot(0, { x: -4, y: 9 });
    expect(model.getState().frames[0].pivot).toEqual({ x: 0, y: 1 });
  });

  it('stores a pivot on a manual frame by its global position', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);

    const gridCount = model.getState().frames.length;
    model.setFramePivot(gridCount, { x: 0.5, y: 0.5 });

    expect(model.getState().manualFrames[0].pivot).toEqual({ x: 0.5, y: 0.5 });
    expect(model.getState().frames.every(f => f.pivot === undefined)).toBe(true);
  });

  it('clears a single pivot with null', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setFramePivot(0, { x: 0.5, y: 0.5 });
    model.setFramePivot(0, null);

    expect(model.getState().frames[0].pivot).toBeUndefined();
    expect(model.getPickedPivotCount()).toBe(0);
  });

  it('ignores an out of range pivot index', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setFramePivot(99, { x: 0.5, y: 0.5 });

    expect(model.getPickedPivotCount()).toBe(0);
  });

  it('clears every pivot at once', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    model.setFramePivot(0, { x: 0, y: 0 });
    model.setFramePivot(model.getState().frames.length, { x: 1, y: 1 });

    model.clearFramePivots();
    expect(model.getPickedPivotCount()).toBe(0);
  });

  it('clamps the alpha threshold', () => {
    const model = new EditorViewModel();

    model.setAtlasAlphaThreshold(-10);
    expect(model.getState().atlasAlphaThreshold).toBe(0);

    model.setAtlasAlphaThreshold(900);
    expect(model.getState().atlasAlphaThreshold).toBe(255);
  });

  it('toggles auto trim', () => {
    const model = new EditorViewModel();
    expect(model.getState().atlasTrim).toBe(true);

    model.setAtlasTrim(false);
    expect(model.getState().atlasTrim).toBe(false);
  });
});

describe('EditorViewModel background removal', () => {
  it('keeps the original image while the effect is off', () => {
    const model = new EditorViewModel();
    seedImage(model);
    expect(model.getState().processedImage).toBe(model.getState().image);
  });

  it('produces a processed canvas when enabled', async () => {
    const model = new EditorViewModel();
    seedImage(model);
    await model.toggleRemoveBackground();

    const processed = model.getState().processedImage;
    expect(processed).not.toBe(model.getState().image);
    expect((processed as unknown as FakeCanvas).width).toBe(128);
    expect((processed as unknown as FakeCanvas).height).toBe(64);
  });

  it('reprocesses when the tolerance changes', async () => {
    const model = new EditorViewModel();
    seedImage(model);
    await model.toggleRemoveBackground();
    const first = model.getState().processedImage;

    await model.setRemoveBgColor(255, 0, 0, 10);
    expect(model.getState().removeBgColor).toEqual({ r: 255, g: 0, b: 0, tolerance: 10 });
    expect(model.getState().processedImage).not.toBe(first);
  });
});

describe('EditorViewModel canvas coordinates', () => {
  it('maps a client point into image space through the zoom', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.setZoom(2);

    const canvas = {
      width: 256,
      height: 128,
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 128, height: 64 }),
    } as unknown as HTMLCanvasElement;

    // client (10, 20) is the top left of the element, so image (0, 0)
    expect(model.getCanvasCoordinates(canvas, 42, 44)).toEqual({ x: 32, y: 24 });
  });
});

describe('EditorViewModel frame list memoization', () => {
  it('survives changes that do not touch the frames', () => {
    const model = new EditorViewModel();
    seedImage(model);

    const frames = model.getFrames();
    const active = model.getActiveFrames();
    expect(model.getFrames()).toBe(frames);
    expect(model.getActiveFrames()).toBe(active);

    // Zoom, selection and playback are irrelevant to the frame lists, so a
    // component that only cares about frames does not have to re-render.
    model.setZoom(2);
    model.selectManualFrame(-1);
    model.setSheetColumns(3);
    expect(model.getFrames()).toBe(frames);
    expect(model.getActiveFrames()).toBe(active);
  });

  it('is invalidated by every frame change', () => {
    const model = new EditorViewModel();
    seedImage(model);
    const frames = model.getFrames();

    model.toggleFrameActive(0);
    expect(model.getFrames()).not.toBe(frames);
    expect(model.getActiveFrames()).toHaveLength(7);

    const afterToggle = model.getFrames();
    model.addManualFrame(0, 0, 20, 20);
    expect(model.getFrames()).not.toBe(afterToggle);
  });

  it('reflects a pivot change even though the frame count is unchanged', () => {
    const model = new EditorViewModel();
    seedImage(model);
    const frames = model.getFrames();

    model.setFramePivot(0, { x: 0.25, y: 0.25 });

    expect(model.getFrames()).not.toBe(frames);
    expect(model.getFrames()[0].pivot).toEqual({ x: 0.25, y: 0.25 });
  });

  it('reflects a grid change in the cached list', () => {
    const model = new EditorViewModel();
    seedImage(model);
    expect(model.getFrames()).toHaveLength(8);

    model.setGridConfig({ cols: 2, rows: 1 });
    expect(model.getFrames()).toHaveLength(2);
  });

  it('reflects a frame toggle in the active list', () => {
    const model = new EditorViewModel();
    seedImage(model);
    expect(model.getActiveFrames()).toHaveLength(8);

    model.toggleFrameActive(0);
    expect(model.getActiveFrames()).toHaveLength(7);
  });

  it('switches the active list when manual mode is toggled', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(0, 0, 20, 20);
    expect(model.getActiveFrames()).toHaveLength(9);

    model.toggleManualMode();
    expect(model.getActiveFrames()).toEqual(model.getState().manualFrames);

    model.toggleManualMode();
    expect(model.getActiveFrames()).toHaveLength(9);
  });
});

describe('EditorViewModel subscriptions', () => {
  it('notifies listeners until they unsubscribe', () => {
    const model = new EditorViewModel();
    let calls = 0;
    const unsubscribe = model.subscribe(() => {
      calls++;
    });

    model.setZoom(2);
    model.setSheetColumns(4);
    expect(calls).toBe(2);

    unsubscribe();
    model.setZoom(3);
    expect(calls).toBe(2);
  });

  it('notifies every listener', () => {
    const model = new EditorViewModel();
    const seen: string[] = [];
    model.subscribe(() => seen.push('a'));
    model.subscribe(() => seen.push('b'));

    model.setZoom(2);
    expect(seen).toEqual(['a', 'b']);
  });
});

describe('EditorViewModel frame helpers', () => {
  it('tracks the drawing gesture state', () => {
    const model = new EditorViewModel();
    seedImage(model);

    model.startDrawing(10, 10);
    expect(model.isDrawing()).toBe(true);
    expect(model.getDrawingState()).toEqual({ isDrawing: true, startX: 10, startY: 10, currentX: 10, currentY: 10 });

    model.updateDrawing(20, 30);
    expect(model.getDrawingState()).toEqual({ isDrawing: true, startX: 10, startY: 10, currentX: 20, currentY: 30 });
    expect(model.getState().manualFrames[0]).toMatchObject({ x: 10, y: 10, w: 10, h: 20 });

    model.endDrawing();
    expect(model.isDrawing()).toBe(false);
    expect(model.getDrawingState()).toBeNull();
  });

  it('drags the selected frame', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(20, 20, 40, 40);
    model.selectManualFrame(0);

    model.startDrag(30, 30);
    model.updateDrag(40, 45);
    model.endDrag();

    expect(model.getState().manualFrames[0]).toMatchObject({ x: 30, y: 35 });
  });

  it('keeps a minimum size while resizing through the gesture API', () => {
    const model = new EditorViewModel();
    seedImage(model);
    model.addManualFrame(20, 20, 40, 40);
    model.selectManualFrame(0);

    model.startResize('tl', 0, 0);
    model.updateResize(100, 100);

    const frame: Frame = model.getState().manualFrames[0];
    expect(frame.w).toBe(5);
    expect(frame.h).toBe(5);

    model.endResize();
    expect(model.isResizing()).toBe(false);
  });
});
