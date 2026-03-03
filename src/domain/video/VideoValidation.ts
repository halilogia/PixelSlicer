/**
 * Video validation logic - Pure domain logic, framework independent
 */

import {
  MAX_FILE_SIZE,
  ALLOWED_FORMATS,
  ALLOWED_EXTENSIONS,
  ValidationResult,
  VideoMetadata,
} from './Video';

export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size (${formatSize(file.size)}) exceeds maximum limit of 500MB`,
      },
    };
  }
  return { valid: true };
}

export function validateFileFormat(file: File): ValidationResult {
  // Check MIME type
  if (!ALLOWED_FORMATS.includes(file.type)) {
    // Fallback to extension check
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: {
          code: 'INVALID_FORMAT',
          message: `Invalid format. Allowed: MP4, MOV`,
        },
      };
    }
  }
  return { valid: true };
}

export async function validateVideoCodec(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      cleanup();
      
      // Check if browser can decode this video (H.264 support)
      const canPlay = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
      if (canPlay === '') {
        resolve({
          valid: false,
          error: {
            code: 'INVALID_CODEC',
            message: 'Video codec not supported. Please use H.264 encoded MP4.',
          },
        });
      } else {
        resolve({ valid: true });
      }
    };

    video.onerror = () => {
      cleanup();
      resolve({
        valid: false,
        error: {
          code: 'INVALID_CODEC',
          message: 'Could not read video metadata. File may be corrupted.',
        },
      });
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      resolve({
        valid: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Video validation timed out. Please try again.',
        },
      });
    }, 10000);

    video.src = url;
    video.load();
  });
}

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30, // Default, would need more complex analysis for actual FPS
        codec: 'H.264', // Assumed based on validation
        bitrate: Math.round((file.size * 8) / video.duration), // Approximate
      };
      cleanup();
      resolve(metadata);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video metadata'));
    };

    video.src = url;
    video.load();
  });
}

export async function generateThumbnail(file: File, time: number = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    
    if (!ctx) {
      URL.revokeObjectURL(url);
      reject(new Error('Could not get canvas context'));
      return;
    }

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
      canvas.remove();
    };

    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      // Seek to specified time or middle of video
      video.currentTime = time > 0 ? time : video.duration / 2;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(thumbnailUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to generate thumbnail'));
    };

    video.src = url;
    video.load();
  });
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
