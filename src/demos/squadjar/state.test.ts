import { describe, expect, it } from 'vitest';
import { heldFor, initialSquad, squadReducer, type SquadAction, type SquadState } from './state';

const started = squadReducer(initialSquad, { type: 'START' });
const run = (...actions: SquadAction[]) => actions.reduce<SquadState>(squadReducer, started);
const you = (s: SquadState) => s.members.find((m) => m.id === s.you)!;

describe('squadReducer', () => {
  it('starts at round 3 with everyone paid except you', () => {
    expect(initialSquad.round).toBe(3);
    expect(initialSquad.totalRounds).toBe(6);
    expect(initialSquad.members.filter((m) => m.paid)).toHaveLength(5);
    expect(you(initialSquad).paid).toBe(false);
  });

  it('opens on the landing page', () => expect(initialSquad.phase).toBe('landing'));

  it('PAY on the landing page is a no-op', () => expect(squadReducer(initialSquad, { type: 'PAY' })).toBe(initialSquad));

  it('START opens the squad', () => expect(started.phase).toBe('overview'));

  it('PAY opens the wallet confirm sheet', () => expect(run({ type: 'PAY' }).phase).toBe('confirm'));

  it('CANCEL closes the sheet without paying', () => {
    const s = run({ type: 'PAY' }, { type: 'CANCEL' });
    expect(s.phase).toBe('overview');
    expect(you(s).paid).toBe(false);
  });

  it('CONFIRM pays your share and records the hash', () => {
    const s = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0xabc' });
    expect(s.phase).toBe('pending');
    expect(you(s).paid).toBe(true);
    expect(s.txHash).toBe('0xabc');
  });

  it('a second CONFIRM is a no-op', () => {
    const once = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0xabc' });
    expect(squadReducer(once, { type: 'CONFIRM', txHash: '0xdef' })).toBe(once);
  });

  it('SETTLE pays the scheduled collector for this round', () => {
    const s = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0xabc' }, { type: 'SETTLE' });
    expect(s.phase).toBe('settled');
    expect(s.received).toEqual([{ round: 3, to: initialSquad.payoutOrder[2] }]);
  });

  it('SETTLE before everyone has paid is a no-op', () => {
    expect(squadReducer(started, { type: 'SETTLE' })).toBe(started);
  });

  it('NEXT_ROUND moves the rotation on and clears who paid', () => {
    const s = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0xabc' }, { type: 'SETTLE' }, { type: 'NEXT_ROUND' });
    expect(s.round).toBe(4);
    expect(s.members.every((m) => !m.paid)).toBe(true);
    expect(s.phase).toBe('overview');
    expect(s.txHash).toBeNull();
  });

  it('OTHERS_PAY marks everyone except you as paid', () => {
    const s = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0x1' }, { type: 'SETTLE' }, { type: 'NEXT_ROUND' }, { type: 'OTHERS_PAY' });
    expect(s.members.filter((m) => m.paid)).toHaveLength(5);
    expect(you(s).paid).toBe(false);
  });

  it('NEXT_ROUND after the last round is a no-op', () => {
    let s = started;
    for (let r = 3; r <= 6; r++) {
      s = [{ type: 'OTHERS_PAY' }, { type: 'PAY' }, { type: 'CONFIRM', txHash: '0x' + r }, { type: 'SETTLE' }].reduce<SquadState>(
        (acc, a) => squadReducer(acc, a as SquadAction),
        s,
      );
      if (r < 6) s = squadReducer(s, { type: 'NEXT_ROUND' });
    }
    expect(s.round).toBe(6);
    expect(squadReducer(s, { type: 'NEXT_ROUND' })).toBe(s);
    expect(s.received.map((x) => x.to)).toEqual(initialSquad.payoutOrder.slice(2));
  });

  it('RESET returns to the initial state', () => {
    const s = run({ type: 'PAY' }, { type: 'CONFIRM', txHash: '0xabc' }, { type: 'RESET' });
    expect(s).toEqual(initialSquad);
  });
});

describe('heldFor (the jar keeps back what a collector still owes)', () => {
  it('a New member collecting round 4 of 6 leaves 2 rounds held', () => expect(heldFor(4, 6, 5000, 0)).toBe(10000));
  it('a Reliable member has half of it held', () => expect(heldFor(4, 6, 5000, 50)).toBe(5000));
  it('the last turn holds nothing', () => expect(heldFor(6, 6, 5000, 0)).toBe(0));
});
