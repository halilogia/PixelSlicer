# 📜 Changelog - PixelSlicer

All notable changes to the PixelSlicer project will be documented in this file.

## [2.2.0] - 2026-09-27
### Fixed
- **Object URL leak** (`F-002`): image upload, multi image stitching and the drag & drop path never revoked their object URLs. A new `ImageLoader` service revokes as soon as the browser finished decoding, and also when decoding fails.
- **Broken upload no longer hangs** (`F-002`): the multi image branch awaited a promise that was never rejected when a file could not be decoded, so a single corrupt file blocked the whole batch. It now skips unreadable files.
- **Animation playback** (`F-009`): `setInterval` replaced with a `requestAnimationFrame` loop. The preview now stays in sync with the display rate, stops burning CPU in background tabs, and carries the frame remainder over instead of drifting when a frame is dropped.
- **GIF import** (`F-005`): the sprite strip is written with one `putImageData` per frame, removing one intermediate canvas per GIF frame.
- **Canvas state churn** (`F-008`): the main canvas draw only touches `strokeStyle` / `fillStyle` / `font` / `lineWidth` when the value actually changes, which removes hundreds of redundant state changes on large sheets.

### Added
- `ImageLoader` infrastructure service (`loadImageFromUrl`, `loadImageFromFile`, `loadImagesFromFiles`).
- Test suites for the new code: object URL lifecycle, and the animation loop driven through a deterministic `requestAnimationFrame` clock (7 + 6 tests).
- `npm run docs:arch` regenerates `ARCHITECTURE_AUTO_GENERATED.md` from the real source tree, so the scan can no longer drift behind the code.

### Changed
- Package version bumped to 2.2.0; the version written into Phaser/Godot/Unity atlas metadata follows it.
- `docs/OPTIMIZATIONS.md` status table refreshed: `F-002`, `F-005`, `F-008` and `F-009` are now closed.

## [2.1.0] - 2026-09-27
### Added
- **Texture Atlas Packer**: MaxRects (BSSF) packing into power-of-two, multi-page atlases with per-sprite padding and extrude rings so no two sprites can touch or bleed.
- **Auto-trim**: automatic transparent bounding box trimming with a tunable alpha threshold, plus a live "pixels saved" report in the modal.
- **Pivot points**: five origin presets (Top Left / Top Center / Center / Bottom Center / Custom) and click-to-place per-frame pivots drawn as a crosshair directly on the canvas.
- **Engine metadata exports**: Phaser 3 (JSON Hash + JSON Array), Godot 4 (JSON, one importable `AtlasTexture` `.tres` per sprite, ready-to-animate `SpriteFrames` resource) and Unity (TexturePacker compatible JSON plus editor scripts that build the `SpriteAtlas` and apply custom sprite pivots).
- **OffscreenCanvas worker**: trim, pack and atlas rasterization run in a Web Worker with a transparent main-thread fallback; worker `ImageBitmap`s are released when a build is replaced or the modal closes.
- **Atlas packer modal**: page previews, occupancy / saved-pixel statistics, padding, extrude, POT toggle, max page size and format selection.
- **Vitest** test runner (`npm test`, `npm run test:watch`, `npm run test:coverage`) with 100 tests over trimming, pivots, bin packing, layout invariants, renderer draw geometry, the worker protocol and every exported metadata format. Lint and tests now run in the deploy workflow.

### Changed
- `ROADMAP.md` now only tracks future work; completed items live in this changelog.

## [2.0.0] - 2026-08-25
### Added
- Complete React 18 + TypeScript + Vite architecture rewrite (Domain / Infrastructure / Presentation layering with path aliases).
- High-performance sprite frame extraction with `gifenc` and `omggif`.
- Video-to-frame extraction support, including H.264 validation and processing presets.
- Single-frame download and full-pack ZIP export with `JSZip`.
- Frame gallery thumbnails generated through a cached idle-callback batch (`useFrameThumbnails`) instead of one canvas per render.
- Background color removal with an eyedropper tool and a tolerance slider.
- Multi-image upload that stitches the files into a grid automatically.
- GitHub Pages deployment workflow with a correct Vite base path.
- `start.sh` launcher and an image based logo.
- Dark-mode interface with Framer Motion animations.
- GNU General Public License v3.0 licensing.
