// Dev helper: phone-width and reduced-motion screenshots.
import { chromium } from 'playwright-core';
import { serve } from './server.mjs';
const { url, close } = await serve();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 700 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => localStorage.setItem('rps.tutorial.seen', '1'));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);
await page.screenshot({ path: 'evals/out/m-idle.png' });
await page.click('#begin');
await page.click('[data-move=scissors]');
await page.waitForTimeout(2200);
await page.screenshot({ path: 'evals/out/m-reveal.png' });
console.log('errors', errors);
await browser.close(); await close();
