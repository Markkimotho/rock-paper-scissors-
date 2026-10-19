// Pure game logic. No DOM, no timers, no randomness except through an injected rng.

export const MOVES = ['rock', 'paper', 'scissors'];

// Each move maps to the move it defeats.
const DEFEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export function isMove(m) {
  return MOVES.includes(m);
}

export function beats(a, b) {
  assertMove(a);
  assertMove(b);
  return DEFEATS[a] === b;
}

// Returns { outcome: 'win' | 'lose' | 'tie', winner: move | null, loser: move | null }
// outcome is from the player's point of view.
export function resolveRound(player, cpu) {
  assertMove(player);
  assertMove(cpu);
  if (player === cpu) return { outcome: 'tie', winner: null, loser: null };
  if (beats(player, cpu)) return { outcome: 'win', winner: player, loser: cpu };
  return { outcome: 'lose', winner: cpu, loser: player };
}

export function pickComputerMove(rng = Math.random) {
  const i = Math.floor(rng() * MOVES.length);
  return MOVES[Math.min(i, MOVES.length - 1)];
}

export function createMatch({ target = 5 } = {}) {
  if (!Number.isInteger(target) || target < 1) {
    throw new RangeError('target must be a positive integer');
  }
  const state = { player: 0, cpu: 0, rounds: 0, over: false, winner: null };

  return {
    target,
    state,
    // Plays one round. After the match is over this is a no-op that returns null.
    play(player, cpu) {
      if (state.over) return null;
      const result = resolveRound(player, cpu);
      state.rounds++;
      if (result.outcome === 'win') state.player++;
      if (result.outcome === 'lose') state.cpu++;
      if (state.player >= target) {
        state.over = true;
        state.winner = 'player';
      } else if (state.cpu >= target) {
        state.over = true;
        state.winner = 'cpu';
      }
      return { ...result, player: state.player, cpu: state.cpu, over: state.over, matchWinner: state.winner };
    },
    reset() {
      state.player = 0;
      state.cpu = 0;
      state.rounds = 0;
      state.over = false;
      state.winner = null;
    },
  };
}

function assertMove(m) {
  if (!isMove(m)) throw new TypeError(`invalid move: ${String(m)}`);
}
