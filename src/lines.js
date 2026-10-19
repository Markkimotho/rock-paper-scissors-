// All spoken and captioned copy lives here as data so it can be tested and edited in one place.
// Spoken text avoids punctuation tricks; short sentences keep speech engines from stalling.

export const COUNT = ['Rock.', 'Paper.', 'Scissors.', 'Shoot!'];

// Delivery per count word. Pitch climbs and "Shoot!" is quicker and higher, like a person
// building to the throw. Flat pitch and rate is what makes speech synthesis sound robotic.
export const COUNT_PROSODY = [
  { pitch: 0.92, rate: 0.95 },
  { pitch: 1.0, rate: 1.0 },
  { pitch: 1.08, rate: 1.0 },
  { pitch: 1.28, rate: 1.12 },
];

// Tutorial steps, spoken in order. Fields:
//   say   the line (also shown as the caption)
//   pose  player hand shape while the line plays ('rest' is the raised fist)
//   cpu   computer hand shape (defaults to 'rest')
//   win   'player' | 'cpu' puts the winner mark under that hand
//   demo  'count' runs a full rock-paper-scissors-shoot pump after the line
export const TUTORIAL = [
  { id: 'two', say: "Okay, here's how it works. Rock paper scissors is a game for two people, face to face.", pose: 'rest' },
  { id: 'pump', say: 'You each raise a fist, and pump it three times, in time with the words. Watch.', pose: 'rest', demo: 'count' },
  { id: 'throw', say: 'Then, on the fourth beat, you both throw a shape, at the same time.', pose: 'rock', cpu: 'scissors' },
  { id: 'shape-rock', say: 'Rock is a closed fist.', pose: 'rock' },
  { id: 'shape-paper', say: 'Paper is a flat, open hand.', pose: 'paper' },
  { id: 'shape-scissors', say: 'And scissors is two fingers, like this.', pose: 'scissors' },
  { id: 'rock', say: 'Rock breaks scissors.', pose: 'rock', cpu: 'scissors', win: 'player' },
  { id: 'scissors', say: 'Scissors cut paper.', pose: 'scissors', cpu: 'paper', win: 'player' },
  { id: 'paper', say: 'And paper covers rock.', pose: 'paper', cpu: 'rock', win: 'player' },
  { id: 'tie', say: "If you both throw the same shape, it's a tie. Just go again.", pose: 'rock', cpu: 'rock' },
  { id: 'goal', say: 'First to five points wins. Ready? Pick a shape.', pose: 'rest' },
];

const VERB = { rock: 'breaks', scissors: 'cut', paper: 'covers' };
const TARGET = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

// Several ways to say each verdict so a long match does not repeat itself.
// Every non-tie variant still states the rule, so the line teaches while it announces.
const WIN = [
  (r) => `${r} You win!`,
  (r) => `${r} Nice one.`,
  (r) => `Yes! ${r}`,
  (r) => `${r} That's a point for you.`,
];
const LOSE = [
  (r) => `${r} Computer wins.`,
  (r) => `Ooh. ${r} Point to the computer.`,
  (r) => `${r} Not this time.`,
  (r) => `Ah. ${r}`,
];
const TIE = ['Tie.', 'Same shape. Again.', 'Tie. Go again.', 'Mirror match. Again.'];

const cap = (w) => w[0].toUpperCase() + w.slice(1);
const rule = (w) => `${cap(w)} ${VERB[w]} ${TARGET[w]}.`;

export function resultVariants({ outcome, winner }) {
  if (outcome === 'tie') return TIE.slice();
  return (outcome === 'win' ? WIN : LOSE).map((f) => f(rule(winner)));
}

// `last` is the index used last time for this outcome (or -1); the same variant never repeats back to back.
// Returns { line, index }.
export function resultLine(result, { rng = Math.random, last = -1 } = {}) {
  const all = resultVariants(result);
  let i = Math.min(Math.floor(rng() * all.length), all.length - 1);
  if (all.length > 1 && i === last) i = (i + 1) % all.length;
  return { line: all[i], index: i };
}

export function matchLine(winner) {
  return winner === 'player' ? 'Match over. You win the match.' : 'Match over. The computer takes the match.';
}

export const PICK = 'Pick a shape.';
