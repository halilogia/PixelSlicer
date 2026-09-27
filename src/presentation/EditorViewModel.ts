// Presentation Layer - Editor ViewModel
// Main state management with reactive updates

import { 
  Frame, 
  GridConfig, 
  ImageDimensions,
  calculateGridFrames,
  createManualFrame,
  resizeFrame,
  getResizeHandleAt,
} from '@domain/FrameLogic';
import type { Pivot, PivotMode } from '@domain/atlas/AtlasTypes';
import { normalizePivot } from '@domain/atlas/AtlasPivot';
import { removeBackgroundColor } from '@infrastructure/BackgroundRemoval';
import type { AtlasSourceImage } from '@infrastructure/atlas/AtlasRenderer';

export type StateListener = () => void;

export interface EditorState {
  // Image
  image: HTMLImageElement | null;
  processedImage: AtlasSourceImage | null;
  imageDimensions: ImageDimensions | null;
  isImageLoaded: boolean;
  
  // Grid
  gridConfig: GridConfig;
  frames: Frame[];
  manualFrames: Frame[];
  
  // Manual Mode
  isManualMode: boolean;
  selectedManualFrameIndex: number;
  
  // Drawing State (for real-time visual feedback)
  isDrawing: boolean;
  drawStartX: number;
  drawStartY: number;
  drawCurrentX: number;
  drawCurrentY: number;
  
  // Animation
  currentFrame: number;
  fps: number;
  isPlaying: boolean;
  singlePreviewFrameIndex: number | null; // For previewing a single frame
  
  // Zoom
  zoom: number;
  previewZoom: number;
  
  // Export
  sheetColumns: number;

  // Atlas Packer / Pivot
  /** Default origin for frames without a manual pick. */
  pivotMode: PivotMode;
  /** Click on a frame to place its origin. */
  isPivotPicking: boolean;
  /** Drop the transparent borders before packing. */
  atlasTrim: boolean;
  /** Alpha value above which a pixel counts as content while trimming. */
  atlasAlphaThreshold: number;
  
  // Effects
  removeBackground: boolean;
  removeBgColor: { r: number, g: number, b: number, tolerance: number };
}

const DEFAULT_STATE: EditorState = {
  image: null,
  processedImage: null,
  imageDimensions: null,
  isImageLoaded: false,
  gridConfig: {
    cols: 4,
    rows: 2,
    offsetX: 0,
    offsetY: 0,
    padding: 0,
  },
  frames: [],
  manualFrames: [],
  isManualMode: false,
  selectedManualFrameIndex: -1,
  isDrawing: false,
  drawStartX: 0,
  drawStartY: 0,
  drawCurrentX: 0,
  drawCurrentY: 0,
  currentFrame: 0,
  fps: 8,
  isPlaying: false,
  singlePreviewFrameIndex: null,
  zoom: 1,
  previewZoom: -1, // -1 means auto-fit
  sheetColumns: 8,
  pivotMode: 'center',
  isPivotPicking: false,
  atlasTrim: true,
  atlasAlphaThreshold: 0,
  removeBackground: false,
  removeBgColor: { r: 0, g: 0, b: 0, tolerance: 30 },
};

export class EditorViewModel {
  private state: EditorState;
  private listeners: Set<StateListener> = new Set();
  private animationFrameId: number | null = null;
  private lastAnimationStep: number = 0;
  
  // Drawing/Resize/Drag state
  private _isDrawing = false;
  private _isResizing = false;
  private _isDragging = false;
  private drawStartX = 0;
  private drawStartY = 0;
  private currentDrawEndX = 0;
  private currentDrawEndY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private resizeHandle: 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private initialFrameState: Frame | null = null;

  // Frame list caches: rebuilding a 1000 element array on every read makes the
  // React dependency checks useless, so the list is memoized. The frame arrays
  // are immutable, their identity is the cache key. Each cache keeps its own
  // key, otherwise reading one list would mark the other as up to date.
  private framesCache: Frame[] = [];
  private framesCacheSource: { frames: readonly Frame[]; manual: readonly Frame[] } | null = null;
  private activeFramesCache: Frame[] = [];
  private activeFramesCacheSource: {
    frames: readonly Frame[];
    manual: readonly Frame[];
    manualMode: boolean;
  } | null = null;
  /** Guards the asynchronous background removal against out of order results. */
  private processedToken = 0;

  constructor() {
    // Fresh array instances: the defaults are shared module state and
    // `addManualFrame` mutates the manual list in place.
    this.state = { ...DEFAULT_STATE, frames: [], manualFrames: [] };
  }

