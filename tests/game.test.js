import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, beats, resolveRound, pickComputerMove, createMatch } from '../src/game.js';

const EXPECTED = {
  'rock,rock': 'tie',
  'rock,paper': 'lose',
  'rock,scissors': 'win',
  'paper,rock': 'win',
  'paper,paper': 'tie',
  'paper,scissors': 'lose',
  'scissors,rock': 'lose',
  'scissors,paper': 'win',
  'scissors,scissors': 'tie',
};

test('all 9 matchups resolve correctly', () => {
  for (const p of MOVES) {
    for (const c of MOVES) {
      assert.equal(resolveRound(p, c).outcome, EXPECTED[`${p},${c}`], `${p} vs ${c}`);
    }
  }
});

test('winner and loser fields line up with the outcome', () => {
  assert.deepEqual(resolveRound('rock', 'scissors'), { outcome: 'win', winner: 'rock', loser: 'scissors' });
  assert.deepEqual(resolveRound('rock', 'paper'), { outcome: 'lose', winner: 'paper', loser: 'rock' });
  assert.deepEqual(resolveRound('paper', 'paper'), { outcome: 'tie', winner: null, loser: null });
});

test('beats is antisymmetric and irreflexive', () => {
  for (const a of MOVES) {
    assert.equal(beats(a, a), false);
    for (const b of MOVES) if (a !== b) assert.notEqual(beats(a, b), beats(b, a));
  }
});

test('invalid moves throw', () => {
  assert.throws(() => resolveRound('lizard', 'rock'), TypeError);
  assert.throws(() => resolveRound('rock', undefined), TypeError);
  assert.throws(() => beats('', 'rock'), TypeError);
});

test('pickComputerMove covers all moves and never overflows at rng=0.9999', () => {
  assert.equal(pickComputerMove(() => 0), 'rock');
  assert.equal(pickComputerMove(() => 0.4), 'paper');
  assert.equal(pickComputerMove(() => 0.9999), 'scissors');
  assert.equal(pickComputerMove(() => 1), 'scissors'); // defensive clamp
  const seen = new Set();
  let i = 0;
  const seq = [0.1, 0.5, 0.9];
  for (let n = 0; n < 3; n++) seen.add(pickComputerMove(() => seq[i++]));
  assert.equal(seen.size, 3);
});

test('ties do not score', () => {
  const m = createMatch();
  const r = m.play('rock', 'rock');
  assert.equal(r.outcome, 'tie');
  assert.equal(m.state.player, 0);
  assert.equal(m.state.cpu, 0);
  assert.equal(m.state.rounds, 1);
});

test('player reaching 5 ends the match and further play is ignored', () => {
  const m = createMatch();
  let last;
  for (let i = 0; i < 5; i++) last = m.play('rock', 'scissors');
  assert.equal(last.over, true);
  assert.equal(last.matchWinner, 'player');
  assert.equal(m.state.player, 5);
  assert.equal(m.play('rock', 'scissors'), null);
  assert.equal(m.state.player, 5);
  assert.equal(m.state.rounds, 5);
});

test('computer reaching 5 ends the match', () => {
  const m = createMatch();
  for (let i = 0; i < 4; i++) m.play('rock', 'paper');
  assert.equal(m.state.over, false);
  const last = m.play('rock', 'paper');
  assert.equal(last.matchWinner, 'cpu');
});

test('match is not over at 4-4', () => {
  const m = createMatch();
  for (let i = 0; i < 4; i++) {
    m.play('rock', 'scissors');
    m.play('rock', 'paper');
  }
  assert.equal(m.state.over, false);
  assert.equal(m.state.player, 4);
  assert.equal(m.state.cpu, 4);
});

test('reset clears everything', () => {
  const m = createMatch();
  for (let i = 0; i < 5; i++) m.play('paper', 'rock');
  m.reset();
  assert.deepEqual(m.state, { player: 0, cpu: 0, rounds: 0, over: false, winner: null });
  assert.notEqual(m.play('paper', 'rock'), null);
});

test('custom target and invalid target', () => {
  const m = createMatch({ target: 2 });
  m.play('rock', 'scissors');
  assert.equal(m.play('rock', 'scissors').over, true);
  assert.throws(() => createMatch({ target: 0 }), RangeError);
  assert.throws(() => createMatch({ target: 2.5 }), RangeError);
});
