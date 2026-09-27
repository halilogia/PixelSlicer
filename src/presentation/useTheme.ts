// Presentation Layer - Theme
// The palette lives in CSS variables (see main.css), this only owns the
// preference and the attribute the stylesheet keys off.

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'pixelslicer_theme';

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(stored)) return stored;

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    // Only a light preference switches the editor away from the default.
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function storeTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
