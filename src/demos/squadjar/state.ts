// Squadjar demo: one member's view of a 6-person ajo squad. Pure state, no network.

export type Member = { id: string; name: string; paid: boolean };
export type SquadState = {
  round: number;
  totalRounds: 6;
  contribution: number;
  members: Member[];
  payoutOrder: string[];
  you: string;
  phase: 'overview' | 'confirm' | 'pending' | 'settled';
  txHash: string | null;
  received: { round: number; to: string }[];
};
export type SquadAction =
  | { type: 'PAY' }
  | { type: 'CONFIRM'; txHash: string }
  | { type: 'CANCEL' }
  | { type: 'SETTLE' }
  | { type: 'NEXT_ROUND' }
  | { type: 'OTHERS_PAY' }
  | { type: 'RESET' };

const names = ['Tolu', 'Chidi', 'Bola', 'You', 'Femi', 'Zainab'];

export const initialSquad: SquadState = {
  round: 3,
  totalRounds: 6,
  contribution: 5000,
  members: names.map((name) => ({ id: name.toLowerCase(), name, paid: name !== 'You' })),
  payoutOrder: names.map((n) => n.toLowerCase()),
  you: 'you',
  phase: 'overview',
  txHash: null,
  received: [],
};

export const collectorOf = (s: SquadState) => s.payoutOrder[s.round - 1];
const youPaid = (s: SquadState) => s.members.some((m) => m.id === s.you && m.paid);

export function squadReducer(s: SquadState, a: SquadAction): SquadState {
  switch (a.type) {
    case 'PAY':
      return s.phase === 'overview' && !youPaid(s) ? { ...s, phase: 'confirm' } : s;
    case 'CANCEL':
      return s.phase === 'confirm' ? { ...s, phase: 'overview' } : s;
    case 'CONFIRM':
      if (s.phase !== 'confirm') return s;
      return {
        ...s,
        phase: 'pending',
        txHash: a.txHash,
        members: s.members.map((m) => (m.id === s.you ? { ...m, paid: true } : m)),
      };
    case 'OTHERS_PAY':
      return { ...s, members: s.members.map((m) => (m.id === s.you ? m : { ...m, paid: true })) };
    case 'SETTLE':
      if (s.phase === 'settled' || !s.members.every((m) => m.paid)) return s;
      return { ...s, phase: 'settled', received: [...s.received, { round: s.round, to: collectorOf(s) }] };
    case 'NEXT_ROUND':
      if (s.phase !== 'settled' || s.round >= s.totalRounds) return s;
      return {
        ...s,
        round: s.round + 1,
        phase: 'overview',
        txHash: null,
        members: s.members.map((m) => ({ ...m, paid: false })),
      };
    case 'RESET':
      return initialSquad;
  }
}
