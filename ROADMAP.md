# 🗺️ Roadmap - PixelSlicer

## 🎯 Milestones
- [x] React 18 + TypeScript + Vite migration from legacy monolithic codebase.
- [x] Real-time sprite sheet slicing with grid & manual selection tools.
- [x] Animated GIF export (`gifenc`, `omggif`) and ZIP frame packing (`JSZip`).
- [x] Video upload & frame extraction.
- [x] **Offscreen Rendering (Web Workers)**: Trim, pack and atlas rasterization run in an OffscreenCanvas Web Worker, so the UI keeps 60fps with 500+ frames. Falls back to the main thread automatically.
- [x] **Sprite Sheet Packer / Atlas Generator**: MaxRects (BSSF) repacking into power-of-two texture atlases, multi-page output, optional padding and extrude rings, with JSON metadata for Phaser, Godot and Unity.
- [x] **Auto-Crop & Pivot Point Picker**: Automatic transparent bounding box trimming with a tunable alpha threshold, plus five origin presets and click-to-place per-frame pivots.
- [x] **Test runner**: Vitest suite (`npm test`) protecting the domain layer, the bin packer, the renderer geometry and every exported metadata format.

## 💡 Ideas
- [ ] Animation-aware packing (keep every animation frame on the same page to avoid texture swaps).
- [ ] Rotation support (90° rotated sprites) to squeeze atlases further.
- [ ] Diff-based repack: keep the previous atlas layout and only re-pack what changed.
