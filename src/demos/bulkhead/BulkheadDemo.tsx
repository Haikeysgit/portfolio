import { useReducer, useState } from 'react';
import { ATTACKS, FIREWALL_RULES, LEGIT } from './rules';
import { bulkheadReducer, initialBulkhead, type Verdict } from './state';
import './bulkhead.css';

const ruleLabel = (id: string) => FIREWALL_RULES.find((r) => r.id === id)?.label ?? id;
const parseUsdc = (text: string) => Number(text.match(/(\d+(?:\.\d+)?)\s*usdc/i)?.[1] ?? 0);

function stages(v: Verdict | undefined) {
  if (!v) return [{ k: 'Firewall', st: 'idle', t: 'Waiting for a message' }, { k: 'Agent', st: 'idle', t: '' }, { k: 'Vault contract', st: 'idle', t: '' }];
  const fw = v.stage === 'firewall' ? { st: 'block', t: `Blocked: ${ruleLabel(v.ruleId)}` } : { st: 'pass', t: 'No attack pattern found' };
  const agent =
    v.stage === 'firewall' ? { st: 'idle', t: 'Never reached' }
    : v.stage === 'agent' ? { st: 'pass', t: v.note }
    : { st: 'pass', t: 'Agent calls release_funds' };
  const contract =
    v.stage === 'contract' ? { st: 'block', t: `Rejected: ${v.error} (over the 50 USDC cap)` }
    : v.stage === 'paid' ? { st: 'pass', t: `Paid ${v.amountUsdc} USDC` }
    : { st: 'idle', t: 'Never reached' };
  return [{ k: 'Firewall', ...fw }, { k: 'Agent', ...agent }, { k: 'Vault contract', ...contract }];
}

export default function BulkheadDemo() {
  const [s, dispatch] = useReducer(bulkheadReducer, initialBulkhead);
  const [text, setText] = useState('');
  const last = s.log.at(-1);
  const send = (prompt: string, amountUsdc: number) => dispatch({ type: 'SUBMIT', prompt, amountUsdc });

  return (
    <div className="bh">
      <div className="bh-main">
        <header className="bh-top">
          <div>
            <p className="bh-kicker">Drain Me · tier 3 vault (simulation)</p>
            <div className="bh-bal">
              <span><strong>{s.vault.usdc}</strong> USDC</span>
              <span><strong>{s.vault.btc}</strong> BTC</span>
              <span className="bh-cap">Cap {s.vault.capUsdc} USDC per payout</span>
            </div>
          </div>
          <button type="button" className="bh-ghost" onClick={() => { setText(''); dispatch({ type: 'RESET' }); }}>Reset</button>
        </header>

        <div className="bh-picks">
          <p className="bh-label">Try an attack</p>
          <div className="bh-chips">
            {ATTACKS.map((a) => (
              <button key={a.label} type="button" onClick={() => send(a.prompt, parseUsdc(a.prompt))}>{a.label}</button>
            ))}
          </div>
          <p className="bh-label">Or a real request</p>
          <div className="bh-chips">
            {LEGIT.map((l) => (
              <button key={l.label} type="button" onClick={() => send(l.prompt, l.amountUsdc)}>{l.label}</button>
            ))}
          </div>
        </div>

        <form
          className="bh-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send(text, parseUsdc(text));
            setText('');
          }}
        >
          <label htmlFor="bh-msg" className="bh-label">Write your own (one message, up to 2,000 characters)</label>
          <textarea id="bh-msg" rows={2} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Talk the agent into paying you…" />
          <button type="submit" className="bh-btn" disabled={!text.trim()}>Send</button>
        </form>

        {last && <blockquote className="bh-msg">“{last.prompt}”</blockquote>}
      </div>

      <aside className="bh-side" aria-live="polite">
        <p className="bh-kicker">What happened</p>
        <ol className="bh-stages">
          {stages(last?.verdict).map((st) => (
            <li key={st.k} className={`is-${st.st}`}>
              <span className="bh-k">{st.k}</span>
              {st.t && <span className="bh-t">{st.t}</span>}
            </li>
          ))}
        </ol>
        <p className="bh-sub">
          {s.log.length} attempt{s.log.length === 1 ? '' : 's'} ·{' '}
          {s.log.filter((x) => x.verdict.stage === 'firewall').length} blocked by the firewall ·{' '}
          {s.log.filter((x) => x.verdict.stage === 'contract').length} stopped by the contract
        </p>
        <p className="bh-note">Simulation of a project in development. Balances are illustrative; the real vault runs on NEAR and pays out in Bitcoin and Base USDC.</p>
      </aside>
    </div>
  );
}
