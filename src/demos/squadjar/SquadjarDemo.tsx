import { useEffect, useReducer, useRef, useState, type ReactElement } from 'react';
import { collectorOf, heldFor, initialSquad, squadReducer, type SquadState } from './state';
import { initialWallet, walletReducer } from './wallet';
import './squadjar.css';

// A replica of the Squadjar app in its own design system (manila paper, ledger rules, stamp ink), on fake data.

type Screen = 'landing' | 'home' | 'squads' | 'history' | 'squad' | 'add' | 'withdraw' | 'payout';

const naira = (n: number) => (n < 0 ? '−' : '') + '₦' + Math.abs(n).toLocaleString('en-NG');
const randomHash = () =>
  '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const tilt = (id: string, r: number) => ((id.charCodeAt(0) * 7 + r * 13) % 17) - 8;
const BANKS = ['GTBank', 'Opay', 'Kuda'];

/** Animates a number towards its new value. */
function useCountUp(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 650);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

function Stamp({ id, name, round, fresh }: { id: string; name: string; round: number; fresh?: boolean }) {
  return (
    <span role="img" aria-label={`${name} paid round ${round}`} className={`sq-stamp${fresh ? ' is-fresh' : ''}`} style={{ ['--tilt' as string]: `${tilt(id, round)}deg` }}>
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
              {rounds.map((r) => <th key={r} scope="col" className={r === s.round ? 'is-now' : ''}>R{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {s.payoutOrder.map((id, i) => {
              const m = s.members.find((x) => x.id === id)!;
              const mine = id === s.you;
              return (
                <tr key={id}>
                  <th scope="row" className={`sq-sticky${mine ? ' is-me' : ''}`}><span className="sq-turn">{i + 1}</span>{m.name}</th>
                  {rounds.map((r) => {
                    const collected = r === i + 1 && (r < s.round || (r === s.round && s.phase === 'settled'));
                    const paid = r < s.round || (r === s.round && m.paid);
                    return (
                      <td key={r} className={r === s.round ? 'is-now' : ''}>
                        {collected ? <span className="sq-paidout">PAID OUT</span>
                          : paid ? <Stamp id={id} name={m.name} round={r} fresh={fresh && mine && r === s.round} />
                          : <span className="sq-box" role="img" aria-label={r > s.round ? `Round ${r} not due yet` : `${m.name} hasn't paid round ${r}`} />}
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

const Icon = {
  home: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  squads: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M10.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /></svg>,
  history: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
};

export default function SquadjarDemo() {
  const [s, dispatch] = useReducer(squadReducer, initialSquad);
  const [w, wallet] = useReducer(walletReducer, initialWallet);
  const [screen, setScreen] = useState<Screen>('landing');
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [addAmt, setAddAmt] = useState(10000);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState(BANKS[0]);
  const [wdAmt, setWdAmt] = useState(5000);
  const [wdStep, setWdStep] = useState<'form' | 'confirm' | 'done'>('form');
  const balance = useCountUp(w.balance);

  const pot = s.contribution * s.members.length;
  const collector = s.members.find((m) => m.id === collectorOf(s))!;
  const youCollect = collector.id === s.you;
  const youPaid = s.members.find((m) => m.id === s.you)!.paid;
  const othersPaid = s.members.filter((m) => m.id !== s.you).every((m) => m.paid);
  const held = heldFor(s.round, s.members.length, s.contribution, 0);
  const to = `${bank} ••6789`;

  const say = (text: string) => setToast({ id: Date.now(), text });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // The last contribute() settles the round in the same transaction.
  useEffect(() => {
    if (s.phase !== 'pending') return;
    const t = setTimeout(() => {
      dispatch({ type: 'SETTLE' });
      if (youCollect) {
        wallet({ type: 'PAYOUT', amount: pot - held, round: s.round });
        setScreen('payout');
      }
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
    dispatch({ type: 'RESET' });
    wallet({ type: 'RESET' });
    setScreen('landing');
    setWdStep('form');
    setBusy(false);
  };
  const confirmPay = () => {
    wallet({ type: 'PAID_ROUND', amount: s.contribution, round: s.round });
    dispatch({ type: 'CONFIRM', txHash: randomHash() });
  };
  const addMoney = () => {
    setBusy(true);
    setTimeout(() => {
      wallet({ type: 'ADD_MONEY', amount: addAmt });
      setBusy(false);
      setScreen('home');
      say(`Balance now ${naira(w.balance + addAmt)}`);
    }, 900);
  };
  const withdraw = () => {
    setBusy(true);
    setTimeout(() => {
      wallet({ type: 'WITHDRAW', amount: wdAmt, to });
      setBusy(false);
      setWdStep('done');
    }, 1000);
  };
  const open = (next: Screen) => {
    if (next === 'withdraw') setWdStep('form');
    setScreen(next);
  };

  if (screen === 'landing') {
    return (
      <div className="sqj">
        <div className="sq-page sq-screen" key="landing">
          <header className="sq-head">
            <span className="sq-logo">Squadjar</span>
            <span className="sq-login">Log in</span>
          </header>
          <section className="sq-hero">
            <div>
              <h1 className="sq-display">Ajo with your squad. Nobody holds the jar.</h1>
              <p className="sq-lead">Everyone pays in each round, one person collects, and the jar pays out on time by itself.</p>
              <button type="button" className="sq-btn-ink sq-auto" onClick={() => { dispatch({ type: 'START' }); setScreen('home'); }}>
                Try it with a demo account
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

  const tabs: { id: Screen; label: string; icon: ReactElement }[] = [
    { id: 'home', label: 'Home', icon: Icon.home },
    { id: 'squads', label: 'Squads', icon: Icon.squads },
    { id: 'history', label: 'History', icon: Icon.history },
  ];
  const tabOf: Record<Screen, number> = { landing: 0, home: 0, add: 0, withdraw: 0, squads: 1, squad: 1, payout: 1, history: 2 };
  const showTabs = screen === 'home' || screen === 'squads' || screen === 'history' || screen === 'squad';

  return (
    <div className="sqj">
      <div className="sq-shell">
        {toast && <div className="sq-toast" key={toast.id} role="status">{toast.text}</div>}

        <main className="sq-main sq-screen" key={screen + (screen === 'withdraw' ? wdStep : '')}>
          {screen === 'home' && (
            <>
              <div className="sq-row-between">
                <p className="sq-hi">Hi there</p>
                <button type="button" className="sq-link" onClick={restart}>Log out</button>
              </div>
              <div className="sq-balance-card">
                <span className="sq-label">Balance</span>
                <span className="sq-balance">{naira(balance)}</span>
                <span className="sq-mono sq-muted">New · 2 paid on time</span>
                <div className="sq-two">
                  <button type="button" className="sq-btn-ink" onClick={() => open('add')}>Add money</button>
                  <button type="button" className="sq-btn-ghost" onClick={() => open('withdraw')}>Withdraw</button>
                </div>
              </div>
              <h3 className="sq-section">Your squads</h3>
              <button type="button" className="sq-squadrow" onClick={() => open('squad')}>
                <span>
                  <strong>Hostel 4B</strong>
                  <small>Round {s.round} of {s.totalRounds} · {youCollect ? 'you collect this round' : `${collector.name} collects`}</small>
                </span>
                <span className={`sq-pill${youPaid ? ' is-done' : ''}`}>{youPaid ? 'Paid' : `Pay ${naira(s.contribution)}`}</span>
              </button>
              <h3 className="sq-section">Reminders</h3>
              <p className="sq-small">{youPaid ? 'No reminders yet.' : `Round ${s.round} is open. Pay ${naira(s.contribution)} before Friday.`}</p>
            </>
          )}

          {screen === 'squads' && (
            <>
              <h2 className="sq-headline">Squads</h2>
              <button type="button" className="sq-squadrow" onClick={() => open('squad')}>
                <span><strong>Hostel 4B</strong><small>6 members · {naira(s.contribution)} a week</small></span>
                <span className="sq-chev" aria-hidden="true">›</span>
              </button>
              <div className="sq-ghostcard">
                <strong>Start a squad</strong>
                <small>Pick the amount, the day and who's in. In the full app.</small>
              </div>
            </>
          )}

          {screen === 'history' && (
            <>
              <h2 className="sq-headline">History</h2>
              <ul className="sq-history">
                {w.history.map((e) => (
                  <li key={e.id} className="sq-hist-in">
                    <span><strong>{e.label}</strong><small>{e.when}</small></span>
                    <span className={`sq-money-sm ${e.amount > 0 ? 'sq-plus' : ''}`}>{e.amount > 0 ? '+' : ''}{naira(e.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {screen === 'squad' && (
            <>
              <div className="sq-bar">
                <button type="button" className="sq-icon" aria-label="Back to home" onClick={() => setScreen('home')}>←</button>
                <span className="sq-mono sq-muted">Squad</span>
                <span />
              </div>
              <h2 className="sq-headline">Hostel 4B</h2>
              <p className="sq-mono sq-muted">Round {s.round} of {s.totalRounds} · {naira(s.contribution)} a week</p>
              <div className="sq-pot">
                <div><span className="sq-label">This round</span><span className="sq-money">{naira(pot)}</span></div>
                <div><span className="sq-label">Collects</span><span className="sq-who">{youCollect ? 'You' : collector.name}</span></div>
              </div>
              <StampCard s={s} fresh={s.phase === 'pending' || s.phase === 'settled'} />
            </>
          )}

          {screen === 'add' && (
            <>
              <div className="sq-bar">
                <button type="button" className="sq-icon" aria-label="Back" onClick={() => setScreen('home')}>←</button>
                <span className="sq-mono sq-muted">Add money</span>
                <span />
              </div>
              <p className="sq-label">Amount</p>
              <div className="sq-chips">
                {[5000, 10000, 20000].map((a) => (
                  <button key={a} type="button" aria-pressed={addAmt === a} onClick={() => setAddAmt(a)}>{naira(a)}</button>
                ))}
              </div>
              <p className="sq-small">₦100 to ₦200,000 per top-up.</p>
              <div className="sq-testcard">
                <span className="sq-label">Card</span>
                <span className="sq-mono">4084 0840 8408 4081 · 12/30 · 408</span>
                <small>Test mode: no real card is charged.</small>
              </div>
              <button type="button" className="sq-btn-primary sq-push" disabled={busy} onClick={addMoney}>
                {busy ? 'Adding…' : `Add ${naira(addAmt)}`}
              </button>
            </>
          )}

          {screen === 'withdraw' && wdStep === 'form' && (
            <>
              <div className="sq-bar">
                <button type="button" className="sq-icon" aria-label="Back" onClick={() => setScreen('home')}>←</button>
                <span className="sq-mono sq-muted">Withdraw</span>
                <span />
              </div>
              <p className="sq-label">Pick your bank</p>
              <div className="sq-chips">
                {BANKS.map((b) => <button key={b} type="button" aria-pressed={bank === b} onClick={() => setBank(b)}>{b}</button>)}
              </div>
              <p className="sq-label">Account number</p>
              <div className="sq-field sq-mono">0123456789</div>
              <p className="sq-label">Amount · balance {naira(w.balance)}</p>
              <div className="sq-chips">
                {[2000, 5000, w.balance].filter((a, i, arr) => a > 0 && arr.indexOf(a) === i).map((a) => (
                  <button key={a} type="button" aria-pressed={wdAmt === a} onClick={() => setWdAmt(a)}>{a === w.balance ? `All · ${naira(a)}` : naira(a)}</button>
                ))}
              </div>
              <p className="sq-small">Test mode: no real money is sent to your bank.</p>
              <button type="button" className="sq-btn-ink sq-push" disabled={wdAmt > w.balance || wdAmt <= 0} onClick={() => setWdStep('confirm')}>
                {wdAmt > w.balance ? 'Not enough balance' : `Withdraw ${naira(wdAmt)}`}
              </button>
            </>
          )}

          {screen === 'withdraw' && wdStep === 'confirm' && (
            <>
              <h2 className="sq-moment sq-moment-sm">Send {naira(wdAmt)} to {to}?</h2>
              <p className="sq-small">The money still leaves your balance.</p>
              <div className="sq-actions">
                <button type="button" className="sq-btn-ink" disabled={busy} onClick={withdraw}>{busy ? 'Withdrawing…' : 'Yes, send it'}</button>
                <button type="button" className="sq-btn-ghost" disabled={busy} onClick={() => setWdStep('form')}>Change</button>
              </div>
            </>
          )}

          {screen === 'withdraw' && wdStep === 'done' && (
            <>
              <h2 className="sq-moment">{naira(wdAmt)} sent to {to}</h2>
              <p className="sq-mono sq-muted">Balance now {naira(w.balance)}</p>
              <div className="sq-actions">
                <button type="button" className="sq-btn-ink" onClick={() => setScreen('home')}>Done</button>
              </div>
            </>
          )}

          {screen === 'payout' && (
            <>
              <h1 className="sq-moment">Your turn landed.</h1>
              <p className="sq-money-hero">{naira(pot - held)}</p>
              <p className="sq-mono"><b>{naira(pot - held)}</b> now · <b>{naira(held)}</b> waits in the jar</p>
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
                <button type="button" className="sq-btn-ink" onClick={() => setScreen('home')}>See my balance</button>
                <button type="button" className="sq-btn-ghost" onClick={() => setScreen('squad')}>Back to squad</button>
              </div>
            </>
          )}
        </main>

        {showTabs && (
          <div className="sq-dock">
            {screen === 'squad' && (
              <div className="sq-actionbar">
                {s.phase === 'overview' && !youPaid && (
                  <>
                    <button type="button" className="sq-btn-primary" disabled={!othersPaid} onClick={() => dispatch({ type: 'PAY' })}>
                      {othersPaid ? `Pay ${naira(s.contribution)}` : 'Waiting for the squad…'}
                    </button>
                    <p className="sq-small sq-center">The jar pays automatically when everyone has paid, or when the round closes.</p>
                  </>
                )}
                {s.phase === 'pending' && <div className="sq-paidlabel">Paid round {s.round}. Your stamp is on the card.</div>}
                {s.phase === 'settled' && (
                  <>
                    <div className="sq-paidlabel">
                      The jar paid {youCollect ? 'you' : collector.name} <b className="sq-money-sm">{naira(youCollect ? pot - held : pot)}</b>. Nobody pressed a button.
                    </div>
                    {s.round < s.totalRounds
                      ? <button type="button" className="sq-btn-ink" onClick={() => dispatch({ type: 'NEXT_ROUND' })}>Next round</button>
                      : <button type="button" className="sq-btn-ghost" onClick={restart}>Squad complete · Start over</button>}
                  </>
                )}
              </div>
            )}
            <nav className="sq-tabs" aria-label="Main" style={{ ['--tab' as string]: tabOf[screen] }}>
              <span className="sq-tab-ind" aria-hidden="true" />
              {tabs.map((t) => (
                <button key={t.id} type="button" aria-current={tabOf[screen] === tabOf[t.id] ? 'page' : undefined} onClick={() => setScreen(t.id)}>
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {s.phase === 'confirm' && screen === 'squad' && (
        <div className="sq-scrim" role="dialog" aria-modal="true" aria-label="Confirm payment">
          <div className="sq-sheet">
            <span className="sq-grab" aria-hidden="true" />
            <p className="sq-label">Demo wallet · test money</p>
            <p className="sq-money-hero sq-sheet-amt">{naira(s.contribution)}</p>
            <dl>
              <div><dt>To</dt><dd>Hostel 4B jar</dd></div>
              <div><dt>Calls</dt><dd className="sq-mono">contribute()</dd></div>
              <div><dt>From balance</dt><dd>{naira(w.balance)}</dd></div>
            </dl>
            {w.balance >= s.contribution ? (
              <button type="button" className="sq-btn-primary" onClick={confirmPay}>Confirm</button>
            ) : (
              <button type="button" className="sq-btn-ink" onClick={() => { dispatch({ type: 'CANCEL' }); open('add'); }}>Not enough balance · Add money</button>
            )}
            <button type="button" className="sq-btn-ghost" onClick={() => dispatch({ type: 'CANCEL' })}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
