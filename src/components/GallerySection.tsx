// Optimized Frame Gallery Section
// Uses cached thumbnails and memoized components for performance

import React, { useCallback, memo } from 'react';
import type { Frame } from '../domain/FrameLogic';
import { useFrameThumbnails } from '../hooks/useFrameThumbnails';
import FrameThumbnail from './FrameThumbnail';
import { EditorViewModel } from '../presentation/EditorViewModel';
import { exportSingleFrame, downloadBlob } from '../infrastructure/ExportService';

interface GallerySectionProps {
  image: HTMLImageElement | null;
  frames: Frame[];
  isImageLoaded: boolean;
  selectedFrameIndex: number | null;
  viewModel: EditorViewModel;
  isManualMode?: boolean;
  gridFrameCount?: number;
}

// Memoized gallery to prevent re-renders
const GallerySection: React.FC<GallerySectionProps> = ({
  image,
  frames,
  isImageLoaded,
  selectedFrameIndex,
  viewModel,
  isManualMode = false,
  gridFrameCount = 0,
}) => {
  // Use cached thumbnails hook
  // Increased maxSize for better resolution match with preview
  const thumbnails = useFrameThumbnails(image, frames, {
    maxSize: 256,
    quality: 0.95,
    format: 'image/png',
  });

  // Memoized callbacks to prevent child re-renders
  // In manual mode, adjust index to account for grid frames in the full frame list
  const handleToggleFrame = useCallback((index: number) => {
    const adjustedIndex = isManualMode ? index + gridFrameCount : index;
    viewModel.toggleFrameActive(adjustedIndex);
  }, [viewModel, isManualMode, gridFrameCount]);

  const handlePreviewFrame = useCallback((index: number) => {
    const adjustedIndex = isManualMode ? index + gridFrameCount : index;
    viewModel.previewSingleFrame(adjustedIndex);
  }, [viewModel, isManualMode, gridFrameCount]);

  const handleDownloadFrame = useCallback(async (index: number) => {
    if (!image) return;
    const adjustedIndex = isManualMode ? index + gridFrameCount : index;
    const allFrames = viewModel.getFrames();
    const frame = allFrames[adjustedIndex];
    if (!frame) return;

    try {
      const blob = await exportSingleFrame(image, frame);
      const filename = `frame_${String(adjustedIndex + 1).padStart(4, '0')}.png`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Failed to download frame:', error);
    }
  }, [image, isManualMode, gridFrameCount, viewModel]);

  if (!isImageLoaded) {
    return (
      <div className="gallery" id="framesGallery">
        <p className="gallery-empty">Henüz kare oluşturulmadı.</p>
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="gallery" id="framesGallery">
        <p className="gallery-empty">Henüz kare oluşturulmadı.</p>
      </div>
    );
  }

  return (
    <div className="gallery" id="framesGallery">
      {frames.map((frame, index) => (
        <FrameThumbnail
          key={`frame-${index}-${frame.x}-${frame.y}`}
          frame={frame}
          index={index}
          thumbnailUrl={thumbnails.get(index)}
          image={image}
          isSelected={selectedFrameIndex === index}
          onToggle={handleToggleFrame}
          onPreview={handlePreviewFrame}
          onDownload={handleDownloadFrame}
        />
      ))}
    </div>
  );
};

// Deep comparison for props
const areEqual = (prev: GallerySectionProps, next: GallerySectionProps): boolean => {
  if (prev.image !== next.image) return false;
  if (prev.isImageLoaded !== next.isImageLoaded) return false;
  if (prev.selectedFrameIndex !== next.selectedFrameIndex) return false;
  if (prev.frames.length !== next.frames.length) return false;
  if (prev.viewModel !== next.viewModel) return false;
  if (prev.isManualMode !== next.isManualMode) return false;
  if (prev.gridFrameCount !== next.gridFrameCount) return false;
  
  // Compare frames deeply but efficiently
  for (let i = 0; i < prev.frames.length; i++) {
    const prevFrame = prev.frames[i];
    const nextFrame = next.frames[i];
    if (
      prevFrame.x !== nextFrame.x ||
      prevFrame.y !== nextFrame.y ||
      prevFrame.w !== nextFrame.w ||
      prevFrame.h !== nextFrame.h ||
      prevFrame.isActive !== nextFrame.isActive
    ) {
      return false;
    }
  }
  
  return true;
};

export default memo(GallerySection, areEqual);
