// Hand glyphs as SVG markup. Local space: wrist at (0,0), hand extends up (negative y), 2px ink strokes,
// paper-colored fill so overlapping shapes occlude each other. Poses are toggled with CSS, not morphed.

const FINGER = (cx, base, h, angle = 0) =>
  `<path transform="translate(${cx} ${base}) rotate(${angle})" d="M-7.5 0V${-(h - 7.5)}a7.5 7.5 0 0 1 15 0V0"/>`;

const THUMB_FIST = '<rect x="-10" y="-30" width="46" height="20" rx="10"/>';

const POSES = {
  rock: `
    <rect x="-34" y="-68" width="68" height="68" rx="20"/>
    <path d="M-34 -48H-14M-34 -32H-14M-34 -16H-14"/>
    ${THUMB_FIST}`,

  paper: `
    ${[-34, -16.5, 1, 18.5].map((x, i) => FINGER(x + 7.5, -56, [58, 70, 74, 62][i])).join('')}
    <path d="M-34 -56V-14a14 14 0 0 0 14 14H20a14 14 0 0 0 14 -14V-56"/>
    <rect x="-66" y="-46" width="40" height="16" rx="8" transform="rotate(-28 -30 -38)"/>`,

  scissors: `
    ${FINGER(-12, -48, 78, -13)}
    ${FINGER(12, -48, 84, 11)}
    <rect x="-34" y="-52" width="68" height="52" rx="18"/>
    <rect x="-8" y="-30" width="44" height="18" rx="9"/>`,
};

// Forearm and cuff, shared by every pose.
const SLEEVE = '<path d="M-26 0L-29 34M26 0L29 34M-36 34H36"/>';

export function handMarkup() {
  const poses = Object.entries(POSES)
    .map(([name, body]) => `<g class="pose ${name}">${body}</g>`)
    .join('');
  return `<g class="bob"><g class="sleeve">${SLEEVE}</g>${poses}</g>`;
}

// 'rest' is the raised fist.
export function poseClass(pose) {
  return pose === 'rest' ? 'rock' : pose;
}
