import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { handMarkup, ASSETS, poseClass } from '../src/hands.js';
import { MOVES } from '../src/game.js';

test('every move has a sprite on disk and a pose in the markup', () => {
  const markup = handMarkup();
  for (const m of MOVES) {
    assert.ok(ASSETS[m], `asset for ${m}`);
    assert.ok(existsSync(new URL(`../${ASSETS[m]}`, import.meta.url)), `${ASSETS[m]} exists`);
    assert.ok(markup.includes(`class="pose ${m}"`), `pose ${m}`);
    assert.ok(markup.includes(ASSETS[m]));
  }
});

test('sprites are real PNGs', () => {
  for (const m of MOVES) {
    const buf = readFileSync(new URL(`../${ASSETS[m]}`, import.meta.url));
    assert.deepEqual([...buf.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test('markup has the float and bob wrappers the animations target', () => {
  const m = handMarkup();
  assert.ok(m.includes('class="float"') && m.includes('class="bob"'));
});

test('rest is the raised fist', () => {
  assert.equal(poseClass('rest'), 'rock');
  assert.equal(poseClass('paper'), 'paper');
});
