// Voice-over via the Web Speech API. Every call is a safe no-op when speech is unavailable.

// Higher score = better. English only; local (on-device) voices beat network voices;
// en-GB / en-US beat other English variants; "premium/enhanced/natural" names get a bump.
export function scoreVoice(v) {
  if (!v || !/^en([-_]|$)/i.test(v.lang || '')) return -1;
  let s = 1;
  if (v.localService) s += 4;
  if (/^en[-_](GB|US)$/i.test(v.lang)) s += 2;
  if (/premium|enhanced|natural|neural/i.test(v.name || '')) s += 3;
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

export function createVoice({ synth, makeUtterance, rate = 1.05 } = {}) {
  const supported = Boolean(synth && makeUtterance);
  let muted = false;
  let chosen = null;

  function pick() {
    if (!supported) return;
    const best = rankVoices(synth.getVoices());
    chosen = best[0] || null;
  }
  pick();
  // Chrome and Safari populate voices asynchronously.
  if (supported && 'onvoiceschanged' in synth) synth.onvoiceschanged = pick;

  return {
    supported,
    get muted() {
      return muted;
    },
    get voice() {
      return chosen;
    },
    // Speaks immediately, cutting off anything still playing so beats never queue up.
    say(text, { interrupt = true } = {}) {
      if (!supported || muted || !text) return;
      if (interrupt) synth.cancel();
      const u = makeUtterance(text);
      if (chosen) u.voice = chosen;
      u.lang = chosen ? chosen.lang : 'en-US';
      u.rate = rate;
      synth.speak(u);
    },
    // Resolves when the line has finished (or immediately when muted/unsupported).
    sayAsync(text) {
      return new Promise((resolve) => {
        if (!supported || muted || !text) return resolve();
        synth.cancel();
        const u = makeUtterance(text);
        if (chosen) u.voice = chosen;
        u.lang = chosen ? chosen.lang : 'en-US';
        u.rate = rate;
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

export function createBrowserVoice() {
  const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  const makeUtterance = typeof SpeechSynthesisUtterance !== 'undefined' ? (t) => new SpeechSynthesisUtterance(t) : null;
  return createVoice({ synth, makeUtterance });
}
