import { describe, expect, it } from 'vitest';
import { getInitialTheme } from './theme';

describe('getInitialTheme', () => {
  it('defaults to dark on first visit', () => expect(getInitialTheme(null, false)).toBe('dark'));
  it('stays dark on first visit even if the OS prefers light', () => expect(getInitialTheme(null, true)).toBe('dark'));
  it('uses a stored light choice', () => expect(getInitialTheme('light', false)).toBe('light'));
  it('ignores a garbage stored value', () => expect(getInitialTheme('garbage', false)).toBe('dark'));
});
