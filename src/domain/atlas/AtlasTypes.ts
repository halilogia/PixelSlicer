// Domain Layer - Atlas Packer types
// Framework independent, shared by the packer, the exporters and the worker.

/** Raw RGBA pixels. Structurally compatible with `ImageData`. */
export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Normalized (0..1) origin inside a sprite rect. */
export interface Pivot {
  x: number;
  y: number;
}

export const PIVOT_MODES = [
  'topLeft',
  'topCenter',
  'center',
  'bottomCenter',
  'custom',
] as const;

export type PivotMode = (typeof PIVOT_MODES)[number];

/** A frame that has been measured for packing (trimmed size + pivot). */
export interface MeasuredSprite {
  /** Stable name used as the key in every exported metadata file. */
  name: string;
  /** Position inside the source sheet, before trimming. */
  source: Rect;
  /** Position actually stored in the atlas page, after trimming. */
  trimmed: Rect;
  /** Offset of the trimmed content relative to the untrimmed frame origin. */
  offset: Point;
  pivot: Pivot;
  wasTrimmed: boolean;
}

export interface AtlasPage {
  index: number;
  width: number;
  height: number;
}

export interface AtlasSprite extends MeasuredSprite {
  /** Index of the source frame, as reported by the slicer. */
  frameIndex: number;
  /** Unique position inside the layout, stable across pages. */
  order: number;
  page: number;
  /** Visible pixel content inside the atlas page. */
  atlas: Rect;
  /** Full occupied box (content + padding + extrude ring). */
  box: Rect;
  /** True when the sprite is stored rotated by 90 degrees. */
  rotated: boolean;
}

export interface AtlasLayout {
  pages: AtlasPage[];
  sprites: AtlasSprite[];
  /** Ratio of used pixels over the total atlas pixels, 0..1. */
  occupancy: number;
  /** Pixels saved by trimming compared to a naive 1:1 copy. */
  savedPixels: number;
  /** Empty, duplicated and oversized frames worth telling the user about. */
  warnings: AtlasWarning[];
}

export interface AtlasPackOptions {
  /** Transparent gap between two sprites, in pixels. */
  padding: number;
  /** Size of the border ring replicated around each sprite to avoid bleeding. */
  extrude: number;
  /** Round every page size up to the next power of two. */
  powerOfTwo: boolean;
  /** Hard cap for a single page, in pixels. */
  maxPageSize: number;
  /** Drop fully transparent borders before packing. */
  trim: boolean;
  /** Alpha value (0..255) above which a pixel counts as content. */
  alphaThreshold: number;
  pivotMode: PivotMode;
  customPivot: Pivot | null;
  /** Allow 90° rotated sprites, which packs tighter but needs engine support. */
  allowRotation: boolean;
  /**
   * Frames per animation. Groups are kept on a single page so engines never
   * swap textures mid animation. 0 packs freely.
   */
  framesPerGroup: number;
  /** Name of the first sprite; the rest are numbered from there. */
  namePrefix: string;
  /** Index of the first sprite, used with `namePrefix`. */
  nameStartIndex: number;
}

export const DEFAULT_ATLAS_PACK_OPTIONS: AtlasPackOptions = {
  padding: 2,
  extrude: 0,
  powerOfTwo: true,
  maxPageSize: 4096,
  trim: true,
  alphaThreshold: 0,
  pivotMode: 'center',
  customPivot: null,
  allowRotation: false,
  framesPerGroup: 0,
  namePrefix: 'frame_',
  nameStartIndex: 1,
};

/** A frame that carries no content at all. */
export interface AtlasWarning {
  kind: 'empty' | 'duplicate' | 'oversized';
  frameIndex: number;
  name: string;
  message: string;
}

export const ATLAS_FORMATS = ['phaser', 'godot', 'unity', 'starling'] as const;

export type AtlasFormat = (typeof ATLAS_FORMATS)[number];
