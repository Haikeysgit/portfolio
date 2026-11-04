import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
function tokens(selector: string) {
  const block = css.split(selector)[1].split('}')[0];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

describe('contrastRatio', () => {
  it('is 21 for black on white', () => expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1));
});

for (const [name, sel] of [['dark', ':root {'], ['light', ':root[data-theme="light"] {']] as const) {
  describe(`${name} theme passes AA`, () => {
    const t = tokens(sel);
    for (const fg of ['ink', 'dim', 'acc']) {
      for (const bg of ['bg', 'bg1', 'bg2']) {
        it(`${fg} on ${bg}`, () => expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5));
      }
    }
  });
}
