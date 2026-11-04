import { useState } from 'react';
import SquadjarDemo from './squadjar/SquadjarDemo';
import KedgeDemo from './kedge/KedgeDemo';
import HsbyfionaDemo from './hsbyfiona/HsbyfionaDemo';
import BulkheadDemo from './bulkhead/BulkheadDemo';
import './host.css';

const DEMOS = { squadjar: SquadjarDemo, kedge: KedgeDemo, hsbyfiona: HsbyfionaDemo, bulkhead: BulkheadDemo };
export type DemoName = keyof typeof DEMOS;

/** Wraps a demo with a visible Reset. Reset remounts the demo, so every bit of its state starts over. */
export default function DemoHost({ demo }: { demo: DemoName }) {
  const [run, setRun] = useState(0);
  const Demo = DEMOS[demo];
  const reset = () => setRun((n) => n + 1);
  return (
    <div data-demo-host>
      <div className="dh-bar">
        <span className="dh-dot" aria-hidden="true" />
        <span className="dh-t">Demo</span>
        <button type="button" className="dh-reset" onClick={reset}>Reset demo</button>
      </div>
      <Demo key={run} onReset={reset} />
    </div>
  );
}
