/**
 * Video Upload Service - Infrastructure layer
 * Mock implementation for frontend development
 */

import {
  VideoFile,
  UploadProgress,
  UploadError,
  generateVideoId,
  formatFileSize,
} from '@domain/video/Video';
import {
  validateFileSize,
  validateFileFormat,
  validateVideoCodec,
  extractVideoMetadata,
  generateThumbnail,
} from '@domain/video/VideoValidation';

type ProgressCallback = (progress: UploadProgress) => void;
type CompleteCallback = (video: VideoFile) => void;
type ErrorCallback = (error: UploadError) => void;

export interface UploadOptions {
  onProgress?: ProgressCallback;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}

export class VideoUploadService {
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Validate video file before upload
   */
  async validateVideo(file: File): Promise<{ valid: boolean; error?: UploadError }> {
    const videoId = generateVideoId();

    // Size validation
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      return {
        valid: false,
        error: {
          videoId,
          code: sizeValidation.error!.code,
          message: sizeValidation.error!.message,
        },
      };
    }

    // Format validation
    const formatValidation = validateFileFormat(file);
    if (!formatValidation.valid) {
      return {
        valid: false,
        error: {
          videoId,
          code: formatValidation.error!.code,
          message: formatValidation.error!.message,
        },
      };
    }

    // Codec validation (async)
    const codecValidation = await validateVideoCodec(file);
    if (!codecValidation.valid) {
      return {
        valid: false,
        error: {
          videoId,
          code: codecValidation.error!.code,
          message: codecValidation.error!.message,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Upload video file with progress tracking
   */
  async uploadVideo(
    file: File,
    options: UploadOptions = {}
  ): Promise<VideoFile> {
    const { onProgress, onComplete, onError } = options;
    const videoId = generateVideoId();
    const abortController = new AbortController();
    this.abortControllers.set(videoId, abortController);

    try {
      // Initial progress
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'validating',
      });

      // Extract metadata
      const metadata = await extractVideoMetadata(file);
      
      // Generate thumbnail
      onProgress?.({
        loaded: 0,
        total: file.size,
        percentage: 5,
        status: 'processing',
      });

      const thumbnailUrl = await generateThumbnail(file, metadata.duration / 2);

      // Create video object
      const video: VideoFile = {
        id: videoId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        metadata,
        thumbnailUrl,
      };

      // Simulate upload progress
      await this.simulateUpload(file.size, videoId, (progress) => {
        onProgress?.({
          ...progress,
          status: 'uploading',
        });
      });

      // Upload to mock backend
      await this.mockBackendUpload(video, abortController.signal);

      // Complete
      const finalProgress: UploadProgress = {
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'completed',
      };
      onProgress?.(finalProgress);
      onComplete?.(video);

      this.abortControllers.delete(videoId);
      return video;
    } catch (error) {
      this.abortControllers.delete(videoId);
      
      const uploadError: UploadError = {
        videoId,
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Upload failed',
      };
      
      onError?.(uploadError);
      throw uploadError;
    }
  }

  /**
   * Upload multiple videos
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<VideoFile[]> {
    const uploadedVideos: VideoFile[] = [];

    for (const file of files) {
      try {
        const video = await this.uploadVideo(file, options);
        uploadedVideos.push(video);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    return uploadedVideos;
  }

  /**
   * Cancel ongoing upload
   */
  cancelUpload(videoId: string): void {
    const controller = this.abortControllers.get(videoId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(videoId);
    }
  }

  /**
   * Cancel all uploads
   */
  cancelAllUploads(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Simulate upload progress for demo
   */
  private simulateUpload(
    totalSize: number,
    videoId: string,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const duration = 3000; // 3 seconds for demo
      const updateInterval = 100; // Update every 100ms

      const intervalId = setInterval(() => {
        const controller = this.abortControllers.get(videoId);
        if (!controller || controller.signal.aborted) {
          clearInterval(intervalId);
          reject(new Error('Upload cancelled'));
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const loaded = Math.floor(totalSize * progress);
        const speed = loaded / (elapsed / 1000); // bytes per second
        const remaining = totalSize - loaded;
        const estimatedTime = remaining / speed;

        onProgress({
          loaded,
          total: totalSize,
          percentage: Math.floor(progress * 95), // Max 95% until backend confirms
          speed,
          estimatedTime: Math.floor(estimatedTime),
          status: 'uploading',
        });

        if (progress >= 1) {
          clearInterval(intervalId);
          resolve();
        }
      }, updateInterval);
    });
  }

  /**
   * Mock backend upload call
   */
  private async mockBackendUpload(
    video: VideoFile,
    signal: AbortSignal
  ): Promise<void> {
    // Simulate API call delay
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, 500);
      
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Upload aborted'));
      });
    });

    // Mock response - in real implementation, this would be an actual API call
    console.log('[Mock Upload] Video uploaded:', {
      id: video.id,
      name: video.name,
      size: formatFileSize(video.size),
      metadata: video.metadata,
    });
  }
}

// Singleton instance
export const videoUploadService = new VideoUploadService();
