import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadImageFromFile, loadImagesFromFiles, loadImageFromUrl } from './ImageLoader';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private source = '';

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    // The browser fires the event asynchronously.
    queueMicrotask(() => {
      if (value.includes('broken')) this.onerror?.();
      else this.onload?.();
    });
  }
}

const created: string[] = [];
const revoked: string[] = [];

/** A blob whose content shows up in the fake object URL. */
function fakeBlob(content: string): Blob {
  const value = new Blob([content]);
  Object.assign(value, { marker: content });
  return value;
}

beforeEach(() => {
  created.length = 0;
  revoked.length = 0;
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      const marker = (blob as Blob & { marker?: string }).marker ?? '';
      const url = `blob:${created.length + 1}:${marker}`;
      created.push(url);
      return url;
    },
    revokeObjectURL: (url: string) => {
      revoked.push(url);
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadImageFromFile', () => {
  it('revokes the object URL after the image is decoded', async () => {
    const image = await loadImageFromFile(fakeBlob('pixels'));

    expect(created).toHaveLength(1);
    expect(revoked).toEqual(created);
    expect(image).toBeInstanceOf(FakeImage);
  });

  it('revokes the object URL even when decoding fails', async () => {
    await expect(loadImageFromFile(fakeBlob('broken'))).rejects.toThrow(/decode/i);
    expect(revoked).toEqual(created);
  });

  it('revokes every URL when loading a batch', async () => {
    const images = await loadImagesFromFiles([fakeBlob('a'), fakeBlob('b')]);

    expect(images).toHaveLength(2);
    expect(created).toHaveLength(2);
    expect(revoked).toHaveLength(2);
  });

  it('keeps the readable images and still revokes the broken ones', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const images = await loadImagesFromFiles([fakeBlob('a'), fakeBlob('broken')]);

    expect(images).toHaveLength(1);
    expect(created).toHaveLength(2);
    expect(revoked).toHaveLength(2);
    quiet.mockRestore();
  });

  it('returns an empty list for an empty input', async () => {
    await expect(loadImagesFromFiles([])).resolves.toEqual([]);
    expect(created).toHaveLength(0);
  });
});

describe('loadImageFromUrl', () => {
  it('does not touch the object URL registry', async () => {
    const image = await loadImageFromUrl('https://example.test/sheet.png');

    expect(image).toBeInstanceOf(FakeImage);
    expect(created).toHaveLength(0);
    expect(revoked).toHaveLength(0);
  });
});
