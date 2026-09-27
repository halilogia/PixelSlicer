# 📜 Changelog - PixelSlicer

All notable changes to the PixelSlicer project will be documented in this file.

## [3.0.0] - 2026-09-27

The editor finally remembers what you did, and it remembers what you were working on.

### Added
- **Undo / redo**: a bounded history (50 steps) over the document slices, not the view. A gesture (draw, drag, resize) collapses into one step, a cancelled gesture leaves no entry, and the history is cleared when a new sheet is loaded. Undo, redo, `canUndo` and `canRedo` live in the `EditorViewModel`, with buttons in the sidebar.
- **Keyboard shortcuts**: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` and `Ctrl+Y` redo, `Space` play/pause, `Delete` removes the selected manual frame, `+`/`-` zoom, arrows nudge the selected frame (with `Shift` for a bigger step). Inputs, textareas and selects are left alone.
- **Project files**: `Save` writes a single self contained `.json` (document + the sheet as a PNG data URL, versioned), `Open` restores it, including the grid, manual frames and every pivot. A file from a newer version is refused with a readable message.
- **Dark / light theme**: the palette is a set of CSS variables and the new light one is tuned for WCAG AA. The choice follows the system on a first visit, persists, and survives a reload.
- **Reduced motion support**: `prefers-reduced-motion` now disables every transition and animation in the app, not just the gallery shimmer.
- **Tests**: 382 → **420** unit/component tests and 32 → **46** browser scenarios. New suites cover the history (28 tests), the project file, the theme and the e2e flows for undo/redo, the shortcuts and a real save/load round trip.

### Fixed
- **The history lost every grid pivot**: restoring a document recalculated the frames, which rebuilt them and dropped the pivots.
- **The history survived a new sheet**: loading another image kept the previous frames in the undo stack.
- **One interaction produced two undo steps**: a grid input updated two slices, so a single undo only reverted half of it. Related changes now run through `viewModel.batch()`.
- **A cancelled drawing left a no-op history entry.**
- The theme toggle reused the `settings-btn` class, so anything selecting the settings button by class also hit the theme button.
- The light palette failed the axe audit: a hardcoded black scrim dimmed the modal content, the zoom bar had a fixed dark surface, the zoom percentage was always white, and the accent colours were too light for a light background. All four now follow the theme.

### Changed
- The axe audit runs on Chromium only: Firefox and WebKit blend the modal backdrop differently, so the numbers are not comparable across engines. The contrast work is in the palette, not in the test.
- Playwright pins `colorScheme: 'dark'` and `reducedMotion: 'reduce'` so the suite and the audit are deterministic.
- `ROADMAP.md` drops the finished items, `docs/KNOWLEDGE.md` documents the history and theme rules.

## [2.6.0] - 2026-09-27

### Added
- **Deterministic ZIP output**: `encodeFramesAsZip` accepts a `modifiedAt` timestamp, so the archive is byte for byte reproducible when a test pins it. The editor still stamps the real export time.
- **Golden archive tests**: the whole ZIP is now checksummed, not just its size, and a test proves a pixel change changes the archive.
- **Video sprite sheet builder tests**: `createSpriteSheetFromFrames` covers the grid, the canvas fallback, the per frame canvas size and the cleanup.
- **Upload simulation tests**: `uploadVideo` progress, `cancelAllUploads` and `cancelUpload` run on a controlled clock with a fake `<video>` element.
- **`VideoPreview` component tests**: thumbnail, placeholder fallback, duration and size formatting, remove by id, accessible button names.
- **Accessibility sweep** (`e2e/accessibility.spec.ts`): axe-core runs against the empty editor, the loaded editor and the atlas modal, on the WCAG 2.1 A/AA tags.
- **Phone viewport suite** (`e2e/mobile.spec.ts`, iPhone 13 profile): no horizontal overflow, canvas/sidebar/gallery visible, taps on manual mode, the atlas packer and the zoom controls.

### Fixed
The accessibility audit found four real defects, all fixed:
- **Contrast**: `--text-secondary` and `--text-muted` failed WCAG AA at 2.2-2.9:1 on both the page and the raised surfaces; they are now `#9aa5ce` / `#7a84a8` (5.5-6.5:1), and the primary button takes dark text on the light accent instead of white (2.5:1).
- **Unlabelled controls**: the grid, offset, padding, FPS, tolerance, alpha and sheet column inputs, plus the pivot `<select>`, had no accessible name. All of them carry one now.
- **Icon only buttons** with no accessible name: settings, video, the four preview controls and the modal close buttons.
- The decorative FontAwesome icons are now `aria-hidden`, so they no longer leak into the accessible name.

