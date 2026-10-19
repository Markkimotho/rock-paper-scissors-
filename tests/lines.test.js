import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, resolveRound } from '../src/game.js';
import { COUNT, COUNT_PROSODY, TUTORIAL, resultLine, resultVariants, matchLine } from '../src/lines.js';

test('count words are rock, paper, scissors, shoot', () => {
  assert.deepEqual(COUNT, ['Rock.', 'Paper.', 'Scissors.', 'Shoot!']);
});

test('every matchup has variants, each stating the rule and the verdict', () => {
  for (const p of MOVES) {
    for (const c of MOVES) {
      const r = resolveRound(p, c);
      const variants = resultVariants(r);
      assert.ok(variants.length >= 3, `${p} vs ${c}: want several variants`);
      for (const line of variants) {
        assert.ok(line.length > 0 && line.length <= 120, line);
        if (r.outcome === 'tie') continue;
        const cap = r.winner[0].toUpperCase() + r.winner.slice(1);
        assert.match(line, new RegExp(`${cap} (breaks|cut|covers) (rock|paper|scissors)\\.`), line);
      }
    }
  }
});

test('result lines state the true rule', () => {
  const only = (p, c) => resultVariants(resolveRound(p, c));
  assert.ok(only('rock', 'scissors').every((l) => l.includes('Rock breaks scissors.')));
  assert.ok(only('scissors', 'paper').every((l) => l.includes('Scissors cut paper.')));
  assert.ok(only('paper', 'rock').every((l) => l.includes('Paper covers rock.')));
  assert.ok(only('rock', 'paper').every((l) => l.includes('Paper covers rock.')));
});

test('a loss never claims a win and a win never claims a loss', () => {
  assert.ok(resultVariants(resolveRound('rock', 'paper')).every((l) => !/you win|point for you|nice one/i.test(l)));
  assert.ok(resultVariants(resolveRound('rock', 'scissors')).every((l) => !/computer wins|point to the computer|not this time/i.test(l)));
});

test('resultLine never repeats the previous variant back to back', () => {
  const r = resolveRound('rock', 'scissors');
  for (let last = 0; last < resultVariants(r).length; last++) {
    for (const rng of [() => 0, () => 0.3, () => 0.6, () => 0.99]) {
      assert.notEqual(resultLine(r, { rng, last }).index, last);
    }
  }
});

test('resultLine covers every variant over the rng range', () => {
  const r = resolveRound('paper', 'paper');
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(resultLine(r, { rng: () => i / 40 }).index);
  assert.equal(seen.size, resultVariants(r).length);
});

test('count prosody climbs toward Shoot and stays in speech-safe ranges', () => {
  assert.equal(COUNT_PROSODY.length, COUNT.length);
  const pitches = COUNT_PROSODY.map((p) => p.pitch);
  assert.deepEqual([...pitches].sort((a, b) => a - b), pitches, 'pitch rises');
  assert.ok(pitches.at(-1) > pitches[0] + 0.2, 'audible rise');
  for (const { pitch, rate } of COUNT_PROSODY) {
    assert.ok(pitch >= 0.5 && pitch <= 2 && rate >= 0.5 && rate <= 2);
  }
});

test('tutorial steps are well-formed', () => {
  assert.ok(TUTORIAL.length >= 6);
  const ids = new Set();
  for (const s of TUTORIAL) {
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
    ids.add(s.id);
    assert.ok(s.say.length > 0 && s.say.length <= 140, `${s.id} length ${s.say.length}`);
    assert.ok(['rest', ...MOVES].includes(s.pose), `${s.id} pose`);
    if (s.cpu) assert.ok(['rest', ...MOVES].includes(s.cpu), `${s.id} cpu`);
    if (s.win) assert.ok(['player', 'cpu'].includes(s.win), `${s.id} win`);
  }
});

test('tutorial teaches all three rules and the goal', () => {
  const text = TUTORIAL.map((s) => s.say).join(' ').toLowerCase();
  for (const phrase of ['rock breaks scissors', 'scissors cut paper', 'paper covers rock', 'tie', 'five']) {
    assert.ok(text.includes(phrase), `missing: ${phrase}`);
  }
});

test('match lines', () => {
  assert.match(matchLine('player'), /You win/);
  assert.match(matchLine('cpu'), /computer/i);
});

test('tutorial rule steps agree with the game engine', () => {
  for (const s of TUTORIAL.filter((t) => t.win)) {
    const r = resolveRound(s.pose, s.cpu);
    assert.equal(r.outcome, s.win === 'player' ? 'win' : 'lose', s.id);
  }
  const tie = TUTORIAL.find((t) => t.id === 'tie');
  assert.equal(resolveRound(tie.pose, tie.cpu).outcome, 'tie');
});

test('exactly one tutorial demo, and it is the count', () => {
  assert.deepEqual(TUTORIAL.filter((t) => t.demo).map((t) => t.demo), ['count']);
});
