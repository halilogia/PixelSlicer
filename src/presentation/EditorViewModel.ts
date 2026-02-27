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

export type StateListener = () => void;

export interface EditorState {
  // Image
  image: HTMLImageElement | null;
  imageDimensions: ImageDimensions | null;
  isImageLoaded: boolean;
  
  // Grid
  gridConfig: GridConfig;
  frames: Frame[];
  manualFrames: Frame[];
  
  // Manual Mode
  isManualMode: boolean;
  selectedManualFrameIndex: number;
  
  // Animation
  currentFrame: number;
  fps: number;
  isPlaying: boolean;
  
  // Zoom
  zoom: number;
  previewZoom: number;
  
  // Export
  sheetColumns: number;
}

const DEFAULT_STATE: EditorState = {
  image: null,
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
  currentFrame: 0,
  fps: 8,
  isPlaying: false,
  zoom: 1,
  previewZoom: -1, // -1 means auto-fit
  sheetColumns: 8,
};

export class EditorViewModel {
  private state: EditorState;
  private listeners: Set<StateListener> = new Set();
  private animationInterval: number | null = null;

  constructor() {
    this.state = { ...DEFAULT_STATE };
  }

  // State access
  getState(): EditorState {
    return this.state;
  }

  getFrames(): Frame[] {
    return [...this.state.frames, ...this.state.manualFrames];
  }

  getActiveFrames(): Frame[] {
    return this.getFrames().filter(f => f.isActive);
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
    this.recalculateFrames();
    this.notify();
  }

  clearImage(): void {
    this.state.image = null;
    this.state.imageDimensions = null;
    this.state.isImageLoaded = false;
    this.state.frames = [];
    this.state.manualFrames = [];
    this.state.currentFrame = 0;
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
    
    this.state.manualFrames.push(frame);
    this.notify();
  }

  updateManualFrame(index: number, frame: Frame): void {
    if (index >= 0 && index < this.state.manualFrames.length) {
      this.state.manualFrames[index] = frame;
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
      const frame = this.state.manualFrames[index];
      const resized = resizeFrame(frame, handle, dx, dy);
      this.state.manualFrames[index] = resized;
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

  getResizeHandle(x: number, y: number): 'tl' | 'tr' | 'bl' | 'br' | null {
    const index = this.state.selectedManualFrameIndex;
    if (index < 0 || index >= this.state.manualFrames.length) return null;
    
    return getResizeHandleAt(x, y, this.state.manualFrames[index]);
  }

  // Frame activation
  toggleFrameActive(index: number): void {
    const allFrames = this.getFrames();
    if (index >= 0 && index < allFrames.length) {
      allFrames[index].isActive = !allFrames[index].isActive;
      
      // Sync back to source arrays
      if (index < this.state.frames.length) {
        this.state.frames[index].isActive = allFrames[index].isActive;
      } else {
        const manualIndex = index - this.state.frames.length;
        if (manualIndex >= 0 && manualIndex < this.state.manualFrames.length) {
          this.state.manualFrames[manualIndex].isActive = allFrames[index].isActive;
        }
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

  startAnimation(): void {
    this.stopAnimation();
    
    const activeFrames = this.getActiveFrames();
    if (activeFrames.length === 0) return;
    
    this.state.isPlaying = true;
    
    this.animationInterval = window.setInterval(() => {
      this.state.currentFrame = (this.state.currentFrame + 1) % activeFrames.length;
      this.notify();
    }, 1000 / this.state.fps);
    
    this.notify();
  }

  stopAnimation(): void {
    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    this.state.isPlaying = false;
    this.notify();
  }

  // Export settings
  setSheetColumns(columns: number): void {
    this.state.sheetColumns = Math.max(1, columns);
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