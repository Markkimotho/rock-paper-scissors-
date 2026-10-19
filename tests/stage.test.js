import test from 'node:test';
import assert from 'node:assert/strict';
import { planBeats, createSequence, run } from '../src/stage.js';

test('plan is 3 pumps then 1 throw, one beat apart', () => {
  const plan = planBeats(500, 3);
  assert.deepEqual(plan, [
    { at: 0, type: 'pump', index: 0 },
    { at: 500, type: 'pump', index: 1 },
    { at: 1000, type: 'pump', index: 2 },
    { at: 1500, type: 'throw', index: 3 },
  ]);
});

test('sequence fires each event once at its offset', () => {
  const events = [];
  let done = null;
  const seq = createSequence({ beatMs: 100, onEvent: (e, t) => events.push([e.type, e.index, t]), onDone: (t) => (done = t) });
  for (const t of [1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350]) seq.update(t);
  assert.deepEqual(events.map((e) => e.slice(0, 2)), [['pump', 0], ['pump', 1], ['pump', 2], ['throw', 3]]);
  assert.deepEqual(events.map((e) => e[2]), [0, 100, 200, 300]);
  assert.equal(done, 300);
  assert.equal(seq.finished, true);
});

test('late frames flush all due events in order, exactly once', () => {
  const events = [];
  const seq = createSequence({ beatMs: 100, onEvent: (e) => events.push(e.index) });
  seq.update(0);
  seq.update(10000); // a tab that was backgrounded
  seq.update(10100);
  assert.deepEqual(events, [0, 1, 2, 3]);
});

test('cancel stops further events', () => {
  const events = [];
  const seq = createSequence({ beatMs: 100, onEvent: (e) => events.push(e.index) });
  seq.update(0);
  seq.cancel();
  seq.update(500);
  assert.deepEqual(events, [0]);
});

test('run drives the sequence with injected raf and stops after finishing', () => {
  const frames = [];
  let id = 0;
  const raf = (fn) => {
    frames.push(fn);
    return ++id;
  };
  const events = [];
  const seq = createSequence({ beatMs: 100, onEvent: (e) => events.push(e.type) });
  run(seq, { raf, caf: () => {} });
  for (const t of [0, 100, 200, 300]) frames.shift()(t);
  assert.deepEqual(events, ['pump', 'pump', 'pump', 'throw']);
  assert.equal(frames.length, 0, 'no frame requested after finish');
});

test('run cancel stops the loop', () => {
  const frames = [];
  const raf = (fn) => (frames.push(fn), frames.length);
  const events = [];
  const seq = createSequence({ beatMs: 100, onEvent: (e) => events.push(e.type) });
  const cancel = run(seq, { raf, caf: () => {} });
  frames.shift()(0);
  cancel();
  assert.equal(seq.finished, true);
  assert.deepEqual(events, ['pump']);
});
