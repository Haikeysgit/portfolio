import { describe, expect, it } from 'vitest';
import { initialKedge, kedgeReducer, type KedgeAction, type KedgeState } from './state';
import { FRAME_COUNT, GUARDED, NO_GUARD } from './steps';

const run = (s: KedgeState, ...a: KedgeAction[]) => a.reduce(kedgeReducer, s);
const race = run(initialKedge, { type: 'OPEN', screen: 'race' });
const toEnd = (s: KedgeState) => run(s, ...Array.from({ length: 10 }, () => ({ type: 'STEP' }) as KedgeAction));

describe('the recorded runs', () => {
  it('end unguarded with 2 of 5 tests and guarded with 5 of 5', () => {
    expect(NO_GUARD.at(-1)).toMatchObject({ tests: '2/5', verdict: 'short' });
    expect(GUARDED.at(-1)).toMatchObject({ tests: '5/5', verdict: 'kept' });
  });
  it('strike the cheat on the guarded strip only', () => {
    expect(GUARDED.some((f) => f.strike)).toBe(true);
    expect(NO_GUARD.some((f) => f.strike)).toBe(false);
  });
});

describe('kedgeReducer', () => {
  it('opens on the landing page with nothing shown', () => expect(initialKedge).toEqual({ screen: 'landing', shown: 0, playing: false }));

  it('OPEN race starts from an empty strip, playing', () => expect(race).toEqual({ screen: 'race', shown: 0, playing: true }));

  it('STEP reveals one frame at a time and stops at the last', () => {
    expect(run(race, { type: 'STEP' }).shown).toBe(1);
    const end = toEnd(race);
    expect(end.shown).toBe(FRAME_COUNT);
    expect(end.playing).toBe(false);
  });

  it('TICK advances only while playing', () => {
    expect(run(race, { type: 'TICK' }).shown).toBe(1);
    expect(run(race, { type: 'PAUSE' }, { type: 'TICK' }).shown).toBe(0);
  });

  it('PLAY at the end replays from the start', () => {
    expect(kedgeReducer(toEnd(race), { type: 'PLAY' })).toEqual({ screen: 'race', shown: 0, playing: true });
  });

  it('OPEN how stops playback', () => {
    expect(run(race, { type: 'OPEN', screen: 'how' })).toMatchObject({ screen: 'how', playing: false });
  });

  it('RESET returns to the landing page', () => expect(run(toEnd(race), { type: 'RESET' })).toEqual(initialKedge));
});
