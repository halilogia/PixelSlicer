/**
 * UploadProgress Component
 * Shows real-time upload progress with speed and ETA
 */

import { motion } from 'framer-motion';
import { UploadProgress as UploadProgressType, formatFileSize } from '@domain/video/Video';
import { useI18n } from '@/i18n/useI18n';

interface UploadProgressProps {
  progress: UploadProgressType;
  onCancel: () => void;
}

export function UploadProgress({ progress, onCancel }: UploadProgressProps) {
  const { t } = useI18n();
  const { percentage, loaded, total, speed, estimatedTime, status } = progress;

  const getStatusText = () => {
    switch (status) {
      case 'validating':
        return t('validatingVideo');
      case 'processing':
        return t('processingVideo');
      case 'uploading':
        return t('uploading');
      case 'completed':
        return t('uploadComplete');
      case 'error':
        return t('uploadFailed');
      default:
        return t('uploading'); // or another fallback
    }
  };

  const formatSpeed = (bytesPerSecond: number | undefined): string => {
    if (!bytesPerSecond) return '';
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number | undefined): string => {
    if (!seconds || seconds < 0) return '';
    if (seconds < 60) return `${Math.ceil(seconds)}s ${t('remaining')}`;
    const mins = Math.ceil(seconds / 60);
    return `${mins}m ${t('remaining')}`;
  };

  return (
    <motion.div
      className="upload-progress"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="upload-progress-header">
        <span className="upload-status">{getStatusText()}</span>
        <span className="upload-percentage">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        <motion.div
          className="progress-bar-shimmer"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        />
      </div>

      {/* Progress Details */}
      <div className="upload-progress-details">
        <span className="upload-size">
          {formatFileSize(loaded)} / {formatFileSize(total)}
        </span>
        
        {speed !== undefined && speed > 0 && (
          <span className="upload-speed">{formatSpeed(speed)}</span>
        )}
        
        {estimatedTime !== undefined && estimatedTime > 0 && (
          <span className="upload-eta">{formatTime(estimatedTime)}</span>
        )}
      </div>

      {/* Cancel Button */}
      {status === 'uploading' && (
        <button
          className="btn-cancel-upload"
          onClick={onCancel}
          type="button"
        >
          {t('cancelUpload')}
        </button>
      )}
    </motion.div>
  );
}
