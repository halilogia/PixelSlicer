# 🗺️ Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).
> Current state: v2.4.0, 313 unit/component tests, 6 Playwright scenarios, 38% line coverage.

## 🎨 v2.5 — Atlas Packer, Remaining Depth

- [ ] **Animation groups from the editor, not from a number**: pick frames in the gallery and assign them to an animation, instead of typing "frames per animation". The packer already keeps groups on one page.
- [ ] **Rotation preview**: the modal does not show which sprite was rotated and in which direction, only a `90°` badge in the name list.
- [ ] **Godot rotation support**: `AtlasTexture` cannot rotate a region, so rotated sprites need either a separate region per rotation or a note in the exported `SpriteFrames` resource.
- [ ] **Diff based repack**: keep the previous atlas layout and only re-pack what changed, so an iteration does not reshuffle every sprite.
- [ ] **Pack from a second sheet**: add sprites from another image to the same atlas.
- [ ] **Texture compression hints** (BC3 / ETC2) per target engine.
- [ ] **2× / 3× retina atlas** from a single source sheet.

## 🧪 v2.5 — Test Depth

- [ ] **Component tests for `App.tsx`**: the sidebar controls, the manual frame gestures and the settings modal are covered by Playwright, not by unit tests.
- [ ] **Golden byte tests for the ZIP and GIF output** with the generated fixture sheet, so a codec change cannot silently alter the files.
- [ ] **Component tests for the Atlas Packer modal**: the options are covered end to end in Chromium, but a fast unit level test per option is still missing.
- [ ] **Cover the remaining zero coverage blocks**: `App.tsx`, the video infrastructure and the video uploader. The global floor is 37% today.
- [ ] **Playwright on the other browsers**: the suite runs on Chromium only.

## 🧹 v2.5 — Housekeeping

- [ ] **Extract the sidebar** out of `App.tsx` (1400 lines) and give it its own selector subscriptions, so a canvas interaction does not re-render 200 controls. Blocked on the `App.tsx` component tests above.
- [ ] **Single frame and sprite sheet export in the worker**: they are single canvas operations today, so they are cheap, but the code path is duplicated between `ExportService` and the worker pipeline.
- [ ] **Test id registry**: the e2e selectors are `data-testid`s added ad hoc, ~12 of them.

## 🧑‍💻 v3.0 — Editor Power Features

- [ ] **Undo / redo** across slicing, manual frames, toggles and pivots. Biggest missing UX feature.
- [ ] **Save / load a project file** (frames + grid + pivots + trim settings) so a session survives a reload.
- [ ] **Keyboard shortcuts** for the frequent actions (toggle frame, delete, nudge, zoom, play/pause).
- [ ] **Per-frame properties panel** (name, pivot, trimmed bounds) in a right hand inspector.
- [ ] **Sprite viewer**: zoom into a single frame at 8×+ with a pixel grid, to place pivots precisely.
- [ ] **Gallery virtualization** (`4.1`): only the visible tiles are reconciled, so a 1000 frame sheet scrolls smoothly.
- [ ] **Additional UI languages** (the i18n layer is ready, only the strings are missing).
- [ ] **A dark/light theme switch** (only the dark palette exists today).

## 💡 Ideas

- [ ] Sprite sheet *import* UI on top of the existing descriptor reader.
- [ ] Local project history in `localStorage` as a stopgap for undo/redo.

## 📌 Engineering Rules

- Domain layer stays pure and fully unit tested; no DOM, no React.
- Every new engine descriptor gets an exact-output test.
- Canvas / Worker APIs are stubbed in `src/testUtils`, never mocked ad hoc in a test file.
- Object URLs go through `ImageLoader` / the thumbnail hook, timers through `requestAnimationFrame`.
- Frame arrays stay immutable: their identity is the cache key.
- Pixel producers return a real `ImageData`: `putImageData` brand checks its argument.
- Asynchronous state updates are token guarded, a slow run never overwrites a newer one.
- Performance claims need `npm run bench`, browser claims need `npm run test:e2e`.
- `npm run lint && npm test && npm run test:e2e && npm run build` must pass before anything is pushed.
