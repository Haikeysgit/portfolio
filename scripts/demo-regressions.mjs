// Browser regression checks for the demos (findings from the branch review).
// Usage: node scripts/demo-regressions.mjs http://localhost:4500
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4500';
const b = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

async function guard(name, fn) {
  try { await fn(); } catch (e) { check(name, false, String(e.message).split(/\r?\n/)[0]); }
}
async function page(path) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.locator('[data-demo-host]').scrollIntoViewIfNeeded().catch(() => {});
  await p.waitForTimeout(700);
  return p;
}
const resetBtn = (p) => p.getByRole('button', { name: 'Reset demo' });

// Every demo has a visible Reset.
for (const slug of ['squadjar', 'kedge', 'hsbyfiona', 'bulkhead']) {
  const p = await page(`/projects/${slug}`);
  check(`${slug}: visible Reset demo button`, (await resetBtn(p).count()) === 1);
  await p.close();
}

// Hsbyfiona: Reset clears the shop filter.
await guard('hsbyfiona: filter back to All after reset', async () => {
  const p = await page('/projects/hsbyfiona');
  await p.getByRole('button', { name: 'Enter the shop' }).click({ timeout: 4000 });
  await p.getByRole('button', { name: 'Oils', exact: true }).click();
  await resetBtn(p).click().catch(() => {});
  await p.getByRole('button', { name: 'Enter the shop' }).click({ timeout: 4000 });
  const pressed = await p.getByRole('button', { name: 'All', exact: true }).getAttribute('aria-pressed');
  check('hsbyfiona: filter back to All after reset', pressed === 'true');
  await p.close();
});

// Bulkhead: Reset reselects tier 1; double-tap on an attack submits once.
await guard('bulkhead: reset and double-tap', async () => {
  const p = await page('/projects/bulkhead');
  await p.getByRole('button', { name: 'Enter Drain Me' }).click({ timeout: 4000 });
  await p.getByRole('button', { name: /Tier 3/ }).click();
  await resetBtn(p).click().catch(() => {});
  await p.getByRole('button', { name: 'Enter Drain Me' }).click({ timeout: 4000 });
  check('bulkhead: tier 1 selected after reset', (await p.getByRole('button', { name: /Tier 1/ }).getAttribute('aria-pressed')) === 'true');
  await p.getByRole('button', { name: 'Override' }).dblclick();
  await p.waitForTimeout(1500);
  const t = await p.locator('.bh-pipe li').nth(2).textContent();
  check('bulkhead: double-tap pays once and shows the payout', /Paid \$30/.test(t), t);
  await p.close();
});

// Squadjar: Log out during Add money stays logged out; amounts reset.
await guard('squadjar: log out mid-top-up', async () => {
  const p = await page('/projects/squadjar');
  await p.getByRole('button', { name: 'Try it with a demo account' }).click();
  await p.getByRole('button', { name: 'Add money' }).click();
  await p.getByRole('button', { name: '₦20,000' }).click();
  await p.getByRole('button', { name: 'Add ₦20,000' }).click();
  await p.getByRole('button', { name: 'Back' }).click();
  await p.getByRole('button', { name: 'Log out' }).click();
  await p.waitForTimeout(1300);
  check('squadjar: still on landing after Log out mid-top-up', (await p.getByRole('button', { name: 'Try it with a demo account' }).count()) === 1);
  await p.getByRole('button', { name: 'Try it with a demo account' }).click();
  await p.getByRole('button', { name: 'Add money' }).click();
  check('squadjar: Add amount back to ₦10,000', (await p.getByRole('button', { name: '₦10,000', exact: true }).getAttribute('aria-pressed')) === 'true');
  await p.close();
});

await b.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ' · ' + r.detail : ''}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
