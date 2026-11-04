// Runs axe-core (the engine behind Lighthouse's accessibility score) on each page in both themes.
// Usage: node scripts/a11y.mjs http://localhost:4500 / /projects/squadjar ...
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const [base, ...paths] = process.argv.slice(2);
const b = await chromium.launch();
let bad = 0;
for (const theme of ['dark', 'light']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme-choice', t); } catch {} }, theme);
  const p = await ctx.newPage();
  for (const path of paths) {
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.mouse.wheel(0, 2500); await p.waitForTimeout(800);
    const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const v = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical');
    bad += v.length;
    console.log(`${v.length ? 'FAIL' : 'ok  '} ${theme} ${path} ${v.map((x) => `${x.id}(${x.nodes.length}): ${x.nodes[0].target.join(' ')}`).join(' | ')}`);
  }
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
