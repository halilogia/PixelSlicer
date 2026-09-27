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
import type { AtlasSourceImage } from '@infrastructure/atlas/AtlasRenderer';
import { atlasPageFileName, exportAtlasZip } from '@infrastructure/atlas/AtlasExportService';
import { downloadBlob } from '@infrastructure/ExportService';
import { AtlasWorkerClient } from '@infrastructure/atlas/AtlasWorkerClient';
import type { AtlasBuildResult } from '@infrastructure/atlas/AtlasPipeline';

interface AtlasExporterProps {
  image: AtlasSourceImage;
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
  starling: 'Starling',
};

const PAGE_SIZES = [1024, 2048, 4096, 8192];
const ZOOM_LEVELS = [0.25, 0.5, 1, 2];

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
  const [allowRotation, setAllowRotation] = useState(false);
  const [framesPerGroup, setFramesPerGroup] = useState(0);
  const [maxPageSize, setMaxPageSize] = useState(2048);
  const [formats, setFormats] = useState<AtlasFormat[]>(['phaser', 'godot', 'unity']);
  const [animationName, setAnimationName] = useState('default');
  const [namePrefix, setNamePrefix] = useState('frame_');
  const [nameStartIndex, setNameStartIndex] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [renames, setRenames] = useState<Record<number, string>>({});

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

  // Names come from the prefix plus the start index, a rename always wins.
  const spriteNames = activeFrames.map((_, index) => {
    const generated = `${namePrefix || 'frame_'}${String(
      nameStartIndex + index
    ).padStart(4, '0')}`;
    return renames[index] ?? generated;
  });

  const options: AtlasPackOptions = {
    ...DEFAULT_ATLAS_PACK_OPTIONS,
    padding,
    extrude,
    powerOfTwo,
    allowRotation,
    framesPerGroup,
    maxPageSize,
    trim,
    alphaThreshold,
    pivotMode,
    namePrefix,
    nameStartIndex,
  };

  const build = async () => {
    setIsBuilding(true);
    setError(null);
    try {
      const built = await getClient().build(
        image,
        activeFrames,
        options,
        collectFramePivots(activeFrames),
        spriteNames
      );
      setResult(built);
      setActivePage(current => Math.min(current, Math.max(0, built.layout.pages.length - 1)));
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsBuilding(false);
    }
  };

  // Preview the selected page, at the selected zoom.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !result || result.pages.length === 0) return;

    const page = result.pages[Math.min(activePage, result.pages.length - 1)];
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, page.width, page.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(page as CanvasImageSource, 0, 0);
  }, [result, activePage, zoom]);

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

  const pageList = result?.layout.pages ?? [];
  const warnings = result?.layout.warnings ?? [];
  const pageLabel = pageList
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
                <label
                  className="form-label"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    checked={allowRotation}
                    onChange={() => setAllowRotation(!allowRotation)}
                    style={{ marginRight: 0 }}
                    data-testid="atlas-rotation"
                  />
                  {t('atlasAllowRotation')}
                </label>
                {allowRotation && <p className="atlas__hint">{t('atlasAllowRotationHint')}</p>}
              </div>

              <div className="form-group">
                <div className="range-label">
                  <span>{t('atlasFramesPerGroup')}</span>
                  <span className="range-value">
                    {framesPerGroup === 0 ? t('atlasFree') : framesPerGroup}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={framesPerGroup}
                  onChange={event => setFramesPerGroup(parseInt(event.target.value))}
                  data-testid="atlas-group-size"
                />
                <p className="atlas__hint">{t('atlasFramesPerGroupHint')}</p>
              </div>

              <div className="form-group">
                <label className="form-label">{t('atlasNaming')}</label>
                <div className="atlas__row">
                  <input
                    type="text"
                    className="form-input"
                    value={namePrefix}
                    onChange={event => {
                      setNamePrefix(event.target.value);
                      setRenames({});
                    }}
                    placeholder="frame_"
                    data-testid="atlas-name-prefix"
                  />
                  <input
                    type="number"
                    className="form-input atlas__number"
                    value={nameStartIndex}
                    min={0}
                    onChange={event => setNameStartIndex(Math.max(0, parseInt(event.target.value) || 0))}
                    data-testid="atlas-name-start"
                  />
                </div>
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
                  data-testid="atlas-build"
                  disabled={isBuilding || activeFrames.length === 0}
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>{' '}
                  {isBuilding ? t('atlasBuilding') : t('atlasBuild')}
                </button>
                {result && (
                  <span className="atlas__badge" data-testid="atlas-worker-badge">
                    {result.usedWorker ? t('atlasWorkerBadge') : t('atlasMainThreadBadge')}
                  </span>
                )}
              </div>

              <div className="atlas__canvas-wrap canvas-bg" data-testid="atlas-preview">
                <canvas
                  ref={previewRef}
                  className="atlas__canvas"
                  style={{ width: `${zoom * 100}%` }}
                />
                {!result && (
                  <p className="atlas__hint atlas__hint--center">{t('atlasPreviewHint')}</p>
                )}
              </div>

              {pageList.length > 0 && (
                <div className="atlas__pages">
                  {pageList.map((page, index) => (
                    <button
                      key={page.index}
                      className={`atlas__chip ${index === activePage ? 'atlas__chip--active' : ''}`}
                      onClick={() => setActivePage(index)}
                      data-testid={`atlas-page-${index}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <span className="atlas__zoom">
                    {ZOOM_LEVELS.map(level => (
                      <button
                        key={level}
                        className={`atlas__chip ${zoom === level ? 'atlas__chip--active' : ''}`}
                        onClick={() => setZoom(level)}
                        data-testid={`atlas-zoom-${level}`}
                      >
                        {level}x
                      </button>
                    ))}
                  </span>
                </div>
              )}

              {warnings.length > 0 && (
                <ul className="atlas__warnings" data-testid="atlas-warnings">
                  {warnings.map((warning, index) => (
                    <li key={`${warning.kind}-${warning.frameIndex}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              )}

              {result && result.layout.sprites.length > 0 && (
                <details className="atlas__names">
                  <summary>{t('atlasRename')}</summary>
                  <div className="atlas__name-list">
                    {result.layout.sprites.map((sprite, index) => (
                      <label key={sprite.order} className="atlas__name-row">
                        <span className="atlas__name-page">p{sprite.page + 1}</span>
                        <input
                          type="text"
                          className="form-input"
                          value={sprite.name}
                          onChange={event =>
                            setRenames(current => ({ ...current, [index]: event.target.value }))
                          }
                          data-testid={`atlas-name-${index}`}
                        />
                        {sprite.rotated && <span className="atlas__badge">90°</span>}
                      </label>
                    ))}
                  </div>
                </details>
              )}


              {result && (
                <div className="atlas__stats" data-testid="atlas-stats">
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
                data-testid="atlas-export"
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
