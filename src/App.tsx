import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorViewModel } from './presentation/EditorViewModel';
import { exportAsZip, exportAsSpriteSheet, downloadBlob } from './infrastructure/ExportService';
import { decodeGif } from './infrastructure/GifService';
import type { GridConfig } from './domain/FrameLogic';
import { useI18n } from './i18n/useI18n';
import type { Language } from './i18n/translations';
import './styles/main.css';

// Initialize ViewModel
const viewModel = new EditorViewModel();

function App() {
  const [state, setState] = useState(viewModel.getState());
  const [showSettings, setShowSettings] = useState(false);
  const { language, changeLanguage, t } = useI18n();
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = viewModel.subscribe(() => {
      setState({ ...viewModel.getState() });
    });
    return unsubscribe;
  }, []);

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
    
    // Draw frames
    const allFrames = viewModel.getFrames();
    allFrames.forEach((frame, index) => {
      // When manual mode is on, only show manual frames
      const isManual = index >= state.frames.length;
      if (state.isManualMode && !isManual) return;
      
      const isSelected = isManual && index - state.frames.length === state.selectedManualFrameIndex;
      
      // Frame border - active: blue, inactive: red
      ctx.strokeStyle = isSelected ? '#7aa2f7' : frame.isActive ? '#7aa2f7' : '#f43f5e';
      ctx.lineWidth = frame.isActive ? 2 : 3;
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
      
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
        ctx.fillStyle = '#7aa2f7';
        ctx.font = '12px sans-serif';
        ctx.fillText(String(frame.index + 1), frame.x + 4, frame.y + 14);
      }
    });
    
    ctx.restore();
  }, [state.image, state.imageDimensions, state.frames, state.manualFrames, state.zoom, state.selectedManualFrameIndex, state.currentFrame, state.isManualMode]);

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
    
    // Check if clicking on existing frame - use viewModel to get latest frames
    const allFrames = viewModel.getFrames();
    const manualFrameCount = state.frames.length;
    
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
          <i className="fa-solid fa-layer-group header__logo"></i>
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
            {!state.isImageLoaded && (
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

      {/* Frame Gallery */}
      <div className="gallery" id="framesGallery">
        {!state.isImageLoaded ? (
          <p className="gallery-empty">Henüz kare oluşturulmadı.</p>
        ) : viewModel.getFrames().length === 0 ? (
          <p className="gallery-empty">Henüz kare oluşturulmadı.</p>
        ) : (
          viewModel.getFrames().map((frame, index) => (
            <div
              key={index}
              className={`frame-item ${!frame.isActive ? 'frame-item--disabled' : ''}`}
            >
              {/* Frame Image - Click to preview */}
              {state.image && (
                <img
                  src={(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = frame.w;
                    canvas.height = frame.h;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(state.image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
                    return canvas.toDataURL();
                  })()}
                  alt={`Frame ${index + 1}`}
                  onClick={() => viewModel.previewSingleFrame(index)}
                  className="frame-item__img"
                />
              )}
              
              {/* Toggle Button - Separate from image */}
              <button
                className={`frame-item__toggle ${!frame.isActive ? 'frame-item__toggle--off' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  viewModel.toggleFrameActive(index);
                }}
                title={frame.isActive ? 'Kapat' : 'Aç'}
              >
                <i className={`fa-solid ${frame.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
}

export default App;