# 🗺️ Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).
> Current state: v2.2.0, 113 tests, 10 test files.

## ⚡ v2.3 — Large Sheet Performance

- [ ] **Benchmark harness first**: a repeatable measurement (100 / 500 / 1000 frames → first paint, gallery scroll FPS, peak memory, export time) so every item below can prove itself instead of guessing.
- [ ] **Memoize `getFrames()` / `getActiveFrames()`** (`F-007`): version guarded caching so React dependency checks stop seeing a new array on every access. Cheap, and it is the cheapest win of the whole list.
- [ ] **Selector based ViewModel subscriptions** (`F-003`): today every state change re-renders the whole tree, which is the main cost at 500+ frames. Needs the v2.3 benchmark as an acceptance gate.
- [ ] **Split the main canvas redraw** (`F-006`): separate structural changes (image, zoom, frames) from visual-only ones (selection, marching ants, hover) so dragging a frame does not repaint everything.
- [ ] **`toBlob()` + `URL.createObjectURL()` for thumbnails** instead of base64 data URLs: ~33% less memory and faster string handling for large galleries.
- [ ] **Skeleton / shimmer while thumbnails are generated**: the gallery is blank today while the idle batches run.
- [ ] **Move the remaining heavy work off the main thread** (`4.2 / 4.4`): thumbnail generation and the ZIP/GIF export paths still block the UI; the atlas builder already proved the worker pattern.

## 🧪 v2.3 — Test Depth

The atlas modules are at 100% / 95%, but the rest of the codebase is effectively untested. This section closes that gap in the order that risks the most.

- [ ] **`FrameLogic` unit tests**: measured **5.78%** statement coverage on the core grid math (`calculateGridFrames`, `createManualFrame`, `resizeFrame`, `getResizeHandleAt`). This is the heart of the tool and a regression here silently corrupts every export. Highest test priority in the project.
- [ ] **`domain/video` unit tests**: 0% coverage on `Video.ts` and `VideoValidation.ts` (file size limits, codec checks, preset maths).
- [ ] **`EditorViewModel` frame lifecycle tests**: grid/manual frames, drag, resize, delete, re-indexing, pivot and trim state. The animation loop is already covered since 2.2.0.
- [ ] **Widen the coverage scope**: `vitest.config.ts` currently measures only `src/domain/**` and `src/infrastructure/atlas/**`, so `ImageLoader`, `ExportService`, `GifService` and all of `src/presentation` are invisible to the report.
- [ ] **Coverage thresholds in CI** once the scope is widened, with a floor that cannot silently regress.
- [ ] **Component tests on jsdom/happy-dom** for `App.tsx` and both modals: open the atlas packer, change an option, export.
- [ ] **Golden tests for `ExportService`**: one small fixture sheet with byte compared ZIP/GIF output.
- [ ] **Playwright smoke test**: upload a sheet → build an atlas → download the ZIP.

## 🎨 v2.4 — Atlas Packer Round Two

- [ ] **Preview every page**, not only the first one, with per-page zoom in the modal.
- [ ] **Editable sprite names**: a prefix + start index field instead of hardcoded `frame_0001`, plus inline rename (names are the keys in every exported descriptor).
- [ ] **Animation aware packing**: keep every frame of one animation on the same page so engines never swap textures mid-animation.
- [ ] **90° rotation support** to squeeze the last few percent out of an atlas.
- [ ] **Native Unity `.spriteatlas` asset** output (`.meta` + GUID generation) so users do not need the bundled editor script.
- [ ] **Warn on empty / duplicate frames** before packing instead of emitting 1×1 placeholders silently.
- [ ] **Starling XML + Starling JSON** exporters (same descriptor pipeline, ~50 lines each).

## 🧹 v2.4 — Housekeeping

- [ ] **Delete the dead `src/components/Icons.tsx`** and drop the unused `lucide-react` dependency: the file is not imported anywhere and the UI uses FontAwesome, so the dependency only costs bundle budget and confusion. (`framer-motion` is genuinely used by the video uploader.)
- [ ] **Re-run `npm run docs:arch`** whenever the folder layout changes and keep the generated report in the commit.

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
- Object URLs go through `ImageLoader`, timers through `requestAnimationFrame`.
- `npm run lint && npm test && npm run build` must pass before anything is pushed.