### Changed
- Coverage 68% → **71.6%** line coverage, 366 → **382** unit/component tests, 18 → **32** browser scenarios (Chromium, Firefox, WebKit, plus the phone profile). Floors moved to 70% lines / 70% functions / 85% branches.
- `docs/KNOWLEDGE.md` documents the axe rule: every icon only control needs an accessible name, and the palette has to clear AA.
- `ROADMAP.md` drops the finished test depth section.

## [2.5.0] - 2026-09-27

### Added
- **Component tests for `App.tsx`**: the shell, the upload and export actions, the settings and video modals, the language switch, the sidebar (manual mode, manual add, grid inputs, atlas entry, pivot picking, pivot presets, auto trim) and the stacked canvas layers. `App.tsx` went from 0% to ~48% coverage.
- **Component tests for the Atlas Packer modal**: one test per option (trim, page size, naming, rename, rotation, grouping, formats), the statistics, the preview, the sticky header and the error path.
- **Golden tests for the export pipeline**: the fixture sheet is decoded to real pixels (a small PNG decoder lives next to the encoder in `src/testUtils/fixtureSheet.ts`), so `cropFrame`, `composeFrameCell`, the GIF bytes and the Phaser descriptor are asserted against a checksum and hand computed values. A single flipped pixel changes the GIF checksum; the 4 bit palette swallows the change on black, which the test documents.
- **Video infrastructure tests**: the grid maths, the frame cleanup, the canvas conversion and the file validation rules.
- **Playwright on Firefox and WebKit**: the suite now runs on all three engines (18 scenarios). The atlas worker, the OffscreenCanvas raster and the downloads behave the same everywhere.
- A shared fixture sheet: the unit tests and the browser tests generate the same PNG from `src/testUtils/fixtureSheet.ts`.

### Fixed
- **The export buttons were not disabled without an image**: "Download ZIP" and friends were clickable and did nothing.
- **A canvas was created at import time**: `new VideoFrameExtractor()` ran in the `App` module scope and threw wherever there is no 2D context. The scratch canvas is now created on first use, which is what made the component testable in the first place.
- The main canvas lost its `id="mainCanvas"`, so the CSS rule and anything looking it up by id stopped matching.
- The gallery empty state was hard coded Turkish while the rest of the interface is translated.

### Changed
- Coverage: 38% → **68%** line coverage, 313 → **366** unit/component tests, 6 → 18 browser scenarios. The floors moved to 65% lines / 68% functions / 82% branches, with the per area floors (domain 90, atlas 90, ViewModel 90) unchanged.
- CI installs Chromium, Firefox and WebKit for the end to end job.
- `ROADMAP.md` drops the finished v2.5 test section, `docs/KNOWLEDGE.md` documents the happy-dom rules.

## [2.4.0] - 2026-09-27

### Added
- **Preview every atlas page** with page chips and a zoom control (0.25x / 0.5x / 1x / 2x); until now only the first page was visible.
- **Editable sprite names**: a prefix + start index generates `frame_0001` style names, and the built sprite list can be renamed inline. The names are the keys in every exported descriptor, so this is the difference between `frame_0001.png` and `hero_walk_01.png`.
- **90° rotation in the packer** (`allowRotation`): MaxRects scores both orientations and stores the transposed rect, with `rotated: true` in the Phaser, Unity, Starling and Godot metadata. Upright wins a tie.
- **Animation aware packing** (`framesPerGroup`): frames are grouped by animation and a group is never split across pages, so an engine that binds a page to a texture never swaps mid animation.
- **Frame warnings**: fully transparent frames (1x1 placeholders) and duplicated areas are listed in the modal instead of being silently packed.
- **Starling exporters**: `atlas.xml` (with `frameX`/`frameY` and `rotation`) and a JSON flavour.
- **Native Unity assets**: a `.meta` per page (sprite sheet, custom pivots) plus a `PixelSlicerAtlas.spriteatlas` with deterministic GUIDs, so the atlas imports as a real `SpriteAtlas` without the editor script. The bundled C# importer remains the fallback.
- **Atlas import**: `readAtlasDescriptor` reads the Phaser and Godot descriptors this tool writes back into frames, for a Godot / Unity round trip.
- **Background removal in a worker**: the colour walk runs off the main thread with an inline fallback.
- Tests: 279 → **313**, plus 2 more Playwright scenarios (rotation + naming + grouping, and the empty frame warning). Line coverage 35.6% → 38.1%.

