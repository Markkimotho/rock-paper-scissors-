// Voice-over via the Web Speech API. Every call is a safe no-op when speech is unavailable.

// Novelty and legacy voices that sound robotic or comical. Never picked, never offered.
const BLOCKED = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|wobble|fred|good news|jester|junior|organ|pipe organ|ralph|superstar|trinoids|whisper|zarvox|kathy|hysterical|deranged|princess|agnes|bruce|vicki|victoria)\b/i;
// Voices that are known to sound natural on macOS, Windows, Android and Chrome.
const NATURAL = /premium|enhanced|natural|neural|siri/i;
const GOOD = /^(samantha|ava|allison|zoe|evan|nathan|tom|susan|karen|daniel|serena|moira|fiona|tessa|aaron|nicky|google (us|uk) english)/i;

// Higher score = better. -1 means excluded: not English, or blocked.
export function scoreVoice(v) {
  if (!v || !/^en([-_]|$)/i.test(v.lang || '')) return -1;
  const name = v.name || '';
  if (BLOCKED.test(name)) return -1;
  let s = 1;
  if (v.localService) s += 4;
  if (/^en[-_](GB|US)$/i.test(v.lang)) s += 2;
  if (NATURAL.test(name)) s += 6;
  if (GOOD.test(name)) s += 3;
  if (v.default) s += 1;
  return s;
}

export function rankVoices(list) {
  const scored = (list || [])
    .map((v, i) => ({ v, i, s: scoreVoice(v) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i);
  return scored.map((x) => x.v);
}

export function createVoice({ synth, makeUtterance, rate = 1, preferred = null, onChange } = {}) {
  const supported = Boolean(synth && makeUtterance);
  let muted = false;
  let ranked = [];
  let chosen = null;

  function pick() {
    if (!supported) return;
    // One entry per voice name, best few only; the rest are noise to a person choosing.
    const seen = new Set();
    ranked = rankVoices(synth.getVoices()).filter((v) => !seen.has(v.name) && seen.add(v.name)).slice(0, 6);
    chosen = ranked.find((v) => v.name === preferred) || ranked[0] || null;
    if (onChange) onChange(chosen, ranked.slice());
  }
  pick();
  // Chrome and Safari populate voices asynchronously.
  if (supported && 'onvoiceschanged' in synth) synth.onvoiceschanged = pick;

  function build(text, { pitch = 1, rate: r = rate } = {}) {
    const u = makeUtterance(text);
    if (chosen) u.voice = chosen;
    u.lang = chosen ? chosen.lang : 'en-US';
    u.rate = r;
    u.pitch = pitch;
    return u;
  }

  return {
    supported,
    get muted() {
      return muted;
    },
    get voice() {
      return chosen;
    },
    get candidates() {
      return ranked.slice();
    },
    // Moves to the next candidate voice (wraps). Returns it, or null if there is nothing to pick.
    next() {
      if (ranked.length === 0) return null;
      const i = ranked.indexOf(chosen);
      chosen = ranked[(i + 1) % ranked.length];
      if (onChange) onChange(chosen, ranked.slice());
      return chosen;
    },
    // Speaks immediately, cutting off anything still playing so beats never queue up.
    // pitch/rate shape the delivery: a flat pitch is the main thing that makes TTS sound robotic.
    say(text, { interrupt = true, pitch, rate: r } = {}) {
      if (!supported || muted || !text) return;
      if (interrupt) synth.cancel();
      synth.speak(build(text, { pitch, rate: r }));
    },
    // Resolves when the line has finished (or immediately when muted/unsupported).
    sayAsync(text, opts = {}) {
      return new Promise((resolve) => {
        if (!supported || muted || !text) return resolve();
        synth.cancel();
        const u = build(text, opts);
        // Some engines never fire onend after cancel(); a length-based timeout keeps callers moving.
        const timer = setTimeout(done, Math.max(1500, text.length * 110) + 1500);
        function done() {
          clearTimeout(timer);
          resolve();
        }
        u.onend = done;
        u.onerror = done;
        synth.speak(u);
      });
    },
    stop() {
      if (supported) synth.cancel();
    },
    setMuted(value) {
      muted = Boolean(value);
      if (muted && supported) synth.cancel();
    },
  };
}

export function createBrowserVoice(opts = {}) {
  const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  const makeUtterance = typeof SpeechSynthesisUtterance !== 'undefined' ? (t) => new SpeechSynthesisUtterance(t) : null;
  return createVoice({ synth, makeUtterance, ...opts });
}
