// Dev helper: large-display screenshots to check centering.
import { chromium } from 'playwright-core';
import { serve } from './server.mjs';
const { url, close } = await serve();
const browser = await chromium.launch();
for (const [w, h] of [[1920, 1080], [2560, 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.addInitScript(() => localStorage.setItem('rps.tutorial.seen', '1'));
  await page.goto(url);
  await page.click('#begin');
  await page.keyboard.press('s');
  await page.waitForTimeout(2300);
  await page.screenshot({ path: `evals/out/wide-${w}.png` });
  // Horizontal centering check: content box midpoint vs viewport midpoint.
  const mid = await page.evaluate(() => {
    const r = document.querySelector('main').getBoundingClientRect();
    const h = document.querySelector('header').getBoundingClientRect();
    const f = document.querySelector('footer').getBoundingClientRect();
    return [r, h, f].map((b) => Math.round(b.left + b.width / 2));
  });
  console.log(w, 'midpoints main/header/footer', mid, 'viewport mid', w / 2);
}
await browser.close(); await close();
