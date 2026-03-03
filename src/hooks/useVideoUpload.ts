/**
 * useVideoUpload Hook
 * Manages video upload state and operations
 */

import { useState, useCallback, useRef } from 'react';
import {
  VideoFile,
  UploadProgress,
  UploadError,
} from '@domain/video/Video';
import { videoUploadService } from '@infrastructure/video/VideoUploadService';

interface UseVideoUploadReturn {
  // State
  videos: VideoFile[];
  currentUpload: VideoFile | null;
  progress: UploadProgress;
  errors: UploadError[];
  isUploading: boolean;
  
  // Actions
  addVideos: (files: File[]) => Promise<void>;
  uploadVideo: (file: File) => Promise<VideoFile>;
  uploadMultiple: (files: File[]) => Promise<VideoFile[]>;
  removeVideo: (videoId: string) => void;
  cancelUpload: () => void;
  clearErrors: () => void;
  retryUpload: (file: File) => Promise<VideoFile>;
}

const initialProgress: UploadProgress = {
  loaded: 0,
  total: 0,
  percentage: 0,
  status: 'idle',
};

export function useVideoUpload(): UseVideoUploadReturn {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentUpload, setCurrentUpload] = useState<VideoFile | null>(null);
  const [progress, setProgress] = useState<UploadProgress>(initialProgress);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Validate and add videos (without uploading)
   */
  const addVideos = useCallback(async (files: File[]) => {
    const newErrors: UploadError[] = [];
    const validVideos: VideoFile[] = [];

    for (const file of files) {
      const result = await videoUploadService.validateVideo(file);
      
      if (!result.valid && result.error) {
        newErrors.push(result.error);
      } else {
        // Create video object without uploading
        const video: VideoFile = {
          id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        };
        validVideos.push(video);
      }
    }

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }

    if (validVideos.length > 0) {
      setVideos(prev => [...prev, ...validVideos]);
    }
  }, []);

  /**
   * Upload a single video
   */
  const uploadVideo = useCallback(async (file: File) => {
    // Reset state
    setErrors([]);
    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    try {
      const video = await videoUploadService.uploadVideo(file, {
        onProgress: (prog) => {
          setProgress(prog);
        },
        onComplete: (completedVideo) => {
          setVideos(prev => [...prev, completedVideo]);
          setCurrentUpload(null);
        },
        onError: (error) => {
          setErrors(prev => [...prev, error]);
        },
      });

      return video;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(initialProgress);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Upload multiple videos sequentially
   */
  const uploadMultiple = useCallback(async (files: File[]) => {
    setErrors([]);
    setIsUploading(true);

    try {
      const uploadedVideos = await videoUploadService.uploadMultiple(files, {
        onProgress: (prog) => {
          setProgress(prog);
        },
        onComplete: (video) => {
          setVideos(prev => [...prev, video]);
        },
        onError: (error) => {
          setErrors(prev => [...prev, error]);
        },
      });

      return uploadedVideos;
    } finally {
      setIsUploading(false);
      setProgress(initialProgress);
    }
  }, []);

  /**
   * Remove a video from the list
   */
  const removeVideo = useCallback((videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
  }, []);

  /**
   * Cancel current upload
   */
  const cancelUpload = useCallback(() => {
    if (currentUpload) {
      videoUploadService.cancelUpload(currentUpload.id);
    }
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setProgress(initialProgress);
    setCurrentUpload(null);
  }, [currentUpload]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback(async (file: File): Promise<VideoFile> => {
    // Remove old errors for this file
    setErrors(prev => prev.filter(e => !e.message.includes(file.name)));
    return await uploadVideo(file);
  }, [uploadVideo]);

  return {
    videos,
    currentUpload,
    progress,
    errors,
    isUploading,
    addVideos,
    uploadVideo,
    uploadMultiple,
    removeVideo,
    cancelUpload,
    clearErrors,
    retryUpload,
  };
}
