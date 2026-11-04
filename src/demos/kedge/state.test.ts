import { describe, expect, it } from 'vitest';
import { initialKedge, kedgeReducer, stepsFor, type KedgeAction, type KedgeState } from './state';
import { SUPERVISED_STEPS, UNSUPERVISED_STEPS } from './steps';

const run = (s: KedgeState, ...a: KedgeAction[]) => a.reduce(kedgeReducer, s);
const toEnd = (s: KedgeState) => {
  for (let i = 0; i < 20; i++) s = kedgeReducer(s, { type: 'STEP' });
  return s;
};

describe('kedgeReducer', () => {
  it('starts supervised at the first step, paused', () =>
    expect(initialKedge).toEqual({ mode: 'supervised', index: 0, playing: false }));

  it('ends supervised with 5 of 5 tests', () => {
    const s = toEnd(initialKedge);
    expect(stepsFor(s)[s.index].tests).toBe('5/5');
    expect(s.index).toBe(SUPERVISED_STEPS.length - 1);
  });

  it('ends unsupervised with 2 of 5 tests', () => {
    const s = toEnd(run(initialKedge, { type: 'TOGGLE_MODE' }));
    expect(stepsFor(s)[s.index].tests).toBe('2/5');
    expect(s.index).toBe(UNSUPERVISED_STEPS.length - 1);
  });

  it('STEP at the last step stays put and stops playing', () => {
    const end = { ...toEnd(initialKedge), playing: true };
    const s = kedgeReducer(end, { type: 'STEP' });
    expect(s.index).toBe(end.index);
    expect(s.playing).toBe(false);
  });

  it('TICK advances only while playing', () => {
    expect(kedgeReducer(initialKedge, { type: 'TICK' }).index).toBe(0);
    expect(run(initialKedge, { type: 'PLAY' }, { type: 'TICK' }).index).toBe(1);
    expect(run(initialKedge, { type: 'PLAY' }, { type: 'PAUSE' }, { type: 'TICK' }).index).toBe(0);
  });

  it('PLAY at the end starts again from the first step', () => {
    const s = kedgeReducer(toEnd(initialKedge), { type: 'PLAY' });
    expect(s.index).toBe(0);
    expect(s.playing).toBe(true);
  });

  it('TOGGLE_MODE switches mode and goes back to the first step', () => {
    const s = run(initialKedge, { type: 'STEP' }, { type: 'STEP' }, { type: 'PLAY' }, { type: 'TOGGLE_MODE' });
    expect(s).toEqual({ mode: 'unsupervised', index: 0, playing: false });
  });

  it('RESET returns to the initial state', () =>
    expect(run(initialKedge, { type: 'TOGGLE_MODE' }, { type: 'STEP' }, { type: 'RESET' })).toEqual(initialKedge));
});
