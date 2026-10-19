// All spoken and captioned copy lives here as data so it can be tested and edited in one place.
// Spoken text avoids punctuation tricks; short sentences keep speech engines from stalling.

export const COUNT = ['Rock.', 'Paper.', 'Scissors.', 'Shoot!'];

// Tutorial steps, spoken in order. Fields:
//   say   the line (also shown as the caption)
//   pose  player hand shape while the line plays ('rest' is the raised fist)
//   cpu   computer hand shape (defaults to 'rest')
//   win   'player' | 'cpu' puts the winner mark under that hand
//   demo  'count' runs a full rock-paper-scissors-shoot pump after the line
export const TUTORIAL = [
  { id: 'two', say: 'Rock paper scissors is played by two people, face to face.', pose: 'rest' },
  { id: 'pump', say: 'Each one raises a fist, and pumps it three times, in time with the words.', pose: 'rest', demo: 'count' },
  { id: 'throw', say: 'On the fourth beat, both players throw a shape at the same time.', pose: 'rock', cpu: 'scissors' },
  { id: 'shape-rock', say: 'Rock is a closed fist.', pose: 'rock' },
  { id: 'shape-paper', say: 'Paper is a flat, open hand.', pose: 'paper' },
  { id: 'shape-scissors', say: 'Scissors is two fingers, like this.', pose: 'scissors' },
  { id: 'rock', say: 'Rock breaks scissors.', pose: 'rock', cpu: 'scissors', win: 'player' },
  { id: 'scissors', say: 'Scissors cut paper.', pose: 'scissors', cpu: 'paper', win: 'player' },
  { id: 'paper', say: 'Paper covers rock.', pose: 'paper', cpu: 'rock', win: 'player' },
  { id: 'tie', say: 'The same shape is a tie. Go again.', pose: 'rock', cpu: 'rock' },
  { id: 'goal', say: 'First to five points wins. Pick a shape, and play.', pose: 'rest' },
];

const VERB = { rock: 'breaks', scissors: 'cut', paper: 'covers' };
const TARGET = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

export function resultLine({ outcome, winner }) {
  if (outcome === 'tie') return 'Tie.';
  const who = outcome === 'win' ? 'You win.' : 'Computer wins.';
  const cap = winner[0].toUpperCase() + winner.slice(1);
  return `${cap} ${VERB[winner]} ${TARGET[winner]}. ${who}`;
}

export function matchLine(winner) {
  return winner === 'player' ? 'Match over. You win the match.' : 'Match over. The computer takes the match.';
}

export const PICK = 'Pick a shape.';
