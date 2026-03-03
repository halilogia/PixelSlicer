/**
 * VideoUploader Component
 * Main container for video upload functionality with processing settings
 */

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoUpload } from '@hooks/useVideoUpload';
import { useDragAndDrop } from '@hooks/useDragAndDrop';
import { useVideoConfigStorage } from '@hooks/useVideoConfigStorage';
import { DropZone } from './DropZone';
import { UploadProgress } from './UploadProgress';
import { VideoPreview } from './VideoPreview';
import { UploadErrorToast } from './UploadErrorToast';
import { VideoFile, VideoProcessingConfig, VIDEO_CONFIG_LIMITS } from '@domain/video/Video';

interface VideoUploaderProps {
  onUploadComplete?: (videos: VideoFile[], config: VideoProcessingConfig) => void;
  maxFiles?: number;
}

export function VideoUploader({ onUploadComplete, maxFiles = 10 }: VideoUploaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Use localStorage hook for persistent config
  const { config, saveConfig, resetConfig } = useVideoConfigStorage();
  const [localConfig, setLocalConfig] = useState<VideoProcessingConfig>(config);
  
  // Sync local config with stored config when component mounts
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);
  
  const {
    videos,
    progress,
    errors,
    isUploading,
    uploadVideo,
    removeVideo,
    cancelUpload,
    clearErrors,
    retryUpload,
  } = useVideoUpload();

  const { dragState, handlers, inputProps, openFileDialog } = useDragAndDrop(
    containerRef,
    {
      onDrop: handleFilesDrop,
      acceptedTypes: ['video/mp4', 'video/quicktime', '.mp4', '.mov'],
      multiple: true,
    }
  );

  async function handleFilesDrop(files: File[]) {
    if (videos.length + files.length > maxFiles) {
      // TODO: Show error about max files limit
      return;
    }

    // Upload each file - validation happens inside uploadVideo
    const uploadedVideos: VideoFile[] = [];
    for (const file of files) {
      try {
        const video = await uploadVideo(file);
        uploadedVideos.push(video);
      } catch {
        // Error handled by hook
      }
    }

    if (onUploadComplete && uploadedVideos.length > 0) {
      onUploadComplete(uploadedVideos, localConfig);
    }
  }

  const handleRemoveVideo = (videoId: string) => {
    removeVideo(videoId);
  };

  const handleRetry = async (file: File) => {
    await retryUpload(file);
  };

  const handleConfigChange = (key: keyof VideoProcessingConfig, value: number) => {
    const limits = VIDEO_CONFIG_LIMITS[key];
    const clampedValue = Math.max(limits.min, Math.min(limits.max, value));
    const newConfig = { ...localConfig, [key]: clampedValue };
    setLocalConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleResetConfig = () => {
    resetConfig();
    setLocalConfig(config);
  };

  return (
    <div
      ref={containerRef}
      className="video-uploader"
      data-dragging={dragState.isOver}
    >
      <input {...inputProps} />

      {/* Settings Panel */}
      <div className="video-settings-panel">
        <button
          className="btn-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v10m4.22-14.22l4.24 4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24" />
          </svg>
          İşlem Ayarları
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="video-settings-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* FPS Setting */}
              <div className="setting-row">
                <label className="setting-label">
                  <span>FPS (Kare Hızı)</span>
                  <span className="setting-value">{localConfig.fps}</span>
                </label>
                <input
                  type="range"
                  min={VIDEO_CONFIG_LIMITS.fps.min}
                  max={VIDEO_CONFIG_LIMITS.fps.max}
                  value={localConfig.fps}
                  onChange={(e) => handleConfigChange('fps', parseInt(e.target.value))}
                  className="setting-slider"
                />
                <div className="setting-hint">
                  {localConfig.fps} FPS × 6 saniye = {localConfig.fps * 6} kare
                </div>
              </div>

              {/* Max Frames Setting */}
              <div className="setting-row">
                <label className="setting-label">
                  <span>Maksimum Kare</span>
                  <span className="setting-value">{localConfig.maxFrames}</span>
                </label>
                <input
                  type="range"
                  min={VIDEO_CONFIG_LIMITS.maxFrames.min}
                  max={VIDEO_CONFIG_LIMITS.maxFrames.max}
                  value={localConfig.maxFrames}
                  onChange={(e) => handleConfigChange('maxFrames', parseInt(e.target.value))}
                  className="setting-slider"
                />
                <div className="setting-hint">
                  Daha fazla kare = Daha akıcı animasyon
                </div>
              </div>

              {/* Target Width Setting */}
              <div className="setting-row">
                <label className="setting-label">
                  <span>Kare Genişliği</span>
                  <span className="setting-value">{localConfig.targetWidth}px</span>
                </label>
                <input
                  type="range"
                  min={VIDEO_CONFIG_LIMITS.targetWidth.min}
                  max={VIDEO_CONFIG_LIMITS.targetWidth.max}
                  step={50}
                  value={localConfig.targetWidth}
                  onChange={(e) => handleConfigChange('targetWidth', parseInt(e.target.value))}
                  className="setting-slider"
                />
                <div className="setting-hint">
                  {Math.floor(4096 / localConfig.targetWidth)} sütun × {Math.ceil(localConfig.maxFrames / Math.floor(4096 / localConfig.targetWidth))} satır grid
                </div>
              </div>

              {/* Reset Button */}
              <button
                className="btn-reset-settings"
                onClick={handleResetConfig}
                type="button"
              >
                Varsayılana Sıfırla
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drop Zone */}
      {!isUploading && videos.length === 0 && (
        <DropZone
          isDragging={dragState.isOver}
          onClick={openFileDialog}
          handlers={handlers}
        />
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <UploadProgress
            progress={progress}
            onCancel={cancelUpload}
          />
        )}
      </AnimatePresence>

      {/* Video Previews */}
      <AnimatePresence mode="popLayout">
        {videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="video-list"
          >
            <div className="video-list-header">
              <h3>Yüklenen Videolar ({videos.length})</h3>
              <button
                className="btn-add-more"
                onClick={openFileDialog}
                disabled={videos.length >= maxFiles}
              >
                + Daha Fazla Ekle
              </button>
            </div>

            <div className="video-grid">
              {videos.map((video, index) => (
                <VideoPreview
                  key={video.id}
                  video={video}
                  index={index}
                  onRemove={handleRemoveVideo}
                />
              ))}
            </div>

            {videos.length >= maxFiles && (
              <p className="max-files-warning">
                Maksimum {maxFiles} dosya limitine ulaşıldı
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toasts */}
      <AnimatePresence>
        {errors.length > 0 && (
          <UploadErrorToast
            errors={errors}
            onClear={clearErrors}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      {/* Drag Overlay */}
      <AnimatePresence>
        {dragState.isDragging && !dragState.isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="drag-overlay"
          >
            <div className="drag-overlay-content">
              <div className="drag-icon">📁</div>
              <p>Videoları buraya bırakın</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
