# Rock Paper Scissors

Rock paper scissors the way it is played in person: both fists pump three times to the count, then you throw. A voice-over teaches the rules on first run and calls every round.

First to 5 wins the match.

## Play

```bash
git clone https://github.com/Markkimotho/rock-paper-scissors-.git
cd rock-paper-scissors-
npm run serve        # http://localhost:5501
```

ES modules need a server, so opening `index.html` directly from disk will not work. Live Server in VS Code (port 5501) also works.

| Input | Action |
| --- | --- |
| click a word, or `r` `p` `s` | pick rock, paper, scissors |
| `enter` / `space` | begin, or play again after a match |
| `m` | sound on/off |
| `esc` | skip the walkthrough |
| "how to play" | replay the walkthrough |

## How a round runs

1. You pick. The pick locks.
2. Both fists pump on beats 1, 2, 3 (560 ms apart). The voice says "Rock. Paper. Scissors." on those beats.
3. On beat 4 ("Shoot!") both hands snap to their shapes. The winner gets a vermilion line, the loser fades.
4. The voice reads the verdict, for example "Paper covers rock. You win."

Words are fired from the beat clock and never awaited, so a slow speech engine cannot drift the animation. With sound off, captions carry the same text. With `prefers-reduced-motion`, the fists stop bobbing and the dot still marks the beat.

## Layout

```
index.html            shell and SVG stage
style.css             tokens, layout, no images
src/game.js           pure rules and match state (no DOM)
src/lines.js          every spoken/captioned line, as data
src/voice.js          Web Speech API wrapper, voice ranking, no-op when unsupported
src/stage.js          beat timeline (clock-agnostic, injectable)
src/hands.js          SVG hand glyphs
src/main.js           DOM wiring and state machine
tests/                gate tests (node:test, no dependencies)
evals/                browser eval and dev screenshot helpers (playwright-core)
.githooks/pre-commit  runs the gate tests
```

## Tests and evals

```bash
npm test                      # gate: 35 tests, under a second
git config core.hooksPath .githooks   # once per clone, runs tests on commit
npm install && npm run eval   # periodic: 20 rounds in headless Chromium
ROUNDS=6 npm run eval         # quick smoke
```

The eval uses a fake `speechSynthesis` and checks, per round: throw lands at 3 beats (1680 ms, plus or minus 150), the four count words are spoken 560 ms apart (plus or minus 80), the result line matches the rules, no console errors, and mashing keys mid-round plays exactly one round. It also runs the first-run walkthrough and checks every line is spoken in order. Pass threshold is every check on every round. Output goes to `evals/out/` (git-ignored).

`playwright-core` is pinned to 1.49.1 to match the Chromium build in the local Playwright cache. If you have a different cache, run `npx playwright-core install chromium` after changing the pin.

## Voice-over notes

Uses the browser's `speechSynthesis`: no API, no key, no audio files. `voice.js` ranks installed voices: English only, on-device before network, en-GB/en-US first, names containing premium/enhanced/natural/neural get a bump. Quality depends on the voices installed on the OS. Speech only starts after the first tap because browsers block it before a user gesture.

Built as part of the [Odin Project](https://www.theodinproject.com/lessons/foundations-rock-paper-scissors) foundations course.
