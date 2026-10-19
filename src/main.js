import { createMatch, pickComputerMove } from './game.js';
import { COUNT, TUTORIAL, PICK, resultLine, matchLine } from './lines.js';
import { createBrowserVoice } from './voice.js';
import { createSequence, run, BEAT_MS } from './stage.js';
import { handMarkup, poseClass } from './hands.js';

const $ = (sel) => document.querySelector(sel);
const body = document.body;
const caption = $('#caption');
const dot = $('.beat .dot');
const hands = { player: $('#hand-player'), cpu: $('#hand-cpu') };
const marks = { player: $('#mark-player'), cpu: $('#mark-cpu') };
const picks = [...document.querySelectorAll('.pick')];
const againBtn = $('#again');
const soundBtn = $('#sound');
const howBtn = $('#how');

const voice = createBrowserVoice();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const match = createMatch({ target: 5 });

const SEEN_KEY = 'rps.tutorial.seen';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let state = 'idle'; // idle | tutorial | ready | busy | over
let token = 0; // bumps to cancel any in-flight tutorial or round
let cancelRun = null;
const timers = new Set();

for (const h of Object.values(hands)) h.innerHTML = handMarkup();

// ---------- small helpers ----------

function setState(s) {
  state = s;
  body.dataset.state = s;
}

function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
}

function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers.clear();
}

const sleep = (ms) => new Promise((r) => later(r, ms));

function setCaption(text) {
  caption.textContent = text;
}

function setPose(side, pose) {
  hands[side].dataset.pose = poseClass(pose);
}

function setThrown(side, on) {
  hands[side].dataset.thrown = String(on);
}

function setMarks(winnerSide) {
  for (const side of ['player', 'cpu']) {
    marks[side].dataset.on = String(side === winnerSide);
    hands[side].dataset.lost = String(Boolean(winnerSide) && side !== winnerSide);
  }
}

function setDot(tick, live = true) {
  dot.dataset.tick = String(tick);
  dot.dataset.live = String(live);
}

function resetStage() {
  for (const side of ['player', 'cpu']) {
    setPose(side, 'rest');
    setThrown(side, false);
  }
  setMarks(null);
  setDot(0, false);
}

function pump() {
  if (reducedMotion.matches) return;
  for (const h of Object.values(hands)) {
    h.querySelector('.bob').animate(
      [
        { transform: 'translateY(-26px)', easing: 'cubic-bezier(.55,0,.9,.45)' },
        { transform: 'translateY(16px)', offset: 0.32, easing: 'cubic-bezier(.2,.7,.3,1)' },
        { transform: 'translateY(-26px)' },
      ],
      { duration: BEAT_MS * 0.95 },
    );
  }
}

function renderScore() {
  for (const [side, id] of [['player', '#score-player'], ['cpu', '#score-cpu']]) {
    const n = match.state[side];
    $(`${id} .n`).textContent = String(n);
    $(`${id} .pips`).querySelectorAll('i').forEach((el, i) => { el.dataset.on = String(i < n); });
  }
}

// One count-and-throw beat sequence. Words are fired on the beat clock and never awaited,
// so a slow speech engine cannot push the animation off the beat.
function playSequence({ onThrow }) {
  return new Promise((resolve) => {
    const my = token;
    const seq = createSequence({
      onEvent(e) {
        if (my !== token) return;
        if (e.type === 'pump') {
          setPose('player', 'rest');
          setPose('cpu', 'rest');
          pump();
          setDot(e.index, true);
          voice.say(COUNT[e.index]);
          setCaption(COUNT[e.index]);
        } else {
          setDot(3, true);
          voice.say(COUNT[3]);
          setCaption(COUNT[3]);
          onThrow();
        }
      },
      onDone: resolve,
    });
    cancelRun = run(seq);
  });
}

function cancelAll() {
  token++;
  clearTimers();
  if (cancelRun) cancelRun();
  cancelRun = null;
  voice.stop();
}

// ---------- tutorial ----------

