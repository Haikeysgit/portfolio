import { useEffect, useReducer, useState } from 'react';
import { collectorOf, initialSquad, squadReducer } from './state';
import './squadjar.css';

const naira = (n: number) => '₦' + n.toLocaleString('en-NG');
const randomHash = () =>
  '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;

export default function SquadjarDemo() {
  const [s, dispatch] = useReducer(squadReducer, initialSquad);
  const [log, setLog] = useState<string[]>(['Squad "Hostel 4B" is active. The contract holds the jar.']);
  const pot = s.contribution * s.members.length;
  const collector = s.members.find((m) => m.id === collectorOf(s))!;
  const youCollect = collector.id === s.you;
  const youPaid = s.members.find((m) => m.id === s.you)!.paid;
  const add = (line: string) => setLog((l) => [...l, line]);

  // After your payment lands, the round settles on its own (the last contribute() settles it).
  useEffect(() => {
    if (s.phase !== 'pending') return;
    const t = setTimeout(() => {
      dispatch({ type: 'SETTLE' });
      add(`Round ${s.round} settled: ${naira(pot)} paid to ${youCollect ? 'you' : collector.name}.`);
    }, 1200);
    return () => clearTimeout(t);
  }, [s.phase]);

  // At the start of a new round, the other members pay in.
  useEffect(() => {
    if (s.phase !== 'overview' || s.round === initialSquad.round || s.members.some((m) => m.paid)) return;
    const t = setTimeout(() => {
      dispatch({ type: 'OTHERS_PAY' });
      add(`Round ${s.round}: 5 members paid ${naira(s.contribution)} each.`);
    }, 900);
    return () => clearTimeout(t);
  }, [s.round, s.phase]);

  const confirm = () => {
    const h = randomHash();
    dispatch({ type: 'CONFIRM', txHash: h });
    add(`You called contribute(): ${naira(s.contribution)} moved from your wallet into the jar. Tx ${short(h)}.`);
  };
  const reset = () => {
    dispatch({ type: 'RESET' });
    setLog(['Squad "Hostel 4B" is active. The contract holds the jar.']);
  };

  return (
    <div className="sj">
      <div className="sj-app">
        <header className="sj-top">
          <div>
            <p className="sj-kicker">Squad · Hostel 4B</p>
            <h4 className="sj-round">Round {s.round} of {s.totalRounds}</h4>
          </div>
          <button type="button" className="sj-ghost" onClick={reset}>Reset</button>
        </header>

        <div className="sj-pot">
          <div>
            <span className="sj-muted">This round's pot</span>
            <strong>{naira(pot)}</strong>
          </div>
          <div>
            <span className="sj-muted">Collects this round</span>
            <strong>{youCollect ? 'You' : collector.name}</strong>
          </div>
        </div>

        <ol className="sj-members" aria-label="Members in payout order">
          {s.payoutOrder.map((id, i) => {
            const m = s.members.find((x) => x.id === id)!;
            const turn = i + 1;
            return (
              <li key={id} className={turn === s.round ? 'is-turn' : turn < s.round ? 'is-done' : ''}>
                <span className="sj-num">{turn}</span>
                <span className="sj-name">{m.name}</span>
                {turn < s.round && <span className="sj-tag">collected</span>}
                {turn === s.round && <span className="sj-tag sj-tag-acc">collecting</span>}
                <span className={m.paid ? 'sj-paid' : 'sj-due'}>{m.paid ? 'Paid' : 'Due'}</span>
              </li>
            );
          })}
        </ol>

        <div className="sj-action">
          {s.phase === 'overview' && !youPaid && (
            <button type="button" className="sj-btn" onClick={() => dispatch({ type: 'PAY' })} disabled={!s.members.filter((m) => m.id !== s.you).every((m) => m.paid)}>
              Pay {naira(s.contribution)} for round {s.round}
            </button>
          )}
          {s.phase === 'pending' && <p className="sj-status">Confirming on chain…</p>}
          {s.phase === 'settled' && (
            <div className="sj-done">
              <p>
                <strong>{naira(pot)}</strong> went to {youCollect ? 'you' : collector.name}. Nobody pressed a button: the
                contract paid out when the last member paid.
              </p>
              {s.round < s.totalRounds ? (
                <button type="button" className="sj-btn" onClick={() => dispatch({ type: 'NEXT_ROUND' })}>
                  Next round
                </button>
              ) : (
                <p className="sj-muted">Everyone has collected once. The squad is complete.</p>
              )}
            </div>
          )}
        </div>

        {s.phase === 'confirm' && (
          <div className="sj-sheet" role="dialog" aria-modal="true" aria-label="Confirm payment">
            <div className="sj-sheet-in">
              <p className="sj-kicker">Demo wallet</p>
              <h5>Confirm contribution</h5>
              <dl>
                <div><dt>Contract</dt><dd>Squad · Hostel 4B</dd></div>
                <div><dt>Function</dt><dd><code>contribute()</code></dd></div>
                <div><dt>Amount</dt><dd>{naira(s.contribution)} sNGN</dd></div>
                <div><dt>Network</dt><dd>EVM testnet (simulated)</dd></div>
              </dl>
              <div className="sj-row">
                <button type="button" className="sj-ghost" onClick={() => dispatch({ type: 'CANCEL' })}>Cancel</button>
                <button type="button" className="sj-btn" onClick={confirm}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="sj-log" aria-live="polite">
        <p className="sj-kicker">What the contract did</p>
        <ol>{log.map((l, i) => <li key={i}>{l}</li>)}</ol>
        <p className="sj-note">
          In the real app, part of an early payout is held back until that member has paid every round, and a missed payment
          becomes a debt to whoever was paid short.
        </p>
      </aside>
    </div>
  );
}
