// Optimized Frame Gallery Section
// Uses cached thumbnails and memoized components for performance

import React, { useCallback, memo } from 'react';
import type { Frame } from '../domain/FrameLogic';
import { useFrameThumbnails } from '../hooks/useFrameThumbnails';
import { useEditorSelector } from '../hooks/useEditorSelector';
import FrameThumbnail from './FrameThumbnail';
import { EditorViewModel } from '../presentation/EditorViewModel';
import { exportSingleFrame, downloadBlob } from '../infrastructure/ExportService';

interface GallerySectionProps {
  viewModel: EditorViewModel;
}

/**
 * The gallery subscribes to the slices it needs instead of receiving them as
 * props: a zoom, a selection or a marching ants tick in the parent no longer
 * re-renders a thousand thumbnails.
 */
const GallerySection: React.FC<GallerySectionProps> = ({ viewModel }) => {
  const image = useEditorSelector(viewModel, state => state.processedImage || state.image);
  const isImageLoaded = useEditorSelector(viewModel, state => state.isImageLoaded);
  const isManualMode = useEditorSelector(viewModel, state => state.isManualMode);
  const gridFrameCount = useEditorSelector(viewModel, state => state.frames.length);
  const selectedFrameIndex = useEditorSelector(viewModel, state =>
    state.isManualMode
      ? state.selectedManualFrameIndex >= 0
        ? state.selectedManualFrameIndex
        : null
      : state.singlePreviewFrameIndex
  );
  // Inactive frames stay visible: the eye button is how they come back.
  const frames = useEditorSelector(viewModel, state =>
    state.isManualMode ? state.manualFrames : state.frames
  );

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

  if (!isImageLoaded || frames.length === 0) {
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

// The component subscribes on its own, the parent only has to stay stable.
export default memo(GallerySection);

export type { GallerySectionProps };
export type { Frame };
