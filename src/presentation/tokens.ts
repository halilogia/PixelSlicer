// Presentation Layer - Design tokens
// Centralized color palette and constants (Tokyonight theme)

// Colors
export const colors = {
  // Backgrounds
  bg: {
    primary: '#1a1b26',    // Main background
    secondary: '#16161e',  // Header, main area
    tertiary: '#1f2335',   // Sidebar
    quaternary: '#292e42', // Cards, panels
  },
  // Borders
  border: {
    default: '#414868',
    focus: '#7aa2f7',
  },
  // Text
  text: {
    primary: '#a9b1d6',
    secondary: '#565f89',
    muted: '#414868',
    white: '#ffffff',
  },
  // Accent colors
  accent: {
    blue: '#7aa2f7',
    blueHover: '#3d59a1',
    green: '#9ece6a',
    greenHover: '#73d216',
    purple: '#bb9af7',
    purpleHover: '#9d7cd8',
    red: '#f43f5e',
    orange: '#e0af68',
    yellow: '#e0af68',
  },
  // Canvas
  canvas: {
    bg: '#101014',
    checkerDark: '#2b2d42',
  },
} as const;

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

// Typography
export const typography = {
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', monospace",
  fontSize: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  glow: {
    blue: '0 0 20px rgba(122, 162, 247, 0.3)',
    green: '0 0 20px rgba(158, 206, 106, 0.3)',
    purple: '0 0 20px rgba(187, 154, 247, 0.3)',
  },
} as const;

// Border radius
export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// Transitions
export const transitions = {
  fast: '0.1s ease-out',
  normal: '0.2s ease-out',
  slow: '0.3s ease-out',
} as const;

// Z-index
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  tooltip: 40,
  toast: 50,
} as const;

// Canvas
export const canvas = {
  minWidth: '500px',
  minHeight: '400px',
  zoomStep: 0.1,
  minZoom: 0.1,
  maxZoom: 10,
  defaultPreviewSize: '128px', // 32 * 4
} as const;

// Frame gallery
export const gallery = {
  height: '160px', // 10 * 16px
  thumbSize: '64px',
  gap: '16px',
} as const;

// CSS Variables export for easy use
export const cssVariables = `
  --color-bg-primary: ${colors.bg.primary};
  --color-bg-secondary: ${colors.bg.secondary};
  --color-bg-tertiary: ${colors.bg.tertiary};
  --color-bg-quaternary: ${colors.bg.quaternary};
  --color-border: ${colors.border.default};
  --color-border-focus: ${colors.border.focus};
  --color-text-primary: ${colors.text.primary};
  --color-text-secondary: ${colors.text.secondary};
  --color-text-muted: ${colors.text.muted};
  --color-text-white: ${colors.text.white};
  --color-accent-blue: ${colors.accent.blue};
  --color-accent-blue-hover: ${colors.accent.blueHover};
  --color-accent-green: ${colors.accent.green};
  --color-accent-purple: ${colors.accent.purple};
  --color-accent-red: ${colors.accent.red};
  --color-accent-orange: ${colors.accent.orange};
  --font-family: ${typography.fontFamily};
  --font-mono: ${typography.fontMono};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --transition-fast: ${transitions.fast};
  --transition-normal: ${transitions.normal};
`;