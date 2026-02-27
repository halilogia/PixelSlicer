// Domain Layer - Pure logic, framework independent
// Grid calculation formulas and frame management

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
  index: number;
  isActive: boolean;
}

export interface GridConfig {
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  padding: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Calculate grid-based frames from image dimensions
 */
export function calculateGridFrames(
  imageDims: ImageDimensions,
  config: GridConfig
): Frame[] {
  const { cols, rows, offsetX, offsetY, padding } = config;
  const frames: Frame[] = [];

  const frameWidth = Math.floor(imageDims.width / cols);
  const frameHeight = Math.floor(imageDims.height / rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      frames.push({
        x: col * frameWidth + offsetX + padding,
        y: row * frameHeight + offsetY + padding,
        w: frameWidth - padding * 2,
        h: frameHeight - padding * 2,
        index,
        isActive: true,
      });
    }
  }

  return frames;
}

/**
 * Check if two frames overlap
 */
export function framesOverlap(a: Frame, b: Frame): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

/**
 * Check if a frame is within image bounds
 */
export function isFrameInBounds(frame: Frame, imageDims: ImageDimensions): boolean {
  return (
    frame.x >= 0 &&
    frame.y >= 0 &&
    frame.x + frame.w <= imageDims.width &&
    frame.y + frame.h <= imageDims.height
  );
}

/**
 * Create a manual frame from drag coordinates
 */
export function createManualFrame(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  index: number
): Frame {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  return {
    x: Math.floor(x),
    y: Math.floor(y),
    w: Math.floor(w),
    h: Math.floor(h),
    index,
    isActive: true,
  };
}

/**
 * Resize frame from a handle (tl, tr, bl, br)
 */
export function resizeFrame(
  frame: Frame,
  handle: 'tl' | 'tr' | 'bl' | 'br',
  dx: number,
  dy: number,
  minSize: number = 5
): Frame {
  const newFrame = { ...frame };

  if (handle.includes('l')) {
    newFrame.x = frame.x + dx;
    newFrame.w = Math.max(minSize, frame.w - dx);
  }
  if (handle.includes('r')) {
    newFrame.w = Math.max(minSize, frame.w + dx);
  }
  if (handle.includes('t')) {
    newFrame.y = frame.y + dy;
    newFrame.h = Math.max(minSize, frame.h - dy);
  }
  if (handle.includes('b')) {
    newFrame.h = Math.max(minSize, frame.h + dy);
  }

  return newFrame;
}

/**
 * Get resize handle at given point
 */
export function getResizeHandleAt(
  pointX: number,
  pointY: number,
  frame: Frame,
  handleSize: number = 10
): 'tl' | 'tr' | 'bl' | 'br' | null {
  const handles = [
    { key: 'tl' as const, x: frame.x, y: frame.y },
    { key: 'tr' as const, x: frame.x + frame.w, y: frame.y },
    { key: 'bl' as const, x: frame.x, y: frame.y + frame.h },
    { key: 'br' as const, x: frame.x + frame.w, y: frame.y + frame.h },
  ];

  for (const handle of handles) {
    if (
      Math.abs(pointX - handle.x) <= handleSize &&
      Math.abs(pointY - handle.y) <= handleSize
    ) {
      return handle.key;
    }
  }

  return null;
}

/**
 * Calculate sprite sheet dimensions
 */
export function calculateSpriteSheet(
  frames: Frame[],
  columns: number
): { width: number; height: number } {
  if (frames.length === 0) {
    return { width: 0, height: 0 };
  }

  const rows = Math.ceil(frames.length / columns);
  let maxFrameWidth = 0;
  let maxFrameHeight = 0;

  for (const frame of frames) {
    maxFrameWidth = Math.max(maxFrameWidth, frame.w);
    maxFrameHeight = Math.max(maxFrameHeight, frame.h);
  }

  const width = maxFrameWidth * columns;
  const height = maxFrameHeight * rows;

  return { width, height };
}