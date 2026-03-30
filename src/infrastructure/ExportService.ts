// Infrastructure Layer - Export services
// JSZip integration and Blob management

import JSZip from 'jszip';
import type { Frame } from '@domain/FrameLogic';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * Export frames as individual PNG files in a ZIP
 */
export async function exportAsZip(
  image: HTMLImageElement | HTMLCanvasElement,
  frames: Frame[],
  activeOnly: boolean = true
): Promise<Blob> {
  const zip = new JSZip();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const filteredFrames = activeOnly 
    ? frames.filter(f => f.isActive) 
    : frames;
  
  for (let i = 0; i < filteredFrames.length; i++) {
    const frame = filteredFrames[i];
    
    canvas.width = frame.w;
    canvas.height = frame.h;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, frame.w, frame.h
    );
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    
    zip.file(`frame_${String(i + 1).padStart(4, '0')}.png`, blob);
  }
  
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Export frames as a sprite sheet
 */
export async function exportAsSpriteSheet(
  image: HTMLImageElement | HTMLCanvasElement,
  frames: Frame[],
  columns: number,
  activeOnly: boolean = true
): Promise<Blob> {
  const filteredFrames = activeOnly 
    ? frames.filter(f => f.isActive) 
    : frames;
  
  if (filteredFrames.length === 0) {
    throw new Error('No active frames to export');
  }
  
  const rows = Math.ceil(filteredFrames.length / columns);
  
  // Calculate max dimensions of a single frame
  let maxFrameWidth = 0;
  let maxFrameHeight = 0;
  
  for (const frame of filteredFrames) {
    maxFrameWidth = Math.max(maxFrameWidth, frame.w);
    maxFrameHeight = Math.max(maxFrameHeight, frame.h);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = maxFrameWidth * columns;
  canvas.height = maxFrameHeight * rows;
  
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw frames in sprite sheet layout
  for (let i = 0; i < filteredFrames.length; i++) {
    const frame = filteredFrames[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    
    // Center the frame within its grid cell if it's smaller than the max dimensions
    const destX = col * maxFrameWidth + (maxFrameWidth - frame.w) / 2;
    const destY = row * maxFrameHeight + (maxFrameHeight - frame.h) / 2;
    
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      destX, destY, frame.w, frame.h
    );
  }
  
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Export a single frame as PNG
 */
export async function exportSingleFrame(
  image: HTMLImageElement | HTMLCanvasElement,
  frame: Frame
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = frame.w;
  canvas.height = frame.h;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    frame.x, frame.y, frame.w, frame.h,
    0, 0, frame.w, frame.h
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Export frames as an animated GIF
 */
export async function exportAsGif(
  image: HTMLImageElement | HTMLCanvasElement,
  frames: Frame[],
  fps: number,
  activeOnly: boolean = true
): Promise<Blob> {
  const filteredFrames = activeOnly 
    ? frames.filter(f => f.isActive) 
    : frames;
  
  if (filteredFrames.length === 0) {
    throw new Error('No active frames to export');
  }

  // Find max dimensions to ensure all frames fit
  let maxW = 0;
  let maxH = 0;
  for (const frame of filteredFrames) {
    maxW = Math.max(maxW, frame.w);
    maxH = Math.max(maxH, frame.h);
  }

  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = maxH;
  // willReadFrequently is important for getImageData performance
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);

  // We need a common palette for the whole GIF for best results or per-frame palette.
  // We'll use per-frame palette with quantize() for simplicity and robustness.
  for (const frame of filteredFrames) {
    ctx.clearRect(0, 0, maxW, maxH);
    
    // Center the frame
    const destX = (maxW - frame.w) / 2;
    const destY = (maxH - frame.h) / 2;
    
    ctx.drawImage(
      image,
      frame.x, frame.y, frame.w, frame.h,
      destX, destY, frame.w, frame.h
    );

    const { data } = ctx.getImageData(0, 0, maxW, maxH);
    
    // Quantize the colors to 256
    const palette = quantize(data, 256, { format: 'rgba4444', clearAlpha: true, clearAlphaThreshold: 0, clearAlphaColor: 0x00 });
    const index = applyPalette(data, palette, 'rgba4444');
    
    // Transparent index is usually 0 if clearAlphaColor is 0x00 and it was empty space
    gif.writeFrame(index, maxW, maxH, { palette, delay, transparent: true, transparentIndex: 0 });
  }

  gif.finish();
  const buffer = gif.bytes();
  return new Blob([buffer], { type: 'image/gif' });
}

/**
 * Trigger file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}