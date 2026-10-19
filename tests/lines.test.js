import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, resolveRound } from '../src/game.js';
import { COUNT, TUTORIAL, resultLine, matchLine } from '../src/lines.js';

test('count words are rock, paper, scissors, shoot', () => {
  assert.deepEqual(COUNT, ['Rock.', 'Paper.', 'Scissors.', 'Shoot!']);
});

test('every matchup has a non-empty result line, and the winner is named', () => {
  for (const p of MOVES) {
    for (const c of MOVES) {
      const r = resolveRound(p, c);
      const line = resultLine(r);
      assert.ok(line.length > 0 && line.length <= 120, line);
      if (r.outcome === 'tie') assert.equal(line, 'Tie.');
      else {
        assert.match(line, new RegExp(`^${r.winner[0].toUpperCase()}${r.winner.slice(1)} `));
        assert.match(line, r.outcome === 'win' ? /You win\.$/ : /Computer wins\.$/);
      }
    }
  }
});

test('result lines state the true rule', () => {
  assert.equal(resultLine(resolveRound('rock', 'scissors')), 'Rock breaks scissors. You win.');
  assert.equal(resultLine(resolveRound('scissors', 'paper')), 'Scissors cut paper. You win.');
  assert.equal(resultLine(resolveRound('paper', 'rock')), 'Paper covers rock. You win.');
  assert.equal(resultLine(resolveRound('rock', 'paper')), 'Paper covers rock. Computer wins.');
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
