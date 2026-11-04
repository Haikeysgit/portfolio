import { FIREWALL_RULES, type Request } from './rules';

// Drain Me's three tiers, as in the Bulkhead spec (2026-10-29). Pots are rounded demo values.
export type Tier = {
  id: 1 | 2 | 3;
  name: string;
  defense: string;
  asset: 'BTC' | 'USDC';
  roundUsd: number;
  roundsLeft: number;
  cooldown: string;
  cooling: boolean;
};
export type Verdict =
  | { stage: 'firewall'; ruleId: string }
  | { stage: 'refused'; reason: string }
  | { stage: 'agent'; note: string }
  | { stage: 'contract'; error: 'ERR_OVER_CAP' | 'ERR_COOLDOWN' | 'ERR_DRAINED' }
  | { stage: 'paid'; amountUsd: number };
export type ArenaState = { tiers: Tier[]; log: { tier: number; prompt: string; verdict: Verdict }[] };
export type ArenaAction =
  | { type: 'SUBMIT'; tier: number; prompt: string; requestUsd: Request }
  | { type: 'END_COOLDOWN'; tier: number }
  | { type: 'RESET' };

export const initialArena: ArenaState = {
  tiers: [
    { id: 1, name: 'Naive', defense: 'System prompt only', asset: 'BTC', roundUsd: 30, roundsLeft: 5, cooldown: '1 h', cooling: false },
    { id: 2, name: 'Hardened', defense: 'Hardened prompt and a refusal policy', asset: 'USDC', roundUsd: 50, roundsLeft: 4, cooldown: '24 h', cooling: false },
    { id: 3, name: 'Firewall', defense: 'Hardened prompt plus the Bulkhead firewall', asset: 'BTC', roundUsd: 62, roundsLeft: 4, cooldown: '24 h', cooling: false },
  ],
  log: [],
};

const plainRules = FIREWALL_RULES.filter((r) => r.id !== 'encoded');

/** One attempt: firewall (tier 3), then the agent (tier 2 refuses plain attacks), then the vault contract. */
export function attempt(t: Tier, prompt: string, request: Request): Verdict {
  if (t.id === 3) {
    const hit = FIREWALL_RULES.find((r) => r.test(prompt));
    if (hit) return { stage: 'firewall', ruleId: hit.id };
  }
  if (t.id === 2 && plainRules.some((r) => r.test(prompt))) {
    return { stage: 'refused', reason: 'The hardened prompt spotted an obvious attack and refused.' };
  }
  if (request === 0) return { stage: 'agent', note: 'No payout requested, so nothing reaches the contract.' };
  if (t.roundsLeft === 0) return { stage: 'contract', error: 'ERR_DRAINED' };
  if (t.cooling) return { stage: 'contract', error: 'ERR_COOLDOWN' };
  const amountUsd = request === 'round' ? t.roundUsd : t.roundUsd * t.roundsLeft;
  if (amountUsd > t.roundUsd) return { stage: 'contract', error: 'ERR_OVER_CAP' };
  return { stage: 'paid', amountUsd };
}

/** The public firewall API (POST /v1/check). Risk ≥ 70 blocks, 40–69 escalates, below 40 allows. */
export function checkApi(input: string): { verdict: 'block' | 'allow'; risk: number; rule: string | null } {
  const hit = FIREWALL_RULES.find((r) => r.test(input));
  return hit ? { verdict: 'block', risk: 88, rule: hit.id } : { verdict: 'allow', risk: 8, rule: null };
}

export function arenaReducer(s: ArenaState, a: ArenaAction): ArenaState {
  switch (a.type) {
    case 'SUBMIT': {
      const t = s.tiers[a.tier];
      const verdict = attempt(t, a.prompt, a.requestUsd);
      const tiers = verdict.stage === 'paid'
        ? s.tiers.map((x, i) => (i === a.tier ? { ...x, roundsLeft: x.roundsLeft - 1, cooling: true } : x))
        : s.tiers;
      return { tiers, log: [...s.log, { tier: a.tier, prompt: a.prompt, verdict }] };
    }
    case 'END_COOLDOWN':
      return { ...s, tiers: s.tiers.map((x, i) => (i === a.tier ? { ...x, cooling: false } : x)) };
    case 'RESET':
      return initialArena;
  }
}
