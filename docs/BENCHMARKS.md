# 📊 Performance Benchmarks

Baseline numbers for the hot paths, produced by `npm run bench` (Vitest + tinybench).
They are **not** pass/fail tests: run the suite before and after a performance change
and compare the mean column.

```bash
npm run bench
```

Synthetic sheet: 32x32 frames, each with a 24x24 opaque core, laid out in a square grid.
Atlas defaults (2px padding, 2px extrude, power of two, 4096px page limit).

## Atlas pipeline (mean ms per operation)

| Operation | Before v2.3 | After v2.3 | Change |
| --- | --- | --- | --- |
| `pack only` 100 frames | 0.059 | 0.070 | noise |
| `measure + pack` 100 frames | 0.44 | 0.41 | noise |
| `pack only` 500 frames | 0.41 | 0.67 | noise |
| `measure + pack` 500 frames | 7.88 | 2.90 | -63% |
| `pack only` 1000 frames | 8.45 | 1.94 | -77% |
| `measure + pack` 1000 frames | 11.54 | 9.11 | -21% |
| `write the Phaser JSON` for 1000 sprites | 9.69 | 7.74 | noise |

What moved and why:

- **Page size estimation (`estimatePageSize`)**: the ascending size search paid for
  several full MaxRects attempts that could not possibly fit. A cheap shelf estimate
  now runs first and returns the most square page that can hold everything, which is
  usually the very first candidate the old search reached anyway.
- **Memoized frame lists (`F-007`)**: reading `getFrames()` is now constant time
  (0.0001 ms) instead of rebuilding a 1000 element array, which is what made React's
  dependency checks useless before.

## Where the remaining time goes

For 1000 frames the trim step is now the dominant cost (~7 ms for a 1 megapixel
buffer): it scans every pixel of the sheet. That work is already inside the
OffscreenCanvas worker, so it no longer blocks the UI, but moving the thumbnail
and ZIP/GIF export paths to a worker is the next step in this list.

| Operation | mean ms |
| --- | --- |
| `read the frame list of 1000 frames` | 0.0001 |
| `read the active frame list of 1000 frames` | 0.0001 |
| `toggle one frame in a 1000 frame sheet` | 0.007 |
| `calculate a 50x20 grid` | 0.013 |

## Adding a benchmark

Add a `bench/*.bench.ts` file. It runs in Node, so only the pure layers and the
`EditorViewModel` are reachable; anything needing a real canvas has to be
benchmarked in the browser instead.
