/**
 * VideoPreview Component
 * Shows uploaded video thumbnail (static preview only)
 * Video playback happens on main canvas via VideoFrameExtractor
 */

import { motion } from 'framer-motion';
import { VideoFile, formatDuration, formatFileSize } from '@domain/video/Video';

interface VideoPreviewProps {
  video: VideoFile;
  index: number;
  onRemove: (videoId: string) => void;
}

export function VideoPreview({ video, index, onRemove }: VideoPreviewProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(video.id);
  };

  return (
    <motion.div
      className="video-preview"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Thumbnail Container - Static image only, no video player */}
      <div className="video-preview-media">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.name}
            className="video-thumbnail"
          />
        ) : (
          <div className="video-thumbnail-placeholder">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
        )}

        {/* Duration Badge */}
        {video.metadata?.duration && (
          <span className="video-duration">
            {formatDuration(video.metadata.duration)}
          </span>
        )}

        {/* Remove Button */}
        <button
          className="btn-remove-video"
          onClick={handleRemove}
          type="button"
          aria-label="Remove video"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Video Info */}
      <div className="video-preview-info">
        <p className="video-name" title={video.name}>
          {video.name}
        </p>
        <div className="video-meta">
          <span>{formatFileSize(video.size)}</span>
          {video.metadata && (
            <span>
              {video.metadata.width}x{video.metadata.height}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
