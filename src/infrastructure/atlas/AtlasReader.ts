// Infrastructure Layer - Atlas reader
// Reads back the descriptors PixelSlicer writes, so an atlas can be re-imported
// into the editor. Only the formats this tool produces are understood.

import type { Frame } from '@domain/FrameLogic';
import { atlasGuid } from './AtlasMetadataExporters';

export interface ImportedAtlas {
  /** The descriptor file the sprites came from, for the UI. */
  source: string;
  width: number;
  height: number;
  frames: Frame[];
  warnings: string[];
}

interface RectLike {
  x: number;
  y: number;
  w: number;
  h: number;
  width: number;
  height: number;
}

function readRect(value: RectLike | undefined): { x: number; y: number; w: number; h: number } {
  if (!value) return { x: 0, y: 0, w: 0, h: 0 };
  const w = value.w ?? value.width;
  const h = value.h ?? value.height;
  return { x: value.x, y: value.y, w, h };
}

function makeFrame(
  index: number,
  rect: { x: number; y: number; w: number; h: number },
  offset: { x: number; y: number },
  source: { w: number; h: number }
): Frame {
  return {
    x: rect.x - offset.x,
    y: rect.y - offset.y,
    w: source.w,
    h: source.h,
    index,
    isActive: true,
  };
}

interface PhaserEntry {
  filename?: string;
  frame?: RectLike;
  spriteSourceSize?: RectLike;
  sourceSize?: RectLike;
  rotated?: boolean;
}

/** Phaser JSON Hash or JSON Array. */
export function readPhaserAtlas(json: unknown, source: string): ImportedAtlas | null {
  const meta = (json as { meta?: { size?: { w: number; h: number }; image?: string } })?.meta;
  const rawFrames = (json as { frames?: unknown })?.frames;
  if (!rawFrames) return null;

  const entries: PhaserEntry[] = Array.isArray(rawFrames)
    ? (rawFrames as PhaserEntry[])
    : Object.entries(rawFrames as Record<string, PhaserEntry>).map(([name, value]) => ({
        ...value,
        filename: name,
      }));

  const warnings: string[] = [];
  const frames = entries.map((entry, index) => {
    const name = entry.filename ?? `frame_${index + 1}`;
    const rect = readRect(entry.frame);
    const offset = readRect(entry.spriteSourceSize);
    const size = readRect(entry.sourceSize);

    if (entry.rotated) {
      warnings.push(`${name} is rotated; the frame is imported upright.`);
    }

    return makeFrame(index, rect, offset, { w: size.w, h: size.h });
  });

  return {
    source,
    width: meta?.size?.w ?? 0,
    height: meta?.size?.h ?? 0,
    frames,
    warnings,
  };
}

/** Godot atlas JSON written by this tool. */
export function readGodotAtlas(json: unknown, source: string): ImportedAtlas | null {
  const meta = (json as { size?: { width: number; height: number } })?.size;
  const rawFrames = (json as { frames?: Record<string, unknown> })?.frames;
  if (!rawFrames) return null;

  const warnings: string[] = [];
  const frames = Object.entries(rawFrames).map(([name, value], index) => {
    const entry = value as {
      region?: RectLike;
      margin?: { left: number; top: number; right: number; bottom: number };
      size?: { width: number; height: number };
      rotated?: boolean;
    };

    if (entry.rotated) {
      warnings.push(`${name} is rotated; the frame is imported upright.`);
    }

    const region = readRect(entry.region);
    const margin = entry.margin;
    const size = entry.size;

    return makeFrame(
      index,
      region,
      { x: margin?.left ?? 0, y: margin?.top ?? 0 },
      { w: size?.width ?? region.w, h: size?.height ?? region.h }
    );
  });

  return {
    source,
    width: meta?.width ?? 0,
    height: meta?.height ?? 0,
    frames,
    warnings,
  };
}

/**
 * Import a descriptor by name. The file name decides the parser, which is what
 * the export bundle guarantees: `phaser.json`, `godot.json`, `unity.json`.
 */
export function readAtlasDescriptor(fileName: string, text: string): ImportedAtlas {
  const lower = fileName.toLowerCase();
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${fileName} is not valid JSON.`);
  }

  const result = lower.includes('godot')
    ? readGodotAtlas(json, fileName)
    : readPhaserAtlas(json, fileName);

  if (!result) {
    throw new Error(`${fileName} does not look like a PixelSlicer atlas descriptor.`);
  }
  if (result.frames.length === 0) {
    throw new Error(`${fileName} does not contain any frame.`);
  }

  return result;
}

/** Stable identity of an imported sprite, used to detect re-imports. */
export function importedSpriteId(name: string): string {
  return atlasGuid(name);
}
