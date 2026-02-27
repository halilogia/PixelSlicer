// Infrastructure Layer - External service integrations
// GIF decoding using omggif

import Gif from 'omggif';

export interface GifFrame {
  data: ImageData;
  width: number;
  height: number;
  delay: number;
}

export interface GifInfo {
  width: number;
  height: number;
  frames: GifFrame[];
}

/**
 * Decode a GIF file and extract frames
 */
export async function decodeGif(file: File): Promise<GifInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const gif = new Gif.GifReader(uint8Array);
        const frames: GifFrame[] = [];
        
        const width = gif.width;
        const height = gif.height;
        
        // Get frame info
        const numFrames = gif.numFrames();
        
        for (let i = 0; i < numFrames; i++) {
          const frameInfo = gif.frameInfo(i);
          const pixels = new Uint8ClampedArray(width * height * 4);
          
          // Decode frame pixels
          gif.decodeAndBlitFrameRGBA(i, pixels);
          
          const imageData = new ImageData(pixels, width, height);
          
          frames.push({
            data: imageData,
            width,
            height,
            delay: (frameInfo.delay || 8) * 10, // Convert to ms
          });
        }
        
        resolve({ width, height, frames });
      } catch (error) {
        reject(new Error(`Failed to decode GIF: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract the first frame as an ImageBitmap for preview
 */
export async function extractGifPreview(file: File): Promise<ImageBitmap> {
  const gifInfo = await decodeGif(file);
  const firstFrame = gifInfo.frames[0];
  
  return createImageBitmap(firstFrame.data);
}