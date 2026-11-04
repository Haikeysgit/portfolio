import { useEffect, useReducer, useState } from 'react';
import { collectorOf, heldFor, initialSquad, squadReducer, type SquadState } from './state';
import './squadjar.css';

// A replica of the Squadjar app (its own design system: manila paper, ledger rules, stamp ink), running on fake data.

const naira = (n: number) => '₦' + n.toLocaleString('en-NG');
const randomHash = () =>
  '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const tilt = (id: string, r: number) => ((id.charCodeAt(0) * 7 + r * 13) % 17) - 8;

function Stamp({ id, name, round, fresh }: { id: string; name: string; round: number; fresh?: boolean }) {
  return (
    <span
      role="img"
      aria-label={`${name} paid round ${round}`}
      className={`sq-stamp${fresh ? ' is-fresh' : ''}`}
      style={{ ['--tilt' as string]: `${tilt(id, round)}deg` }}
    >
      {initials(name)}
    </span>
  );
}

function StampCard({ s, fresh }: { s: SquadState; fresh: boolean }) {
  const rounds = Array.from({ length: s.totalRounds }, (_, i) => i + 1);
  return (
    <div className="sq-card">
      <div className="sq-card-scroll">
        <table className="sq-ledger">
          <caption className="sq-sr">Contribution card for Hostel 4B</caption>
          <thead>
            <tr>
              <th scope="col" className="sq-sticky">Turn</th>
              {rounds.map((r) => (
                <th key={r} scope="col" className={r === s.round ? 'is-now' : ''}>R{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.payoutOrder.map((id, i) => {
              const m = s.members.find((x) => x.id === id)!;
              const mine = id === s.you;
              return (
                <tr key={id}>
                  <th scope="row" className={`sq-sticky${mine ? ' is-me' : ''}`}>
                    <span className="sq-turn">{i + 1}</span>
                    {m.name}
                  </th>
                  {rounds.map((r) => {
                    const collected = r === i + 1 && (r < s.round || (r === s.round && s.phase === 'settled'));
                    const paid = r < s.round || (r === s.round && m.paid);
                    return (
                      <td key={r} className={r === s.round ? 'is-now' : ''}>
                        {collected ? (
                          <span className="sq-paidout">PAID OUT</span>
                        ) : paid ? (
                          <Stamp id={id} name={m.name} round={r} fresh={fresh && mine && r === s.round} />
                        ) : (
                          <span className="sq-box" role="img" aria-label={r > s.round ? `Round ${r} not due yet` : `${m.name} hasn't paid round ${r}`} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SquadjarDemo() {
  const [s, dispatch] = useReducer(squadReducer, initialSquad);
  const [showPayout, setShowPayout] = useState(false);
  const pot = s.contribution * s.members.length;
  const collector = s.members.find((m) => m.id === collectorOf(s))!;
  const youCollect = collector.id === s.you;
  const youPaid = s.members.find((m) => m.id === s.you)!.paid;
  const othersPaid = s.members.filter((m) => m.id !== s.you).every((m) => m.paid);
  const held = heldFor(s.round, s.members.length, s.contribution, 0);

  // The last contribute() settles the round in the same transaction.
  useEffect(() => {
    if (s.phase !== 'pending') return;
    const t = setTimeout(() => {
      dispatch({ type: 'SETTLE' });
      if (youCollect) setShowPayout(true);
    }, 1300);
    return () => clearTimeout(t);
  }, [s.phase]);

  // A new round opens: the rest of the squad pays in.
  useEffect(() => {
    if (s.phase !== 'overview' || s.round === initialSquad.round || s.members.some((m) => m.paid)) return;
    const t = setTimeout(() => dispatch({ type: 'OTHERS_PAY' }), 900);
    return () => clearTimeout(t);
  }, [s.round, s.phase]);

  const restart = () => {
    setShowPayout(false);
    dispatch({ type: 'RESET' });
  };

  if (s.phase === 'landing') {
    return (
      <div className="sqj">
        <div className="sq-page">
          <header className="sq-head">
            <span className="sq-logo">Squadjar</span>
            <span className="sq-login">Log in</span>
          </header>
          <section className="sq-hero">
            <div>
              <h1 className="sq-display">Ajo with your squad. Nobody holds the jar.</h1>
              <p className="sq-lead">Everyone pays in each round, one person collects, and the jar pays out on time by itself.</p>
              <button type="button" className="sq-btn-ink" onClick={() => dispatch({ type: 'START' })}>
                Open the demo squad
              </button>
            </div>
            <figure className="sq-fig">
              <div className="sq-tilt"><StampCard s={{ ...s, phase: 'overview' }} fresh={false} /></div>
              <figcaption>An example squad card: 6 classmates, ₦5,000 a week. Every box is stamped when someone pays.</figcaption>
            </figure>
          </section>
        </div>
      </div>
    );
  }

  if (showPayout) {
    return (
      <div className="sqj">
        <div className="sq-page sq-narrow">
          <h1 className="sq-moment">Your turn landed.</h1>
          <p className="sq-money-hero">{naira(pot - held)}</p>
          <p className="sq-mono">
            <b>{naira(pot - held)}</b> now · <b>{naira(held)}</b> waits in the jar
          </p>
          <p className="sq-mono sq-muted">Hostel 4B · Round {s.round}</p>
          <p className="sq-small">You still owe the rounds after your turn, so part of your payout waits in the jar. It comes back to you at the end.</p>
          <div className="sq-receipt">
            <span className="sq-collected" aria-hidden="true">COLLECTED</span>
            <dl>
              <div><dt>Sent to</dt><dd>Your balance</dd></div>
              <div><dt>Waits in the jar</dt><dd>{naira(held)}</dd></div>
              <div><dt>Tx</dt><dd>{s.txHash ? short(s.txHash) : '—'}</dd></div>
            </dl>
          </div>
          <div className="sq-actions">
            <button type="button" className="sq-btn-ink" onClick={() => setShowPayout(false)}>Back to squad</button>
            <button type="button" className="sq-btn-ghost" onClick={restart}>Start over</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sqj">
      <div className="sq-page sq-narrow">
        <header className="sq-bar">
          <button type="button" className="sq-icon" aria-label="Back to the landing page" onClick={restart}>←</button>
          <span className="sq-mono sq-muted">Squad</span>
          <span />
        </header>
        <h2 className="sq-headline">Hostel 4B</h2>
        <p className="sq-mono sq-muted">Round {s.round} of {s.totalRounds} · {naira(s.contribution)} a week</p>

        <div className="sq-pot">
          <div>
            <span className="sq-label">This round</span>
            <span className="sq-money">{naira(pot)}</span>
          </div>
          <div>
            <span className="sq-label">Collects</span>
            <span className="sq-who">{youCollect ? 'You' : collector.name}</span>
          </div>
        </div>

        <StampCard s={s} fresh={s.phase === 'pending' || s.phase === 'settled'} />

        <div className="sq-actionbar">
          {s.phase === 'overview' && !youPaid && (
            <>
              <button type="button" className="sq-btn-primary" disabled={!othersPaid} onClick={() => dispatch({ type: 'PAY' })}>
                {othersPaid ? `Pay ${naira(s.contribution)}` : 'Waiting for the squad…'}
              </button>
              <p className="sq-small">The jar pays automatically when everyone has paid, or when the round closes.</p>
            </>
          )}
          {s.phase === 'pending' && (
            <div className="sq-paidlabel">You've paid round {s.round}. <span className="sq-mono">tx {s.txHash && short(s.txHash)}</span></div>
          )}
          {s.phase === 'settled' && (
            <>
              <div className="sq-paidlabel">
                The jar paid {youCollect ? 'you' : collector.name} <b className="sq-money-sm">{naira(youCollect ? pot - held : pot)}</b>. Nobody pressed a button.
              </div>
              {s.round < s.totalRounds ? (
                <button type="button" className="sq-btn-ink" onClick={() => dispatch({ type: 'NEXT_ROUND' })}>Next round</button>
              ) : (
                <button type="button" className="sq-btn-ghost" onClick={restart}>Squad complete · Start over</button>
              )}
            </>
          )}
        </div>
      </div>

      {s.phase === 'confirm' && (
        <div className="sq-scrim" role="dialog" aria-modal="true" aria-label="Confirm payment">
          <div className="sq-sheet">
            <span className="sq-grab" aria-hidden="true" />
            <p className="sq-label">Demo wallet · test money</p>
            <p className="sq-money-hero sq-sheet-amt">{naira(s.contribution)}</p>
            <dl>
              <div><dt>To</dt><dd>Hostel 4B jar</dd></div>
              <div><dt>Calls</dt><dd className="sq-mono">contribute()</dd></div>
              <div><dt>Network</dt><dd>EVM testnet</dd></div>
            </dl>
            <button type="button" className="sq-btn-primary" onClick={() => dispatch({ type: 'CONFIRM', txHash: randomHash() })}>Confirm</button>
            <button type="button" className="sq-btn-ghost" onClick={() => dispatch({ type: 'CANCEL' })}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
