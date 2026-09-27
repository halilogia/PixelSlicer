import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EditorViewModel } from './EditorViewModel';
import type { Frame } from '@domain/FrameLogic';
import { FakeCanvas } from '../testUtils/canvasFixtures';

function seed(model: EditorViewModel): void {
  model.setImage({ naturalWidth: 128, naturalHeight: 64, width: 128, height: 64 } as HTMLImageElement);
}

beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => new FakeCanvas() });
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditorViewModel undo and redo', () => {
  it('starts with an empty history', () => {
    const model = new EditorViewModel();
    seed(model);

    expect(model.canUndo()).toBe(false);
    expect(model.canRedo()).toBe(false);
    expect(model.undo()).toBe(false);
    expect(model.redo()).toBe(false);
  });

  it('restores the previous grid configuration', () => {
    const model = new EditorViewModel();
    seed(model);

    model.setGridConfig({ cols: 2, rows: 1 });
    expect(model.getState().frames).toHaveLength(2);
    expect(model.canUndo()).toBe(true);

    expect(model.undo()).toBe(true);
    expect(model.getState().gridConfig.cols).toBe(4);
    expect(model.getState().frames).toHaveLength(8);
  });

  it('re-applies a change with redo', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setGridConfig({ cols: 2, rows: 1 });

    model.undo();
    expect(model.canRedo()).toBe(true);

    expect(model.redo()).toBe(true);
    expect(model.getState().frames).toHaveLength(2);
  });

  it('undoes a manual frame and re-indexes the rest', () => {
    const model = new EditorViewModel();
    seed(model);
    model.addManualFrame(0, 0, 20, 20);
    model.addManualFrame(30, 0, 50, 20);
    expect(model.getState().manualFrames).toHaveLength(2);

    model.undo();
    expect(model.getState().manualFrames).toHaveLength(1);
    expect(model.getState().manualFrames[0].index).toBe(0);

    model.redo();
    expect(model.getState().manualFrames.map(frame => frame.index)).toEqual([0, 1]);
  });

  it('undoes a frame toggle', () => {
    const model = new EditorViewModel();
    seed(model);

    model.toggleFrameActive(0);
    expect(model.getState().frames[0].isActive).toBe(false);

    model.undo();
    expect(model.getState().frames[0].isActive).toBe(true);
  });

  it('undoes a pivot change and restores the mode', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setPivotMode('bottomCenter');
    model.setFramePivot(0, { x: 0.5, y: 0.5 });

    model.undo();
    expect(model.getState().frames[0].pivot).toBeUndefined();
    expect(model.getState().pivotMode).toBe('bottomCenter');
  });

  it('does not record view only changes', () => {
    const model = new EditorViewModel();
    seed(model);
    const before = model.canUndo();

    model.setZoom(2);
    model.setFps(20);
    model.setPreviewZoom(0.5);
    model.selectManualFrame(0);

    expect(model.canUndo()).toBe(before);
  });

  it('coalesces a drag into a single undo step', () => {
    const model = new EditorViewModel();
    seed(model);
    model.addManualFrame(20, 20, 60, 60);
    model.selectManualFrame(0);

    model.startDrag(30, 30);
    model.updateDrag(40, 40);
    model.updateDrag(50, 50);
    model.updateDrag(60, 60);
    model.endDrag();

    const frame = model.getState().manualFrames[0];
    expect(frame.x).toBe(50);
    expect(frame.y).toBe(50);

    // One undo returns to the pre drag position, not one step per pointer move.
    model.undo();
    expect(model.getState().manualFrames[0].x).toBe(20);
    expect(model.getState().manualFrames[0].y).toBe(20);
  });

  it('coalesces a resize into a single undo step', () => {
    const model = new EditorViewModel();
    seed(model);
    model.addManualFrame(20, 20, 60, 60);
    model.selectManualFrame(0);

    model.startResize('br', 60, 60);
    model.updateResize(70, 70);
    model.updateResize(80, 80);
    model.endResize();
    expect(model.getState().manualFrames[0].w).toBe(60);

    model.undo();
    expect(model.getState().manualFrames[0].w).toBe(40);
  });

  it('drops the provisional frame when a drawing is cancelled', () => {
    const model = new EditorViewModel();
    seed(model);
    // An untouched drawing is removed, and there is nothing to undo back to.
    model.startDrawing(10, 10);
    model.cancelDrawing();

    expect(model.getState().manualFrames).toHaveLength(0);
    expect(model.canUndo()).toBe(false);
  });

  it('undoes a finished drawing', () => {
    const model = new EditorViewModel();
    seed(model);
    model.startDrawing(10, 10);
    model.updateDrawing(40, 40);
    model.endDrawing();
    expect(model.getState().manualFrames).toHaveLength(1);

    model.undo();
    expect(model.getState().manualFrames).toHaveLength(0);
  });

  it('undoes the atlas trim settings', () => {
    const model = new EditorViewModel();
    seed(model);
    expect(model.getState().atlasTrim).toBe(true);

    model.setAtlasTrim(false);
    model.undo();
    expect(model.getState().atlasTrim).toBe(true);
  });

  it('undoes the background colour', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setRemoveBgColor(10, 20, 30, 40);

    model.undo();
    expect(model.getState().removeBgColor).toEqual({ r: 0, g: 0, b: 0, tolerance: 30 });
  });

  it('clears the redo stack once a new change is recorded', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setGridConfig({ cols: 2, rows: 1 });
    model.undo();
    expect(model.canRedo()).toBe(true);

    model.setGridConfig({ cols: 8, rows: 1 });
    expect(model.canRedo()).toBe(false);
  });

  it('keeps the history bounded', () => {
    const model = new EditorViewModel();
    seed(model);

    for (let i = 0; i < 80; i++) {
      model.setGridConfig({ offsetX: i });
    }

    let undos = 0;
    while (model.undo()) undos++;
    expect(undos).toBeLessThanOrEqual(50);
  });

  it('notifies subscribers when the document is restored', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setGridConfig({ cols: 2, rows: 1 });

    let calls = 0;
    model.subscribe(() => calls++);
    model.undo();

    expect(calls).toBe(1);
  });

  it('drops the history when a new image is loaded', () => {
    const model = new EditorViewModel();
    seed(model);
    model.setGridConfig({ cols: 2, rows: 1 });
    expect(model.canUndo()).toBe(true);

    seed(model);
    expect(model.canUndo()).toBe(false);
  });
});

