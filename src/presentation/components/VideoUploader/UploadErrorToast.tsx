/**
 * UploadErrorToast Component
 * Displays upload errors with retry option
 */

import { motion, AnimatePresence } from 'framer-motion';
import { UploadError } from '@domain/video/Video';
import { useI18n } from '@/i18n/useI18n';

interface UploadErrorToastProps {
  errors: UploadError[];
  onClear: () => void;
  onRetry?: (file: File) => Promise<void>;
}

export function UploadErrorToast({ errors, onClear }: UploadErrorToastProps) {
  const { t } = useI18n();

  if (errors.length === 0) return null;

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'FILE_TOO_LARGE':
        return '⚠️';
      case 'INVALID_FORMAT':
      case 'INVALID_CODEC':
        return '🎬';
      case 'NETWORK_ERROR':
        return '🌐';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'FILE_TOO_LARGE':
        return t('fileTooLarge');
      case 'INVALID_FORMAT':
        return t('invalidFormat');
      case 'INVALID_CODEC':
        return t('invalidCodec');
      case 'NETWORK_ERROR':
        return t('networkError');
      case 'UPLOAD_FAILED':
        return t('uploadFailed');
      default:
        return 'Error';
    }
  };

  return (
    <motion.div
      className="upload-error-container"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className="upload-error-header">
        <span>{t('uploadErrors')} ({errors.length})</span>
        <button
          className="btn-clear-errors"
          onClick={onClear}
          type="button"
          aria-label={t('clearErrors')}
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

      <AnimatePresence mode="popLayout">
        {errors.map((error, index) => (
          <motion.div
            key={`${error.videoId}-${index}`}
            className="upload-error-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="error-icon">{getErrorIcon(error.code)}</span>
            <div className="error-content">
              <p className="error-title">{getErrorTitle(error.code)}</p>
              <p className="error-message">{error.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
