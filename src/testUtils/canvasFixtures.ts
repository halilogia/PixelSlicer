// Test fixtures for the canvas layer (no real browser canvas required).

export interface DrawCall {
  args: number[];
}

export class FakeContext {
  calls: DrawCall[] = [];
  cleared: DrawCall[] = [];
  imageSmoothingEnabled = true;
  saved = 0;
  restored = 0;
  lastImageData: ImageData | null = null;

  clearRect(...args: number[]): void {
    this.cleared.push({ args });
  }

  drawImage(_image: CanvasImageSource, ...args: number[]): void {
    this.calls.push({ args });
  }

  putImageData(data: ImageData, _x: number, _y: number): void {
    this.lastImageData = data;
  }

  save(): void {
    this.saved++;
  }

  restore(): void {
    this.restored++;
  }

  getImageData(_x: number, _y: number, width: number, height: number): ImageData {
    return { data: new Uint8ClampedArray(width * height * 4), width, height, colorSpace: 'srgb' };
  }
}

export class FakeCanvas {
  width = 0;
  height = 0;
  context = new FakeContext();
  lastContext: FakeContext | null = null;

  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }

  getContext(): FakeContext {
    this.lastContext = this.context;
    return this.context;
  }
}

export class FakeConvertibleCanvas extends FakeCanvas {
  payload = 'atlas';

  async convertToBlob(): Promise<Blob> {
    return new Blob([this.payload], { type: 'image/png' });
  }
}
