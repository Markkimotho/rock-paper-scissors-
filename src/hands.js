// Hand sprites. The three PNGs are 200x200, black outline on transparent, drawn facing different ways,
// so each pose gets its own transform to make them all face inward from the player's (left) side.
// The computer side is the same markup mirrored by its parent group.
// Local space: image is centered on x=0 and sits on the wrist anchor at y=0.

export const ASSETS = {
  rock: 'assets/rock.png',
  paper: 'assets/paper.png',
  scissors: 'assets/scissors.png',
};

// rock.png faces left and scissors.png faces right natively; paper.png is upright.
const POSE_TRANSFORM = {
  rock: 'scale(-1 1) rotate(-8 0 -85)',
  paper: 'rotate(8 0 -85)',
  scissors: 'rotate(-14 0 -85)',
};

export function handMarkup() {
  const poses = Object.entries(ASSETS)
    .map(
      ([name, href]) =>
        `<g class="pose ${name}"><image href="${href}" x="-100" y="-185" width="200" height="200" transform="${POSE_TRANSFORM[name]}"/></g>`,
    )
    .join('');
  return `<g class="float"><g class="bob">${poses}</g></g>`;
}

// 'rest' is the raised fist.
export function poseClass(pose) {
  return pose === 'rest' ? 'rock' : pose;
}
