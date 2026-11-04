// Loads pages at several widths in both themes, reports console errors and horizontal overflow,
// and saves screenshots to .superpowers/shots/. Usage: node scripts/check-pages.mjs http://localhost:4321 / /projects/kedge
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [base, ...paths] = process.argv.slice(2);
const widths = (process.env.WIDTHS ?? '320,375,1280').split(',').map(Number);
const out = '.superpowers/shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
let failed = false;
for (const theme of ['dark', 'light']) {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addInitScript((t) => { try { localStorage.setItem('theme-choice', t); } catch {} }, theme);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = `${p.replace(/\W+/g, '_') || 'home'}-${width}-${theme}.png`;
      await page.screenshot({ path: `${out}/${name}`, fullPage: process.env.FULL === '1' });
      const bad = overflow > 0 || errors.length > 0;
      if (bad) failed = true;
      console.log(`${bad ? 'FAIL' : 'ok  '} ${theme} ${width} ${p} overflow=${overflow}${errors.length ? ' errors=' + JSON.stringify(errors) : ''}`);
      errors.length = 0;
    }
    await ctx.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
