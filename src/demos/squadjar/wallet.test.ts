import { describe, expect, it } from 'vitest';
import { MAX_TOPUP, MIN_TOPUP, initialWallet, walletReducer, type WalletAction, type WalletState } from './wallet';

const run = (...a: WalletAction[]) => a.reduce<WalletState>(walletReducer, initialWallet);

describe('walletReducer', () => {
  it('starts with a balance and a short history', () => {
    expect(initialWallet.balance).toBeGreaterThan(0);
    expect(initialWallet.history.length).toBeGreaterThan(0);
  });

  it('ADD_MONEY raises the balance and records it', () => {
    const s = run({ type: 'ADD_MONEY', amount: 10000 });
    expect(s.balance).toBe(initialWallet.balance + 10000);
    expect(s.history[0]).toMatchObject({ kind: 'added', amount: 10000 });
  });

  it('ADD_MONEY outside ₦100–₦200,000 is ignored', () => {
    expect(run({ type: 'ADD_MONEY', amount: MIN_TOPUP - 1 })).toEqual(initialWallet);
    expect(run({ type: 'ADD_MONEY', amount: MAX_TOPUP + 1 })).toEqual(initialWallet);
  });

  it('WITHDRAW lowers the balance and names the bank', () => {
    const s = run({ type: 'WITHDRAW', amount: 5000, to: 'GTBank ••6789' });
    expect(s.balance).toBe(initialWallet.balance - 5000);
    expect(s.history[0]).toMatchObject({ kind: 'withdraw', amount: -5000, label: 'Cashed out to GTBank ••6789' });
  });

  it('WITHDRAW more than the balance is ignored', () => {
    expect(run({ type: 'WITHDRAW', amount: initialWallet.balance + 1, to: 'x' })).toEqual(initialWallet);
  });

  it('PAID_ROUND takes the contribution out', () => {
    const s = run({ type: 'PAID_ROUND', amount: 5000, round: 3 });
    expect(s.balance).toBe(initialWallet.balance - 5000);
    expect(s.history[0]).toMatchObject({ kind: 'paid', amount: -5000 });
  });

  it('PAYOUT adds what landed now', () => {
    const s = run({ type: 'PAYOUT', amount: 20000, round: 4 });
    expect(s.balance).toBe(initialWallet.balance + 20000);
    expect(s.history[0]).toMatchObject({ kind: 'payout', amount: 20000 });
  });

  it('RESET returns to the initial state', () => {
    expect(walletReducer(run({ type: 'ADD_MONEY', amount: 500 }), { type: 'RESET' })).toEqual(initialWallet);
  });
});
