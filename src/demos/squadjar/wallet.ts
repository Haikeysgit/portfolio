// The member's Squadjar balance (test naira) and history. Pure state, no network.

export const MIN_TOPUP = 100;
export const MAX_TOPUP = 200_000;

export type Entry = { id: number; kind: 'added' | 'withdraw' | 'paid' | 'payout'; label: string; amount: number; when: string };
export type WalletState = { balance: number; history: Entry[]; nextId: number };
export type WalletAction =
  | { type: 'ADD_MONEY'; amount: number }
  | { type: 'WITHDRAW'; amount: number; to: string }
  | { type: 'PAID_ROUND'; amount: number; round: number }
  | { type: 'PAYOUT'; amount: number; round: number }
  | { type: 'RESET' };

export const initialWallet: WalletState = {
  balance: 12000,
  history: [
    { id: 2, kind: 'paid', label: 'Paid · Hostel 4B · round 2', amount: -5000, when: 'Last week' },
    { id: 1, kind: 'added', label: 'Added money', amount: 15000, when: 'Last week' },
  ],
  nextId: 3,
};

const push = (s: WalletState, e: Omit<Entry, 'id' | 'when'>): WalletState => ({
  balance: s.balance + e.amount,
  history: [{ ...e, id: s.nextId, when: 'Just now' }, ...s.history],
  nextId: s.nextId + 1,
});

export function walletReducer(s: WalletState, a: WalletAction): WalletState {
  switch (a.type) {
    case 'ADD_MONEY':
      return a.amount < MIN_TOPUP || a.amount > MAX_TOPUP ? s : push(s, { kind: 'added', label: 'Added money', amount: a.amount });
    case 'WITHDRAW':
      return a.amount <= 0 || a.amount > s.balance ? s : push(s, { kind: 'withdraw', label: `Cashed out to ${a.to}`, amount: -a.amount });
    case 'PAID_ROUND':
      return a.amount > s.balance ? s : push(s, { kind: 'paid', label: `Paid · Hostel 4B · round ${a.round}`, amount: -a.amount });
    case 'PAYOUT':
      return push(s, { kind: 'payout', label: `Payout · round ${a.round} · Hostel 4B`, amount: a.amount });
    case 'RESET':
      return initialWallet;
  }
}