describe('EditorViewModel document import and export', () => {
  it('round trips a document', () => {
    const source = new EditorViewModel();
    seed(source);
    source.setGridConfig({ cols: 2, rows: 2, padding: 3 });
    source.addManualFrame(0, 0, 20, 20);
    source.setFramePivot(0, { x: 0.25, y: 0.75 });
    source.setPivotMode('bottomCenter');
    const document = source.getDocument();

    const target = new EditorViewModel();
    seed(target);
    target.loadDocument(document);

    expect(target.getState().gridConfig).toMatchObject({ cols: 2, rows: 2, padding: 3 });
    expect(target.getState().manualFrames).toHaveLength(1);
    expect(target.getState().frames[0].pivot).toEqual({ x: 0.25, y: 0.75 });
    expect(target.getState().pivotMode).toBe('bottomCenter');
  });

  it('clears the history on load', () => {
    const source = new EditorViewModel();
    seed(source);
    source.setGridConfig({ cols: 2, rows: 2 });

    const target = new EditorViewModel();
    seed(target);
    target.setGridConfig({ cols: 8, rows: 8 });
    target.loadDocument(source.getDocument());

    expect(target.canUndo()).toBe(false);
  });

  it('recalculates the frames on load', () => {
    const source = new EditorViewModel();
    seed(source);
    source.setGridConfig({ cols: 2, rows: 1 });

    const target = new EditorViewModel();
    seed(target);
    target.loadDocument(source.getDocument());

    expect(target.getState().frames).toHaveLength(2);
  });

  it('hands out a detached copy', () => {
    const model = new EditorViewModel();
    seed(model);
    const document = model.getDocument();
    (document.frames as Frame[])[0].x = 999;

    expect(model.getState().frames[0].x).not.toBe(999);
  });
});
