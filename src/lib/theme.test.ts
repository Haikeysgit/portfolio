import { describe, expect, it } from 'vitest';
import { getInitialTheme } from './theme';

describe('getInitialTheme', () => {
  it('opens light on a laptop first visit', () => expect(getInitialTheme(null, false)).toBe('light'));
  it('opens dark on a phone first visit', () => expect(getInitialTheme(null, true)).toBe('dark'));
  it('keeps a stored dark choice on a laptop', () => expect(getInitialTheme('dark', false)).toBe('dark'));
  it('keeps a stored light choice on a phone', () => expect(getInitialTheme('light', true)).toBe('light'));
  it('ignores a garbage stored value', () => expect(getInitialTheme('garbage', true)).toBe('dark'));
});