  // State access
  getState(): EditorState {
    return this.state;
  }

  getFrames(): readonly Frame[] {
    const { frames, manualFrames } = this.state;
    const cache = this.framesCacheSource;

    if (cache?.frames !== frames || cache.manual !== manualFrames) {
      this.framesCache = [...frames, ...manualFrames];
      this.framesCacheSource = { frames, manual: manualFrames };
    }

    return this.framesCache;
  }

  getActiveFrames(): readonly Frame[] {
    const { frames, manualFrames, isManualMode } = this.state;
    const cache = this.activeFramesCacheSource;

    if (cache?.frames !== frames || cache.manual !== manualFrames || cache.manualMode !== isManualMode) {
      // In manual mode the grid frames are hidden, so only manual ones count.
      this.activeFramesCache = isManualMode
        ? manualFrames.filter(frame => frame.isActive)
        : this.getFrames().filter(frame => frame.isActive);
      this.activeFramesCacheSource = { frames, manual: manualFrames, manualMode: isManualMode };
    }

    return this.activeFramesCache;
  }

  // Subscription
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  // Image operations
  setImage(image: HTMLImageElement): void {
    this.state.image = image;
    this.state.imageDimensions = {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    this.state.isImageLoaded = true;
    void this.updateProcessedImage();
    this.recalculateFrames();
    this.notify();
  }

  clearImage(): void {
    this.state.image = null;
    this.state.processedImage = null;
    this.state.imageDimensions = null;
    this.state.isImageLoaded = false;
    this.state.frames = [];
    this.state.manualFrames = [];
    this.state.currentFrame = 0;
    this.state.isPivotPicking = false;
    this.stopAnimation();
    this.notify();
  }

  // Grid operations
  setGridConfig(config: Partial<GridConfig>): void {
    this.state.gridConfig = { ...this.state.gridConfig, ...config };
    this.recalculateFrames();
    this.notify();
  }

  private recalculateFrames(): void {
    if (!this.state.imageDimensions) return;
    
    this.state.frames = calculateGridFrames(
      this.state.imageDimensions,
      this.state.gridConfig
    );
  }

  // Manual frame operations
  toggleManualMode(): void {
    this.state.isManualMode = !this.state.isManualMode;
    this.state.selectedManualFrameIndex = -1;
    this.notify();
  }

  addManualFrame(startX: number, startY: number, endX: number, endY: number): void {
    if (!this.state.imageDimensions) return;
    
    const frame = createManualFrame(
      startX, startY, endX, endY,
      this.state.manualFrames.length
    );
    
    // The frame arrays are always replaced, never mutated in place: their
    // identity is what invalidates the memoized getters.
    this.state.manualFrames = [...this.state.manualFrames, frame];
    this.notify();
  }

  updateManualFrame(index: number, frame: Frame): void {
    if (index >= 0 && index < this.state.manualFrames.length) {
      this.state.manualFrames = this.state.manualFrames.map((current, i) =>
        i === index ? frame : current
      );
      this.notify();
    }
  }

  resizeManualFrame(
    index: number,
    handle: 'tl' | 'tr' | 'bl' | 'br',
    dx: number,
    dy: number
  ): void {
    if (index >= 0 && index < this.state.manualFrames.length) {
      const resized = resizeFrame(this.state.manualFrames[index], handle, dx, dy);
      this.state.manualFrames = this.state.manualFrames.map((current, i) =>
        i === index ? resized : current
      );
      this.notify();
    }
  }

  selectManualFrame(index: number): void {
    this.state.selectedManualFrameIndex = index;
    this.notify();
  }

  clearManualFrames(): void {
    this.state.manualFrames = [];
    this.state.selectedManualFrameIndex = -1;
    this.notify();
  }

  deleteManualFrame(index: number): void {
    if (index >= 0 && index < this.state.manualFrames.length) {
      // Drop the frame and re-index the rest in one immutable step
      this.state.manualFrames = this.state.manualFrames
        .filter((_, i) => i !== index)
        .map((frame, i) => ({ ...frame, index: i }));

      // Adjust selected index if necessary
      if (this.state.selectedManualFrameIndex === index) {
        this.state.selectedManualFrameIndex = -1;
      } else if (this.state.selectedManualFrameIndex > index) {
        this.state.selectedManualFrameIndex--;
      }

      this.notify();
    }
  }

  getResizeHandle(x: number, y: number): 'tl' | 'tr' | 'bl' | 'br' | null {
    const index = this.state.selectedManualFrameIndex;
    if (index < 0 || index >= this.state.manualFrames.length) return null;
    
    return getResizeHandleAt(x, y, this.state.manualFrames[index]);
  }

  // Frame activation
  toggleFrameActive(index: number): void {
    const allFrames = this.getFrames();
    if (index >= 0 && index < allFrames.length) {
      const newIsActive = !allFrames[index].isActive;
      
      // Create new arrays to trigger React re-render
      if (index < this.state.frames.length) {
        // It's a grid frame
        this.state.frames = this.state.frames.map((f, i) =>
          i === index ? { ...f, isActive: newIsActive } : f
        );
      } else {
        // It's a manual frame
        const manualIndex = index - this.state.frames.length;
        this.state.manualFrames = this.state.manualFrames.map((f, i) =>
          i === manualIndex ? { ...f, isActive: newIsActive } : f
        );
      }
      
      this.notify();
    }
  }

  // Zoom operations
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(10, zoom));
    this.notify();
  }

  zoomIn(): void {
    this.setZoom(this.state.zoom + 0.1);
  }

  zoomOut(): void {
    this.setZoom(this.state.zoom - 0.1);
  }

  setPreviewZoom(zoom: number): void {
    this.state.previewZoom = zoom;
    this.notify();
  }

  // Animation
  setFps(fps: number): void {
    this.state.fps = Math.max(1, Math.min(60, fps));
    if (this.state.isPlaying) {
      this.startAnimation();
    }
    this.notify();
  }

  /**
   * Play the animation with requestAnimationFrame instead of a timer, so the
   * preview stays in sync with the display and stops burning CPU in background
   * tabs. Frame timing is derived from the elapsed time, which keeps a dropped
   * frame from shifting the whole animation.
   */
  startAnimation(): void {
    this.stopAnimation();

    const activeFrames = this.getActiveFrames();
    if (activeFrames.length === 0) return;

    this.state.isPlaying = true;
    this.lastAnimationStep = performance.now();
    this.notify();

    const step = (now: number): void => {
      if (!this.state.isPlaying) return;

      const frameDuration = 1000 / this.state.fps;
      const elapsed = now - this.lastAnimationStep;

      if (elapsed >= frameDuration) {
        this.lastAnimationStep = now - (elapsed % frameDuration);
        this.state.currentFrame = (this.state.currentFrame + 1) % activeFrames.length;
        this.notify();
      }

      this.animationFrameId = requestAnimationFrame(step);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.state.isPlaying = false;
    this.notify();
  }

  // Preview single frame (when clicking on gallery item)
  previewSingleFrame(index: number): void {
    this.stopAnimation();
    this.state.singlePreviewFrameIndex = index;
    this.notify();
  }

  clearSinglePreview(): void {
    this.state.singlePreviewFrameIndex = null;
    this.notify();
  }

  // Export settings
  setSheetColumns(columns: number): void {
    this.state.sheetColumns = Math.max(1, columns);
    this.notify();
  }

  // Atlas packer & pivot
  setPivotMode(mode: PivotMode): void {
    this.state.pivotMode = mode;
    this.notify();
  }

  togglePivotPicking(): void {
    this.state.isPivotPicking = !this.state.isPivotPicking;
    this.notify();
  }

  setAtlasTrim(enabled: boolean): void {
    this.state.atlasTrim = enabled;
    this.notify();
  }

  setAtlasAlphaThreshold(value: number): void {
    this.state.atlasAlphaThreshold = Math.max(0, Math.min(255, value));
    this.notify();
  }

  /**
   * Store (or clear with null) the picked origin of a frame.
   * `index` is the position inside getFrames(), grid frames first.
   */
  setFramePivot(index: number, pivot: Pivot | null): void {
    const gridCount = this.state.frames.length;
    const isManual = index >= gridCount;
    const localIndex = isManual ? index - gridCount : index;
    const list = isManual ? this.state.manualFrames : this.state.frames;

    if (localIndex < 0 || localIndex >= list.length) return;

    const updated = list.map((frame, i) => {
      if (i !== localIndex) return frame;
      const next = { ...frame };
      if (pivot) {
        next.pivot = normalizePivot(pivot);
      } else {
        delete next.pivot;
      }
      return next;
    });

    if (isManual) {
      this.state.manualFrames = updated;
    } else {
      this.state.frames = updated;
    }

    if (pivot) {
      this.state.pivotMode = 'custom';
    }
    this.notify();
  }

  /** Number of frames carrying a manually picked origin. */
  getPickedPivotCount(): number {
    return this.getFrames().filter(frame => frame.pivot !== undefined).length;
  }

  clearFramePivots(): void {
    const strip = (frame: Frame): Frame => {
      if (!frame.pivot) return frame;
      const next = { ...frame };
      delete next.pivot;
      return next;
    };
    this.state.frames = this.state.frames.map(strip);
    this.state.manualFrames = this.state.manualFrames.map(strip);
    this.notify();
  }
  
  // Reset fine-tune settings
  resetFineTune(): void {
    this.state.gridConfig.offsetX = 0;
    this.state.gridConfig.offsetY = 0;
    this.state.gridConfig.padding = 0;
    this.recalculateFrames();
    this.notify();
  }
  
  // Effects settings
  toggleRemoveBackground(): Promise<void> {
    this.state.removeBackground = !this.state.removeBackground;
    this.notify();
    // Awaitable so callers and tests can wait for the worker round trip.
    return this.updateProcessedImage();
  }

  setRemoveBgColor(r: number, g: number, b: number, tolerance: number): Promise<void> {
    this.state.removeBgColor = { r, g, b, tolerance };
    if (!this.state.removeBackground) {
      // The colour is also used by the eyedropper preview, so it is published.
      this.notify();
      return Promise.resolve();
    }
    return this.updateProcessedImage();
  }

  /**
   * Rebuild the processed image. The pixel walk is handed to a worker when
   * OffscreenCanvas is available, so a huge sheet does not freeze the editor.
   */
  private async updateProcessedImage(): Promise<void> {
    if (!this.state.image || !this.state.imageDimensions) return;

    // The pixel walk is asynchronous, so a slow run must never overwrite the
    // result of a newer one.
    const token = ++this.processedToken;

    if (!this.state.removeBackground) {
      this.state.processedImage = this.state.image;
      this.notify();
      return;
    }

    const { r, g, b, tolerance } = this.state.removeBgColor;

    try {
      const result = await removeBackgroundColor(this.state.image, r, g, b, tolerance);
      if (token !== this.processedToken) return;
      this.state.processedImage = result;
    } catch (error) {
      if (token !== this.processedToken) return;
      console.error('Background removal failed:', error);
      this.state.processedImage = this.state.image;
    }
    this.notify();
  }
  
  // Drawing state management
  isDrawing(): boolean {
    return this._isDrawing;
  }
  
  isResizing(): boolean {
    return this._isResizing;
  }
  
  isDragging(): boolean {
    return this._isDragging;
  }
  
  getDrawingState(): { isDrawing: boolean; startX: number; startY: number; currentX: number; currentY: number } | null {
    if (!this._isDrawing) return null;
    return {
      isDrawing: this._isDrawing,
      startX: this.drawStartX,
      startY: this.drawStartY,
      currentX: this.currentDrawEndX,
      currentY: this.currentDrawEndY,
    };
  }
  
  startDrawing(x: number, y: number): void {
    this._isDrawing = true;
    this.drawStartX = x;
    this.drawStartY = y;
    this.currentDrawEndX = x;
    this.currentDrawEndY = y;
    
    // Update drawing state in state for UI feedback
    this.state.isDrawing = true;
    this.state.drawStartX = x;
    this.state.drawStartY = y;
    this.state.drawCurrentX = x;
    this.state.drawCurrentY = y;
    
    // Create a new manual frame to draw
    // Create new array to trigger React re-render
    const frame = createManualFrame(x, y, x, y, this.state.manualFrames.length);
    this.state.manualFrames = [...this.state.manualFrames, frame];
    this.notify();
  }
  
  updateDrawing(x: number, y: number): void {
    if (!this._isDrawing) return;
    
    // Update current drawing coordinates for real-time feedback
    this.currentDrawEndX = x;
    this.currentDrawEndY = y;
    
    // Update drawing state
    this.state.drawCurrentX = x;
    this.state.drawCurrentY = y;
    
    // Update the last manual frame being drawn
    const lastIndex = this.state.manualFrames.length - 1;
    if (lastIndex >= 0) {
      // Create new array and frame object to trigger React re-render
      const currentFrame = this.state.manualFrames[lastIndex];
      const updatedFrame = {
        ...currentFrame,
        w: x - this.drawStartX,
        h: y - this.drawStartY,
      };
      this.state.manualFrames = [
        ...this.state.manualFrames.slice(0, lastIndex),
        updatedFrame,
      ];
      this.notify();
    }
  }
  
  endDrawing(): void {
    if (!this._isDrawing) return;
    
    // Clean up invalid frames (too small)
    const lastIndex = this.state.manualFrames.length - 1;
    if (lastIndex >= 0) {
      const frame = this.state.manualFrames[lastIndex];
      if (Math.abs(frame.w) < 5 || Math.abs(frame.h) < 5) {
        // Remove too small frames by creating new array
        this.state.manualFrames = this.state.manualFrames.slice(0, lastIndex);
      } else {
        // Normalize negative dimensions by creating new frame object
        let normalizedFrame = { ...frame };
        if (frame.w < 0) {
          normalizedFrame.x += frame.w;
          normalizedFrame.w = Math.abs(frame.w);
        }
        if (frame.h < 0) {
          normalizedFrame.y += frame.h;
          normalizedFrame.h = Math.abs(frame.h);
        }
        this.state.manualFrames = [
          ...this.state.manualFrames.slice(0, lastIndex),
          normalizedFrame,
        ];
      }
    }
    
    this._isDrawing = false;
    this.state.isDrawing = false;
    this.notify();
  }
  
  cancelDrawing(): void {
    if (!this._isDrawing) return;
    
    // Remove the incomplete frame
    const lastIndex = this.state.manualFrames.length - 1;
    if (lastIndex >= 0) {
      const frame = this.state.manualFrames[lastIndex];
      if (frame.w === 0 && frame.h === 0) {
        // Create new array without the last frame
        this.state.manualFrames = this.state.manualFrames.slice(0, lastIndex);
      }
    }
    
    this._isDrawing = false;
    this.state.isDrawing = false;
    this.notify();
  }
  
  startDrag(x: number, y: number): void {
    this._isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;
  }
  
  updateDrag(x: number, y: number): void {
    if (!this._isDragging) return;
    
    const index = this.state.selectedManualFrameIndex;
    if (index >= 0 && index < this.state.manualFrames.length) {
      const frame = this.state.manualFrames[index];
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      
      // Create new frame object and array to trigger React re-render
      const updatedFrame = {
        ...frame,
        x: frame.x + dx,
        y: frame.y + dy,
      };
      
      this.state.manualFrames = [
        ...this.state.manualFrames.slice(0, index),
        updatedFrame,
        ...this.state.manualFrames.slice(index + 1),
      ];
      
      this.dragStartX = x;
      this.dragStartY = y;
      this.notify();
    }
  }
  
  endDrag(): void {
    this._isDragging = false;
    this.notify();
  }
  
  startResize(handle: 'tl' | 'tr' | 'bl' | 'br', x: number, y: number): void {
    const index = this.state.selectedManualFrameIndex;
    if (index < 0 || index >= this.state.manualFrames.length) return;
    
    this._isResizing = true;
    this.resizeHandle = handle;
    this.initialFrameState = { ...this.state.manualFrames[index] };
    this.dragStartX = x;
    this.dragStartY = y;
  }
  
  updateResize(x: number, y: number): void {
    if (!this._isResizing || !this.initialFrameState) return;
    
    const index = this.state.selectedManualFrameIndex;
    if (index < 0 || index >= this.state.manualFrames.length) return;
    
    const frame = this.state.manualFrames[index];
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;
    
    // Create new frame object to trigger React re-render
    let updatedFrame = { ...frame };
    
    if (this.resizeHandle?.includes('l')) {
      updatedFrame.x = this.initialFrameState.x + dx;
      updatedFrame.w = this.initialFrameState.w - dx;
    }
    if (this.resizeHandle?.includes('r')) {
      updatedFrame.w = this.initialFrameState.w + dx;
    }
    if (this.resizeHandle?.includes('t')) {
      updatedFrame.y = this.initialFrameState.y + dy;
      updatedFrame.h = this.initialFrameState.h - dy;
    }
    if (this.resizeHandle?.includes('b')) {
      updatedFrame.h = this.initialFrameState.h + dy;
    }
    
    // Minimum size protection
    if (updatedFrame.w < 5) updatedFrame.w = 5;
    if (updatedFrame.h < 5) updatedFrame.h = 5;
    
    // Create new array to trigger React re-render
    this.state.manualFrames = [
      ...this.state.manualFrames.slice(0, index),
      updatedFrame,
      ...this.state.manualFrames.slice(index + 1),
    ];
    
    this.notify();
  }
  
  endResize(): void {
    this._isResizing = false;
    this.resizeHandle = null;
    this.initialFrameState = null;
    this.notify();
  }

  // Canvas coordinate conversion
  getCanvasCoordinates(
    canvas: HTMLCanvasElement, 
    clientX: number, 
    clientY: number
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX / this.state.zoom,
      y: (clientY - rect.top) * scaleY / this.state.zoom,
    };
  }
}