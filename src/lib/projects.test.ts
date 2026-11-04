import { describe, expect, it } from 'vitest';
import { matchesFilter, sortByOrder, trackLabel } from './projects';

describe('matchesFilter', () => {
  it('matches a multi-track project on any of its tracks', () => expect(matchesFilter(['ai', 'blockchain'], 'blockchain')).toBe(true));
  it('rejects a project without the track', () => expect(matchesFilter(['app'], 'ai')).toBe(false));
  it('matches everything on "all"', () => expect(matchesFilter(['app'], 'all')).toBe(true));
});

describe('trackLabel', () => {
  it('labels blockchain as "Blockchain"', () => expect(trackLabel('blockchain')).toBe('Blockchain'));
  it('labels ai as "AI agents"', () => expect(trackLabel('ai')).toBe('AI agents'));
  it('labels app as "Web apps"', () => expect(trackLabel('app')).toBe('Web apps'));
});

describe('sortByOrder', () => {
  it('sorts ascending without mutating the input', () => {
    const input = [{ data: { order: 3 } }, { data: { order: 1 } }, { data: { order: 2 } }];
    const out = sortByOrder(input);
    expect(out.map((p) => p.data.order)).toEqual([1, 2, 3]);
    expect(input.map((p) => p.data.order)).toEqual([3, 1, 2]);
  });
});
