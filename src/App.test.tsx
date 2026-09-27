// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { FakeConvertibleCanvas, FakeContext } from './testUtils/canvasFixtures';

function stubBrowserApis(): void {
  const context = new FakeContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    (callback: BlobCallback) => callback(new Blob(['thumbnail'], { type: 'image/png' }))
  );
  vi.stubGlobal('OffscreenCanvas', FakeConvertibleCanvas);
  // The editor has to run without workers here: the clients fall back inline.
  vi.stubGlobal('Worker', undefined);
  vi.stubGlobal('requestIdleCallback', undefined);
  vi.stubGlobal('cancelIdleCallback', undefined);
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:app',
    revokeObjectURL: () => undefined,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  // The editor starts in English unless a language was stored.
  window.localStorage.setItem('pixelslicer_lang', 'en');
  stubBrowserApis();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function text(): string {
  return document.body.textContent ?? '';
}

function buttonWith(label: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll('button')).find(candidate =>
    (candidate.textContent ?? '').includes(label)
  );
  if (!button) throw new Error(`No button labelled ${label}`);
  return button;
}

function openSettings(): void {
  fireEvent.click(document.querySelector('.settings-btn') as HTMLButtonElement);
}

describe('App shell', () => {
  it('renders the header, the drop hint and the empty gallery', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(text()).toContain('PixelSlicer');
    expect(text()).toContain('Use the button at top left or drag and drop to start.');
    expect(document.querySelector('#framesGallery')).toBeTruthy();
  });

  it('shows the upload and export actions', () => {
    render(<App />);

    expect(text()).toContain('Upload GIF');
    expect(text()).toContain('Upload Image(s)');
    expect(text()).toContain('Sprite Sheet');
    expect(text()).toContain('Download GIF');
    expect(text()).toContain('Download ZIP');
  });

  it('keeps the export buttons disabled while there is no image', () => {
    render(<App />);

    const disabled = (label: string): boolean => buttonWith(label).disabled;

    expect(disabled('Sprite Sheet')).toBe(true);
    expect(disabled('Download GIF')).toBe(true);
    expect(disabled('Download ZIP')).toBe(true);
  });

  it('opens and closes the settings modal', () => {
    render(<App />);

    openSettings();
    expect(document.querySelector('.modal__title')?.textContent).toContain('Settings');

    fireEvent.click(document.querySelector('.modal__close')!);
    expect(document.querySelector('.modal__title')).toBeNull();
  });

  it('switches the interface language and remembers it', () => {
    render(<App />);
    openSettings();

    fireEvent.click(screen.getByText('Türkçe'));

    expect(text()).toContain('Resim(ler) Yükle');
    expect(window.localStorage.getItem('pixelslicer_lang')).toBe('tr');
  });

  it('restores the language from local storage', () => {
    window.localStorage.setItem('pixelslicer_lang', 'tr');

    render(<App />);

    // Only the language is persisted today, the grid config is not.
    expect(document.documentElement.lang).toBe('tr');
    // The English label is gone, which is the language proof without non ASCII.
    expect(text()).not.toContain('Upload Image(s)');
    expect(window.localStorage.getItem('pixelslicer_lang')).toBe('tr');
  });

  it('opens and closes the video uploader modal', () => {
    render(<App />);

    const videoButton = document.querySelector('.fa-video')?.closest('button');
    fireEvent.click(videoButton as HTMLButtonElement);
    expect(document.querySelector('.video-uploader')).toBeTruthy();

    fireEvent.click(document.querySelector('.modal__close')!);
    expect(document.querySelector('.video-uploader')).toBeNull();
  });
});

describe('App sidebar controls', () => {
  it('toggles the manual selection mode', () => {
    render(<App />);
    const toggle = buttonWith('Manual Add: OFF');
    expect(toggle.className).not.toContain('btn--active');

    fireEvent.click(toggle);
    expect(buttonWith('Manual Add: ON').className).toContain('btn--active');
  });

  it('bounds the grid number inputs', () => {
    const { container } = render(<App />);
    const numbers = Array.from(container.querySelectorAll('input[type="number"]')) as HTMLInputElement[];

    expect(numbers.length).toBeGreaterThanOrEqual(2);
    numbers.forEach(input => {
      expect(input.min).toBeTruthy();
      expect(Number.isFinite(Number(input.value))).toBe(true);
    });
  });

  it('keeps the atlas packer button disabled without an image', () => {
    render(<App />);
    expect((screen.getByTestId('atlas-open') as HTMLButtonElement).disabled).toBe(true);
  });

  it('toggles the pivot picking mode', () => {
    render(<App />);

    const pivotButton = buttonWith('Pick Pivot');
    expect(pivotButton.className).not.toContain('btn--active');

    fireEvent.click(pivotButton);
    expect(text()).toContain('Pick Pivot: ON');
  });

  it('offers the four pivot presets plus custom', () => {
    const { container } = render(<App />);
    const select = container.querySelector('select') as HTMLSelectElement;

    expect(Array.from(select.options).map(option => option.value)).toEqual([
      'topLeft',
      'topCenter',
      'center',
      'bottomCenter',
      'custom',
    ]);
  });

  it('switches the pivot preset', () => {
    const { container } = render(<App />);
    const select = container.querySelector('select') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'bottomCenter' } });

    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('bottomCenter');
  });

  it('toggles auto trim', () => {
    render(<App />);

    const label = screen.getByText('Trim Transparent Borders').closest('label');
    const trim = label?.querySelector('input') as HTMLInputElement;
    expect(trim.checked).toBe(true);

    fireEvent.click(trim);
    expect(trim.checked).toBe(false);
  });

});

describe('App landmarks', () => {
  it('labels the header, the sidebar, the gallery and the canvas', () => {
    const { container } = render(<App />);

    expect(within(container).getByRole('banner')).toBeTruthy();
    expect(container.querySelector('.sidebar')).toBeTruthy();
    expect(container.querySelector('#framesGallery')).toBeTruthy();
    expect(container.querySelector('#mainCanvas')).toBeTruthy();
  });
});
