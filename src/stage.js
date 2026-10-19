// Beat timeline. Pure and clock-agnostic: the caller feeds in timestamps.
// Pump i fires at i * beatMs (i = 0..pumps-1). The throw fires one beat after the last pump.

export const BEAT_MS = 560;
export const PUMPS = 3;

export function planBeats(beatMs = BEAT_MS, pumps = PUMPS) {
  const plan = [];
  for (let i = 0; i < pumps; i++) plan.push({ at: i * beatMs, type: 'pump', index: i });
  plan.push({ at: pumps * beatMs, type: 'throw', index: pumps });
  return plan;
}

// Returns a sequence you drive with update(now). Each event fires exactly once, in order,
// even if update() is called late (skipped frames) and several events are due at once.
export function createSequence({ beatMs = BEAT_MS, pumps = PUMPS, onEvent, onDone }) {
  const plan = planBeats(beatMs, pumps);
  let t0 = null;
  let next = 0;
  let finished = false;

  return {
    plan,
    get finished() {
      return finished;
    },
    update(now) {
      if (finished) return;
      if (t0 === null) t0 = now;
      const elapsed = now - t0;
      while (next < plan.length && plan[next].at <= elapsed) {
        onEvent(plan[next], elapsed);
        next++;
      }
      if (next >= plan.length) {
        finished = true;
        if (onDone) onDone(elapsed);
      }
    },
    cancel() {
      finished = true;
    },
  };
}

// Drives a sequence with requestAnimationFrame. Returns a cancel function.
export function run(sequence, { raf = requestAnimationFrame, caf = cancelAnimationFrame } = {}) {
  let id = 0;
  const loop = (now) => {
    sequence.update(now);
    if (!sequence.finished) id = raf(loop);
  };
  id = raf(loop);
  return () => {
    sequence.cancel();
    caf(id);
  };
}
