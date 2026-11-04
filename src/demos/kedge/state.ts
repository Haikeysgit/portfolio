import { SUPERVISED_STEPS, UNSUPERVISED_STEPS, type Step } from './steps';

export type KedgeState = { mode: 'supervised' | 'unsupervised'; index: number; playing: boolean };
export type KedgeAction =
  | { type: 'STEP' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TICK' }
  | { type: 'TOGGLE_MODE' }
  | { type: 'RESET' };

export const initialKedge: KedgeState = { mode: 'supervised', index: 0, playing: false };

export const stepsFor = (s: KedgeState): Step[] => (s.mode === 'supervised' ? SUPERVISED_STEPS : UNSUPERVISED_STEPS);
const last = (s: KedgeState) => stepsFor(s).length - 1;

function advance(s: KedgeState): KedgeState {
  return s.index >= last(s) ? { ...s, playing: false } : { ...s, index: s.index + 1 };
}

export function kedgeReducer(s: KedgeState, a: KedgeAction): KedgeState {
  switch (a.type) {
    case 'STEP':
      return advance(s);
    case 'TICK':
      return s.playing ? advance(s) : s;
    case 'PLAY':
      return { ...s, playing: true, index: s.index >= last(s) ? 0 : s.index };
    case 'PAUSE':
      return { ...s, playing: false };
    case 'TOGGLE_MODE':
      return { mode: s.mode === 'supervised' ? 'unsupervised' : 'supervised', index: 0, playing: false };
    case 'RESET':
      return initialKedge;
  }
}
