/**
 * VideoUploader Component
 * Main container for video upload functionality with processing settings
 */

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoUpload } from '@hooks/useVideoUpload';
import { useDragAndDrop } from '@hooks/useDragAndDrop';
import { useVideoConfigStorage } from '@hooks/useVideoConfigStorage';
import { useI18n } from '@/i18n/useI18n';
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
  const { t } = useI18n();
  
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

  const handleConfigChange = (key: keyof VideoProcessingConfig, value: number | boolean) => {
    let finalValue = value;
    if (typeof value === 'number' && key in VIDEO_CONFIG_LIMITS) {
      const limits = VIDEO_CONFIG_LIMITS[key as keyof typeof VIDEO_CONFIG_LIMITS];
      finalValue = Math.max(limits.min, Math.min(limits.max, value));
    }
    const newConfig = { ...localConfig, [key]: finalValue };
    setLocalConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleResetConfig = () => {
    resetConfig();
    setLocalConfig(config);
  };

  const applyPreset = (preset: Partial<VideoProcessingConfig>) => {
    const newConfig = { ...localConfig, ...preset };
    setLocalConfig(newConfig);
    saveConfig(newConfig);
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
          {t('processingSettings')}
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
              {/* Presets */}
              <div className="video-presets">
                <button 
                  className="btn-preset" 
                  onClick={() => applyPreset({ fps: 8, maxFrames: 40, useOriginalResolution: true })}
                  title={t('presetPixelArtDesc')}
                >
                  <i className="fa-solid fa-gamepad"></i> {t('presetPixelArt')}
                </button>
                <button 
                  className="btn-preset" 
                  onClick={() => applyPreset({ fps: 24, maxFrames: 120, targetWidth: 500, useOriginalResolution: false })}
                  title={t('presetSmoothDesc')}
                >
                  <i className="fa-solid fa-person-running"></i> {t('presetSmooth')}
                </button>
                <button 
                  className="btn-preset" 
                  onClick={() => applyPreset({ fps: 12, maxFrames: 150, targetWidth: 250, useOriginalResolution: false })}
                  title={t('presetLongEffectDesc')}
                >
                  <i className="fa-solid fa-burst"></i> {t('presetLongEffect')}
                </button>
                <button 
                  className="btn-preset" 
                  onClick={() => applyPreset({ fps: 10, maxFrames: 60, targetWidth: 800, useOriginalResolution: false })}
                  title={t('presetStandardDesc')}
                >
                  <i className="fa-solid fa-sliders"></i> {t('presetStandard')}
                </button>
              </div>

              {/* FPS Setting */}
              <div className="setting-row">
                <label className="setting-label">
                  <span>{t('fpsSetting')}</span>
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
                  {t('fpsHint').replace('{fps}', localConfig.fps.toString()).replace('{total}', (localConfig.fps * 6).toString())}
                </div>
              </div>

              {/* Max Frames Setting */}
              <div className="setting-row">
                <label className="setting-label">
                  <span>{t('maxFramesSetting')}</span>
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
                  {t('maxFramesHint')}
                </div>
              </div>

              {/* Target Width Setting */}
              <div className="setting-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="setting-label" style={{ marginBottom: 0 }}>
                    <span>{t('targetWidthSetting')}</span>
                    <span className="setting-value">
                      {localConfig.useOriginalResolution ? t('original') : `${localConfig.targetWidth}px`}
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <input 
                      type="checkbox" 
                      checked={localConfig.useOriginalResolution || false}
                      onChange={(e) => handleConfigChange('useOriginalResolution', e.target.checked)}
                      style={{ marginRight: '6px' }}
                    />
                    {t('keepOriginalRes')}
                  </label>
                </div>
                
                <input
                  type="range"
                  min={VIDEO_CONFIG_LIMITS.targetWidth.min}
                  max={VIDEO_CONFIG_LIMITS.targetWidth.max}
                  step={50}
                  value={localConfig.targetWidth}
                  onChange={(e) => handleConfigChange('targetWidth', parseInt(e.target.value))}
                  className="setting-slider"
                  disabled={localConfig.useOriginalResolution}
                  style={{ opacity: localConfig.useOriginalResolution ? 0.5 : 1 }}
                />
                <div className="setting-hint" style={{ marginTop: '6px', color: localConfig.useOriginalResolution ? '#ff9e64' : 'var(--text-muted)' }}>
                  {localConfig.useOriginalResolution 
                    ? t('resWarning') 
                    : t('gridHint').replace('{cols}', Math.floor(4096 / localConfig.targetWidth).toString()).replace('{rows}', Math.ceil(localConfig.maxFrames / Math.floor(4096 / localConfig.targetWidth)).toString())}
                </div>
              </div>

              {/* Reset Button */}
              <button
                className="btn-reset-settings"
                onClick={handleResetConfig}
                type="button"
              >
                {t('resetToDefault')}
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
              <h3>{t('uploadedVideos')} ({videos.length})</h3>
              <button
                className="btn-add-more"
                onClick={openFileDialog}
                disabled={videos.length >= maxFiles}
              >
                + {t('addMore')}
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
                {t('maxFilesReached')}
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
              <p>{t('dropVideosHere')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
