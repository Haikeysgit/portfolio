import { useEffect, useReducer } from 'react';
import { initialKedge, kedgeReducer, stepsFor } from './state';
import './kedge.css';

const ACTOR: Record<string, string> = { pr: 'Pull request', agent: 'Coding agent', kedge: 'Kedge', ci: 'Result' };

export default function KedgeDemo() {
  const [s, dispatch] = useReducer(kedgeReducer, initialKedge);
  const steps = stepsFor(s);
  const shown = steps.slice(0, s.index + 1);
  const atEnd = s.index === steps.length - 1;
  const latestTests = [...shown].reverse().find((x) => x.tests)?.tests;
  const final = atEnd ? steps[s.index].tests : undefined;

  useEffect(() => {
    if (!s.playing) return;
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1400);
    return () => clearInterval(t);
  }, [s.playing]);

  return (
    <div className="kd">
      <div className="kd-bar">
        <div className="kd-seg" role="group" aria-label="Run mode">
          <button type="button" aria-pressed={s.mode === 'unsupervised'} onClick={() => s.mode !== 'unsupervised' && dispatch({ type: 'TOGGLE_MODE' })}>
            Without Kedge
          </button>
          <button type="button" aria-pressed={s.mode === 'supervised'} onClick={() => s.mode !== 'supervised' && dispatch({ type: 'TOGGLE_MODE' })}>
            With Kedge
          </button>
        </div>
        <div className="kd-ctrl">
          {s.playing ? (
            <button type="button" onClick={() => dispatch({ type: 'PAUSE' })}>Pause</button>
          ) : (
            <button type="button" className="kd-primary" onClick={() => dispatch({ type: 'PLAY' })}>{atEnd ? 'Replay' : 'Play'}</button>
          )}
          <button type="button" onClick={() => dispatch({ type: 'STEP' })} disabled={atEnd}>Step</button>
          <button type="button" onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
        </div>
      </div>

      <div className="kd-body">
        <ol className="kd-steps" aria-live="polite">
          {shown.map((step, i) => (
            <li key={`${s.mode}-${step.id}`} className={`kd-step kd-${step.actor}${i === s.index ? ' is-new' : ''}`}>
              <span className="kd-actor">{ACTOR[step.actor]}</span>
              <p>{step.text}</p>
            </li>
          ))}
          {!atEnd && <li className="kd-next">{s.playing ? 'Running…' : 'Press Play or Step to continue.'}</li>}
        </ol>

        <aside className="kd-side">
          <p className="kd-kicker">Tests in the pull request</p>
          <p className="kd-count">{latestTests ?? '0/5'}</p>
          <p className="kd-sub">The base branch has 5.</p>
          {final && (
            <div className={`kd-verdict ${final === '5/5' ? 'ok' : 'bad'}`}>
              {final === '5/5' ? 'Every test kept. Cheat caught at step 1 and rolled back.' : 'Looks green, but 3 of 5 tests are gone and the agent said "Fixed".'}
            </div>
          )}
          <p className="kd-src">Replayed from real runs: same PR, same model, same sabotage.</p>
        </aside>
      </div>
    </div>
  );
}
