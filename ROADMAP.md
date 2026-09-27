# 🗺️ Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).

## 🎯 v2.2 — Correctness & Quick Performance Wins

- [ ] **Fix the object URL leak** (`F-002`): `handleImageUpload`, the drag & drop handler and `handleGifUpload` never call `URL.revokeObjectURL`. ~15 min, no risk.
- [ ] **RAF based animation playback** (`F-009`): replace the `setInterval` in `EditorViewModel.startAnimation` with a `requestAnimationFrame` loop so the preview stays in sync and stops burning CPU in background tabs.
- [ ] **Build the GIF sprite strip without intermediate canvases** (`F-005`): a single `putImageData` pass per frame onto the strip canvas.
- [ ] **Batch canvas state changes** (`F-008`): hoist `ctx.font` / `ctx.fillStyle` out of the per-frame loop of the main canvas draw.
- [ ] **Regenerate `ARCHITECTURE_AUTO_GENERATED.md`**: the auto-generated scan is two releases behind and does not know about `src/domain/atlas`, `src/infrastructure/atlas`, `src/workers` or `src/testUtils`.

## ⚡ v2.3 — Large Sheet Performance

- [ ] **Selector based ViewModel subscriptions** (`F-003`): today every state change re-renders the whole tree, which is the main cost at 500+ frames.
- [ ] **Memoize `getFrames()` / `getActiveFrames()`** (`F-007`): version guarded caching so React dependency checks stop seeing a new array on every access.
- [ ] **Split the main canvas redraw** (`F-006`): separate structural changes (image, zoom, frames) from visual-only ones (selection, marching ants, hover) so dragging a frame does not repaint everything.
- [ ] **`toBlob()` + `URL.createObjectURL()` for thumbnails** instead of base64 data URLs: ~33% less memory and faster string handling for large galleries.
- [ ] **Skeleton / shimmer while thumbnails are generated**: the gallery is blank today while the idle batches run.
- [ ] **Measure it**: a repeatable benchmark (100 / 500 / 1000 frames: first paint, gallery scroll FPS, peak memory, export time) so each change above can prove itself.

## 🧪 v2.3 — Test Depth

- [ ] **`EditorViewModel` unit tests**: grid/manual frame lifecycle, drag/resize, pivot and trim state, with `window.setInterval` stubbed.
- [ ] **Component tests on jsdom/happy-dom** for `App.tsx` and the modals: open the atlas packer, change an option, export.
- [ ] **Golden tests for `ExportService`**: one small fixture sheet, byte compared ZIP/GIF output.
- [ ] **Coverage thresholds in CI** (`vitest --coverage` with a floor, currently ~95% on the atlas modules).
- [ ] **Playwright smoke test**: upload a sheet → build an atlas → download the ZIP.

## 🎨 v2.4 — Atlas Packer Round Two

- [ ] **Preview every page**, not only the first one, with per-page zoom in the modal.
- [ ] **Editable sprite names**: a prefix + start index field instead of hardcoded `frame_0001`, plus inline rename (names are the keys in every exported descriptor).
- [ ] **Animation aware packing**: keep every frame of one animation on the same page so engines never swap textures mid-animation.
- [ ] **90° rotation support** to squeeze the last few percent out of an atlas.
- [ ] **Native Unity `.spriteatlas` asset** output (`.meta` + GUID generation) so users do not need the bundled editor script.
- [ ] **Warn on empty / duplicate frames** before packing instead of emitting 1×1 placeholders silently.
- [ ] **Starling XML + Starling JSON** exporters (same descriptor pipeline, ~50 lines each).

## 🧑‍💻 v3.0 — Editor Power Features

- [ ] **Undo / redo** across slicing, manual frames, toggles and pivots. Biggest missing UX feature.
- [ ] **Save / load a project file** (frames + grid + pivots + trim settings) so a session survives a reload.
- [ ] **Keyboard shortcuts** for the frequent actions (toggle frame, delete, nudge, zoom, play/pause).
- [ ] **Per-frame properties panel** (name, pivot, trimmed bounds) in a right hand inspector.
- [ ] **Sprite viewer**: zoom into a single frame at 8×+ with a pixel grid, to place pivots precisely.
- [ ] **Additional UI languages** (the i18n layer is ready, only the strings are missing).

## 💡 Ideas

- [ ] Diff based repack: keep the previous atlas layout and only re-pack what actually changed.
- [ ] 2× / 3× retina atlas export from a single source sheet.
- [ ] Sprite sheet *import* for Godot / Unity round trips (read an atlas back into the editor).
- [ ] Texture compression hints (BC3 / ETC2 recommended settings per target engine).

## 📌 Engineering Rules

- Domain layer stays pure and fully unit tested; no DOM, no React.
- Every new engine descriptor gets an exact-output test.
- Canvas / Worker APIs are stubbed in `src/testUtils`, never mocked ad hoc in a test file.
- `npm run lint` and `npm test` must pass before anything is pushed.
