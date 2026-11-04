export type Theme = 'dark' | 'light';

/** First visit is dark. Only an explicit stored "light" switches it. */
export function getInitialTheme(stored: string | null, _prefersLight: boolean): Theme {
  return stored === 'light' ? 'light' : 'dark';
}
