/**
 * Video domain entity - Represents a video file with upload metadata
 */

export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  metadata?: VideoMetadata;
  thumbnailUrl?: string;
}

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: UploadStatus;
  speed?: number; // bytes per second
  estimatedTime?: number; // seconds
}

export interface VideoUploadState {
  videos: VideoFile[];
  currentUpload: VideoFile | null;
  progress: UploadProgress;
  errors: UploadError[];
}

export interface UploadError {
  videoId: string;
  code: ErrorCode;
  message: string;
}

export type ErrorCode = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FORMAT'
  | 'INVALID_CODEC'
  | 'NETWORK_ERROR'
  | 'UPLOAD_FAILED'
  | 'VALIDATION_FAILED';

export interface ValidationResult {
  valid: boolean;
  error?: {
    code: ErrorCode;
    message: string;
  };
}

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime'];
export const ALLOWED_EXTENSIONS = ['.mp4', '.mov'];

export function generateVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Video Processing Configuration
export interface VideoProcessingConfig {
  fps: number;
  maxFrames: number;
  targetWidth: number;
}

export const DEFAULT_VIDEO_CONFIG: VideoProcessingConfig = {
  fps: 10,
  maxFrames: 60,
  targetWidth: 800,
};

export const VIDEO_CONFIG_LIMITS = {
  fps: { min: 1, max: 30 },
  maxFrames: { min: 10, max: 200 },
  targetWidth: { min: 200, max: 1200 },
};
