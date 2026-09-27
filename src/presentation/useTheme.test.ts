// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  getInitialTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './useTheme';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  vi.stubGlobal('matchMedia', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theme preference', () => {
  it('defaults to dark', () => {
    expect(getInitialTheme()).toBe('dark');
  });

  it('reads the stored preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getInitialTheme()).toBe('light');
  });

  it('ignores a corrupted stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(getInitialTheme()).toBe('dark');
  });

  it('follows a light system preference on a first visit', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('light'),
    }));

    expect(getInitialTheme()).toBe('light');
  });

  it('prefers the stored value over the system one', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    expect(getInitialTheme()).toBe('dark');
  });

  it('persists the choice', () => {
    storeTheme('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});

describe('applyTheme', () => {
  it('sets the attribute the stylesheet keys off', () => {
    applyTheme('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('switches back to dark', () => {
    applyTheme('light');
    applyTheme('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});

describe('toggleTheme', () => {
  it('flips between the two palettes', () => {
    expect(toggleTheme('dark')).toBe('light');
    expect(toggleTheme('light')).toBe('dark');
  });
});
