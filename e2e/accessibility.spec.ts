import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSheetPng, FIXTURE_CELLS, type SheetOptions } from './support/sheetPng';

interface AxeResult {
  violations: Array<{ id: string; impact: string | null; help: string }>;
}

async function uploadSheet(page: Page, options: SheetOptions = {}): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), 'pixelslicer-a11y-'));
  const path = join(directory, 'sheet.png');
  writeFileSync(path, createSheetPng(options));

  await page.goto('/');
  await page.getByTestId('image-upload-input').setInputFiles(path);
  await expect(page.locator('.frame-item')).toHaveCount(FIXTURE_CELLS);
}

/** Violations that are accepted for this editor, with the reason next to them. */
const IGNORED = new Set<string>();

async function audit(page: Page, include?: string): Promise<string> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ]);
  if (include) builder = builder.include(include);

  const results = (await builder.analyze()) as AxeResult;
  return results.violations
    .filter(violation => !IGNORED.has(violation.id))
    .map(violation => `${violation.id} (${violation.impact}): ${violation.help}`)
    .join('\n');
}

test.describe('accessibility', () => {
  test('the empty editor has no violations', async ({ page }) => {
    await page.goto('/');
    expect(await audit(page)).toBe('');
  });

  test('the editor with a loaded sheet has no violations', async ({ page }) => {
    await uploadSheet(page);
    expect(await audit(page)).toBe('');
  });

  test('the atlas packer modal has no violations', async ({ page }) => {
    await uploadSheet(page);
    await page.getByTestId('atlas-open').click();
    await expect(page.getByTestId('atlas-build')).toBeVisible();
    expect(await audit(page, '.modal')).toBe('');
  });

  test('the light palette has no violations', async ({ page }) => {
    await uploadSheet(page);

    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // Wait for the palette to be applied, not just the attribute to be set.
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(247, 248, 252)');

    expect(await audit(page)).toBe('');

    await page.getByTestId('atlas-open').click();
    await expect(page.getByTestId('atlas-build')).toBeVisible();
    expect(await audit(page, '.modal')).toBe('');
  });

  test('the theme choice survives a reload', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
