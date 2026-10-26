# Kids' Choice Games: agent checklist

**Read [^du_report(22), How Dress Up Is Made](https://matthewhammer.org/kids-choice-games/dress-up/reports/022/) before this file.** It is the game's public, human-facing instructions, for people and agents alike: who decides, how a change reaches the kids, the rules and why, the code in one page. This file is the checklist that goes with it: exact steps and names. (Its source is `dress-up/reports/022/index.html`, in this repository.)

Keep both in sync with the code, in the same commit: a rule or a step that changes is changed in the report and here. History is in the code's comments, by ticket (`grep -rn "ticket 412" dress-up/js`). The long, old version of this file is at commit `f356855`.

## Release ([why](https://matthewhammer.org/kids-choice-games/dress-up/reports/022/#release))

A push to `main` is a deploy. Release each feature as soon as it works; never leave one on an unmerged branch.

1. `dress-up/VERSIONS.md`: turn `## Unreleased` into `## X.Y.Z (YYYY-MM-DD)`, opening "Everything in X.Y.Z−1, plus …". Write for a player, with the buttons' labels; a fix starts **Fixed:**.
2. The same number and date in `const VERSION` (`dress-up/js/01-state.js`, by pattern), `dress-up/version.json`, and every `?v=` in `dress-up/index.html`.
3. `python3 tools/check_script.py dress-up/index.html` and `node tools/check_load.mjs dress-up/index.html`.
4. Commit on `main`, tag `dress-up-X.Y.Z`, fetch and rebase, push `main`, then the tag.
5. Check the live `version.json` and a changed file with python's `urllib` (no curl here).
6. Read the speed run's result (`dress-up/speed.json`); if it is slow or broken, mint a ticket.
7. Released from another worktree? Fast-forward `~/kids-choice-games` too: http://localhost:8133 serves it.

## In the code ([why](https://matthewhammer.org/kids-choice-games/dress-up/reports/022/#code))

- **60 fps:** moving calls `moved()`, not `changed()`. No masks on what redraws each frame, no rewriting an unchanged attribute, no layout reads in `draw()`, no SMIL on CSS properties in many copies. A costly effect goes in `PERF_FEATURES`, off by default.
- **Pictures are deterministic:** time only via `picClock()`, chance only via a seed in the settings.
- **A new place:** `PLACES`, `PLACE_GROUPS`, `SCENES`, `SCENE_FIG`, `SCENE_FAR`, `ARRIVE`, `PLACE_PHRASE`, `SCENE_TUNE`, the kinds list in `25-scripting.js`.
- **A new costume:** `COSTUME_CLOTHES` (or `ANIMALS`), `TD_GEAR` (from above), `LIE_GEAR` (asleep).
- **Settings:** a row in `TABS`, a rule in `SHOWN_WHEN`, a default in `DEFAULTS`; an old save must still load (`upgrade…`).
- **Caching:** `part(name, inputs, build)` gets every input it reads and nothing per-frame.
- **Depth:** standing things are `obj(name, z, svg)`; the depth lies within the thing's collision box.
- **Script events:** what the game starts for an event takes `scriptHold`/`scriptHeld` and gives it back when done.
- **A new part file:** the two-line licence notice under `"use strict";`.

## Reports ([why](https://matthewhammer.org/kids-choice-games/dress-up/reports/022/#where))

`dress-up/reports/NNN/index.html`, called `^du_report(N)`, opening with the linked series line. Publishing is three edits: the series index, `hazel/dress-up/reports/index.html` and `nav/nav.js` in matthewhammer.github.io. Then `python3 ~/matthewhammer.github.io/tools/og_previews.py all`, push both repositories, and check all three live.

## Testing traps ([why](https://matthewhammer.org/kids-choice-games/dress-up/reports/022/#checks))

- The laptop shuts down under load: one heavy job at a time; browser checks on GitHub (`.github/workflows/dress-up-tests.yml`, checks in `tools/checks/`).
- Test browsers muted (`--mute-audio`); the game muted (🔇) before any click.
- A hidden browser pane runs no `requestAnimationFrame` and stalls Web Animations: stub or finish them before calling a trip broken.
- Copied SVGs in one page need their own ids. A regex in an injected template string needs doubled backslashes.
- Without a browser: load the parts in node as `check_load.mjs` does, call `drawNow()`, render with `ffmpeg -i x.svg x.png`. Refactors: `tools/same_friend.mjs` compares the friend byte for byte.

## Working with Matthew

Mint and queue a ticket on the Hazel Work Dashboard for every ask ([its rules](https://github.com/matthewhammer/hazel-work-notes/blob/main/agent-instructions.md)). Show a picture before asking "is this right?". Call the kids M and N only.
