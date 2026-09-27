/**
 * AtlasExporterModal
 * Packs the current frames into trimmed texture atlases and exports the
 * Phaser / Godot / Unity metadata next to them. Rendering happens in a worker
 * whenever OffscreenCanvas is available.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import type { Frame } from '@domain/FrameLogic';
import {
  ATLAS_FORMATS,
  DEFAULT_ATLAS_PACK_OPTIONS,
  type AtlasFormat,
  type AtlasPackOptions,
  type PivotMode,
} from '@domain/atlas/AtlasTypes';
import { collectFramePivots } from '@domain/atlas/AtlasPivot';
import { atlasPageFileName, exportAtlasZip } from '@infrastructure/atlas/AtlasExportService';
import { downloadBlob } from '@infrastructure/ExportService';
import { AtlasWorkerClient } from '@infrastructure/atlas/AtlasWorkerClient';
import type { AtlasBuildResult } from '@infrastructure/atlas/AtlasPipeline';

interface AtlasExporterProps {
  image: HTMLImageElement | HTMLCanvasElement;
  frames: readonly Frame[];
  pivotMode: PivotMode;
  trim: boolean;
  alphaThreshold: number;
  fps: number;
  onTrimChange: (enabled: boolean) => void;
  onAlphaThresholdChange: (value: number) => void;
  onClose: () => void;
}

const FORMAT_LABELS: Record<AtlasFormat, string> = {
  phaser: 'Phaser 3',
  godot: 'Godot 4',
  unity: 'Unity',
};

const PAGE_SIZES = [1024, 2048, 4096, 8192];

export function AtlasExporterModal({
  image,
  frames,
  pivotMode,
  trim,
  alphaThreshold,
  fps,
  onTrimChange,
  onAlphaThresholdChange,
  onClose,
}: AtlasExporterProps) {
  const { t } = useI18n();
  const previewRef = useRef<HTMLCanvasElement>(null);

  const [padding, setPadding] = useState(2);
  const [extrude, setExtrude] = useState(0);
  const [powerOfTwo, setPowerOfTwo] = useState(true);
  const [maxPageSize, setMaxPageSize] = useState(2048);
  const [formats, setFormats] = useState<AtlasFormat[]>(['phaser', 'godot', 'unity']);
  const [animationName, setAnimationName] = useState('default');

  const [result, setResult] = useState<AtlasBuildResult | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<AtlasWorkerClient | null>(null);
  const getClient = useCallback((): AtlasWorkerClient => {
    if (!clientRef.current) {
      clientRef.current = new AtlasWorkerClient();
    }
    return clientRef.current;
  }, []);

  // ImageBitmaps hold GPU memory: release the pages of the previous build.
  const resultRef = useRef<AtlasBuildResult | null>(null);
  const releaseResult = (built: AtlasBuildResult | null) => {
    built?.pages.forEach(page => {
      if (typeof ImageBitmap !== 'undefined' && page instanceof ImageBitmap) {
        page.close();
      }
    });
  };

  useEffect(() => {
    const previous = resultRef.current;
    resultRef.current = result;
    releaseResult(previous);
  }, [result]);

  useEffect(() => {
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
      releaseResult(resultRef.current);
      resultRef.current = null;
    };
  }, []);

  const activeFrames = frames.filter(frame => frame.isActive);

  const options: AtlasPackOptions = {
    ...DEFAULT_ATLAS_PACK_OPTIONS,
    padding,
    extrude,
    powerOfTwo,
    maxPageSize,
    trim,
    alphaThreshold,
    pivotMode,
  };

  const build = async () => {
    setIsBuilding(true);
    setError(null);
    try {
      const built = await getClient().build(
        image,
        activeFrames,
        options,
        collectFramePivots(activeFrames)
      );
      setResult(built);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsBuilding(false);
    }
  };

  // Preview the first page so the user sees the result before exporting.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !result || result.pages.length === 0) return;

    const page = result.pages[0];
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, page.width, page.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(page as CanvasImageSource, 0, 0);
  }, [result]);

  const handleExport = async () => {
    if (!result) return;
    setIsExporting(true);
    setError(null);
    try {
      const blob = await exportAtlasZip({
        layout: result.layout,
        pages: result.pages,
        formats,
        pageFileName: page => atlasPageFileName(page, result.layout.pages.length),
        fps,
        animationName,
        pretty: true,
      });
      downloadBlob(blob, 'pixelslicer-atlas.zip');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFormat = (format: AtlasFormat) => {
    setFormats(current =>
      current.includes(format) ? current.filter(item => item !== format) : [...current, format]
    );
  };

  const pageLabel = (result?.layout.pages ?? [])
    .map(page => `${page.width}×${page.height}`)
    .join('  ·  ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={event => event.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">
            <i className="fa-solid fa-cubes"></i> {t('atlasPacker')}
          </h3>
          <button className="modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal__body atlas">
          <div className="atlas__grid">
            {/* Options */}
            <div className="atlas__options">
              <div className="form-group">
                <label
                  className="form-label"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    checked={trim}
                    onChange={() => onTrimChange(!trim)}
                    style={{ marginRight: 0 }}
                  />
                  {t('atlasAutoTrim')}
                </label>
              </div>

              {trim && (
                <div className="form-group">
                  <div className="range-label">
                    <span>{t('atlasAlphaThreshold')}</span>
                    <span className="range-value">{alphaThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={alphaThreshold}
                    onChange={event => onAlphaThresholdChange(parseInt(event.target.value))}
                  />
                </div>
              )}

              <div className="form-group">
                <div className="range-label">
                  <span>{t('atlasPadding')}</span>
                  <span className="range-value">{padding}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={padding}
                  onChange={event => setPadding(parseInt(event.target.value))}
                />
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>{t('atlasExtrude')}</span>
                  <span className="range-value">{extrude}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={extrude}
                  onChange={event => setExtrude(parseInt(event.target.value))}
                />
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    checked={powerOfTwo}
                    onChange={() => setPowerOfTwo(!powerOfTwo)}
                    style={{ marginRight: 0 }}
                  />
                  {t('atlasPowerOfTwo')}
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">{t('atlasMaxPageSize')}</label>
                <div className="atlas__chips">
                  {PAGE_SIZES.map(size => (
                    <button
                      key={size}
                      className={`atlas__chip ${maxPageSize === size ? 'atlas__chip--active' : ''}`}
                      onClick={() => setMaxPageSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('atlasFormats')}</label>
                <div className="atlas__chips">
                  {ATLAS_FORMATS.map(format => (
                    <button
                      key={format}
                      className={`atlas__chip ${formats.includes(format) ? 'atlas__chip--active' : ''}`}
                      onClick={() => toggleFormat(format)}
                    >
                      {FORMAT_LABELS[format]}
                    </button>
                  ))}
                </div>
              </div>

              {formats.includes('godot') && (
                <div className="form-group">
                  <label className="form-label">{t('atlasAnimationName')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={animationName}
                    onChange={event => setAnimationName(event.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Preview + stats */}
            <div className="atlas__preview">
              <div className="atlas__preview-head">
                <button
                  className="btn btn--primary"
                  onClick={build}
                  disabled={isBuilding || activeFrames.length === 0}
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>{' '}
                  {isBuilding ? t('atlasBuilding') : t('atlasBuild')}
                </button>
                {result && (
                  <span className="atlas__badge">
                    {result.usedWorker ? t('atlasWorkerBadge') : t('atlasMainThreadBadge')}
                  </span>
                )}
              </div>

              <div className="atlas__canvas-wrap canvas-bg">
                <canvas ref={previewRef} className="atlas__canvas" />
                {!result && (
                  <p className="atlas__hint atlas__hint--center">{t('atlasPreviewHint')}</p>
                )}
              </div>

              {result && (
                <div className="atlas__stats">
                  <div className="atlas__stat">
                    <span>{t('atlasSprites')}</span>
                    <strong>{result.layout.sprites.length}</strong>
                  </div>
                  <div className="atlas__stat">
                    <span>{t('atlasPages')}</span>
                    <strong>{result.layout.pages.length}</strong>
                  </div>
                  <div className="atlas__stat">
                    <span>{t('atlasOccupancy')}</span>
                    <strong>{(result.layout.occupancy * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="atlas__stat">
                    <span>{t('atlasSaved')}</span>
                    <strong>{result.layout.savedPixels.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {pageLabel && <p className="atlas__hint">{pageLabel}</p>}
              {error && <p className="atlas__error">{error}</p>}

              <button
                className="btn btn--success atlas__export"
                onClick={handleExport}
                disabled={!result || isExporting || formats.length === 0}
              >
                <i className="fa-solid fa-file-zipper"></i>{' '}
                {isExporting ? t('atlasExporting') : t('atlasExport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
