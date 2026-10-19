// Periodic eval (not a gate test): drives the real page in headless Chromium with a fake
// speechSynthesis and checks that the ritual holds on the beat.
//
//   npm run eval            20 rounds
//   ROUNDS=6 npm run eval   quicker smoke
//
// Pass threshold: every round passes every check. Exit code 1 otherwise.
import { chromium } from 'playwright-core';
import { writeFile, mkdir } from 'node:fs/promises';
import { serve } from './server.mjs';
import { TUTORIAL, COUNT, COUNT_PROSODY, resultVariants } from '../src/lines.js';
import { BEAT_MS } from '../src/stage.js';

const ROUNDS = Number(process.env.ROUNDS || 20);
const THROW_AT = 3 * BEAT_MS;
const TOL = 150; // ms
const failures = [];
const fail = (msg) => { failures.push(msg); console.error('FAIL', msg); };

const FAKE_SPEECH = () => {
  window.__spoken = [];
  class U { constructor(t) { this.text = t; } }
  window.SpeechSynthesisUtterance = U;
  const synth = {
    onvoiceschanged: null,
    getVoices: () => [
      { name: 'Albert', lang: 'en-US', localService: true, default: true },
      { name: 'Samantha', lang: 'en-US', localService: true, default: false },
    ],
    cancel() {},
    speak(u) {
      window.__spoken.push({ t: performance.now(), text: u.text, pitch: u.pitch, rate: u.rate, voice: u.voice && u.voice.name });
      setTimeout(() => u.onend && u.onend(), 40);
    },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
};

await mkdir('evals/out', { recursive: true });
const { url, close } = await serve();
const browser = await chromium.launch();

async function fresh(seen) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 760 } });
  await ctx.addInitScript(FAKE_SPEECH);
  if (seen) await ctx.addInitScript(() => localStorage.setItem('rps.tutorial.seen', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  return { ctx, page, errors };
}

// ---- 1. first-run tutorial narrates every step and lands in ready ----
{
  const { ctx, page, errors } = await fresh(false);
  await page.click('#begin');
  await page.waitForFunction(() => window.__rps.state === 'ready', null, { timeout: 90_000 });
  const spoken = (await page.evaluate(() => window.__spoken)).map((s) => s.text);
  const expected = [];
  for (const s of TUTORIAL) {
    expected.push(s.say);
    if (s.demo === 'count') expected.push(...COUNT);
  }
  if (JSON.stringify(spoken) !== JSON.stringify(expected)) fail(`tutorial speech mismatch:\n got ${JSON.stringify(spoken)}\n exp ${JSON.stringify(expected)}`);
  if (errors.length) fail(`tutorial console errors: ${errors.join(' | ')}`);
  console.log(`tutorial: ${spoken.length} lines spoken`);
  await ctx.close();
}

// ---- 2. rounds: beat timing, speech cadence, state ----
const { ctx, page, errors } = await fresh(true);
await page.click('#begin');
await page.waitForFunction(() => window.__rps.state === 'ready');
await page.screenshot({ path: 'evals/out/eval-ready.png' });

const rows = [];
for (let n = 1; n <= ROUNDS; n++) {
  if (await page.evaluate(() => window.__rps.state === 'over')) {
    await page.click('#again');
    await page.waitForFunction(() => window.__rps.state === 'ready');
  }
  const before = await page.evaluate(() => window.__spoken.length);
  const key = ['r', 'p', 's'][n % 3];
  const t0 = await page.evaluate(() => performance.now());
  await page.keyboard.press(key);
  await page.waitForFunction(() => document.querySelector('#hand-player').dataset.thrown === 'true', null, { polling: 'raf' });
  const tThrow = await page.evaluate(() => performance.now());
  if (n === 1) await page.screenshot({ path: 'evals/out/eval-reveal.png' });
  await page.waitForFunction(() => ['ready', 'over'].includes(window.__rps.state), null, { timeout: 15_000 });

  const speech = (await page.evaluate(() => window.__spoken)).slice(before);
  const words = speech.slice(0, 4);
  const row = { round: n, throwMs: Math.round(tThrow - t0), speechCount: speech.length, ok: true, notes: [] };

  if (Math.abs(row.throwMs - THROW_AT) > TOL) row.notes.push(`throw at ${row.throwMs}ms, want ${THROW_AT}±${TOL}`);
  if (words.map((w) => w.text).join('|') !== COUNT.join('|')) row.notes.push(`count words ${JSON.stringify(words.map((w) => w.text))}`);
  else {
    for (let i = 1; i < 4; i++) {
      const gap = words[i].t - words[i - 1].t;
      if (Math.abs(gap - BEAT_MS) > 80) row.notes.push(`word gap ${i} = ${Math.round(gap)}ms, want ${BEAT_MS}±80`);
    }
  }
  const over = await page.evaluate(() => window.__rps.state === 'over');
  const want = over ? 6 : 5; // 4 count words + result line (+ match line)
  if (speech.length !== want) row.notes.push(`spoke ${speech.length} lines, want ${want}`);
  const lastResult = await page.evaluate(() => window.__rps.lastResult);
  if (!resultVariants(lastResult).includes(speech[4]?.text)) row.notes.push(`result line ${JSON.stringify(speech[4]?.text)} is not a variant for ${lastResult?.outcome}`);
  if (words.length === 4 && words.some((w, i) => w.pitch !== COUNT_PROSODY[i].pitch)) row.notes.push(`count pitch ${words.map((w) => w.pitch)}`);
  if (speech.some((x) => x.voice !== 'Samantha')) row.notes.push(`wrong voice ${[...new Set(speech.map((x) => x.voice))]} (novelty voice must be skipped)`);
  row.ok = row.notes.length === 0;
  if (!row.ok) fail(`round ${n}: ${row.notes.join('; ')}`);
  rows.push(row);
}

if (errors.length) fail(`console errors: ${errors.join(' | ')}`);

// ---- 3. a locked round ignores further picks ----
await page.evaluate(() => { if (window.__rps.state === 'over') document.querySelector('#again').click(); });
await page.waitForFunction(() => window.__rps.state === 'ready');
const roundsBefore = await page.evaluate(() => window.__rps.match.state.rounds);
await page.keyboard.press('r');
await page.keyboard.press('p');
await page.keyboard.press('s');
await page.waitForFunction(() => window.__rps.state !== 'busy', null, { timeout: 15_000 });
const roundsAfter = await page.evaluate(() => window.__rps.match.state.rounds);
if (roundsAfter - roundsBefore !== 1) fail(`mashing keys played ${roundsAfter - roundsBefore} rounds, want 1`);

await ctx.close();
await browser.close();
await close();

const passed = rows.filter((r) => r.ok).length;
const report = { rounds: ROUNDS, passed, failures, rows };
await writeFile('evals/out/report.json', JSON.stringify(report, null, 2));
console.log(`rounds passed ${passed}/${ROUNDS}; failures ${failures.length}; report evals/out/report.json`);
process.exit(failures.length ? 1 : 0);
