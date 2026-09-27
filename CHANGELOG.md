# 📜 Changelog - PixelSlicer

All notable changes to the PixelSlicer project will be documented in this file.

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
