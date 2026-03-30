// Memoized Frame Thumbnail Component
// Prevents unnecessary re-renders when parent updates

import React, { memo, useCallback } from 'react';
import type { Frame } from '../domain/FrameLogic';

interface FrameThumbnailProps {
  frame: Frame;
  index: number;
  thumbnailUrl: string | undefined;
  image: HTMLImageElement | HTMLCanvasElement | null;
  isSelected: boolean;
  onToggle: (index: number) => void;
  onPreview: (index: number) => void;
  onDownload: (index: number) => void;
}

// Frame hash calculation (faster than string comparison)
const getFrameHash = (frame: Frame): number => {
  return frame.x + frame.y + frame.w + frame.h + (frame.isActive ? 1 : 0);
};

// Memo comparison function - uses frame hash for faster comparison
const areEqual = (prevProps: FrameThumbnailProps, nextProps: FrameThumbnailProps): boolean => {
  // Use frame hash for faster comparison (avoids multiple property checks)
  const prevHash = getFrameHash(prevProps.frame);
  const nextHash = getFrameHash(nextProps.frame);
  
  return (
    prevHash === nextHash &&
    prevProps.index === nextProps.index &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.image === nextProps.image
  );
};

const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  frame,
  index,
  thumbnailUrl,
  isSelected,
  onToggle,
  onPreview,
  onDownload,
}) => {
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(index);
  }, [index, onToggle]);

  const handlePreview = useCallback(() => {
    onPreview(index);
  }, [index, onPreview]);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(index);
  }, [index, onDownload]);

  // Fallback to inline canvas if thumbnail not ready
  const renderImage = () => {
    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={`Frame ${index + 1}`}
          className="frame-item__img"
          loading="lazy"
          decoding="async"
        />
      );
    }

    // Placeholder while thumbnail generates
    return (
      <div 
        className="frame-item__placeholder"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1f2335',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#565f89',
          fontSize: '12px',
        }}
      >
        {index + 1}
      </div>
    );
  };

  return (
    <div
      className={`frame-item ${!frame.isActive ? 'frame-item--disabled' : ''} ${isSelected ? 'frame-item--selected' : ''}`}
      style={{
        position: 'relative',
        border: isSelected ? '2px solid #7aa2f7' : undefined,
      }}
    >
      {/* Frame Image - Click to preview */}
      <div 
        className="frame-item__img-wrapper"
        onClick={handlePreview}
        style={{
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '4px',
        }}
      >
        {renderImage()}
      </div>

      {/* Frame Index Badge */}
      <div
        className="frame-item__badge"
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          backgroundColor: 'rgba(26, 27, 38, 0.8)',
          color: frame.isActive ? '#9ece6a' : '#f43f5e',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none',
        }}
      >
        {index + 1}
      </div>

      {/* Toggle Button */}
      <button
        className={`frame-item__toggle ${!frame.isActive ? 'frame-item__toggle--off' : ''}`}
        onClick={handleToggle}
        title={frame.isActive ? 'Kapat' : 'Aç'}
        style={{
          position: 'absolute',
          top: '4px',
          right: '24px',
          backgroundColor: 'rgba(26, 27, 38, 0.8)',
          border: 'none',
          borderRadius: '3px',
          padding: '4px',
          cursor: 'pointer',
          color: frame.isActive ? '#7aa2f7' : '#565f89',
          transition: 'color 0.15s ease',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className={`fa-solid ${frame.isActive ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '12px' }} />
      </button>

      {/* Download Button */}
      <button
        className="frame-item__download"
        onClick={handleDownload}
        title="İndir"
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: 'rgba(26, 27, 38, 0.8)',
          border: 'none',
          borderRadius: '3px',
          padding: '4px',
          cursor: 'pointer',
          color: '#7aa2f7',
          transition: 'color 0.15s ease',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="fa-solid fa-download" style={{ fontSize: '12px' }} />
      </button>

      {/* Size Info */}
      <div
        className="frame-item__info"
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          right: '4px',
          backgroundColor: 'rgba(26, 27, 38, 0.8)',
          color: '#565f89',
          padding: '2px 4px',
          borderRadius: '3px',
          fontSize: '9px',
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        {frame.w}×{frame.h}
      </div>
    </div>
  );
};

// Apply memo
export default memo(FrameThumbnail, areEqual);

// Virtual list helper for future optimization
export interface VirtualListConfig {
  itemHeight: number;
  itemWidth: number;
  gap: number;
  containerWidth: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  totalItems: number,
  config: VirtualListConfig
): { startIndex: number; endIndex: number; totalHeight: number } {
  const itemsPerRow = Math.floor((config.containerWidth + config.gap) / (config.itemWidth + config.gap));
  const rowHeight = config.itemHeight + config.gap;
  const startRow = Math.floor(scrollTop / rowHeight);
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 1; // +1 for buffer
  
  const startIndex = Math.max(0, startRow * itemsPerRow);
  const endIndex = Math.min(totalItems - 1, (startRow + visibleRows) * itemsPerRow);
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const totalHeight = totalRows * rowHeight - config.gap;

  return { startIndex, endIndex, totalHeight };
}
