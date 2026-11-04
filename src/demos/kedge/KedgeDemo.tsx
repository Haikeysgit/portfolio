import { useEffect, useReducer } from 'react';
import { initialKedge, kedgeReducer } from './state';
import { FRAME_COUNT, GUARDED, NO_GUARD, type Frame } from './steps';
import './kedge.css';

// A replica of the Kedge site in its own design system: a run is a strip of film on a lightbox,
// and Kedge is the editor with the red china marker. Frames replay the real runs.

const CAPTIONS = [
  ['1 · plan', '2 · step 1', '3A · final'],
  ['1 · plan', '2 · step 1', '3 · step 2'],
];

function Strip({ frames, shown, run }: { frames: Frame[]; shown: number; run: 0 | 1 }) {
  return (
    <div className="kd-strip">
      <div className="kd-holes" aria-hidden="true" />
      <ol className="kd-frames">
        {frames.map((f, i) => {
          const on = i < shown;
          return (
            <li key={i} className={`kd-frame${on ? ' is-on' : ''}${on && f.strike ? ' is-struck' : ''}${on && f.verdict ? ` is-${f.verdict}` : ''}`}>
              <div className="kd-pic">
                {on && (
                  <>
                    <p className="kd-ft">{f.title}</p>
                    <p className="kd-fb">{f.body}</p>
                    {f.tests && <p className="kd-tests">tests {f.tests}</p>}
                    {f.strike && (
                      <>
                        <svg className="kd-x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M6 10 L94 88" /><path d="M92 12 L8 90" />
                        </svg>
                        <p className="kd-hand">{f.strike}</p>
                      </>
                    )}
                    {f.verdict === 'short' && <p className="kd-stamp kd-stamp-bad">SHIPPED SHORT</p>}
                    {f.verdict === 'kept' && <p className="kd-stamp kd-stamp-good">KEPT</p>}
                  </>
                )}
              </div>
              <span className="kd-cap">KEDGE 0{run + 1} · {CAPTIONS[run][i]}</span>
            </li>
          );
        })}
      </ol>
      <div className="kd-holes" aria-hidden="true" />
    </div>
  );
}

export default function KedgeDemo({ onReset }: { onReset?: () => void }) {
  const [s, dispatch] = useReducer(kedgeReducer, initialKedge);
  const done = s.shown >= FRAME_COUNT;

  useEffect(() => {
    if (!s.playing) return;
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1500);
    return () => clearInterval(t);
  }, [s.playing]);

  const header = (
    <header className="kd-head">
      <button type="button" className="kd-mark" onClick={() => (onReset ? onReset() : dispatch({ type: 'RESET' }))} aria-label="Kedge home">
        KEDGE <span>built for #neatHack</span>
      </button>
      <nav className="kd-nav">
        <button type="button" onClick={() => dispatch({ type: 'OPEN', screen: 'how' })} aria-current={s.screen === 'how' ? 'page' : undefined}>How it works</button>
        <button type="button" onClick={() => dispatch({ type: 'OPEN', screen: 'race' })} aria-current={s.screen === 'race' ? 'page' : undefined}>Proof</button>
      </nav>
    </header>
  );

  return (
    <div className="kdj">
      {header}
      <main className="kd-screen" key={s.screen}>
        {s.screen === 'landing' && (
          <section className="kd-hero">
            <h1 className="kd-display">
              Your coding agent cheats.<br />
              Kedge <span className="kd-circled">catches<svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M8 34 C 12 8, 186 2, 192 28 C 198 52, 30 60, 12 42 C 4 32, 30 14, 70 10" /></svg></span> it.
            </h1>
            <p className="kd-lead">
              Agents left alone delete the failing test, wander off the plan, then report "all tests pass." Kedge supervises every
              step, strikes the cheat, rewinds the agent to its last good commit and makes it try again.
            </p>
            <div className="kd-ctas">
              <button type="button" className="kd-btn" onClick={() => dispatch({ type: 'OPEN', screen: 'race' })}>▶ Replay the race</button>
              <button type="button" className="kd-textlink" onClick={() => dispatch({ type: 'OPEN', screen: 'how' })}>How the catch works</button>
            </div>
          </section>
        )}

        {s.screen === 'race' && (
          <section className="kd-race">
            <p className="kd-note">Same Dependabot PR, same sabotage: the agent deletes a test file. Top strip runs unguarded. Bottom strip runs under Kedge. Real runs, replayed.</p>
            <p className="kd-lane kd-lane-bad">No guard</p>
            <Strip frames={NO_GUARD} shown={s.shown} run={0} />
            <p className="kd-lane kd-lane-good">Kedge</p>
            <Strip frames={GUARDED} shown={s.shown} run={1} />
            <div className="kd-controls">
              {s.playing
                ? <button type="button" className="kd-btn kd-btn-ghost" onClick={() => dispatch({ type: 'PAUSE' })}>Pause</button>
                : <button type="button" className="kd-btn" onClick={() => dispatch({ type: 'PLAY' })}>{done ? '↺ Replay' : '▶ Play'}</button>}
              <button type="button" className="kd-btn kd-btn-ghost" disabled={done} onClick={() => dispatch({ type: 'STEP' })}>Next frame</button>
            </div>
            {done && (
              <div className="kd-print">
                <p className="kd-score">2/5 <span>→</span> 5/5</p>
                <p className="kd-word">KEPT</p>
                <p className="kd-print-cap">Unguarded, the agent shipped a "green" PR with 3 of 5 tests deleted. Under Kedge the same sabotage was struck at step 1, rewound and fixed for real.</p>
                <p className="kd-mono">kedge-demo#1 · packaging 21.3 → 24.2 · --storm delete-test</p>
              </div>
            )}
          </section>
        )}

        {s.screen === 'how' && (
          <section className="kd-how">
            <h2 className="kd-h2">How the catch works</h2>
            <div className="kd-strip kd-strip-how">
              <div className="kd-holes" aria-hidden="true" />
              <ol className="kd-frames">
                {[
                  ['Plan', 'Kedge reads the failing tests and the base branch, and writes down which files a fix may touch and how many tests must survive.'],
                  ['Check every step', 'After each agent step it re-runs the tests, diffs the files and compares the count against the base branch. No model judges the agent; the tests do.'],
                  ['Strike and rewind', 'A deleted test, an off-plan edit, a repeat attempt or a false "fixed" is struck. Kedge resets to the last good commit and hands the agent a note on what it did wrong.'],
                  ['Keep', 'Only a green result that holds on a second run becomes a draft PR, with every step traced.'],
                ].map(([t, b], i) => (
                  <li key={t} className={`kd-frame is-on${i === 2 ? ' is-struck-soft' : ''}${i === 3 ? ' is-keep' : ''}`} style={{ animationDelay: `${i * 90}ms` }}>
                    <div className="kd-pic">
                      <p className="kd-mono kd-dim">{i + 1}</p>
                      <p className="kd-ft">{t}</p>
                      <p className="kd-fb">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="kd-holes" aria-hidden="true" />
            </div>
            <p className="kd-hand kd-hand-big">Kedge doesn't trust what the agent says. It checks.</p>
            <button type="button" className="kd-btn kd-auto" onClick={() => dispatch({ type: 'OPEN', screen: 'race' })}>▶ Replay the race</button>
          </section>
        )}
      </main>
    </div>
  );
}
