// Dev helper: screenshots of idle / pump / reveal for visual review.
import { chromium } from 'playwright-core';
import { serve } from './server.mjs';

const { url, close } = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
await page.goto(url);
await page.evaluate(() => localStorage.setItem('rps.tutorial.seen', '1'));
await page.reload();
await page.screenshot({ path: 'evals/out/1-idle.png' });
await page.click('#begin');
await page.screenshot({ path: 'evals/out/2-ready.png' });
await page.keyboard.press('p');
await page.waitForTimeout(700);
await page.screenshot({ path: 'evals/out/3-pump.png' });
await page.waitForTimeout(1300);
await page.screenshot({ path: 'evals/out/4-reveal.png' });
for (const pose of ['rock', 'paper', 'scissors']) {
  await page.evaluate((p) => { for (const id of ['player','cpu']) document.querySelector('#hand-'+id).dataset.pose = p; }, pose);
  await page.screenshot({ path: `evals/out/pose-${pose}.png`, clip: { x: 100, y: 100, width: 800, height: 400 } });
}
await browser.close();
await close();
