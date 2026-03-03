/**
 * Video Frame Grid Service
 * Creates a grid layout from video frames and integrates with EditorViewModel
 * Generates a sprite sheet from extracted frames for seamless integration
 */

import { ExtractedFrame } from './VideoFrameExtractor';

export interface FrameGridConfig {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  spacing: number;
}

export interface VideoFrameGrid {
  spriteSheet: HTMLCanvasElement;
  config: FrameGridConfig;
  totalFrames: number;
}

export class VideoFrameGridService {
  /**
   * Calculate optimal grid layout for video frames
   */
  static calculateOptimalGrid(
    totalFrames: number,
    frameWidth: number,
    frameHeight: number,
    maxCanvasWidth: number = 4096
  ): FrameGridConfig {
    // Calculate optimal columns based on frame count and canvas size limit
    const maxColumns = Math.floor(maxCanvasWidth / frameWidth);
    
    // Use square root approach for balanced grid
    const idealColumns = Math.ceil(Math.sqrt(totalFrames));
    const columns = Math.min(idealColumns, maxColumns, totalFrames);
    const rows = Math.ceil(totalFrames / columns);
    
    return {
      columns,
      rows,
      frameWidth,
      frameHeight,
      spacing: 0,
    };
  }

  /**
   * Create a sprite sheet from extracted video frames
   * This allows seamless integration with EditorViewModel
   */
  static async createSpriteSheetFromFrames(
    frames: ExtractedFrame[],
    maxCanvasWidth: number = 4096
  ): Promise<VideoFrameGrid> {
    if (frames.length === 0) {
      throw new Error('No frames provided');
    }

    // Get frame dimensions from first frame
    const firstFrame = frames[0];
    const frameWidth = firstFrame.canvas?.width || firstFrame.imageData.width;
    const frameHeight = firstFrame.canvas?.height || firstFrame.imageData.height;

    // Calculate optimal grid
    const config = this.calculateOptimalGrid(
      frames.length,
      frameWidth,
      frameHeight,
      maxCanvasWidth
    );

    // Create sprite sheet canvas
    const spriteSheetWidth = config.columns * frameWidth;
    const spriteSheetHeight = config.rows * frameHeight;
    
    const spriteSheet = document.createElement('canvas');
    spriteSheet.width = spriteSheetWidth;
    spriteSheet.height = spriteSheetHeight;
    
    const ctx = spriteSheet.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw each frame onto the sprite sheet
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const col = i % config.columns;
      const row = Math.floor(i / config.columns);
      const x = col * frameWidth;
      const y = row * frameHeight;

      if (frame.canvas) {
        ctx.drawImage(frame.canvas, x, y);
      } else {
        // Create temporary canvas from ImageData
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(frame.imageData, 0, 0);
          ctx.drawImage(tempCanvas, x, y);
        }
      }
    }

    return {
      spriteSheet,
      config,
      totalFrames: frames.length,
    };
  }

  /**
   * Convert canvas to HTMLImageElement for EditorViewModel compatibility
   */
  static canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to convert canvas to image'));
      img.src = canvas.toDataURL('image/png');
    });
  }

  /**
   * Clean up frame resources to prevent memory leaks
   */
  static cleanupFrames(frames: ExtractedFrame[]): void {
    frames.forEach(frame => {
      if (frame.canvas) {
        frame.canvas.width = 0;
        frame.canvas.height = 0;
      }
      // Clear imageData reference
      (frame as { imageData: ImageData | null }).imageData = null as unknown as ImageData;
    });
  }
}

// Singleton instance
export const videoFrameGridService = new VideoFrameGridService();
