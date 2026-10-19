// Dev helper: captures stage frames across one round, to eyeball motion continuity.
import { chromium } from 'playwright-core';
import { serve } from './server.mjs';
const { url, close } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.addInitScript(() => localStorage.setItem('rps.tutorial.seen', '1'));
await page.goto(url);
await page.click('#begin');
await page.keyboard.press('p');
for (let i = 0; i < 20; i++) {
  await page.screenshot({ path: `evals/out/f${String(i).padStart(2, '0')}.png`, clip: { x: 180, y: 100, width: 640, height: 280 } });
  await page.waitForTimeout(90);
}
await browser.close(); await close();
