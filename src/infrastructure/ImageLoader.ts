// Infrastructure Layer - Image loading helpers
// Object URLs are released as soon as the browser finished decoding them.

/** Decode a URL into an `HTMLImageElement`. */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode the image.'));
    image.src = url;
  });
}

/**
 * Decode a blob/file into an `HTMLImageElement` and revoke the object URL.
 * Revoking after `load` is safe because the pixels are already decoded, and
 * revoking on failure is what keeps a broken upload from leaking.
 */
export function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return loadImageFromUrl(url).then(
    image => {
      URL.revokeObjectURL(url);
      return image;
    },
    error => {
      URL.revokeObjectURL(url);
      throw error;
    }
  );
}

/** Load many images, silently skipping the ones that cannot be decoded. */
export async function loadImagesFromFiles(files: readonly Blob[]): Promise<HTMLImageElement[]> {
  const results = await Promise.allSettled(files.map(file => loadImageFromFile(file)));
  const images: HTMLImageElement[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      images.push(result.value);
    } else {
      console.error('Skipped an unreadable image:', result.reason);
    }
  }

  return images;
}
