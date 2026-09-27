import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSheetPng, FIXTURE_CELLS } from './support/sheetPng';

async function uploadSheet(page: Page): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'pixelslicer-project-'));
  const path = join(directory, 'sheet.png');
  writeFileSync(path, createSheetPng());

  await page.goto('/');
  await page.getByTestId('image-upload-input').setInputFiles(path);
  await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);
}

test.describe('history and project', () => {
  test('the undo button is disabled until something changes', async ({ page }) => {
    await uploadSheet(page);

    await expect(page.getByTestId('undo')).toBeDisabled();
    await expect(page.getByTestId('redo')).toBeDisabled();
  });

  test('undo and redo a grid change', async ({ page }) => {
    await uploadSheet(page);

    const columns = page.getByLabel('Columns (Horizontal)');
    await columns.fill('2');
    // 2 columns x 2 rows = 4 frames, down from 8
    await expect(page.locator('.frame-item')).toHaveCount(4);
    await expect(page.getByTestId('undo')).toBeEnabled();

    await page.getByTestId('undo').click();
    await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);

    await page.getByTestId('redo').click();
    await expect(page.locator('.frame-item')).toHaveCount(4);
  });

  test('the keyboard shortcuts drive the history', async ({ page }) => {
    await uploadSheet(page);
    await page.getByLabel('Columns (Horizontal)').fill('2');
    await expect(page.locator('.frame-item')).toHaveCount(4);

    await page.locator('body').press('Control+z');
    await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);

    // Shift+Z is the redo shortcut that every engine delivers reliably.
    await page.locator('body').press('Control+Shift+z');
    await expect(page.locator('.frame-item')).toHaveCount(4);
  });

  test('the space bar starts and stops the playback', async ({ page }) => {
    await uploadSheet(page);

    // The play control is icon only, so its accessible name is the state.
    await expect(page.getByLabel('Play')).toBeVisible();

    await page.locator('body').press('Space');
    await expect(page.getByLabel('Pause')).toBeVisible();

    await page.locator('body').press('Space');
    await expect(page.getByLabel('Play')).toBeVisible();
  });

  test('saves a project file and opens it again', async ({ page }) => {
    await uploadSheet(page);
    await page.getByLabel('Columns (Horizontal)').fill('2');
    await expect(page.locator('.frame-item')).toHaveCount(4);

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('save-project').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('scene.project.json');
    const saved = join(mkdtempSync(join(tmpdir(), 'pixelslicer-proj-')), 'scene.project.json');
    await download.saveAs(saved);

    const project = JSON.parse(readFileSync(saved, 'utf8'));
    expect(project.format).toBe('pixelslicer-project');
    expect(project.document.gridConfig.cols).toBe(2);
    expect(project.document.frames).toHaveLength(4);

    // A fresh page can open the file and gets the same slice back.
    await page.goto('/');
    await page.getByTestId('load-project').setInputFiles(saved);

    await expect(page.getByTestId('project-notice')).toBeVisible();
    await expect(page.locator('.frame-item')).toHaveCount(4);
  });

  test('reports a project file it cannot read', async ({ page }) => {
    const directory = mkdtempSync(join(tmpdir(), 'pixelslicer-bad-'));
    const path = join(directory, 'broken.json');
    writeFileSync(path, '{ not json');

    await page.goto('/');
    await page.getByTestId('load-project').setInputFiles(path);

    await expect(page.getByTestId('project-notice')).toBeVisible();
    await expect(page.getByTestId('project-notice')).toContainText(/JSON/i);
  });
});
