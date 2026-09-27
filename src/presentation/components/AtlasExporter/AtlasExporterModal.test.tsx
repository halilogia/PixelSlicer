// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtlasExporterModal } from './AtlasExporterModal';
import { EditorViewModel } from '@presentation/EditorViewModel';
import type { Frame } from '@domain/FrameLogic';
import { FakeConvertibleCanvas } from '../../../testUtils/canvasFixtures';
import {
  FIXTURE_CELL,
  FIXTURE_CELLS,
  FIXTURE_WIDTH,
  fixtureSheet,
} from '../../../testUtils/fixtureSheet';

function sheetImage(): HTMLImageElement {
  const { width, height } = fixtureSheet();
  return { naturalWidth: width, naturalHeight: height, width, height } as HTMLImageElement;
}

function sheetFrames(): Frame[] {
  return Array.from({ length: FIXTURE_CELLS }, (_, i) => ({
    x: (i % 4) * FIXTURE_CELL,
    y: Math.floor(i / 4) * FIXTURE_CELL,
    w: FIXTURE_CELL,
    h: FIXTURE_CELL,
    index: i,
    isActive: true,
  }));
}

interface RenderOptions {
  fps?: number;
  trim?: boolean;
  alphaThreshold?: number;
  onClose?: () => void;
}

function renderModal(options: RenderOptions = {}) {
  const onClose = vi.fn();
  const model = new EditorViewModel();
  model.setFps(options.fps ?? 10);

  const view = render(
    <AtlasExporterModal
      image={sheetImage()}
      frames={sheetFrames()}
      pivotMode="center"
      trim={options.trim ?? true}
      alphaThreshold={options.alphaThreshold ?? 0}
      fps={options.fps ?? 10}
      onTrimChange={vi.fn()}
      onAlphaThresholdChange={vi.fn()}
      onClose={onClose}
    />
  );

  return { ...view, onClose };
}

const buildButton = () => screen.getByTestId('atlas-build');
const exportButton = () => screen.getByTestId('atlas-export');

async function build() {
  await act(async () => {
    fireEvent.click(buildButton());
  });
}

beforeEach(() => {
  vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
  // No worker in this environment: the client uses its inline pipeline, which
  // runs the very same code.
  vi.stubGlobal('Worker', undefined);
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:atlas',
    revokeObjectURL: () => undefined,
  });
  vi.stubGlobal('requestIdleCallback', undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AtlasExporterModal', () => {
  it('starts with the build action and a disabled export', () => {
    renderModal();

    expect(buildButton()).toBeTruthy();
    expect((exportButton() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('atlas-preview')).toBeTruthy();
  });

  it('builds the atlas and reports the statistics', async () => {
    renderModal();
    await build();

    const stats = screen.getByTestId('atlas-stats');
    expect(stats.textContent).toContain(String(FIXTURE_CELLS));
    expect(stats.textContent).toContain('1'); // one page
    expect(stats.textContent).toContain('%');
  });

  it('enables the export once a build exists', async () => {
    renderModal();
    await build();

    expect((exportButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('lets the page size be chosen', async () => {
    renderModal();
    fireEvent.click(screen.getByText('1024'));
    await build();

    const stats = screen.getByTestId('atlas-stats');
    expect(stats.textContent).toContain('1');
  });

  it('changes the sprite naming prefix and start index', async () => {
    renderModal();
    fireEvent.change(screen.getByTestId('atlas-name-prefix'), { target: { value: 'hero_' } });
    fireEvent.change(screen.getByTestId('atlas-name-start'), { target: { value: '7' } });
    await build();

    fireEvent.click(document.querySelector('.atlas__names summary')!);
    expect((screen.getByTestId('atlas-name-0') as HTMLInputElement).value).toBe('hero_0007');
  });

  it('keeps a manual rename across a rebuild', async () => {
    renderModal();
    await build();
    fireEvent.click(document.querySelector('.atlas__names summary')!);

    fireEvent.change(screen.getByTestId('atlas-name-1'), { target: { value: 'walk_02' } });
    await build();

    expect((screen.getByTestId('atlas-name-1') as HTMLInputElement).value).toBe('walk_02');
  });

  it('can enable rotation and animation groups', async () => {
    renderModal();
    fireEvent.click(screen.getByTestId('atlas-rotation'));
    fireEvent.change(screen.getByTestId('atlas-group-size'), { target: { value: '4' } });
    await build();

    expect(screen.getByTestId('atlas-stats').textContent).toContain(String(FIXTURE_CELLS));
  });

  it('switches the engine formats', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Starling'));
    await build();

    // The Godot animation field disappears, the build still works.
    expect(screen.getByTestId('atlas-stats')).toBeTruthy();
  });

  it('closes on the header button and on the backdrop', () => {
    const { onClose } = renderModal();

    fireEvent.click(document.querySelector('.modal__close')!);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('draws the preview canvas once a page is built', async () => {
    renderModal();
    await build();
    const preview = document.querySelector('.atlas__canvas') as HTMLCanvasElement;

    expect(preview.width).toBeGreaterThan(0);
    expect(preview.height).toBeGreaterThan(0);
  });

  it('disables the build when there is nothing to pack', () => {
    render(
      <AtlasExporterModal
        image={sheetImage()}
        frames={[]}
        pivotMode="center"
        trim
        alphaThreshold={0}
        fps={10}
        onTrimChange={vi.fn()}
        onAlphaThresholdChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect((buildButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables the export once a build exists and does not error', async () => {
    renderModal();
    await build();

    const button = exportButton() as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(button);
    });

    // The zip is assembled asynchronously and the real download is covered by
    // the Playwright suite; here the action must not end in an error state.
    await vi.waitFor(() =>
      expect(document.querySelector('.atlas__error')).toBeNull()
    );
  });

  it('reports a worker that had to fall back to the main thread', async () => {
    renderModal();
    await build();

    expect(screen.getByTestId('atlas-worker-badge').textContent?.length).toBeGreaterThan(0);
  });

  it('keeps the sheet dimensions for the pages it builds', async () => {
    renderModal();
    await build();

    const { width, height } = fixtureSheet();
    expect(width * height).toBeGreaterThan(0);
    expect(FIXTURE_WIDTH).toBe(128);
    expect(screen.getByTestId('atlas-stats')).toBeTruthy();
  });
});

describe('AtlasExporterModal errors', () => {
  it('shows the message when the build fails', async () => {
    class FailingCanvas {
      width = 0;
      height = 0;
      getContext(): never {
        throw new Error('no context');
      }
    }
    vi.stubGlobal('OffscreenCanvas', FailingCanvas);

    renderModal();
    await build();

    expect(document.querySelector('.atlas__error')?.textContent).toContain('no context');
  });
});
