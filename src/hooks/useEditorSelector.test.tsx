// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { EditorViewModel } from '@presentation/EditorViewModel';
import { shallowEqual, useEditorSelector } from './useEditorSelector';

afterEach(cleanup);

function fakeImage(width = 128, height = 64): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height, width, height } as HTMLImageElement;
}

function modelWithImage(): EditorViewModel {
  const model = new EditorViewModel();
  model.setImage(fakeImage());
  return model;
}

describe('shallowEqual', () => {
  it('is true for the same reference', () => {
    const slice = { a: 1 };
    expect(shallowEqual(slice, slice)).toBe(true);
  });

  it('compares own values', () => {
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 2, b: 'x' })).toBe(false);
  });

  it('rejects a different shape', () => {
    expect(shallowEqual({ a: 1 } as Record<string, unknown>, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1 } as Record<string, unknown>)).toBe(false);
  });
});

describe('useEditorSelector', () => {
  it('returns the selected slice on the first render', () => {
    const model = modelWithImage();

    function Probe() {
      const zoom = useEditorSelector(model, state => state.zoom);
      return <span data-testid="zoom">{zoom}</span>;
    }

    render(<Probe />);
    expect(screen.getByTestId('zoom').textContent).toBe(String(model.getState().zoom));
  });

  it('re-renders only when the slice changes', () => {
    const model = modelWithImage();
    let renders = 0;

    function Probe() {
      renders++;
      const isPlaying = useEditorSelector(model, state => state.isPlaying);
      return <span data-testid="playing">{String(isPlaying)}</span>;
    }

    render(<Probe />);
    const initial = renders;

    act(() => model.setZoom(2));
    expect(renders).toBe(initial);

    act(() => model.setFramePivot(0, { x: 0, y: 0 }));
    expect(renders).toBe(initial);

    act(() => model.startAnimation());
    expect(renders).toBe(initial + 1);
    expect(screen.getByTestId('playing').textContent).toBe('true');
  });

  it('supports an object slice with a custom equality', () => {
    const model = modelWithImage();

    function Probe() {
      const bg = useEditorSelector(model, state => state.removeBgColor, shallowEqual);
      return <span data-testid="bg">{`${bg.r},${bg.g},${bg.b},${bg.tolerance}`}</span>;
    }

    render(<Probe />);
    expect(screen.getByTestId('bg').textContent).toBe('0,0,0,30');

    // A new object with identical values must not re-render.
    act(() => model.setRemoveBgColor(0, 0, 0, 30));
    expect(screen.getByTestId('bg').textContent).toBe('0,0,0,30');

    act(() => model.setRemoveBgColor(10, 20, 30, 40));
    expect(screen.getByTestId('bg').textContent).toBe('10,20,30,40');
  });

  it('does not re-subscribe when the selector identity changes', () => {
    const model = modelWithImage();
    const subscribes: Array<() => void> = [];
    const original = model.subscribe.bind(model);
    model.subscribe = listener => {
      const unsubscribe = original(listener);
      subscribes.push(unsubscribe);
      return unsubscribe;
    };

    function Probe({ tag }: { tag: number }) {
      // A brand new closure on every render, on purpose.
      const count = useEditorSelector(model, state => state.frames.length + tag * 0);
      return <span data-testid="count">{count}</span>;
    }

    const { rerender } = render(<Probe tag={1} />);
    expect(subscribes).toHaveLength(1);

    rerender(<Probe tag={2} />);
    expect(subscribes).toHaveLength(1);

    act(() => model.setGridConfig({ cols: 2, rows: 1 }));
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('catches a change that happened before the subscription', () => {
    const model = modelWithImage();
    const late: { current: (() => void) | null } = { current: null };

    function Probe() {
      const cols = useEditorSelector(model, state => state.gridConfig.cols);
      return <span data-testid="cols">{cols}</span>;
    }

    function Outer() {
      const [show, setShow] = useState(false);
      late.current = () => setShow(true);
      return show ? <Probe /> : null;
    }

    // The state changes while no component is subscribed.
    model.setGridConfig({ cols: 3 });

    render(<Outer />);
    act(() => late.current?.());

    expect(screen.getByTestId('cols').textContent).toBe('3');
  });

  it('stops listening after unmount', () => {
    const model = modelWithImage();
    let renders = 0;

    function Probe() {
      renders++;
      const frames = useEditorSelector(model, state => state.frames);
      return <span data-testid="len">{frames.length}</span>;
    }

    const { unmount } = render(<Probe />);
    const initial = renders;
    unmount();

    act(() => model.setGridConfig({ cols: 2, rows: 1 }));
    expect(renders).toBe(initial);
  });
});
