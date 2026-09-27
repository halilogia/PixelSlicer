# 🗺️ Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).
> Current state: v2.3.0, 277 unit/component tests, 4 Playwright smoke tests, 35% line coverage.

## 🎨 v2.4 — Atlas Packer Round Two

The packer works and is fast; what is missing is depth for real projects.

- [ ] **Preview every page**, not only the first one, with per-page zoom in the modal.
- [ ] **Editable sprite names**: a prefix + start index field instead of hardcoded `frame_0001`, plus inline rename (names are the keys in every exported descriptor).
- [ ] **Animation aware packing**: keep every frame of one animation on the same page so engines never swap textures mid-animation.
- [ ] **90° rotation support** to squeeze the last few percent out of an atlas.
- [ ] **Native Unity `.spriteatlas` asset** output (`.meta` + GUID generation) so users do not need the bundled editor script.
- [ ] **Warn on empty / duplicate frames** before packing instead of emitting 1×1 placeholders silently.
- [ ] **Starling XML + Starling JSON** exporters (same descriptor pipeline, ~50 lines each).
- [ ] **Sprite sheet import** (read an atlas back into the editor) for Godot / Unity round trips.

## 🧪 v2.4 — Test Depth

- [ ] **Component tests for `App.tsx`**: the sidebar controls, the manual frame gestures and the settings modal are still only covered by the Playwright smoke test.
- [ ] **Golden tests for the ZIP and GIF byte output** with a real (tiny) fixture sheet, asserted through JSZip, so a codec change cannot silently alter the files.
- [ ] **Component tests for the Atlas Packer modal**: every option, the multi-page case and the error path.
- [ ] **Widen the coverage scope further**: `src/App.tsx`, the video infrastructure and the hooks are still the biggest uncovered blocks (see the coverage report).
- [ ] **Coverage thresholds for the new areas** once they are covered, so the floor can keep rising.
- [ ] **Extend the e2e suite**: manual frame drawing, pivot picking, GIF upload, video upload.

## 🧹 v2.4 — Housekeeping

- [ ] **Extract the sidebar** out of `App.tsx` (1379 lines) and give it its own selector subscriptions, so a canvas interaction no longer re-renders 200 controls.
- [ ] **`updateProcessedImage` in a worker**: the background colour removal still walks the whole sheet on the main thread.
- [ ] **Move the single frame download and the sprite sheet export** behind the same worker pipeline for consistency.
- [ ] **Registry of test ids**: the Playwright specs currently rely on a handful of `data-testid`s added ad hoc.

## 🧑‍💻 v3.0 — Editor Power Features

- [ ] **Undo / redo** across slicing, manual frames, toggles and pivots. Biggest missing UX feature.
- [ ] **Save / load a project file** (frames + grid + pivots + trim settings) so a session survives a reload.
- [ ] **Keyboard shortcuts** for the frequent actions (toggle frame, delete, nudge, zoom, play/pause).
- [ ] **Per-frame properties panel** (name, pivot, trimmed bounds) in a right hand inspector.
- [ ] **Sprite viewer**: zoom into a single frame at 8×+ with a pixel grid, to place pivots precisely.
- [ ] **Gallery virtualization** (`4.1`): only the visible tiles are reconciled, so a 1000 frame sheet scrolls smoothly.
- [ ] **Additional UI languages** (the i18n layer is ready, only the strings are missing).

## 💡 Ideas

- [ ] Diff based repack: keep the previous atlas layout and only re-pack what actually changed.
- [ ] 2× / 3× retina atlas export from a single source sheet.
- [ ] Texture compression hints (BC3 / ETC2 recommended settings per target engine).
- [ ] A dark/light theme switch (only the dark palette exists today).
- [ ] Local project history in `localStorage` as a stopgap for undo/redo.

## 📌 Engineering Rules

- Domain layer stays pure and fully unit tested; no DOM, no React.
- Every new engine descriptor gets an exact-output test.
- Canvas / Worker APIs are stubbed in `src/testUtils`, never mocked ad hoc in a test file.
- Object URLs go through `ImageLoader` / the thumbnail hook, timers through `requestAnimationFrame`.
- Frame arrays stay immutable: their identity is the cache key.
- Pixel producers return a real `ImageData`: `putImageData` brand checks its argument.
- Performance claims need `npm run bench`, browser claims need `npm run test:e2e`.
- `npm run lint && npm test && npm run test:e2e && npm run build` must pass before anything is pushed.
