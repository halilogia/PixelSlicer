// Infrastructure Layer - Atlas bundle exporter
// Packs the rendered pages plus every engine descriptor into a single ZIP.

import JSZip from 'jszip';
import type { AtlasFormat } from '@domain/atlas/AtlasTypes';
import {
  buildGodotAtlasTextureResources,
  buildGodotJson,
  buildGodotSpriteFramesResource,
  buildPhaserArrayJson,
  buildPhaserJson,
  buildUnityJson,
  UNITY_IMPORTER_CS,
  type AtlasExportInput,
} from './AtlasMetadataExporters';
import { canvasToBlob, type AtlasPageImage } from './AtlasRenderer';

export interface AtlasBundleInput extends AtlasExportInput {
  formats: readonly AtlasFormat[];
  pages: readonly AtlasPageImage[];
  /** Godot animation speed written in the SpriteFrames resource. */
  fps?: number;
  animationName?: string;
}

export function atlasPageFileName(page: number, total: number): string {
  return total > 1 ? `atlas_${page}.png` : 'atlas.png';
}

function metadataFileName(base: string, page: number, total: number): string {
  return total > 1 ? `${base}_${page}.json` : `${base}.json`;
}

const FORMAT_LABELS: Record<AtlasFormat, string> = {
  phaser: 'Phaser 3 (JSON Hash + JSON Array)',
  godot: 'Godot 4 (JSON + AtlasTexture .tres + SpriteFrames .tres)',
  unity: 'Unity (JSON + editor importer scripts)',
};

function readme(input: AtlasBundleInput): string {
  const pageCount = input.layout.pages.length;
  const lines: string[] = [
    `PixelSlicer texture atlas - ${input.layout.sprites.length} sprites, ${pageCount} page(s)`,
    '',
    `Atlas size: ${input.layout.pages.map(p => `${p.width}x${p.height}`).join(', ')}`,
    `Occupancy: ${(input.layout.occupancy * 100).toFixed(1)}%`,
    `Saved by auto-trim: ${input.layout.savedPixels.toLocaleString('en-US')} pixels`,
    '',
    'Files:',
  ];

  input.formats.forEach(format => {
    lines.push(`- ${FORMAT_LABELS[format]}`);
  });

  if (input.formats.includes('phaser')) {
    lines.push(
      '',
      'Phaser: this.scene.load.atlas("atlas", "atlas.png", "phaser.json")',
      '      this.scene.load.atlas("atlas", "atlas.png", "phaser-array.json")'
    );
  }

  if (input.formats.includes('godot')) {
    lines.push(
      '',
      'Godot: move every file into res://. Import atlas*.png as Texture2D, then use',
      '      godot/<name>.tres  (one AtlasTexture per sprite)',
      '      spriteframes.tres (ready to animate: assign to AnimatedSprite2D)'
    );
  }

  if (input.formats.includes('unity')) {
    lines.push(
      '',
      'Unity: move atlas*.png + unity*.json + Unity/PixelSlicerAtlas.cs into Assets/.',
      '      Select the sprites in the Project window, then',
      '      Tools > PixelSlicer > Create SpriteAtlas From Selection.'
    );
  }

  return `${lines.join('\n')}\n`;
}

/** Every metadata file that will land in the bundle. */
export function buildAtlasMetadataFiles(input: AtlasBundleInput): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const total = input.layout.pages.length;

  for (let page = 0; page < total; page++) {
    if (input.formats.includes('phaser')) {
      files.push({
        path: metadataFileName('phaser', page, total),
        content: buildPhaserJson(input, page),
      });
      files.push({
        path: metadataFileName('phaser-array', page, total),
        content: buildPhaserArrayJson(input, page),
      });
    }

    if (input.formats.includes('godot')) {
      files.push({
        path: metadataFileName('godot', page, total),
        content: buildGodotJson(input, page),
      });
    }

    if (input.formats.includes('unity')) {
      files.push({
        path: metadataFileName('unity', page, total),
        content: buildUnityJson(input, page),
      });
    }
  }

  if (input.formats.includes('godot')) {
    files.push(...buildGodotAtlasTextureResources(input));
    files.push({
      path: 'godot/spriteframes.tres',
      content: buildGodotSpriteFramesResource(input),
    });
  }

  if (input.formats.includes('unity')) {
    files.push({ path: 'Unity/PixelSlicerAtlas.cs', content: UNITY_IMPORTER_CS });
  }

  files.push({ path: 'README.txt', content: readme(input) });

  return files;
}

/** Bundle the rendered pages and their descriptors into a ZIP blob. */
export async function exportAtlasZip(input: AtlasBundleInput): Promise<Blob> {
  if (input.layout.pages.length === 0) {
    throw new Error('No active frames to export');
  }

  const zip = new JSZip();
  const total = input.layout.pages.length;

  for (let page = 0; page < total; page++) {
    const canvas = input.pages[page];
    if (!canvas) continue;
    // ArrayBuffer keeps JSZip on the same code path in the browser and in Node.
    const buffer = await (await canvasToBlob(canvas, 'image/png')).arrayBuffer();
    zip.file(atlasPageFileName(page, total), buffer);
  }

  for (const file of buildAtlasMetadataFiles(input)) {
    zip.file(file.path, file.content);
  }

  return zip.generateAsync({ type: 'blob' });
}
