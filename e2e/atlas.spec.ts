import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { createSheetPng, FIXTURE_CELLS, type SheetOptions } from './support/sheetPng';

const readFile = (path: string) => readFileSync(path);

async function uploadSheet(page: Page, options: SheetOptions = {}): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'pixelslicer-e2e-'));
  const path = join(directory, 'sheet.png');
  writeFileSync(path, createSheetPng(options));

  await page.goto('/');
  await page.getByTestId('image-upload-input').setInputFiles(path);
  await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);
}

test('slices an uploaded sheet into the gallery', async ({ page }) => {
  await uploadSheet(page);

  // Thumbnails are generated in idle batches, the tiles show the shimmer first.
  await expect(page.locator('.frame-item__img')).toHaveCount(FIXTURE_CELLS);
  await expect(page.locator('.frame-item__placeholder-shimmer')).toHaveCount(0);
});

test('toggles a frame from the gallery', async ({ page }) => {
  await uploadSheet(page);

  const firstTile = page.locator('.frame-item').first();
  await expect(firstTile).not.toHaveClass(/frame-item--disabled/);

  await firstTile.locator('.frame-item__toggle').click();
  await expect(firstTile).toHaveClass(/frame-item--disabled/);
});

test('builds a trimmed atlas and downloads the ZIP', async ({ page }) => {
  await uploadSheet(page);

  await page.getByTestId('atlas-open').click();
  await expect(page.getByTestId('atlas-build')).toBeVisible();

  await page.getByTestId('atlas-build').click();

  // The stats block only exists after a successful build.
  const stats = page.getByTestId('atlas-stats');
  await expect(stats).toBeVisible();
  await expect(stats).toContainText('8');
  // The auto-trim has to have found the 24x24 cores inside the 32x32 cells.
  await expect(stats).not.toContainText('0');

  const preview = page.getByTestId('atlas-preview').locator('canvas');
  await expect
    .poll(async () => preview.evaluate(canvas => (canvas as HTMLCanvasElement).width))
    .toBeGreaterThan(0);

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('atlas-export').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('pixelslicer-atlas.zip');
});

test('exports the frame ZIP and the animation GIF from the worker', async ({ page }) => {
  await uploadSheet(page);

  const zipPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ZIP' }).first().click();
  const zip = await zipPromise;
  expect(zip.suggestedFilename()).toBe('frames.zip');

  const zipPath = await zip.path();
  const archive = await JSZip.loadAsync(await readFile(zipPath!));
  expect(Object.keys(archive.files).sort()).toEqual([
    'frame_0001.png',
    'frame_0002.png',
    'frame_0003.png',
    'frame_0004.png',
    'frame_0005.png',
    'frame_0006.png',
    'frame_0007.png',
    'frame_0008.png',
  ]);

  const gifPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'GIF' }).first().click();
  const gif = await gifPromise;
  expect(gif.suggestedFilename()).toBe('animation.gif');

  const header = (await readFile((await gif.path())!)).subarray(0, 6).toString('ascii');
  expect(header).toBe('GIF89a');
});

test('rotates, renames and groups without breaking the build', async ({ page }) => {
  await uploadSheet(page);
  await page.getByTestId('atlas-open').click();

  await page.getByTestId('atlas-rotation').check();
  await page.getByTestId('atlas-name-prefix').fill('hero_');
  await page.getByTestId('atlas-name-start').fill('7');
  // Group the eight frames as two animations of four.
  await page.getByTestId('atlas-group-size').fill('4');

  await page.getByTestId('atlas-build').click();
  await expect(page.getByTestId('atlas-stats')).toBeVisible();
  await expect(page.getByTestId('atlas-stats')).toContainText('8');

  // The generated names follow the prefix and the start index.
  await page.locator('.atlas__names summary').click();
  await expect(page.getByTestId('atlas-name-0')).toHaveValue('hero_0007');
  await expect(page.getByTestId('atlas-name-7')).toHaveValue('hero_0014');

  // A manual rename survives the next build. The list is collapsed first: with
  // a long list open the modal scrolls and the build button moves out of reach.
  await page.getByTestId('atlas-name-0').fill('hero_walk_01');
  await page.locator('.atlas__names summary').click();
  await page.getByTestId('atlas-build').click();
  await page.locator('.atlas__names summary').click();
  await expect(page.getByTestId('atlas-name-0')).toHaveValue('hero_walk_01');
});

test('warns about a fully transparent frame', async ({ page }) => {
  await uploadSheet(page, { transparentCells: [3] });
  await page.getByTestId('atlas-open').click();
  await page.getByTestId('atlas-build').click();

  const warnings = page.getByTestId('atlas-warnings');
  await expect(warnings).toBeVisible();
  await expect(warnings).toContainText('1x1 placeholder');
});
