// Optimized Frame Thumbnail Hook
// Caches thumbnails to prevent canvas recreation on every render

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Frame } from '../domain/FrameLogic';
import type { AtlasSourceImage } from '../infrastructure/atlas/AtlasRenderer';
import { scheduleTask, cancelScheduledTask } from '../utils/scheduler';

export interface ThumbnailOptions {
  maxSize?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  maxSize: 128,
  quality: 0.85,
  format: 'image/jpeg',
};

type ThumbnailResult = [index: number, url: string] | null;

function revoke(url: string | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function useFrameThumbnails(
  image: AtlasSourceImage | null,
  frames: readonly Frame[],
  options: ThumbnailOptions = {}
): Map<number, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());

  // Refs for version tracking
  const frameVersionsRef = useRef<Map<number, number>>(new Map());
  const pendingUpdateRef = useRef<number | null>(null);
  const lastImageRef = useRef<AtlasSourceImage | null>(null);

  /**
   * Draw one frame and hand back an object URL.
   *
   * `toBlob()` is asynchronous, so the encoding never blocks the main thread,
   * and the result is a binary blob instead of a base64 data URL: ~33% less
   * memory and no giant string to keep alive in React state.
   */
  const generateThumbnail = useCallback(
    (frame: Frame): Promise<string> => {
      const scale = Math.min(opts.maxSize / frame.w, opts.maxSize / frame.h, 1);
      const width = Math.max(1, Math.floor(frame.w * scale));
      const height = Math.max(1, Math.floor(frame.h * scale));

      // A fresh canvas per frame: the bitmap is captured asynchronously by
      // toBlob(), so a shared canvas could be resized before the read happens.
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return Promise.reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(
        image!,
        frame.x, frame.y, frame.w, frame.h,
        0, 0, width, height
      );

      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Could not encode the thumbnail'));
              return;
            }
            resolve(URL.createObjectURL(blob));
          },
          opts.format,
          opts.quality
        );
      });
    },
    [image, opts.format, opts.quality, opts.maxSize]
  );

  // Batch thumbnail generation using scheduleTask (requestIdleCallback with Safari fallback)
  // Using ref for thumbnails to avoid circular dependency
  const thumbnailsRef = useRef(thumbnails);
  thumbnailsRef.current = thumbnails;

  useEffect(() => {
    // RESET CACHE ON IMAGE CHANGE
    // If the image reference changes, we must invalidate all thumbnails
    // because frame dimensions might be identical but the content is different
    if (lastImageRef.current !== image) {
      if (thumbnailsRef.current.size > 0) {
        thumbnailsRef.current.forEach(revoke);
        setThumbnails(new Map());
        frameVersionsRef.current = new Map();
      }
      lastImageRef.current = image;
      // Don't return here, continue to schedule the new update in this same render
    }

    if (!image || frames.length === 0) {
      if (thumbnailsRef.current.size > 0) {
        thumbnailsRef.current.forEach(revoke);
        setThumbnails(new Map());
        frameVersionsRef.current = new Map();
      }
      return;
    }

    // Cancel pending update
    if (pendingUpdateRef.current !== null) {
      cancelScheduledTask(pendingUpdateRef.current);
    }

    // Check if we need to update any thumbnails
    let needsUpdate = false;
    const currentVersions = frameVersionsRef.current;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const currentVersion = frame.x + frame.y + frame.w + frame.h + (frame.isActive ? 1 : 0);
      const cachedVersion = currentVersions.get(i);

      if (cachedVersion !== currentVersion || !thumbnailsRef.current.has(i)) {
        needsUpdate = true;
        break;
      }
    }

    // Check for removed frames
    if (!needsUpdate) {
      for (const key of thumbnailsRef.current.keys()) {
        if (key >= frames.length) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (!needsUpdate) return;

    // Batch thumbnail generation using scheduleTask (requestIdleCallback with Safari fallback)
    const processBatch = (startIndex: number) => {
      pendingUpdateRef.current = scheduleTask(deadline => {
        let currentIndex = startIndex;
        const batchVersions = new Map<number, number>();
        const encoding: Array<Promise<ThumbnailResult>> = [];
        let processedInThisBatch = 0;

        // The draw call is the synchronous part and respects the idle budget;
        // the encoding runs in parallel behind it.
        while (currentIndex < frames.length && (deadline.timeRemaining() > 0 || processedInThisBatch === 0)) {
          const frame = frames[currentIndex];

          // Basic validation to avoid DOM errors
          if (frame.w > 0 && frame.h > 0) {
            const currentVersion = frame.x + frame.y + frame.w + frame.h + (frame.isActive ? 1 : 0);
            const cachedVersion = frameVersionsRef.current.get(currentIndex);

            // Generate if changed or missing
            if (cachedVersion !== currentVersion || !thumbnailsRef.current.has(currentIndex)) {
              const index = currentIndex;
              batchVersions.set(index, currentVersion);
              encoding.push(
                generateThumbnail(frame)
                  .then(url => [index, url] as [number, string])
                  .catch(err => {
                    console.error('Failed to generate thumbnail for frame', index, err);
                    return null;
                  })
              );
              processedInThisBatch++;
            }
          }

          currentIndex++;
        }

        void Promise.all(encoding).then(settled => {
          // The sheet changed while we were encoding: those blobs are useless.
          if (lastImageRef.current !== image) {
            settled.forEach(result => result && revoke(result[1]));
            return;
          }

          const ready = settled.filter((result): result is [number, string] => result !== null);

          if (ready.length > 0) {
            // UPDATE STATE ONCE PER IDLE PERIOD
            setThumbnails(prev => {
              const next = new Map(prev);
              ready.forEach(([index, url]) => {
                revoke(next.get(index));
                next.set(index, url);
              });
              return next;
            });

            ready.forEach(([index]) => frameVersionsRef.current.set(index, batchVersions.get(index)!));
          }

          if (currentIndex < frames.length) {
            // More frames to process, schedule NEXT idle period
            processBatch(currentIndex);
            return;
          }

          // All done, clean up removed frames
          setThumbnails(prev => {
            let hasRemoved = false;
            const next = new Map(prev);
            for (const key of next.keys()) {
              if (key >= frames.length) {
                revoke(next.get(key));
                next.delete(key);
                frameVersionsRef.current.delete(key);
                hasRemoved = true;
              }
            }
            return hasRemoved ? next : prev;
          });
          pendingUpdateRef.current = null;
        });
      }, { timeout: 100 });
    };

    processBatch(0);

    return () => {
      if (pendingUpdateRef.current !== null) {
        cancelScheduledTask(pendingUpdateRef.current);
      }
    };
  }, [image, frames, generateThumbnail]);

  // Cleanup on unmount. The ref is used on purpose: the state value captured
  // by this effect is the empty map from the first render, so reading it here
  // would leak every URL generated later.
  useEffect(() => {
    return () => {
      thumbnailsRef.current.forEach(revoke);
    };
  }, []);

  return thumbnails;
}
