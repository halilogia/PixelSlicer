import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorViewModel } from './presentation/EditorViewModel';
import { exportAsZip, exportAsSpriteSheet, downloadBlob } from './infrastructure/ExportService';
import { decodeGif } from './infrastructure/GifService';
import type { GridConfig } from './domain/FrameLogic';
import { useI18n } from './i18n/useI18n';
import GallerySection from './components/GallerySection';
import { VideoUploader } from './presentation/components/VideoUploader';
import type { VideoFile } from './domain/video/Video';
import { videoFrameExtractor, ExtractedFrame } from './infrastructure/video/VideoFrameExtractor';
import { VideoFrameGridService } from './infrastructure/video/VideoFrameGridService';
import { VideoProcessingConfig, DEFAULT_VIDEO_CONFIG } from './domain/video/Video';
import './styles/main.css';
import './styles/video-uploader.css';

// Initialize ViewModel
const viewModel = new EditorViewModel();

function App() {
  const [state, setState] = useState(viewModel.getState());
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [videoFrames, setVideoFrames] = useState<ExtractedFrame[]>([]);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const { language, changeLanguage, t } = useI18n();
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const videoAnimationRef = useRef<number | null>(null);

  // Calculate optimal zoom to fit content in viewport
  const calculateOptimalZoom = useCallback((contentWidth: number, contentHeight: number): number => {
    if (!canvasContainerRef.current) return 1;
    
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth - 40; // Padding
    const containerHeight = container.clientHeight - 40;
    
    // Calculate zoom to fit entire content
    const zoomX = containerWidth / contentWidth;
    const zoomY = containerHeight / contentHeight;
    
    // Use smaller zoom to ensure entire content fits
    const optimalZoom = Math.min(zoomX, zoomY, 1); // Max 100%
    
    return Math.max(0.1, optimalZoom); // Min 10%
  }, []);

  // Cleanup function for video frames and canvas
  const cleanupVideoContent = useCallback(() => {
    // Stop any playing animation
    if (videoAnimationRef.current) {
      cancelAnimationFrame(videoAnimationRef.current);
      videoAnimationRef.current = null;
    }
    
    // Clear video frames from memory
    if (videoFrames.length > 0) {
      VideoFrameGridService.cleanupFrames(videoFrames);
      setVideoFrames([]);
    }
    
    // Reset state
    setIsExtractingFrames(false);
    setExtractionProgress(0);
    
    // Clear main canvas
    if (mainCanvasRef.current) {
      const ctx = mainCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height);
      }
      mainCanvasRef.current.width = 0;
      mainCanvasRef.current.height = 0;
    }
  }, [videoFrames]);

  // Handle video upload completion and extract frames
  const handleVideoUploadComplete = useCallback(async (videos: VideoFile[], processingConfig: VideoProcessingConfig = DEFAULT_VIDEO_CONFIG) => {
    if (videos.length === 0) return;
    
    // Close uploader modal
    setShowVideoUploader(false);
    
    // Clean up any previous video/image content
    cleanupVideoContent();
    viewModel.clearImage();
    
    // Process the first uploaded video
    const videoFile = videos[0];
    setIsExtractingFrames(true);
    setExtractionProgress(0);
    
    try {
      // Extract frames from video
      const frames = await videoFrameExtractor.extractFrames(
        videoFile,
        {
          fps: processingConfig.fps,
          maxFrames: processingConfig.maxFrames,
          targetWidth: processingConfig.targetWidth,
        },
        (progress) => {
          setExtractionProgress(progress.percentage);
        }
      );
      
      setVideoFrames(frames);
      
      // Create sprite sheet from frames
      const grid = await VideoFrameGridService.createSpriteSheetFromFrames(frames);
      
      // Convert sprite sheet to image for EditorViewModel
      const spriteImage = await VideoFrameGridService.canvasToImage(grid.spriteSheet);
      
      // Set image in EditorViewModel
      viewModel.setImage(spriteImage);
      
      // Auto-calculate optimal grid based on frame count
      const optimalCols = grid.config.columns;
      const optimalRows = grid.config.rows;
      viewModel.setGridConfig({
        cols: optimalCols,
        rows: optimalRows,
        offsetX: 0,
        offsetY: 0,
        padding: 0,
      });
      
      // Calculate and apply optimal zoom
      const spriteWidth = grid.spriteSheet.width;
      const spriteHeight = grid.spriteSheet.height;
      const optimalZoom = calculateOptimalZoom(spriteWidth, spriteHeight);
      viewModel.setZoom(optimalZoom);
      
      // Video processed and displayed in grid
    } catch (error) {
      console.error('Video processing failed:', error);
    } finally {
      setIsExtractingFrames(false);
    }
  }, [cleanupVideoContent]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = viewModel.subscribe(() => {
      setState({ ...viewModel.getState() });
    });
    return unsubscribe;
  }, []);

  // Animation frame counter for marching ants effect
  const animationFrameRef = useRef<number>(0);
  const [marchingAntsOffset, setMarchingAntsOffset] = useState(0);
  
  // Marching ants animation - only runs when drawing in manual mode
  useEffect(() => {
    if (!state.isManualMode || !state.isDrawing) return;
    
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 50) { // Update every 50ms
        setMarchingAntsOffset(prev => (prev + 1) % 16);
        lastTime = time;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isManualMode, state.isDrawing]);

  // Draw main canvas when state changes
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !state.image || !state.imageDimensions) return;

    canvas.width = state.imageDimensions.width * state.zoom;
    canvas.height = state.imageDimensions.height * state.zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(state.zoom, state.zoom);
    
    // Draw image
    ctx.drawImage(state.image, 0, 0);
    
    // Get drawing state for real-time feedback from state
    const drawingState = state.isDrawing ? {
      isDrawing: state.isDrawing,
      startX: state.drawStartX,
      startY: state.drawStartY,
      currentX: state.drawCurrentX,
      currentY: state.drawCurrentY,
    } : null;
    
    // Draw frames
    const allFrames = viewModel.getFrames();
    allFrames.forEach((frame, index) => {
      // When manual mode is on, completely hide automatic selection frames
      const isManual = index >= state.frames.length;
      if (state.isManualMode && !isManual) return;
      
      const manualFrameIndex = index - state.frames.length;
      const isSelected = isManual && manualFrameIndex === state.selectedManualFrameIndex;
      const isBeingDrawn = isManual && drawingState && manualFrameIndex === state.manualFrames.length - 1;
      
      if (isBeingDrawn && drawingState) {
        // Draw marching ants / dashed border for selection in progress
        const drawX = Math.min(drawingState.startX, drawingState.currentX);
        const drawY = Math.min(drawingState.startY, drawingState.currentY);
        const drawW = Math.abs(drawingState.currentX - drawingState.startX);
        const drawH = Math.abs(drawingState.currentY - drawingState.startY);
        
        if (drawW > 0 && drawH > 0) {
          // Semi-transparent overlay
          ctx.fillStyle = 'rgba(122, 162, 247, 0.15)';
          ctx.fillRect(drawX, drawY, drawW, drawH);
          
          // Marching ants border
          ctx.strokeStyle = '#7aa2f7';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -marchingAntsOffset;
          ctx.strokeRect(drawX, drawY, drawW, drawH);
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
          
          // Dynamic border trail - corners
          ctx.fillStyle = '#7aa2f7';
          const handleSize = 8;
          // Top-left
          ctx.fillRect(drawX - handleSize/2, drawY - handleSize/2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(drawX + drawW - handleSize/2, drawY - handleSize/2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(drawX - handleSize/2, drawY + drawH - handleSize/2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(drawX + drawW - handleSize/2, drawY + drawH - handleSize/2, handleSize, handleSize);
        }
      } else {
        // Frame border - active: blue, inactive: red
        ctx.strokeStyle = isSelected ? '#bb9af7' : frame.isActive ? '#7aa2f7' : '#f43f5e';
        ctx.lineWidth = isSelected ? 3 : frame.isActive ? 2 : 3;
        
        // Draw solid border
        ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
        
        // Selected frame highlighting
        if (isSelected) {
          // Outer glow effect
          ctx.strokeStyle = 'rgba(187, 154, 247, 0.4)';
          ctx.lineWidth = 6;
          ctx.strokeRect(frame.x - 2, frame.y - 2, frame.w + 4, frame.h + 4);
          
          // Inner highlight
          ctx.strokeStyle = '#bb9af7';
          ctx.lineWidth = 2;
          ctx.strokeRect(frame.x + 2, frame.y + 2, frame.w - 4, frame.h - 4);
          
          // Draw resize handles for selected frame
          ctx.fillStyle = '#bb9af7';
          const handleSize = 10;
          // Top-left
          ctx.fillRect(frame.x - handleSize/2, frame.y - handleSize/2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(frame.x + frame.w - handleSize/2, frame.y - handleSize/2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(frame.x - handleSize/2, frame.y + frame.h - handleSize/2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(frame.x + frame.w - handleSize/2, frame.y + frame.h - handleSize/2, handleSize, handleSize);
        }
        
        // Draw delete button (X) in top-right corner for manual frames
        if (isManual) {
          const deleteBtnSize = 16;
          const deleteBtnX = frame.x + frame.w - deleteBtnSize - 2;
          const deleteBtnY = frame.y + 2;
          
          // Delete button background (circular)
          ctx.beginPath();
          ctx.arc(deleteBtnX + deleteBtnSize/2, deleteBtnY + deleteBtnSize/2, deleteBtnSize/2, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
          
          // X mark
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(deleteBtnX + 4, deleteBtnY + 4);
          ctx.lineTo(deleteBtnX + deleteBtnSize - 4, deleteBtnY + deleteBtnSize - 4);
          ctx.moveTo(deleteBtnX + deleteBtnSize - 4, deleteBtnY + 4);
          ctx.lineTo(deleteBtnX + 4, deleteBtnY + deleteBtnSize - 4);
          ctx.stroke();
        }
        
        // Draw X mark for inactive frames
        if (!frame.isActive) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(frame.x + 4, frame.y + 4);
          ctx.lineTo(frame.x + frame.w - 4, frame.y + frame.h - 4);
          ctx.moveTo(frame.x + frame.w - 4, frame.y + 4);
          ctx.lineTo(frame.x + 4, frame.y + frame.h - 4);
          ctx.stroke();
        }
        
        // Frame number for active frames
        if (frame.isActive) {
          ctx.fillStyle = isSelected ? '#bb9af7' : '#7aa2f7';
          ctx.font = isSelected ? 'bold 14px sans-serif' : '12px sans-serif';
          ctx.fillText(String(frame.index + 1), frame.x + 4, frame.y + (isSelected ? 18 : 14));
        }
      }
    });
    
    ctx.restore();
  }, [state.image, state.imageDimensions, state.frames, state.manualFrames, state.zoom, state.selectedManualFrameIndex, state.currentFrame, state.isManualMode, state.isDrawing, state.drawStartX, state.drawStartY, state.drawCurrentX, state.drawCurrentY, marchingAntsOffset]);

  // Draw preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !state.image) return;

    let currentFrame;
    
    // Check if single frame preview is active
    if (state.singlePreviewFrameIndex !== null) {
      const allFrames = viewModel.getFrames();
      currentFrame = allFrames[state.singlePreviewFrameIndex];
    } else {
      const activeFrames = viewModel.getActiveFrames();
      if (activeFrames.length === 0) return;
      currentFrame = activeFrames[state.currentFrame];
    }
    
    if (!currentFrame) return;

    // Apply zoom
    canvas.width = currentFrame.w;
    canvas.height = currentFrame.h;
    
    // Set display size for zoom
    if (state.previewZoom === -1) {
      // Auto-fit: let CSS handle it
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.classList.add('auto-fit');
    } else {
      const displayWidth = currentFrame.w * state.previewZoom;
      const displayHeight = currentFrame.h * state.previewZoom;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      canvas.classList.remove('auto-fit');
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      state.image,
      currentFrame.x, currentFrame.y, currentFrame.w, currentFrame.h,
      0, 0, currentFrame.w, currentFrame.h
    );
  }, [state.image, state.currentFrame, state.frames, state.manualFrames, state.previewZoom, state.singlePreviewFrameIndex, state.isPlaying]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      viewModel.setImage(img);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Handle GIF upload
  const handleGifUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const gifInfo = await decodeGif(file);
      const numFrames = gifInfo.frames.length;
      
      // Create sprite strip: all frames side by side
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = gifInfo.width * numFrames;
      spriteCanvas.height = gifInfo.height;
      const sCtx = spriteCanvas.getContext('2d')!;
      
      // Draw each frame to the sprite strip
      for (let i = 0; i < numFrames; i++) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gifInfo.width;
        frameCanvas.height = gifInfo.height;
        const fCtx = frameCanvas.getContext('2d')!;
        fCtx.putImageData(gifInfo.frames[i].data, 0, 0);
        sCtx.drawImage(frameCanvas, i * gifInfo.width, 0);
      }
      
      // Create image from sprite strip
      const img = new Image();
      img.onload = () => {
        viewModel.setImage(img);
        // Auto-set grid: all frames in one row
        viewModel.setGridConfig({
          cols: numFrames,
          rows: 1
        });
        viewModel.setSheetColumns(numFrames);
      };
      
      img.src = spriteCanvas.toDataURL();
    } catch (error) {
      console.error('Failed to decode GIF:', error);
    }
  }, []);

  // Handle grid config changes
  const handleGridChange = useCallback((key: keyof GridConfig, value: number) => {
    viewModel.setGridConfig({ [key]: value });
    
    // Auto-update sheet columns when grid cols change
    if (key === 'cols') {
      viewModel.setSheetColumns(value);
    }
  }, []);

  // Handle export
  const handleExportZip = useCallback(async () => {
    if (!state.image) return;
    const blob = await exportAsZip(state.image, viewModel.getFrames());
    downloadBlob(blob, 'frames.zip');
  }, [state.image]);

  const handleExportSpriteSheet = useCallback(async () => {
    if (!state.image) return;
    const blob = await exportAsSpriteSheet(state.image, viewModel.getFrames(), state.sheetColumns);
    downloadBlob(blob, 'spritesheet.png');
  }, [state.image, state.sheetColumns]);

  // Canvas click handler for frame toggle (when manual mode is OFF)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.imageDimensions || state.isManualMode) return;
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const pos = viewModel.getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    // Check if clicking on any frame (grid frames only)
    const allFrames = viewModel.getFrames();
    for (let i = allFrames.length - 1; i >= 0; i--) {
      const f = allFrames[i];
      if (pos.x >= f.x && pos.x <= f.x + f.w && pos.y >= f.y && pos.y <= f.y + f.h) {
        viewModel.toggleFrameActive(i);
        return;
      }
    }
  }, [state.imageDimensions, state.isManualMode]);

  // Canvas mouse handlers for manual mode
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isManualMode || !state.imageDimensions) return;
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const pos = viewModel.getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    // Check if clicking on resize handle
    const handle = viewModel.getResizeHandle(pos.x, pos.y);
    if (handle && state.selectedManualFrameIndex >= 0) {
      viewModel.startResize(handle, pos.x, pos.y);
      return;
    }
    
    // Check if clicking on delete button (X) for manual frames
    const allFrames = viewModel.getFrames();
    const manualFrameCount = state.frames.length;
    
    for (let i = allFrames.length - 1; i >= manualFrameCount; i--) {
      const f = allFrames[i];
      const deleteBtnSize = 16;
      const deleteBtnX = f.x + f.w - deleteBtnSize - 2;
      const deleteBtnY = f.y + 2;
      
      // Check if clicking on delete button (circular area)
      const dx = pos.x - (deleteBtnX + deleteBtnSize/2);
      const dy = pos.y - (deleteBtnY + deleteBtnSize/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist <= deleteBtnSize/2) {
        // Delete the frame
        viewModel.deleteManualFrame(i - manualFrameCount);
        return;
      }
    }
    
    // Check if clicking on existing frame - use viewModel to get latest frames
    for (let i = allFrames.length - 1; i >= manualFrameCount; i--) {
      const f = allFrames[i];
      if (pos.x >= f.x && pos.x <= f.x + f.w && pos.y >= f.y && pos.y <= f.y + f.h) {
        viewModel.selectManualFrame(i - manualFrameCount);
        viewModel.startDrag(pos.x, pos.y);
        return;
      }
    }
    
    // Deselect when clicking empty area
    viewModel.selectManualFrame(-1);
    
    // Start drawing new frame
    viewModel.startDrawing(pos.x, pos.y);
  }, [state.isManualMode, state.imageDimensions, state.frames.length]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isManualMode || !state.imageDimensions) return;
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const pos = viewModel.getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    // Handle resize
    if (viewModel.isResizing()) {
      viewModel.updateResize(pos.x, pos.y);
      return;
    }
    
    // Handle drag
    if (viewModel.isDragging()) {
      viewModel.updateDrag(pos.x, pos.y);
      return;
    }
    
    // Handle drawing
    if (viewModel.isDrawing()) {
      viewModel.updateDrawing(pos.x, pos.y);
    }
  }, [state.isManualMode, state.imageDimensions]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!state.isManualMode) return;
    
    if (viewModel.isResizing()) {
      viewModel.endResize();
    }
    
    if (viewModel.isDragging()) {
      viewModel.endDrag();
    }
    
    if (viewModel.isDrawing()) {
      viewModel.endDrawing();
    }
  }, [state.isManualMode]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (!state.isManualMode) return;
    
    if (viewModel.isResizing()) {
      viewModel.endResize();
    }
    
    if (viewModel.isDragging()) {
      viewModel.endDrag();
    }
    
    if (viewModel.isDrawing()) {
      viewModel.cancelDrawing();
    }
  }, [state.isManualMode]);

  // Wheel zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY > 0) {
        viewModel.zoomOut();
      } else {
        viewModel.zoomIn();
      }
    }
  }, []);

  // Attach wheel event listener
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <img src="/assets/logo2.png" alt="PixelSlicer" className="header__logo" />
          <div>
            <h1 className="header__title">Pixel<span>Slicer</span></h1>
            <p className="header__subtitle">{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="header__actions">
          <label className="btn btn--success">
            <i className="fa-solid fa-film"></i> {t('uploadGif')}
            <input type="file" accept="image/gif" className="file-input" onChange={handleGifUpload} />
          </label>
          <label className="btn btn--primary">
            <i className="fa-solid fa-upload"></i> {t('uploadImage')}
            <input type="file" accept="image/*" className="file-input" onChange={handleImageUpload} />
          </label>
          <button
            className="btn btn--secondary settings-btn"
            onClick={() => setShowSettings(true)}
            title={t('settings')}
          >
            <i className="fa-solid fa-gear"></i>
          </button>
          <button
            className={`btn ${showVideoUploader ? 'btn--active' : 'btn--secondary'}`}
            onClick={() => setShowVideoUploader(!showVideoUploader)}
            title={t('uploadVideos')}
          >
            <i className="fa-solid fa-video"></i>
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Manual Mode */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">
              <i className="fa-solid fa-pen-nib"></i> {t('manualSelection')}
            </h3>
            <button
              className={`btn ${state.isManualMode ? 'btn--active' : 'btn--secondary'}`}
              onClick={() => viewModel.toggleManualMode()}
              style={{ width: '100%' }}
            >
              <i className="fa-regular fa-square"></i>
              {state.isManualMode ? t('manualAddOn') : t('manualAddOff')}
            </button>
            {state.manualFrames.length > 0 && (
              <button
                className="btn btn--danger"
                onClick={() => viewModel.clearManualFrames()}
                style={{ width: '100%', marginTop: '8px' }}
              >
                {t('clearManualFrames')}
              </button>
            )}
          </div>

          {/* Grid Settings */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">
              <i className="fa-solid fa-table-cells"></i> {t('gridSettings')}
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('columns')}</label>
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    className="form-input"
                    value={state.gridConfig.cols}
                    min={1}
                    onChange={(e) => handleGridChange('cols', parseInt(e.target.value) || 1)}
                  />
                  <div className="number-input-spinners">
                    <button onClick={() => handleGridChange('cols', state.gridConfig.cols + 1)}>▲</button>
                    <button onClick={() => handleGridChange('cols', Math.max(1, state.gridConfig.cols - 1))}>▼</button>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('rows')}</label>
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    className="form-input"
                    value={state.gridConfig.rows}
                    min={1}
                    onChange={(e) => handleGridChange('rows', parseInt(e.target.value) || 1)}
                  />
                  <div className="number-input-spinners">
                    <button onClick={() => handleGridChange('rows', state.gridConfig.rows + 1)}>▲</button>
                    <button onClick={() => handleGridChange('rows', Math.max(1, state.gridConfig.rows - 1))}>▼</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fine Tune */}
            <div className="sidebar__section" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#e0af68', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-ruler-combined"></i> {t('fineTune')}
                </h4>
                <button
                  className="btn btn--secondary"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                  onClick={() => viewModel.resetFineTune()}
                >
                  <i className="fa-solid fa-rotate-left"></i> {t('reset')}
                </button>
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>{t('offsetX')}</span>
                  <span className="range-value">{state.gridConfig.offsetX}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={state.gridConfig.offsetX}
                  onChange={(e) => handleGridChange('offsetX', parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>{t('offsetY')}</span>
                  <span className="range-value">{state.gridConfig.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={state.gridConfig.offsetY}
                  onChange={(e) => handleGridChange('offsetY', parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>{t('padding')}</span>
                  <span className="range-value">{state.gridConfig.padding}px</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={state.gridConfig.padding}
                  onChange={(e) => handleGridChange('padding', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">
              <i className="fa-solid fa-play" style={{ color: '#9ece6a' }}></i> {t('preview')}
            </h3>
            <div className="preview-container canvas-bg">
              <canvas ref={previewCanvasRef}></canvas>
              {viewModel.getActiveFrames().length === 0 && (
                <div className="preview-empty">
                  Pasif
                </div>
              )}
            </div>
            <div className="preview-controls">
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => {
                const newZoom = state.previewZoom === -1 ? 0.5 : Math.max(0.1, state.previewZoom - 0.1);
                viewModel.setPreviewZoom(newZoom);
              }}>
                <i className="fa-solid fa-minus"></i>
              </button>
              <button
                className="btn btn--secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => {
                  if (state.isPlaying) {
                    viewModel.stopAnimation();
                  } else {
                    viewModel.clearSinglePreview();
                    viewModel.startAnimation();
                  }
                }}
              >
                <i className={`fa-solid ${state.isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => {
                const newZoom = state.previewZoom === -1 ? 0.5 : state.previewZoom + 0.1;
                viewModel.setPreviewZoom(newZoom);
              }}>
                <i className="fa-solid fa-plus"></i>
              </button>
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => viewModel.setPreviewZoom(-1)}>
                {t('fit')}
              </button>
            </div>
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label">{t('speed')}</label>
              <input
                type="range"
                min={1}
                max={60}
                value={state.fps}
                onChange={(e) => viewModel.setFps(parseInt(e.target.value))}
              />
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#7aa2f7' }}>
                {state.fps} FPS
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="sidebar__section">
            <div className="form-group">
              <label className="form-label">{t('sheetColumns')}</label>
              <div className="number-input-wrapper">
                <input
                  type="number"
                  className="form-input"
                  value={state.sheetColumns}
                  min={1}
                  onChange={(e) => viewModel.setSheetColumns(parseInt(e.target.value) || 1)}
                />
                <div className="number-input-spinners">
                  <button onClick={() => viewModel.setSheetColumns(state.sheetColumns + 1)}>▲</button>
                  <button onClick={() => viewModel.setSheetColumns(Math.max(1, state.sheetColumns - 1))}>▼</button>
                </div>
              </div>
            </div>
            <button
              className="btn btn--primary"
              style={{ width: '100%', marginBottom: '8px' }}
              onClick={handleExportSpriteSheet}
            >
              <i className="fa-solid fa-image"></i> {t('downloadSpriteSheet')}
            </button>
            <button
              className="btn btn--secondary"
              style={{ width: '100%', backgroundColor: '#bb9af7', color: '#1a1b26' }}
              onClick={handleExportZip}
            >
              <i className="fa-solid fa-file-zipper"></i> {t('downloadZip')}
            </button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="canvas-area">
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => viewModel.zoomOut()} title="Küçült">
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="zoom-level">{Math.round(state.zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => viewModel.zoomIn()} title="Büyüt">
              <i className="fa-solid fa-plus"></i>
            </button>
            <div className="zoom-divider"></div>
            <button className="zoom-btn zoom-btn--text" onClick={() => viewModel.setZoom(1)} title="Ekrana Sığdır">
              <i className="fa-solid fa-compress"></i>
              <span>Sığdır</span>
            </button>
          </div>

          {/* Frame Extraction Progress */}
          {isExtractingFrames && (
            <div className="frame-extraction-progress">
              <div className="progress-bar-container" style={{ margin: '10px 20px' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${extractionProgress}%` }}
                />
              </div>
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#7aa2f7' }}>
                Frame çıkarılıyor... {extractionProgress}%
              </p>
            </div>
          )}

          {/* Canvas Wrapper */}
          <div 
            ref={canvasContainerRef}
            className="canvas-wrapper canvas-bg"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const img = new Image();
                img.onload = () => viewModel.setImage(img);
                img.src = URL.createObjectURL(file);
              }
            }}
          >
            {!state.isImageLoaded && videoFrames.length === 0 && (
              <div className="welcome">
                <i className="fa-solid fa-cloud-arrow-up welcome__icon"></i>
                <h2 className="welcome__title">Resim Yükleyin</h2>
                <p className="welcome__text">Başlamak için sol üstteki butonu kullanın veya sürükleyip bırakın.</p>
              </div>
            )}
            <canvas
              ref={mainCanvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              style={{ cursor: state.isManualMode ? 'crosshair' : 'default' }}
            ></canvas>
          </div>
        </main>
      </div>

      {/* Frame Gallery - Optimized with thumbnail caching */}
      {/* When manual mode is active, show only manual frames; otherwise show grid frames */}
      <GallerySection
        image={state.image}
        frames={state.isManualMode ? state.manualFrames : state.frames}
        isImageLoaded={state.isImageLoaded}
        selectedFrameIndex={state.isManualMode
          ? (state.selectedManualFrameIndex >= 0 ? state.selectedManualFrameIndex : null)
          : state.singlePreviewFrameIndex
        }
        viewModel={viewModel}
        isManualMode={state.isManualMode}
        gridFrameCount={state.frames.length}
      />

      {/* Settings Modal */}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                <i className="fa-solid fa-gear"></i> {t('settings')}
              </h3>
              <button className="modal__close" onClick={() => setShowSettings(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">{t('language')}</label>
                <div className="language-selector">
                  <button
                    className={`lang-btn ${language === 'tr' ? 'lang-btn--active' : ''}`}
                    onClick={() => changeLanguage('tr')}
                  >
                    <span className="lang-flag">🇹🇷</span>
                    <span className="lang-name">{t('turkish')}</span>
                  </button>
                  <button
                    className={`lang-btn ${language === 'en' ? 'lang-btn--active' : ''}`}
                    onClick={() => changeLanguage('en')}
                  >
                    <span className="lang-flag">🇬🇧</span>
                    <span className="lang-name">{t('english')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Uploader Modal */}
      {showVideoUploader && (
        <div className="modal-overlay" onClick={() => setShowVideoUploader(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                <i className="fa-solid fa-video"></i> {t('uploadVideos')}
              </h3>
              <button className="modal__close" onClick={() => setShowVideoUploader(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal__body" style={{ padding: 0 }}>
              <VideoUploader
                onUploadComplete={handleVideoUploadComplete}
                maxFiles={10}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;