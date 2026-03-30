declare module 'gifenc' {
  export function GIFEncoder(opts?: any): any;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: any): any;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: any, format?: string): Uint8Array;
}
