import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorViewModel } from './EditorViewModel';
import type { Frame } from '@domain/FrameLogic';

function frame(index: number): Frame {
  return { x: index * 32, y: 0, w: 32, h: 32, index, isActive: true };
}

/** Force a grid of `count` frames without needing a real image. */
function seedFrames(model: EditorViewModel, count: number): void {
  const frames = Array.from({ length: count }, (_, i) => frame(i));
  const state = model.getState();
  Object.assign(state, {
    frames,
    manualFrames: [],
    imageDimensions: { width: count * 32, height: 32 },
  });
}

/**
 * Deterministic requestAnimationFrame driver: the callback timestamp and
 * `performance.now()` are kept on the same clock, exactly like a browser.
 */
function createRafDriver() {
  let now = 0;
  const queue: Array<(timestamp: number) => void> = [];

  vi.stubGlobal('requestAnimationFrame', (callback: (timestamp: number) => void) => {
    queue.push(callback);
    return queue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    queue.length = 0;
  });
  vi.stubGlobal('performance', { now: () => now });

  return {
    /** Advance the clock and run the scheduled frame callbacks. */
    tick(milliseconds: number): void {
      now += milliseconds;
      const pending = queue.splice(0, queue.length);
      pending.forEach(callback => callback(now));
    },
    pending: () => queue.length,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EditorViewModel animation', () => {
  it('advances one frame per frame duration', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 4);
    model.setFps(10);

    model.startAnimation();
    expect(model.getState().isPlaying).toBe(true);
    expect(raf.pending()).toBe(1);
    expect(model.getState().currentFrame).toBe(0);

    raf.tick(100);
    expect(model.getState().currentFrame).toBe(1);

    raf.tick(100);
    expect(model.getState().currentFrame).toBe(2);

    model.stopAnimation();
  });

  it('does not advance faster than the configured fps', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 4);
    model.setFps(10);
    model.startAnimation();

    raf.tick(90);
    expect(model.getState().currentFrame).toBe(0);

    raf.tick(20);
    expect(model.getState().currentFrame).toBe(1);

    model.stopAnimation();
  });

  it('wraps around and stays inside the active frame range', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 3);
    model.setFps(20);
    model.startAnimation();

    for (let i = 0; i < 10; i++) {
      raf.tick(50);
      expect(model.getState().currentFrame).toBeLessThan(3);
      expect(model.getState().currentFrame).toBeGreaterThanOrEqual(0);
    }

    model.stopAnimation();
  });

  it('steps at most one frame per callback and keeps the remainder', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 10);
    model.setFps(10);
    model.startAnimation();

    // A long stall must not burst into a catch-up storm of frames.
    raf.tick(1050);
    expect(model.getState().currentFrame).toBe(1);

    // 50ms of the pending step is carried over instead of being lost.
    raf.tick(40);
    expect(model.getState().currentFrame).toBe(1);

    raf.tick(60);
    expect(model.getState().currentFrame).toBe(2);

    model.stopAnimation();
  });

  it('stops the loop and freezes the frame', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 5);
    model.setFps(10);
    model.startAnimation();
    raf.tick(300);

    model.stopAnimation();
    const frozen = model.getState().currentFrame;
    expect(model.getState().isPlaying).toBe(false);
    expect(raf.pending()).toBe(0);

    raf.tick(1000);
    expect(model.getState().currentFrame).toBe(frozen);
  });

  it('re-applies the new fps to a running animation', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    seedFrames(model, 10);
    model.setFps(2);
    model.startAnimation();

    model.setFps(20);
    raf.tick(50);
    expect(model.getState().currentFrame).toBe(1);

    model.stopAnimation();
  });

  it('does nothing without active frames', () => {
    const raf = createRafDriver();
    const model = new EditorViewModel();
    model.startAnimation();

    expect(model.getState().isPlaying).toBe(false);
    expect(raf.pending()).toBe(0);
    raf.tick(1000);
    expect(model.getState().currentFrame).toBe(0);
  });
});
