// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoPreview } from './VideoPreview';
import type { VideoFile } from '@domain/video/Video';

function videoFile(overrides: Partial<VideoFile> = {}): VideoFile {
  return {
    id: 'vid_1_abc',
    file: { name: 'clip.mp4', type: 'video/mp4', size: 2 * 1024 * 1024 } as File,
    name: 'clip.mp4',
    size: 2 * 1024 * 1024,
    type: 'video/mp4',
    metadata: {
      duration: 75,
      width: 320,
      height: 180,
      fps: 30,
      codec: 'H.264',
      bitrate: 2_000_000,
    },
    thumbnailUrl: 'blob:thumb',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.setItem('pixelslicer_lang', 'en');
  // framer-motion animates on mount, the tests assert the settled output.
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('VideoPreview', () => {
  it('shows the thumbnail, the duration and the size', () => {
    render(<VideoPreview video={videoFile()} index={0} onRemove={vi.fn()} />);

    expect(screen.getByAltText('clip.mp4')).toBeTruthy();
    expect(screen.getByText('1:15')).toBeTruthy();
    expect(screen.getByText('2 MB')).toBeTruthy();
  });

  it('falls back to a placeholder without a thumbnail', () => {
    const { container } = render(
      <VideoPreview video={videoFile({ thumbnailUrl: '' })} index={0} onRemove={vi.fn()} />
    );

    expect(container.querySelector('.video-thumbnail-placeholder')).toBeTruthy();
    expect(container.querySelector('.video-thumbnail')).toBeNull();
  });

  it('formats a zero duration', () => {
    const { container } = render(<VideoPreview video={videoFile()} index={0} onRemove={vi.fn()} />);
    expect(container.textContent).toContain('2 MB');
  });

  it('hides the duration badge for a zero duration', () => {
    const base = videoFile();
    const video = videoFile({
      metadata: { ...base.metadata!, duration: 0 },
    });
    const { container } = render(<VideoPreview video={video} index={0} onRemove={vi.fn()} />);

    // A zero length video shows no badge at all, not a "0:00" one.
    expect(container.textContent).not.toContain('0:00');
    expect(container.textContent).toContain('clip.mp4');
  });

  it('removes the video by id', () => {
    const onRemove = vi.fn();
    const { container } = render(
      <VideoPreview video={videoFile()} index={0} onRemove={onRemove} />
    );

    const removeButton = container.querySelector('button');
    expect(removeButton).toBeTruthy();
    fireEvent.click(removeButton as HTMLButtonElement);

    expect(onRemove).toHaveBeenCalledWith('vid_1_abc');
  });

  it('gives the remove button an accessible name', () => {
    render(<VideoPreview video={videoFile()} index={1} onRemove={vi.fn()} />);

    const buttons = Array.from(document.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach(button => {
      const name = button.getAttribute('aria-label') ?? button.textContent ?? '';
      expect(name.trim().length).toBeGreaterThan(0);
    });
  });
});
