# 📜 Changelog - PixelSlicer

All notable changes to the PixelSlicer project will be documented in this file.

## [2.1.0] - 2026-09-27
### Added
- **Texture Atlas Packer**: MaxRects bin packing with power-of-two pages, multi-page output and configurable padding / extrude rings.
- **Auto-trim**: transparent border removal with a configurable alpha threshold, plus a live "pixels saved" report.
- **Pivot points**: five origin presets, per-frame pivot picking directly on the canvas, and normalized pivots in every exported descriptor.
- **Engine metadata exports**: Phaser 3 (JSON Hash + JSON Array), Godot 4 (JSON, one `AtlasTexture` `.tres` per sprite, ready-to-animate `SpriteFrames` resource) and Unity (TexturePacker compatible JSON plus editor scripts that build the `SpriteAtlas` and set custom sprite pivots).
- **OffscreenCanvas worker**: trim, pack and rasterize run in a Web Worker, with a transparent main-thread fallback when the browser lacks `OffscreenCanvas`.
- **Vitest** test runner (`npm test`, `npm run test:watch`, `npm run test:coverage`) covering trimming, pivots, bin packing, layout building, the renderer's draw geometry, the worker protocol and the exported metadata (100 tests).

## [2.0.0] - 2026-08-25
### Added
- Complete React 18 + TypeScript + Vite architecture rewrite.
- High-performance sprite frame extraction with `gifenc` and `omggif`.
- Video-to-frame extraction support.
- Single-frame and full-pack ZIP export with `JSZip`.
- Dark-mode interface with Framer Motion animations.
- GNU General Public License v3.0 licensing.
