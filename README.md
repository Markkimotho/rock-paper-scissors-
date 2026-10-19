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

| Input                              | Action                             |
| ---------------------------------- | ---------------------------------- |
| click a word, or `r` `p` `s` | pick rock, paper, scissors         |
| `enter` / `space`              | begin, or play again after a match |
| `m`                              | sound on/off                       |
| `esc`                            | skip the walkthrough               |
| "how to play"                      | replay the walkthrough             |

## How a round runs

1. You pick. The pick locks.
2. Both fists pump on beats 1, 2, 3 (560 ms apart). The voice says "Rock. Paper. Scissors." on those beats.
3. On beat 4 ("Shoot!") both hands snap to their shapes. The winner gets a vermilion line, the loser fades.
4. The voice reads the verdict, for example "Paper covers rock. You win."

Words are fired from the beat clock and never awaited, so a slow speech engine cannot drift the animation. With sound off, captions carry the same text. With `prefers-reduced-motion`, the fists stop bobbing and the dot still marks the beat.

## Layout

```
index.html            shell and SVG stage
style.css             tokens, layout
src/game.js           pure rules and match state (no DOM)
src/lines.js          every spoken/captioned line, as data
src/voice.js          Web Speech API wrapper, voice ranking, no-op when unsupported
src/stage.js          beat timeline (clock-agnostic, injectable)
src/hands.js          PNG hand sprites and per-pose transforms
assets/               rock.png, paper.png, scissors.png
src/main.js           DOM wiring and state machine
tests/                gate tests (node:test, no dependencies)
evals/                browser eval and dev screenshot helpers (playwright-core)
.githooks/pre-commit  runs the gate tests
```

## Tests and evals

```bash
npm test                      # gate: 53 tests, under a second
git config core.hooksPath .githooks   # once per clone, runs tests on commit
npm install && npm run eval   # periodic: 20 rounds in headless Chromium
ROUNDS=6 npm run eval         # quick smoke
```

The eval uses a fake `speechSynthesis` and checks, per round: throw lands at 3 beats (1680 ms, plus or minus 150), the four count words are spoken 560 ms apart (plus or minus 80), the result line matches the rules, no console errors, and mashing keys mid-round plays exactly one round. It also checks the layout stays centered at 1920, 2560 and 3440 px wide, and runs the first-run walkthrough and checks every line is spoken in order. Pass threshold is every check on every round. Output goes to `evals/out/` (git-ignored).

`playwright-core` is pinned to 1.49.1 to match the Chromium build in the local Playwright cache. If you have a different cache, run `npx playwright-core install chromium` after changing the pin.

## Voice-over notes

Uses the browser's `speechSynthesis`: no API, no key, no audio files. Three things keep it from sounding robotic:

- **Voice choice.** `voice.js` never picks novelty or legacy voices (Albert, Fred, Bells, Zarvox and friends), and prefers premium/enhanced/natural/neural voices, then known-good ones (Samantha, Ava, Daniel, Karen...). The "voice:" link in the header cycles the best few installed voices and remembers your pick.
- **Delivery.** The count rises in pitch and "Shoot!" is quicker and higher (`COUNT_PROSODY` in `src/lines.js`). Verdicts are warmer on a win and lower on a loss.
- **Variety.** Each verdict has several phrasings and never repeats the same one twice in a row, so a long match does not loop.

For the most natural sound, install a Premium or Enhanced voice (macOS: System Settings, Accessibility, Spoken Content, System Voice, Manage Voices) and pick it with the header link. Speech only starts after the first tap because browsers block it before a user gesture.

## Motion notes

The hands are the original PNGs, animated per hand so nothing moves in lockstep: each pump has an anticipation lift, a hit with squash, and a wrist swing. Every beat hits harder than the last, the computer lags a few milliseconds and swings a little differently, the throw pops in and overshoots, the winner hops, and idle hands drift slowly. The beat clock itself stays exact, so the voice and the eval timing do not move.

Built and Scaled as part of the [Odin Project](https://www.theodinproject.com/lessons/foundations-rock-paper-scissors) foundations course.
