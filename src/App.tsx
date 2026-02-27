import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorViewModel } from './presentation/EditorViewModel';
import { exportAsZip, exportAsSpriteSheet, downloadBlob } from './infrastructure/ExportService';
import { decodeGif } from './infrastructure/GifService';
import type { GridConfig } from './domain/FrameLogic';

// Initialize ViewModel
const viewModel = new EditorViewModel();

function App() {
  const [state, setState] = useState(viewModel.getState());
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
      const isManual = index >= state.frames.length;
      const isSelected = isManual && index - state.frames.length === state.selectedManualFrameIndex;
      
      // Frame border
      ctx.strokeStyle = isSelected ? '#7aa2f7' : frame.isActive ? '#7aa2f7' : '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
      
      // Frame number
      if (frame.isActive) {
        ctx.fillStyle = '#7aa2f7';
        ctx.font = '12px sans-serif';
        ctx.fillText(String(frame.index + 1), frame.x + 4, frame.y + 14);
      }
    });
    
    ctx.restore();
  }, [state.image, state.imageDimensions, state.frames, state.manualFrames, state.zoom, state.selectedManualFrameIndex, state.currentFrame]);

  // Draw preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !state.image) return;

    const activeFrames = viewModel.getActiveFrames();
    if (activeFrames.length === 0) return;

    const currentFrame = activeFrames[state.currentFrame];
    if (!currentFrame) return;

    canvas.width = currentFrame.w;
    canvas.height = currentFrame.h;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      state.image,
      currentFrame.x, currentFrame.y, currentFrame.w, currentFrame.h,
      0, 0, currentFrame.w, currentFrame.h
    );
  }, [state.image, state.currentFrame, state.frames, state.manualFrames]);

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
      
      // Create image from first frame
      const img = new Image();
      img.onload = () => {
        viewModel.setImage(img);
        // Auto-set grid based on GIF frames
        viewModel.setGridConfig({
          cols: Math.ceil(Math.sqrt(gifInfo.frames.length)),
          rows: Math.ceil(gifInfo.frames.length / Math.ceil(Math.sqrt(gifInfo.frames.length)))
        });
      };
      
      const canvas = document.createElement('canvas');
      canvas.width = gifInfo.width;
      canvas.height = gifInfo.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(gifInfo.frames[0].data, 0, 0);
      img.src = canvas.toDataURL();
    } catch (error) {
      console.error('Failed to decode GIF:', error);
    }
  }, []);

  // Handle grid config changes
  const handleGridChange = useCallback((key: keyof GridConfig, value: number) => {
    viewModel.setGridConfig({ [key]: value });
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

  // Canvas mouse handlers for manual mode
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isManualMode || !state.imageDimensions) return;
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const pos = viewModel.getCanvasCoordinates(canvas, e.clientX, e.clientY);
    
    // Check if clicking on resize handle
    const handle = viewModel.getResizeHandle(pos.x, pos.y);
    if (handle && state.selectedManualFrameIndex >= 0) {
      // Start resize
      return;
    }
    
    // Check if clicking on existing frame
    const manualFrames = state.manualFrames;
    for (let i = manualFrames.length - 1; i >= 0; i--) {
      const f = manualFrames[i];
      if (pos.x >= f.x && pos.x <= f.x + f.w && pos.y >= f.y && pos.y <= f.y + f.h) {
        viewModel.selectManualFrame(i);
        return;
      }
    }
    
    // Start drawing new frame
    viewModel.addManualFrame(pos.x, pos.y, pos.x, pos.y);
  }, [state.isManualMode, state.imageDimensions, state.manualFrames, state.selectedManualFrameIndex]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <i className="fa-solid fa-layer-group header__logo"></i>
          <div>
            <h1 className="header__title">Pixel<span>Slicer</span></h1>
            <p className="header__subtitle">ONLINE SPRITE CUTTER</p>
          </div>
        </div>
        <div className="header__actions">
          <label className="btn btn--success">
            <i className="fa-solid fa-film"></i> GIF Yükle
            <input type="file" accept="image/gif" className="file-input" onChange={handleGifUpload} />
          </label>
          <label className="btn btn--primary">
            <i className="fa-solid fa-upload"></i> Resim Yükle
            <input type="file" accept="image/*" className="file-input" onChange={handleImageUpload} />
          </label>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Manual Mode */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">
              <i className="fa-solid fa-pen-nib"></i> Manuel Seçim
            </h3>
            <button
              className={`btn ${state.isManualMode ? 'btn--active' : 'btn--secondary'}`}
              onClick={() => viewModel.toggleManualMode()}
              style={{ width: '100%' }}
            >
              <i className="fa-regular fa-square"></i>
              Manuel Ekle: {state.isManualMode ? 'AÇIK' : 'KAPALI'}
            </button>
            {state.manualFrames.length > 0 && (
              <button
                className="btn btn--danger"
                onClick={() => viewModel.clearManualFrames()}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Tüm Manuel Kareleri Sil
              </button>
            )}
          </div>

          {/* Grid Settings */}
          <div className="sidebar__section">
            <h3 className="sidebar__title">
              <i className="fa-solid fa-table-cells"></i> Izgara Ayarları
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sütun (Yatay)</label>
                <input
                  type="number"
                  className="form-input"
                  value={state.gridConfig.cols}
                  min={1}
                  onChange={(e) => handleGridChange('cols', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Satır (Dikey)</label>
                <input
                  type="number"
                  className="form-input"
                  value={state.gridConfig.rows}
                  min={1}
                  onChange={(e) => handleGridChange('rows', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Fine Tune */}
            <div className="sidebar__section" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#e0af68', textTransform: 'uppercase' }}>
                  <i className="fa-solid fa-ruler-combined"></i> İnce Ayar
                </h4>
                <button
                  className="btn btn--secondary"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                  onClick={() => viewModel.resetFineTune()}
                >
                  <i className="fa-solid fa-rotate-left"></i> Sıfırla
                </button>
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>Yatay Kaydır (Offset X)</span>
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
                  <span>Dikey Kaydır (Offset Y)</span>
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
                  <span>Genişlik Düzeltme (Padding)</span>
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
              <i className="fa-solid fa-play" style={{ color: '#9ece6a' }}></i> Önizleme
            </h3>
            <div className="preview-container canvas-bg">
              <canvas ref={previewCanvasRef}></canvas>
            </div>
            <div className="preview-controls">
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => viewModel.setPreviewZoom(state.previewZoom - 0.1)}>
                <i className="fa-solid fa-minus"></i>
              </button>
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => viewModel.startAnimation()}>
                <i className="fa-solid fa-play"></i>
              </button>
              <button className="btn btn--secondary" style={{ padding: '4px 8px' }} onClick={() => viewModel.setPreviewZoom(state.previewZoom + 0.1)}>
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label">Hız (FPS)</label>
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
              <label className="form-label">Sheet Sütun</label>
              <input
                type="number"
                className="form-input"
                value={state.sheetColumns}
                min={1}
                onChange={(e) => viewModel.setSheetColumns(parseInt(e.target.value) || 1)}
              />
            </div>
            <button
              className="btn btn--primary"
              style={{ width: '100%', marginBottom: '8px' }}
              onClick={handleExportSpriteSheet}
            >
              <i className="fa-solid fa-image"></i> Sprite Sheet
            </button>
            <button
              className="btn btn--secondary"
              style={{ width: '100%', backgroundColor: '#bb9af7', color: '#1a1b26' }}
              onClick={handleExportZip}
            >
              <i className="fa-solid fa-file-zipper"></i> ZIP İndir
            </button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="canvas-area">
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => viewModel.zoomOut()}>
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="zoom-level">{Math.round(state.zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => viewModel.zoomIn()}>
              <i className="fa-solid fa-plus"></i>
            </button>
            <div className="zoom-divider"></div>
            <button className="zoom-btn" onClick={() => viewModel.setZoom(1)}>
              <i className="fa-solid fa-compress"></i>
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="canvas-wrapper canvas-bg">
            {!state.isImageLoaded && (
              <div className="welcome">
                <i className="fa-solid fa-cloud-arrow-up welcome__icon"></i>
                <h2 className="welcome__title">Resim Yükleyin</h2>
                <p className="welcome__text">Başlamak için sol üstteki butonu kullanın veya sürükleyip bırakın.</p>
              </div>
            )}
            <canvas
              ref={mainCanvasRef}
              onMouseDown={handleCanvasMouseDown}
              style={{ cursor: state.isManualMode ? 'crosshair' : 'default' }}
            ></canvas>
          </div>
        </main>
      </div>

      {/* Frame Gallery */}
      <div className="gallery" id="framesGallery">
        {state.isImageLoaded && viewModel.getFrames().map((frame, index) => (
          <div
            key={index}
            className={`frame-item ${!frame.isActive ? 'frame-item--disabled' : ''}`}
            onClick={() => viewModel.toggleFrameActive(index)}
          >
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
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;