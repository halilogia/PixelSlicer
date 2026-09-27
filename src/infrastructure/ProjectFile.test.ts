import { describe, expect, it } from 'vitest';
import {
  parseProject,
  PROJECT_FORMAT,
  PROJECT_VERSION,
  serializeProject,
  summarizeProject,
} from './ProjectFile';
import type { EditorDocument } from '@presentation/EditorViewModel';

const document: EditorDocument = {
  gridConfig: { cols: 4, rows: 2, offsetX: 0, offsetY: 0, padding: 0 },
  frames: [
    { x: 0, y: 0, w: 32, h: 32, index: 0, isActive: true, pivot: { x: 0.5, y: 0.5 } },
    { x: 32, y: 0, w: 32, h: 32, index: 1, isActive: false },
  ],
  manualFrames: [{ x: 0, y: 32, w: 16, h: 16, index: 0, isActive: true }],
  isManualMode: false,
  selectedManualFrameIndex: -1,
  pivotMode: 'custom',
  sheetColumns: 8,
  removeBackground: false,
  removeBgColor: { r: 0, g: 0, b: 0, tolerance: 30 },
  atlasTrim: true,
  atlasAlphaThreshold: 0,
};

const image = 'data:image/png;base64,AAAA';

describe('serializeProject', () => {
  it('writes a versioned, self contained file', () => {
    const text = serializeProject(document, image, 128, 64, new Date('2026-01-01T00:00:00Z'));
    const parsed = JSON.parse(text);

    expect(parsed.format).toBe(PROJECT_FORMAT);
    expect(parsed.version).toBe(PROJECT_VERSION);
    expect(parsed.savedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(parsed.image).toBe(image);
    expect(parsed.document.frames[0].pivot).toEqual({ x: 0.5, y: 0.5 });
  });

  it('is pretty printed for a readable diff', () => {
    const text = serializeProject(document, image, 128, 64);

    expect(text).toContain('\n  "format"');
  });
});

describe('parseProject', () => {
  it('round trips a serialized project', () => {
    const text = serializeProject(document, image, 128, 64);
    const parsed = parseProject(text);

    expect(parsed.document.gridConfig.cols).toBe(4);
    expect(parsed.document.manualFrames).toHaveLength(1);
    expect(parsed.imageWidth).toBe(128);
  });

  it('rejects text that is not JSON', () => {
    expect(() => parseProject('nope')).toThrow(/not valid JSON/);
  });

  it('rejects JSON that is not a project', () => {
    expect(() => parseProject('{"format":"something-else"}')).toThrow(/not a PixelSlicer project/);
  });

  it('rejects a project without a document', () => {
    expect(() => parseProject(JSON.stringify({ format: PROJECT_FORMAT, version: 1, image }))).toThrow(
      /not a PixelSlicer project/
    );
  });

  it('refuses a file from a newer version', () => {
    const text = JSON.stringify({
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION + 1,
      document,
      image,
    });

    expect(() => parseProject(text)).toThrow(/newer version/);
  });
});

describe('summarizeProject', () => {
  it('counts the frames of both lists', () => {
    const summary = summarizeProject(parseProject(serializeProject(document, image, 128, 64)));

    expect(summary).toEqual({
      frameCount: 3,
      width: 128,
      height: 64,
      savedAt: expect.any(String),
      version: PROJECT_VERSION,
    });
  });
});