### Fixed
- **Pages held a single sprite** when the content was larger than the page limit: the size search gave up and fell back to one page per sprite. It now fills the largest allowed page with as many sprites (or whole groups) as fit.
- **Out of order background removal**: a slow run could overwrite the result of a newer one; the ViewModel now guards it with a token, and the mutators are awaitable.
- **The Build button scrolled out of reach** in the atlas modal when the sprite name list was open; the preview header is now sticky.
- The Godot descriptor reports the rotation (AtlasTexture cannot rotate a region) and the margins still restore the untrimmed size.

### Changed
- `AtlasSourceImage` accepts `OffscreenCanvas` and `ImageBitmap`, which is what the worker based background removal and atlas pages return.
- `README.txt` in the bundle documents the Unity, Godot and Phaser steps, including the new native Unity assets.
- `ROADMAP.md` drops the finished v2.4 sections, `docs/OPTIMIZATIONS.md` and `docs/KNOWLEDGE.md` follow.

## [2.3.0] - 2026-09-27

### Performance
- **Memoized frame lists** (`F-007`): `getFrames()` / `getActiveFrames()` are cached behind the identity of the now immutable frame arrays, so a zoom or a selection change no longer rebuilds a 1000 element array. Reading them is now 0.0001 ms.
- **Page size estimation** in the bin packer: a cheap shelf pass guesses the most square page that can hold everything, so the search stops paying for full MaxRects attempts that cannot fit. `pack only` for 1000 sprites: 8.45 ms → 0.62 ms.
- **Split editor canvas** (`F-006`): the sheet and frame decorations live on the image layer, the marching ants on a pointer transparent overlay. A 50 ms animation tick no longer repaints the image and every frame border.
- **Selector subscriptions** (`F-003`): new `useEditorSelector`, and the gallery now subscribes to the slices it needs. Zooming, selecting or animating no longer re-renders a thousand thumbnails.
- **Object URL thumbnails**: `toBlob()` + `createObjectURL()` instead of base64 data URLs (~33% less memory), and the encoding no longer blocks the main thread.
- **Export in a worker**: the ZIP and GIF exports run in a second Web Worker on a shared encoding pipeline, so a large export no longer freezes the editor. JSZip and gifenc are only loaded when an export actually runs.
- **Gathered canvas state** (`F-008`): the main draw only touches `strokeStyle` / `fillStyle` / `font` / `lineWidth` when the value really changes.

### Added
- `npm run test:e2e`: Playwright smoke tests in real Chromium — upload a generated fixture sheet, slice it, toggle a frame, build a trimmed atlas, download the atlas ZIP, and export the frame ZIP + animated GIF through the worker (4 tests, running in CI).
- `npm run bench`: Vitest benchmarks for the atlas pipeline and the editor state at 100 / 500 / 1000 frames, with the baseline recorded in `docs/BENCHMARKS.md`.
- `ExportPipeline`: the pixel and encoding half of the ZIP/GIF export, shared by the main thread and the worker.
- Tests: 113 → **279**. `FrameLogic` 5.78% → 100%, `domain/video` 0% → 96%, `ExportService` 0% → 98%, `EditorViewModel` at 96%. Coverage now measures all of `src` with per area floors.
- React component tests on happy-dom for `useEditorSelector`, `GallerySection` and the object URL lifecycle of `useFrameThumbnails`.
- A shimmer placeholder while thumbnails are still generating (respects `prefers-reduced-motion`).

### Fixed
- **ZIP and GIF export were completely broken in the browser**: `putImageData` brand checks its argument, and the pixel producers returned a plain object. Found by the Playwright suite, fixed with a real `ImageData` (with a Node fallback) plus `toNativeImageData` in every encoder.
- **State leak**: the `EditorViewModel` constructor shallow copied the default state, so the frame arrays were shared with the module level defaults and `addManualFrame` mutated them.
- **Object URL leak on unmount**: the thumbnail hook cleanup closed over the first, still empty map, so every URL generated later was never revoked.
- **Stale frame list**: sharing one cache key between `getFrames()` and `getActiveFrames()` let a frame toggle return a stale list.
- **Wrong worker path**: a relative `new URL()` in the export client pointed outside `src` and broke the production build.
- A corrupt file in a multi image upload no longer blocks the whole batch.

### Changed
- The frame arrays are now immutable: `addManualFrame`, `updateManualFrame`, `resizeManualFrame` and `deleteManualFrame` replace the array instead of mutating it. That identity is what makes the caches correct.
- Removed the dead `src/components/Icons.tsx` and the unused `lucide-react` dependency (the UI uses FontAwesome).
- Removed the unused `useSingleThumbnail` hook so there is a single thumbnail implementation.
- `ROADMAP.md` drops the finished v2.3 sections, `docs/OPTIMIZATIONS.md` and `docs/KNOWLEDGE.md` follow the new architecture.

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
