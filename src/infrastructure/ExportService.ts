// Infrastructure Layer - Export services
// JSZip integration and Blob management

import JSZip from 'jszip';
import type { Frame } from '@domain/FrameLogic';

/**
 * Export frames as individual PNG files in a ZIP
 */
export async function exportAsZip(
  image: HTMLImageElement,
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
  image: HTMLImageElement,
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
  
  // Calculate max dimensions
  let maxWidth = 0;
  let maxHeight = 0;
  
  for (const frame of filteredFrames) {
    maxWidth = Math.max(maxWidth, frame.x + frame.w);
    maxHeight = Math.max(maxHeight, frame.y + frame.h);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw frames in sprite sheet layout
  for (let i = 0; i < filteredFrames.length; i++) {
    const frame = filteredFrames[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    
    const destX = col * maxWidth / columns;
    const destY = row * maxHeight / rows;
    
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