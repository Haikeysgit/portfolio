import { FRAME_COUNT } from './steps';

export type KedgeScreen = 'landing' | 'race' | 'how';
export type KedgeState = { screen: KedgeScreen; shown: number; playing: boolean };
export type KedgeAction =
  | { type: 'OPEN'; screen: KedgeScreen }
  | { type: 'STEP' }
  | { type: 'TICK' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RESET' };

export const initialKedge: KedgeState = { screen: 'landing', shown: 0, playing: false };

const advance = (s: KedgeState): KedgeState =>
  s.shown >= FRAME_COUNT ? { ...s, playing: false } : { ...s, shown: s.shown + 1, playing: s.playing && s.shown + 1 < FRAME_COUNT };

export function kedgeReducer(s: KedgeState, a: KedgeAction): KedgeState {
  switch (a.type) {
    case 'OPEN':
      return a.screen === 'race' ? { screen: 'race', shown: 0, playing: true } : { ...s, screen: a.screen, playing: false };
    case 'STEP':
      return advance(s);
    case 'TICK':
      return s.playing ? advance(s) : s;
    case 'PLAY':
      return { ...s, playing: true, shown: s.shown >= FRAME_COUNT ? 0 : s.shown };
    case 'PAUSE':
      return { ...s, playing: false };
    case 'RESET':
      return initialKedge;
  }
}
