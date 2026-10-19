// Hand sprites. The three PNGs are 200x200, black outline on transparent, drawn facing different ways,
// so each pose gets its own transform to make them all face inward from the player's (left) side.
// The computer side is the same markup mirrored by its parent group.
// Local space: image is centered on x=0 and sits on the wrist anchor at y=0.

export const ASSETS = {
  rock: 'assets/rock.png',
  paper: 'assets/paper.png',
  scissors: 'assets/scissors.png',
};

// All three sprites natively face right (paper is upright). Each pose is first translated so the
// sprite's measured visual centroid (alpha > 40) lands on the shared anchor (0,-85), then rotated about
// that anchor. Same anchor for every pose means a pose swap changes shape, not position.
//   centroid px: rock (104.6, 97.7)  paper (104.1, 94.9)  scissors (102.5, 92.7)
export const POSE_TRANSFORM = {
  rock: 'rotate(-4 0 -85) translate(-4.6 2.3)',
  paper: 'rotate(8 0 -85) translate(-4.1 5.1)',
  scissors: 'rotate(-10 0 -85) translate(-2.5 7.3)',
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
