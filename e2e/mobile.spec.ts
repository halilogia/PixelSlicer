import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSheetPng, FIXTURE_CELLS } from './support/sheetPng';

async function uploadSheet(page: Page): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'pixelslicer-mobile-'));
  const path = join(directory, 'sheet.png');
  writeFileSync(path, createSheetPng());

  await page.goto('/');
  await page.getByTestId('image-upload-input').setInputFiles(path);
  await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);
}

test.describe('phone viewport', () => {
  test('fits the layout without horizontal scrolling', async ({ page }) => {
    await uploadSheet(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the canvas and the gallery are visible', async ({ page }) => {
    await uploadSheet(page);

    await expect(page.locator('#mainCanvas')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.frame-item').first()).toBeVisible();
  });

  test('a tap switches the manual selection mode', async ({ page }) => {
    await uploadSheet(page);

    const toggle = page.getByText(/Manual Selection/).locator('..').getByRole('button');
    await expect(toggle).toHaveAttribute('class', /btn--secondary/);

    await toggle.tap();

    await expect(page.getByText(/Manual Selection/).locator('..').getByRole('button')).toHaveAttribute(
      'class',
      /btn--active/
    );
  });

  test('a tap opens the atlas packer and builds an atlas', async ({ page }) => {
    await uploadSheet(page);

    await page.getByTestId('atlas-open').tap();
    await expect(page.getByTestId('atlas-build')).toBeVisible();

    await page.getByTestId('atlas-build').tap();
    await expect(page.getByTestId('atlas-stats')).toBeVisible();
    await expect(page.getByTestId('atlas-stats')).toContainText(String(FIXTURE_CELLS));
  });

  test('the zoom controls answer to taps', async ({ page }) => {
    await uploadSheet(page);

    const level = page.locator('.zoom-level');
    const before = await level.textContent();

    // The canvas zoom button, not the preview one inside the sidebar.
    await page.locator('.zoom-controls').getByLabel(/Zoom In/).tap();

    await expect(level).not.toHaveText(before ?? '');
  });
});
