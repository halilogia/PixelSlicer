// Optimized Frame Thumbnail Hook
// Caches thumbnails to prevent canvas recreation on every render

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Frame } from '../domain/FrameLogic';
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

export function useFrameThumbnails(
  image: HTMLImageElement | HTMLCanvasElement | null,
  frames: readonly Frame[],
  options: ThumbnailOptions = {}
): Map<number, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  
  // Refs for version tracking
  const frameVersionsRef = useRef<Map<number, number>>(new Map());
  const pendingUpdateRef = useRef<number | null>(null);
  const lastImageRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);

  // Generate thumbnail for single frame - creates fresh canvas to avoid resize issues
  const generateThumbnail = useCallback((
    frame: Frame
  ): string => {
    const scale = Math.min(
      opts.maxSize / frame.w,
      opts.maxSize / frame.h,
      1
    );
    
    const width = Math.max(1, Math.floor(frame.w * scale));
    const height = Math.max(1, Math.floor(frame.h * scale));
    
    // Create fresh canvas for each thumbnail to avoid resize clearing issues
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Draw image directly (no need to clear on fresh canvas)
    ctx.drawImage(
      image!,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, width, height
    );
    
    return canvas.toDataURL(opts.format, opts.quality);
  }, [image, opts.format, opts.quality, opts.maxSize]);

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
        setThumbnails(new Map());
        frameVersionsRef.current = new Map();
      }
      lastImageRef.current = image;
      // Don't return here, continue to schedule the new update in this same render
    }

    if (!image || frames.length === 0) {
      if (thumbnailsRef.current.size > 0) {
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
      pendingUpdateRef.current = scheduleTask((deadline) => {
        let currentIndex = startIndex;
        const batchThumbnails = new Map<number, string>();
        const batchVersions = new Map<number, number>();
        let processedInThisBatch = 0;

        // Inner loop to process as many frames as possible in this idle period
        while (currentIndex < frames.length && (deadline.timeRemaining() > 0 || processedInThisBatch === 0)) {
          const frame = frames[currentIndex];
          
          // Basic validation to avoid DOM errors
          if (frame.w > 0 && frame.h > 0) {
            const currentVersion = frame.x + frame.y + frame.w + frame.h + (frame.isActive ? 1 : 0);
            const cachedVersion = frameVersionsRef.current.get(currentIndex);
            
            // Generate if changed or missing
            if (cachedVersion !== currentVersion || !thumbnailsRef.current.has(currentIndex)) {
              try {
                const thumbnailUrl = generateThumbnail(frame);
                batchThumbnails.set(currentIndex, thumbnailUrl);
                batchVersions.set(currentIndex, currentVersion);
                processedInThisBatch++;
              } catch (err) {
                console.error('Failed to generate thumbnail for frame', currentIndex, err);
              }
            }
          }
          
          currentIndex++;
        }

        // UPDATE STATE ONCE PER IDLE PERIOD
        if (processedInThisBatch > 0) {
          setThumbnails(prev => {
            const next = new Map(prev);
            batchThumbnails.forEach((url, idx) => next.set(idx, url));
            return next;
          });
          
          // Update versions ref alongside state
          batchVersions.forEach((ver, idx) => frameVersionsRef.current.set(idx, ver));
        }

        if (currentIndex < frames.length) {
          // More frames to process, schedule NEXT idle period
          processBatch(currentIndex);
        } else {
          // All done, clean up removed frames if necessary
          setThumbnails(prev => {
            let hasRemoved = false;
            const next = new Map(prev);
            for (const key of next.keys()) {
              if (key >= frames.length) {
                next.delete(key);
                frameVersionsRef.current.delete(key);
                hasRemoved = true;
              }
            }
            return hasRemoved ? next : prev;
          });
          pendingUpdateRef.current = null;
        }
      }, { timeout: 100 });
    };

    processBatch(0);

    return () => {
      if (pendingUpdateRef.current !== null) {
        cancelScheduledTask(pendingUpdateRef.current);
      }
    };
  }, [image, frames, generateThumbnail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Revoke object URLs to prevent memory leaks
      thumbnails.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return thumbnails;
}

// Hook for single thumbnail (simpler version for specific use cases)
export function useSingleThumbnail(
  image: HTMLImageElement | null,
  frame: Frame | null,
  options: ThumbnailOptions = {}
): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameRef = useRef<Frame | null>(null);

  useEffect(() => {
    if (!image || !frame) {
      setThumbnail(null);
      return;
    }

    // Check if frame actually changed
    if (lastFrameRef.current &&
        lastFrameRef.current.x === frame.x &&
        lastFrameRef.current.y === frame.y &&
        lastFrameRef.current.w === frame.w &&
        lastFrameRef.current.h === frame.h &&
        thumbnail) {
      return;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const scale = Math.min(
      opts.maxSize / frame.w,
      opts.maxSize / frame.h,
      1
    );
    
    canvas.width = Math.max(1, Math.floor(frame.w * scale));
    canvas.height = Math.max(1, Math.floor(frame.h * scale));

    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, canvas.width, canvas.height
    );

    const newThumbnail = canvas.toDataURL(opts.format, opts.quality);
    setThumbnail(newThumbnail);
    lastFrameRef.current = frame;

    return () => {
      if (newThumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(newThumbnail);
      }
    };
  }, [image, frame, options, thumbnail]);

  return thumbnail;
}