async function runTutorial() {
  cancelAll();
  const my = token;
  const alive = () => my === token;
  setState('tutorial');
  resetStage();
  howBtn.textContent = 'skip';

  for (const step of TUTORIAL) {
    if (!alive()) return;
    setMarks(null);
    setThrown('player', step.pose !== 'rest');
    setThrown('cpu', Boolean(step.cpu));
    setPose('player', step.pose);
    setPose('cpu', step.cpu || 'rest');
    if (step.win) setMarks(step.win);
    setCaption(step.say);
    await voice.sayAsync(step.say);
    if (!alive()) return;
    await sleep(voice.supported && !voice.muted ? 350 : Math.max(1800, step.say.length * 55));
    if (!alive()) return;

    if (step.demo === 'count') {
      resetStage();
      await playSequence({
        onThrow() {
          setThrown('player', true);
          setThrown('cpu', true);
          setPose('player', 'rock');
          setPose('cpu', 'scissors');
        },
      });
      if (!alive()) return;
      await sleep(1200);
    }
  }
  if (alive()) finishTutorial();
}

function finishTutorial() {
  store.set(SEEN_KEY, '1');
  howBtn.textContent = 'how to play';
  toReady();
}

function skipTutorial() {
  cancelAll();
  finishTutorial();
}

// ---------- rounds ----------

function toReady() {
  cancelAll();
  setState('ready');
  resetStage();
  picks.forEach((b) => { b.disabled = false; b.setAttribute('aria-pressed', 'false'); });
  setCaption(PICK);
}

async function playRound(move) {
  if (state !== 'ready') return;
  cancelAll();
  const my = token;
  setState('busy');
  resetStage();
  picks.forEach((b) => {
    b.disabled = true;
    b.setAttribute('aria-pressed', String(b.dataset.move === move));
  });

  const cpuMove = pickComputerMove();
  const result = match.play(move, cpuMove);

  await playSequence({
    onThrow() {
      setThrown('player', true);
      setThrown('cpu', true);
      setPose('player', move);
      setPose('cpu', cpuMove);
      const side = result.outcome === 'win' ? 'player' : result.outcome === 'lose' ? 'cpu' : null;
      setMarks(side);
      renderScore();
    },
  });
  if (my !== token) return;

  const line = resultLine(result);
  await sleep(480); // let "Shoot!" land before the verdict
  if (my !== token) return;
  setCaption(line);
  await voice.sayAsync(line);
  if (my !== token) return;

  if (result.over) {
    const end = matchLine(result.matchWinner);
    await sleep(300);
    if (my !== token) return;
    setCaption(end);
    await voice.sayAsync(end);
    if (my !== token) return;
    setState('over');
    againBtn.hidden = false;
    againBtn.focus({ preventScroll: true });
    return;
  }
  await sleep(voice.supported && !voice.muted ? 500 : 1100);
  if (my !== token) return;
  toReady();
}

function again() {
  match.reset();
  renderScore();
  againBtn.hidden = true;
  toReady();
}

// ---------- begin / controls ----------

function showBegin() {
  caption.textContent = '';
  const b = document.createElement('button');
  b.type = 'button';
  b.id = 'begin';
  b.innerHTML = '<span class="dot-inline"></span>tap to begin';
  b.addEventListener('click', begin);
  caption.append(b);
}

function begin() {
  if (state !== 'idle') return;
  // Speech must be started from a user gesture; this call is that gesture.
  if (store.get(SEEN_KEY)) toReady();
  else runTutorial();
}

picks.forEach((b) => b.addEventListener('click', () => playRound(b.dataset.move)));
againBtn.addEventListener('click', again);

howBtn.addEventListener('click', () => {
  if (state === 'idle') begin();
  else if (state === 'tutorial') skipTutorial();
  else if (state !== 'busy') runTutorial();
});

soundBtn.addEventListener('click', () => {
  const on = voice.muted; // toggling: currently muted means turning on
  voice.setMuted(!on);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? 'sound on' : 'sound off';
});
if (!voice.supported) {
  soundBtn.hidden = true;
}

const KEYS = { r: 'rock', p: 'paper', s: 'scissors' };
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (KEYS[k]) return playRound(KEYS[k]);
  if (k === 'm') return soundBtn.click();
  if (k === 'escape' && state === 'tutorial') return skipTutorial();
  if (k === 'enter' || k === ' ') {
    if (state === 'idle') { e.preventDefault(); begin(); }
    else if (state === 'over') { e.preventDefault(); again(); }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) voice.stop();
});

// ---------- boot ----------

renderScore();
resetStage();
showBegin();
setState('idle');

// Test hook for the browser eval: lets it observe speech without audio hardware.
window.__rps = { get state() { return state; }, match, voice };
