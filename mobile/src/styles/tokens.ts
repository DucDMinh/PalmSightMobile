export const PALMSIGHT_TOKENS = {
  colors: {
    // Cosmic Night Palette
    canvas: '#0b0716',
    ink: '#f5e6c8',
    inkDeep: '#d4af37',
    charcoal: '#e5c888',
    body: '#d8cbe8',
    mute: '#9e8cb8',
    stone: '#7e6d99',
    ash: '#6a5885',

    // Surfaces
    surfaceSoft: '#140d26',
    surfaceCard: '#1b1233',
    surfaceDark: '#1f1438',
    surfaceElevated: '#2c1d4f',
    surfaceDarkElevated: '#2c1d4f',
    surfaceSecondary: '#241842',

    // Hairlines & borders
    hairline: 'rgba(212, 175, 55, 0.25)',
    hairlineStrong: 'rgba(212, 175, 55, 0.55)',
    hairlineBright: 'rgba(212, 175, 55, 0.85)',
    borderSubtle: '#27203a',

    // Imperial Gold & Celestial Tones
    gold: '#d4af37',
    goldLight: '#f7e7b4',
    goldDim: '#c5a059',
    goldGlow: 'rgba(212, 175, 55, 0.25)',

    // Accents & Signals
    accent: '#a855f7',
    accentHover: '#9333ea',
    warning: '#f59e0b',
    danger: '#fb7185',
    success: '#34d399',
    info: '#60a5fa',

    // Palm lines colors
    heartLine: '#fb7185',
    headLine: '#c084fc',
    lifeLine: '#f5d77f',
    fateLine: '#34d399',
  },
  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    fontDisplay: 'Georgia',
    fontMono: 'Courier',
    fontSans: 'System',
  },
} as const;

export const PALMSIGHT_MOBILE_THEME = PALMSIGHT_TOKENS;
export default PALMSIGHT_TOKENS;
