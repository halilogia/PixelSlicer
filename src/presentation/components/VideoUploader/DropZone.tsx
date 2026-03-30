/**
 * DropZone Component
 * Drag and drop area for video upload
 */

import { motion } from 'framer-motion';
import { formatFileSize, MAX_FILE_SIZE } from '@domain/video/Video';
import { useI18n } from '@/i18n/useI18n';

interface DropZoneProps {
  isDragging: boolean;
  onClick: () => void;
  handlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export function DropZone({ isDragging, onClick, handlers }: DropZoneProps) {
  const { t } = useI18n();

  return (
    <motion.div
      className="drop-zone"
      data-dragging={isDragging}
      onClick={onClick}
      {...handlers}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="drop-zone-content">
        <motion.div
          className="drop-zone-icon"
          animate={{
            y: isDragging ? -10 : 0,
            scale: isDragging ? 1.1 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isDragging ? (
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          ) : (
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
          )}
        </motion.div>

        <h3 className="drop-zone-title">
          {isDragging ? t('dropVideosHere') : t('uploadVideos')}
        </h3>

        <p className="drop-zone-subtitle">
          {t('dragDropVideos')}
        </p>

        <div className="drop-zone-requirements">
          <span className="requirement-badge">MP4 / MOV</span>
          <span className="requirement-badge">H.264</span>
          <span className="requirement-badge">Max {formatFileSize(MAX_FILE_SIZE)}</span>
        </div>
      </div>

      {/* Drag active indicator */}
      {isDragging && (
        <motion.div
          className="drop-zone-active-indicator"
          layoutId="drop-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}
