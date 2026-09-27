// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorViewModel } from '@presentation/EditorViewModel';
import GallerySection from './GallerySection';
import { FakeContext } from '../testUtils/canvasFixtures';

let created = 0;

function fakeImage(width = 128, height = 64): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height, width, height } as HTMLImageElement;
}

function modelWithSheet(): EditorViewModel {
  const model = new EditorViewModel();
  model.setImage(fakeImage());
  return model;
}

beforeEach(() => {
  created = 0;
  // happy-dom ships the canvas element but no backend, so the 2D context and
  // the encoder are stubbed on the prototype (never on the whole document).
  const context = new FakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback: BlobCallback) => callback(new Blob(['thumbnail'], { type: 'image/png' }))
  );
  vi.stubGlobal('URL', {
    createObjectURL: () => `blob:thumb-${created++}`,
    revokeObjectURL: () => undefined,
  });
  // The idle scheduler is never allowed to run here, so the tiles stay in the
  // pending state (the thumbnail hook has its own lifecycle test).
  vi.stubGlobal('requestIdleCallback', () => 1);
  vi.stubGlobal('cancelIdleCallback', () => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('GallerySection', () => {
  it('shows an empty state before an image is loaded', () => {
    render(<GallerySection viewModel={new EditorViewModel()} />);
    expect(screen.getByText('Henüz kare oluşturulmadı.')).toBeTruthy();
  });

  it('renders one tile per frame of the grid', () => {
    const model = modelWithSheet();
    const { container } = render(<GallerySection viewModel={model} />);

    expect(container.querySelectorAll('.frame-item')).toHaveLength(8);
    expect(container.querySelectorAll('.frame-item__badge')[0].textContent).toBe('1');
  });

  it('keeps inactive frames visible so they can be re-enabled', () => {
    const model = modelWithSheet();
    const { container } = render(<GallerySection viewModel={model} />);

    act(() => model.toggleFrameActive(0));

    expect(container.querySelectorAll('.frame-item')).toHaveLength(8);
    expect(container.querySelectorAll('.frame-item--disabled')).toHaveLength(1);
  });

  it('renders shimmer placeholders while the thumbnails are pending', () => {
    const model = modelWithSheet();
    const { container } = render(<GallerySection viewModel={model} />);

    expect(container.querySelectorAll('.frame-item__placeholder-shimmer')).toHaveLength(8);
  });

  it('reacts to a grid change on its own', () => {
    const model = modelWithSheet();
    const { container } = render(<GallerySection viewModel={model} />);

    act(() => model.setGridConfig({ cols: 2, rows: 1 }));

    expect(container.querySelectorAll('.frame-item')).toHaveLength(2);
  });

  it('switches to the manual frames in manual mode', () => {
    const model = modelWithSheet();
    model.toggleManualMode();
    model.addManualFrame(10, 10, 40, 40);
    const { container } = render(<GallerySection viewModel={model} />);

    expect(container.querySelectorAll('.frame-item')).toHaveLength(1);

    act(() => model.toggleManualMode());
    expect(container.querySelectorAll('.frame-item')).toHaveLength(8);
  });
});
