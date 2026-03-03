/**
 * Video Frame Extractor Service
 * Extracts frames from video files for canvas rendering
 * Provides frame-by-frame playback like GIF animation
 */

import { VideoFile } from '@domain/video/Video';

export interface ExtractedFrame {
  id: number;
  imageData: ImageData;
  timestamp: number;
  canvas?: HTMLCanvasElement;
}

export interface FrameExtractionConfig {
  fps?: number;
  maxFrames?: number;
  quality?: number;
  targetWidth?: number;
  targetHeight?: number;
}

export interface FrameExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
}

type ProgressCallback = (progress: FrameExtractionProgress) => void;
type CompleteCallback = (frames: ExtractedFrame[]) => void;

export class VideoFrameExtractor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private abortController: AbortController | null = null;
  private extractedFrames: ExtractedFrame[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
  }

  /**
   * Extract frames from a video file
   */
  async extractFrames(
    videoFile: VideoFile,
    config: FrameExtractionConfig = {},
    onProgress?: ProgressCallback,
    onComplete?: CompleteCallback
  ): Promise<ExtractedFrame[]> {
    const {
      fps = 10,
      maxFrames = 100,
      targetWidth,
      targetHeight,
    } = config;

    this.abortController = new AbortController();
    this.extractedFrames = [];

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(videoFile.file);
      this.video = document.createElement('video');
      this.video.crossOrigin = 'anonymous';
      this.video.muted = true;
      this.video.preload = 'auto';

      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (this.video) {
          this.video.pause();
          this.video.src = '';
          this.video.load();
          this.video = null;
        }
      };

      // Handle abort
      this.abortController?.signal.addEventListener('abort', () => {
        cleanup();
        reject(new Error('Frame extraction cancelled'));
      });

      this.video.onloadedmetadata = async () => {
        if (!this.video) return;

        const duration = this.video.duration;
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;

        // Calculate target dimensions
        let canvasWidth = targetWidth || videoWidth;
        let canvasHeight = targetHeight || videoHeight;

        if (targetWidth && !targetHeight) {
          canvasHeight = (videoHeight / videoWidth) * targetWidth;
        } else if (targetHeight && !targetWidth) {
          canvasWidth = (videoWidth / videoHeight) * targetHeight;
        }

        // Set canvas size
        this.canvas.width = Math.floor(canvasWidth);
        this.canvas.height = Math.floor(canvasHeight);

        // Calculate frame intervals
        const totalFramesToExtract = Math.min(
          Math.floor(duration * fps),
          maxFrames
        );
        const frameInterval = duration / totalFramesToExtract;

        try {
          for (let i = 0; i < totalFramesToExtract; i++) {
            if (this.abortController?.signal.aborted) {
              throw new Error('Frame extraction cancelled');
            }

            const timestamp = i * frameInterval;
            await this.seekToTime(timestamp);
            
            const frame = await this.captureFrame(i, timestamp);
            this.extractedFrames.push(frame);

            onProgress?.({
              currentFrame: i + 1,
              totalFrames: totalFramesToExtract,
              percentage: Math.round(((i + 1) / totalFramesToExtract) * 100),
            });

            // Small delay to prevent UI blocking
            if (i % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }

          cleanup();
          onComplete?.(this.extractedFrames);
          resolve(this.extractedFrames);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      this.video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video'));
      };

      this.video.src = url;
      this.video.load();
    });
  }

  /**
   * Seek to specific time in video
   */
  private seekToTime(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.video) {
        reject(new Error('Video not initialized'));
        return;
      }

      const onSeeked = () => {
        this.video?.removeEventListener('seeked', onSeeked);
        this.video?.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        this.video?.removeEventListener('seeked', onSeeked);
        this.video?.removeEventListener('error', onError);
        reject(new Error('Seek failed'));
      };

      this.video.addEventListener('seeked', onSeeked);
      this.video.addEventListener('error', onError);
      this.video.currentTime = time;
    });
  }

  /**
   * Capture current frame from video
   */
  private captureFrame(id: number, timestamp: number): ExtractedFrame {
    if (!this.video || !this.ctx) {
      throw new Error('Video or context not initialized');
    }

    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Create a separate canvas for this frame (for easy rendering)
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = this.canvas.width;
    frameCanvas.height = this.canvas.height;
    const frameCtx = frameCanvas.getContext('2d');
    if (frameCtx) {
      frameCtx.putImageData(imageData, 0, 0);
    }

    return {
      id,
      imageData,
      timestamp,
      canvas: frameCanvas,
    };
  }

  /**
   * Cancel ongoing frame extraction
   */
  cancelExtraction(): void {
    this.abortController?.abort();
  }

  /**
   * Get total duration of video
   */
  static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get video duration'));
      };

      video.preload = 'metadata';
      video.src = url;
      video.load();
    });
  }

  /**
   * Calculate optimal FPS based on video duration and max frames
   */
  static calculateOptimalFPS(duration: number, maxFrames: number = 100): number {
    const fps = Math.floor(maxFrames / duration);
    return Math.min(Math.max(fps, 1), 30); // Clamp between 1-30 fps
  }
}

// Singleton instance
export const videoFrameExtractor = new VideoFrameExtractor();
