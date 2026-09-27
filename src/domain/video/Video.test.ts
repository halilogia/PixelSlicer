import { describe, expect, it } from 'vitest';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_FORMATS,
  DEFAULT_VIDEO_CONFIG,
  formatDuration,
  formatFileSize,
  generateVideoId,
  MAX_FILE_SIZE,
  VIDEO_CONFIG_LIMITS,
} from './Video';

describe('generateVideoId', () => {
  it('is unique per call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateVideoId()));
    expect(ids.size).toBe(50);
  });

  it('is prefixed and does not contain path separators', () => {
    expect(generateVideoId()).toMatch(/^vid_\d+_[a-z0-9]+$/);
  });
});

describe('formatFileSize', () => {
  it('formats every unit', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe('3 GB');
  });
});

describe('formatDuration', () => {
  it('pads the seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(599)).toBe('9:59');
  });

  it('truncates fractional seconds', () => {
    expect(formatDuration(65.9)).toBe('1:05');
  });
});

describe('domain constants', () => {
  it('keeps a 500MB limit and the two allowed containers', () => {
    expect(MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
    expect(ALLOWED_FORMATS).toEqual(['video/mp4', 'video/quicktime']);
    expect(ALLOWED_EXTENSIONS).toEqual(['.mp4', '.mov']);
  });

  it('ships a default processing config inside the limits', () => {
    expect(DEFAULT_VIDEO_CONFIG).toEqual({
      fps: 10,
      maxFrames: 60,
      targetWidth: 800,
      useOriginalResolution: false,
    });

    const { fps, maxFrames, targetWidth } = VIDEO_CONFIG_LIMITS;
    expect(DEFAULT_VIDEO_CONFIG.fps).toBeGreaterThanOrEqual(fps.min);
    expect(DEFAULT_VIDEO_CONFIG.fps).toBeLessThanOrEqual(fps.max);
    expect(DEFAULT_VIDEO_CONFIG.maxFrames).toBeGreaterThanOrEqual(maxFrames.min);
    expect(DEFAULT_VIDEO_CONFIG.maxFrames).toBeLessThanOrEqual(maxFrames.max);
    expect(DEFAULT_VIDEO_CONFIG.targetWidth).toBeGreaterThanOrEqual(targetWidth.min);
    expect(DEFAULT_VIDEO_CONFIG.targetWidth).toBeLessThanOrEqual(targetWidth.max);
  });
});
