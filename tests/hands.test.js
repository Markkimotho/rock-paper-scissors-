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

import { POSE_TRANSFORM } from '../src/hands.js';

test('regression: no sprite is flipped, so both fists face the opponent once the computer side mirrors', () => {
  // rock.png natively faces right. Flipping it made the player fist face away from the computer.
  for (const [pose, t] of Object.entries(POSE_TRANSFORM)) {
    assert.ok(!/scale\(\s*-/.test(t), `${pose} must not be flipped: ${t}`);
  }
});

test('every pose is re-centered on the same anchor and rotated about it', () => {
  for (const m of MOVES) {
    assert.match(POSE_TRANSFORM[m], /^rotate\(-?[\d.]+ 0 -85\) translate\(-?[\d.]+ -?[\d.]+\)$/, m);
  }
});

test('poses cross-fade instead of cutting', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.hand \.pose \{[^}]*transition: opacity/);
});

test('layout column is centered on wide screens', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /grid-template-columns: minmax\(0, \d+px\);\s*grid-template-rows:[^;]*;\s*justify-content: center;/);
});
