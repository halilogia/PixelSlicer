/**
 * useVideoConfigStorage Hook
 * Manages video processing config in localStorage with type safety and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  VideoProcessingConfig,
  DEFAULT_VIDEO_CONFIG,
  VIDEO_CONFIG_LIMITS,
} from '@domain/video/Video';

const STORAGE_KEY = 'pixelslicer_video_config';

interface StorageError {
  type: 'storage_unavailable' | 'parse_error' | 'validation_error';
  message: string;
}

/**
 * Validate if a value is a valid VideoProcessingConfig
 */
function isValidConfig(value: unknown): value is VideoProcessingConfig {
  if (!value || typeof value !== 'object') return false;

  const config = value as Record<string, unknown>;

  // Check required keys exist
  const requiredKeys: (keyof VideoProcessingConfig)[] = ['fps', 'maxFrames', 'targetWidth'];
  for (const key of requiredKeys) {
    if (!(key in config)) return false;
    if (typeof config[key] !== 'number') return false;
  }

  // Validate fps
  const fps = config.fps as number;
  if (
    fps < VIDEO_CONFIG_LIMITS.fps.min ||
    fps > VIDEO_CONFIG_LIMITS.fps.max
  ) {
    return false;
  }

  // Validate maxFrames
  const maxFrames = config.maxFrames as number;
  if (
    maxFrames < VIDEO_CONFIG_LIMITS.maxFrames.min ||
    maxFrames > VIDEO_CONFIG_LIMITS.maxFrames.max
  ) {
    return false;
  }

  // Validate targetWidth
  const targetWidth = config.targetWidth as number;
  if (
    targetWidth < VIDEO_CONFIG_LIMITS.targetWidth.min ||
    targetWidth > VIDEO_CONFIG_LIMITS.targetWidth.max
  ) {
    return false;
  }

  return true;
}

/**
 * Safely parse JSON from localStorage
 */
function safeParseJSON(json: string): unknown | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

interface UseVideoConfigStorageReturn {
  config: VideoProcessingConfig;
  saveConfig: (config: VideoProcessingConfig) => void;
  resetConfig: () => void;
  error: StorageError | null;
}

export function useVideoConfigStorage(): UseVideoConfigStorageReturn {
  const [config, setConfig] = useState<VideoProcessingConfig>(DEFAULT_VIDEO_CONFIG);
  const [error, setError] = useState<StorageError | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    if (!isStorageAvailable()) {
      setError({
        type: 'storage_unavailable',
        message: 'LocalStorage is not available (private mode or storage disabled)',
      });
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed = safeParseJSON(stored);
        
        if (parsed === null) {
          setError({
            type: 'parse_error',
            message: 'Failed to parse stored config',
          });
          // Keep default config
          return;
        }

        if (isValidConfig(parsed)) {
          setConfig(parsed);
          setError(null);
        } else {
          setError({
            type: 'validation_error',
            message: 'Stored config failed validation, using defaults',
          });
          // Invalid config, remove it
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Silent fail - use defaults
      setError({
        type: 'storage_unavailable',
        message: 'Error accessing localStorage',
      });
    }
  }, []);

  /**
   * Save config to localStorage
   */
  const saveConfig = useCallback((newConfig: VideoProcessingConfig) => {
    if (!isStorageAvailable()) {
      // Silent fail - just update state
      setConfig(newConfig);
      return;
    }

    try {
      // Validate before saving
      if (!isValidConfig(newConfig)) {
        console.warn('Attempted to save invalid config');
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      setError(null);
    } catch {
      // Silent fail - just update state
      setConfig(newConfig);
    }
  }, []);

  /**
   * Reset config to defaults and clear localStorage
   */
  const resetConfig = useCallback(() => {
    if (isStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Silent fail
      }
    }
    
    setConfig(DEFAULT_VIDEO_CONFIG);
    setError(null);
  }, []);

  return {
    config,
    saveConfig,
    resetConfig,
    error,
  };
}
