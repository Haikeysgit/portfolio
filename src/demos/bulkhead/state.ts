import { FIREWALL_RULES } from './rules';

// Illustrative demo values, not the arena's real balances.
export type Vault = { usdc: number; btc: number; capUsdc: number };
export type Verdict =
  | { stage: 'firewall'; ruleId: string }
  | { stage: 'agent'; note: string }
  | { stage: 'contract'; error: 'ERR_OVER_CAP' }
  | { stage: 'paid'; amountUsdc: number };
export type BulkheadState = { vault: Vault; log: { prompt: string; verdict: Verdict }[] };
export type BulkheadAction = { type: 'SUBMIT'; prompt: string; amountUsdc: number } | { type: 'RESET' };

export const initialBulkhead: BulkheadState = { vault: { usdc: 600, btc: 0.005, capUsdc: 50 }, log: [] };

/** Firewall first, then the agent, then the contract's spending cap. */
export function evaluate(prompt: string, amountUsdc: number, vault: Vault): Verdict {
  const hit = FIREWALL_RULES.find((r) => r.test(prompt));
  if (hit) return { stage: 'firewall', ruleId: hit.id };
  if (amountUsdc <= 0) return { stage: 'agent', note: 'No payout requested, so nothing reaches the contract.' };
  if (amountUsdc > vault.capUsdc || amountUsdc > vault.usdc) return { stage: 'contract', error: 'ERR_OVER_CAP' };
  return { stage: 'paid', amountUsdc };
}

export function bulkheadReducer(s: BulkheadState, a: BulkheadAction): BulkheadState {
  switch (a.type) {
    case 'SUBMIT': {
      const verdict = evaluate(a.prompt, a.amountUsdc, s.vault);
      const vault = verdict.stage === 'paid' ? { ...s.vault, usdc: s.vault.usdc - verdict.amountUsdc } : s.vault;
      return { vault, log: [...s.log, { prompt: a.prompt, verdict }] };
    }
    case 'RESET':
      return initialBulkhead;
  }
}
