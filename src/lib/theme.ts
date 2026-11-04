export type Theme = 'dark' | 'light';

/**
 * A choice made with the toggle always wins. Otherwise laptops open light and phones open dark.
 * The inline script in src/layouts/Base.astro mirrors this; keep the two in sync.
 */
export function getInitialTheme(stored: string | null, isPhone: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return isPhone ? 'dark' : 'light';
}

/** Browser chrome colour per theme (matches --bg in tokens.css). */
export const THEME_COLOR: Record<Theme, string> = { dark: '#17110d', light: '#f4ede3' };
