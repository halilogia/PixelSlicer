# 📊 Performance Benchmarks

Baseline numbers for the hot paths, produced by `npm run bench` (Vitest + tinybench).
They are **not** pass/fail tests: run the suite before and after a performance change
and compare the mean column.

```bash
npm run bench
```

Synthetic sheet: 32x32 frames, each with a 24x24 opaque core, laid out in a square grid.
Atlas defaults (2px padding, 2px extrude, power of two, 4096px page limit).
"Before" is the state at the start of v2.3 (v2.2.0).

## Atlas pipeline (mean ms per operation)

| Operation | Before v2.3 | Now | Change |
| --- | --- | --- | --- |
| `pack only` 100 frames | 0.059 | 0.063 | noise |
| `measure + pack` 100 frames | 0.44 | 0.42 | noise |
| `pack only` 500 frames | 0.41 | 0.28 | -32% |
| `measure + pack` 500 frames | 7.88 | 2.12 | **-73%** |
| `pack only` 1000 frames | 8.45 | 0.62 | **-93%** |
| `measure + pack` 1000 frames | 11.54 | 4.36 | **-62%** |
| `write the Phaser JSON` for 1000 sprites | 9.69 | 7.74 | noise |

What moved and why:

- **Page size estimation (`estimatePageSize`)**: the ascending size search paid for
  several full MaxRects attempts that could not possibly fit. A cheap shelf estimate
  now runs first and returns the most square page that can hold everything, which is
  usually the very first candidate the old search reached anyway.
- **Memoized frame lists (`F-007`)**: reading `getFrames()` is constant time
  (0.0001 ms) instead of rebuilding a 1000 element array, which is what made React's
  dependency checks useless before. The cache key is the identity of the immutable
  frame arrays, so unrelated state changes (zoom, selection, playback) do not even
  invalidate it.

## Where the remaining time goes

For 1000 frames the trim step is now the dominant cost (~3.7 ms for a 1 megapixel
buffer): it scans every pixel of the sheet. That work runs inside the
OffscreenCanvas worker, so it no longer blocks the UI, and the ZIP/GIF exports moved
to a second worker as well.

| Operation | mean ms |
| --- | --- |
| `read the frame list of 1000 frames` | 0.0001 |
| `read the active frame list of 1000 frames` | 0.0001 |
| `toggle one frame in a 1000 frame sheet` | 0.007 |
| `calculate a 50x20 grid` | 0.013 |

## What is not measured here

Browser only paths have no Node benchmark: thumbnail generation, the gallery
reconciliation, the ZIP/GIF export wall time and the atlas rasterization. The React
level is covered by component tests instead (see `src/hooks/useEditorSelector.test.tsx`),
and the worker paths by `AtlasWorkerClient.test.ts` / `FrameExportWorkerClient.test.ts`.

## Adding a benchmark

Add a `bench/*.bench.ts` file. It runs in Node, so only the pure layers and the
`EditorViewModel` are reachable; anything needing a real canvas has to be
benchmarked in the browser instead.
