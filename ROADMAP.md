# 🗺️ Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).
> Current state: v2.6.0, 382 unit/component tests, 32 browser scenarios (Chromium + Firefox + WebKit + a phone profile), 71.6% line coverage, zero axe violations.

## 🎨 v2.7 — Atlas Packer, Remaining Depth

- [ ] **Animation groups from the editor, not from a number**: pick frames in the gallery and assign them to an animation, instead of typing "frames per animation". The packer already keeps groups on one page.
- [ ] **Rotation preview**: the modal does not show which sprite was rotated and in which direction, only a `90°` badge in the name list.
- [ ] **Godot rotation support**: `AtlasTexture` cannot rotate a region, so rotated sprites need either a separate region per rotation or a note in the exported `SpriteFrames` resource.
- [ ] **Diff based repack**: keep the previous atlas layout and only re-pack what changed, so an iteration does not reshuffle every sprite.
- [ ] **Pack from a second sheet**: add sprites from another image to the same atlas.
- [ ] **Texture compression hints** (BC3 / ETC2) per target engine.
- [ ] **2× / 3× retina atlas** from a single source sheet.

## 🧪 v2.7 — Test Depth, Remaining

- [ ] **Touch drag for the manual frame tools** on a real phone: the suite proves taps work, a touch drag still needs pointer event dispatch.
- [ ] **Cross browser axe**: the audit runs on Chromium only; Firefox and WebKit engines report different contrast and label results.
- [ ] **Gallery virtualization coverage**: the behaviour only exists after the feature lands, so its tests come with it.
- [ ] **Golden fixtures for the atlas PNGs**: the real encoder needs a browser, so the atlas bytes can only be pinned through an e2e snapshot.

## 🧹 v2.7 — Housekeeping

- [ ] **Extract the sidebar** out of `App.tsx` (1400 lines) and give it its own selector subscriptions, so a canvas interaction does not re-render 200 controls. The `App.tsx` component tests exist, so the safety net is in place.
- [ ] **Single frame and sprite sheet export in the worker**: they are single canvas operations today, so they are cheap, but the code path is duplicated between `ExportService` and the worker pipeline.
- [ ] **Test id registry**: the e2e selectors are `data-testid`s added ad hoc, ~15 of them.
- [ ] **Move the canvas creation out of the module scope** everywhere else: `App.tsx` still instantiates services at import time.

## 🧑‍💻 v3.0 — Editor Power Features

- [ ] **Undo / redo** across slicing, manual frames, toggles and pivots. Biggest missing UX feature.
- [ ] **Save / load a project file** (frames + grid + pivots + trim settings) so a session survives a reload. Today only the language is persisted.
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
- No canvas or worker is created at module import time: services create their scratch surface on first use.
- Icon only controls need an accessible name; the palette must clear WCAG AA (axe runs in the e2e suite).
- Object URLs go through `ImageLoader` / the thumbnail hook, timers through `requestAnimationFrame`.
- Frame arrays stay immutable: their identity is the cache key.
- Pixel producers return a real `ImageData`: `putImageData` brand checks its argument.
- Asynchronous state updates are token guarded, a slow run never overwrites a newer one.
- Performance claims need `npm run bench`, browser claims need `npm run test:e2e` (four profiles).
- `npm run lint && npm test && npm run test:e2e && npm run build` must pass before anything is pushed.
