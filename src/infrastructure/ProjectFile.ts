// Infrastructure Layer - Project file
// A project stores the document (grid, frames, pivots, trim) plus the image, so
// a session can be saved and resumed.

import type { EditorDocument } from '@presentation/EditorViewModel';

export const PROJECT_FORMAT = 'pixelslicer-project';
export const PROJECT_VERSION = 1;

export interface ProjectFile {
  format: typeof PROJECT_FORMAT;
  version: number;
  savedAt: string;
  document: EditorDocument;
  /** The sheet as a PNG data URL, so the project is a single self contained file. */
  image: string;
  imageWidth: number;
  imageHeight: number;
}

export interface ProjectSummary {
  frameCount: number;
  width: number;
  height: number;
  savedAt: string;
  version: number;
}

function isProjectFile(value: unknown): value is ProjectFile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProjectFile>;
  return (
    candidate.format === PROJECT_FORMAT &&
    typeof candidate.version === 'number' &&
    !!candidate.document &&
    typeof candidate.image === 'string'
  );
}

export function serializeProject(
  document: EditorDocument,
  image: string,
  width: number,
  height: number,
  now: Date = new Date()
): string {
  const file: ProjectFile = {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    savedAt: now.toISOString(),
    document,
    image,
    imageWidth: width,
    imageHeight: height,
  };
  return JSON.stringify(file, null, 2);
}

export function parseProject(text: string): ProjectFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The project file is not valid JSON.');
  }

  if (!isProjectFile(parsed)) {
    throw new Error('This is not a PixelSlicer project file.');
  }
  if (parsed.version > PROJECT_VERSION) {
    throw new Error(
      `The project was saved by a newer version (${parsed.version}), update PixelSlicer to open it.`
    );
  }
  return parsed;
}

/** A short description for the file input and the confirmation prompt. */
export function summarizeProject(file: ProjectFile): ProjectSummary {
  return {
    frameCount: file.document.frames.length + file.document.manualFrames.length,
    width: file.imageWidth,
    height: file.imageHeight,
    savedAt: file.savedAt,
    version: file.version,
  };
}
