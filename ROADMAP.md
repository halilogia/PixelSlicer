# ??? Roadmap - PixelSlicer

> Only **future** work lives here. Everything already shipped is recorded in [CHANGELOG.md](CHANGELOG.md).
> Current state: v3.0.0, 420 unit/component tests, 46 browser scenarios, 71.9% line coverage, no axe violations on either palette (Chromium).

## ?? v3.1 � Atlas Packer, Remaining Depth

- [ ] **Animation groups from the editor, not from a number**: pick frames in the gallery and assign them to an animation, instead of typing "frames per animation". The packer already keeps groups on one page.
- [ ] **Rotation preview**: the modal does not show which sprite was rotated and in which direction, only a `90�` badge in the name list.
- [ ] **Godot rotation support**: `AtlasTexture` cannot rotate a region, so rotated sprites need either a separate region per rotation or a note in the exported `SpriteFrames` resource.
- [ ] **Diff based repack**: keep the previous atlas layout and only re-pack what changed, so an iteration does not reshuffle every sprite.
- [ ] **Pack from a second sheet**: add sprites from another image to the same atlas.
- [ ] **Texture compression hints** (BC3 / ETC2) per target engine.
- [ ] **2� / 3� retina atlas** from a single source sheet.

## ????? v3.1 � Editor Power Features

Undo/redo, project files, shortcuts and the theme shipped in v3.0. What is left:

- [ ] **Per-frame properties panel** (name, pivot, trimmed bounds) in a right hand inspector.
- [ ] **Sprite viewer**: zoom into a single frame at 8�+ with a pixel grid, to place pivots precisely.
- [ ] **Gallery virtualization** (`4.1`): only the visible tiles are reconciled, so a 1000 frame sheet scrolls smoothly.
- [ ] **More UI languages** (the i18n layer is ready, only the strings are missing).
- [ ] **Undo across the project boundary**: loading a project clears the history today; a cross session stack would need the sheet in the history.

## ?? v3.1 � Test Depth, Remaining

- [ ] **Cross engine axe**: the audit runs on Chromium only. Firefox and WebKit blend the modal backdrop differently, so the numbers are not comparable yet.
- [ ] **Touch drag for the manual frame tools** on a real phone: taps are covered, a touch drag still needs pointer event dispatch.
- [ ] **Golden atlas PNG fixtures** through an e2e snapshot, the encoder needs a real browser.
- [ ] **History and project tests in a component**: the ViewModel and the file format are covered, the wiring is only covered by Playwright.

## ?? v3.1 � Housekeeping

- [ ] **Extract the sidebar** out of `App.tsx` (1500 lines) and give it its own selector subscriptions, so a canvas interaction does not re-render 200 controls. The component tests exist, so the safety net is in place.
- [ ] **Single frame and sprite sheet export in the worker**: single canvas operations today, but the code path is duplicated between `ExportService` and the worker pipeline.
- [ ] **Test id registry**: the e2e selectors are `data-testid`s added ad hoc, ~18 of them.
- [ ] **Move the canvas creation out of the module scope** everywhere else: `App.tsx` still instantiates services at import time.

## ?? Ideas

- [ ] Sprite sheet *import* UI on top of the existing descriptor reader.
- [ ] A command palette over the ViewModel methods.
- [ ] Undo/redo for the atlas options, they are not in the history today.

## ?? Engineering Rules

- Domain layer stays pure and fully unit tested; no DOM, no React.
- Every new engine descriptor gets an exact-output test.
- Canvas / Worker APIs are stubbed in `src/testUtils`, never mocked ad hoc in a test file.
- No canvas or worker is created at module import time: services create their scratch surface on first use.
- Icon only controls need an accessible name; both palettes must clear WCAG AA (axe runs in the e2e suite).
- Every colour is a CSS variable: a hardcoded surface breaks the light theme.
- Every document change records history through `record()`; related changes go through `batch()`, gestures through `beginGesture()` / `endGesture()`.
- Object URLs go through `ImageLoader` / the thumbnail hook, timers through `requestAnimationFrame`.
- Frame arrays stay immutable: their identity is the cache key.
- Pixel producers return a real `ImageData`: `putImageData` brand checks its argument.
- Asynchronous state updates are token guarded, a slow run never overwrites a newer one.
- Performance claims need `npm run bench`, browser claims need `npm run test:e2e` (four profiles).
- `npm run lint && npm test && npm run test:e2e && npm run build` must pass before anything is pushed.
