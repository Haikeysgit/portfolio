// Screenshots each project's pages at desktop (1440x900) and mobile (390x844 @2x).
// Usage: node scripts/shoot.mjs [slug ...]   (reads scripts/shots.json, writes public/images/projects/<slug>/)
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const all = JSON.parse(readFileSync('scripts/shots.json', 'utf8'));
const only = process.argv.slice(2);
const devices = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const browser = await chromium.launch();
for (const [slug, pages] of Object.entries(all)) {
  if (only.length && !only.includes(slug)) continue;
  const dir = `public/images/projects/${slug}`;
  mkdirSync(dir, { recursive: true });
  for (const [device, opts] of Object.entries(devices)) {
    const ctx = await browser.newContext({ ...opts, colorScheme: 'dark' });
    const page = await ctx.newPage();
    for (const { url, name, hideText } of pages) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1500);
        if (hideText) {
          // Hide every short row whose text mentions hideText (e.g. a commit line naming a co-author).
          await page.evaluate((t) => {
            const hits = [...document.querySelectorAll('body *')].filter(
              (e) => e.children.length === 0 && e.textContent?.toLowerCase().includes(t),
            );
            for (const el of hits) {
              let row = el;
              while (row.parentElement && row.parentElement.getBoundingClientRect().height < 90) row = row.parentElement;
              row.style.visibility = 'hidden';
            }
          }, hideText.toLowerCase());
        }
        const file = `${dir}/${device}-${name}.png`;
        await page.screenshot({ path: file });
        console.log('ok  ', file, '<-', page.url());
      } catch (e) {
        console.log('FAIL', slug, device, url, e.message.split('\n')[0]);
      }
    }
    await ctx.close();
  }
}
await browser.close();
