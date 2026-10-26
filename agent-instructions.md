# Kids' Choice Games: agent instructions

Read this before changing anything here. The [README](README.md) says what the games are. This file says how to work on them.

Keep it short and in sync: when a change moves something below, update this file in the same commit. History belongs in the code's comments (each change names its ticket: `grep -rn "ticket 412" dress-up/js`) and in git. The long version of this file, with a feature-by-feature code map, is at commit `f356855` (`git show f356855:agent-instructions.md`).

## Who decides

- **The players decide what comes next.** They are Matthew's kids, **M** and **N**; their requests come through Matthew. In anything published, call them M and N only, and credit one only when Matthew said whose it was.
- **Matthew decides releases and design calls.** Ask him when a request is ambiguous. A call he has made is a rule: don't reopen it.
- **The game is the prototype.** Features are tried here first, with real players, then rebuilt as livelits in Hazel. Name things plainly so the Hazel versions can follow.

## Releasing: a push to `main` is a deploy

GitHub Pages serves `main` at http://matthewhammer.org/kids-choice-games/. Release each feature as soon as it works (Matthew, 2026-10-15). Never leave a feature on an unmerged branch.

1. Add a line under `## Unreleased` in [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md), then turn it into `## X.Y.Z (YYYY-MM-DD)`, opening with "Everything in X.Y.Z−1, plus …".
2. Set the same number and date in three more places: `const VERSION` in `dress-up/js/01-state.js` (change it by pattern, not by line number), `dress-up/version.json`, and every `?v=X.Y.Z` in `dress-up/index.html`.
3. Check: `python3 tools/check_script.py dress-up/index.html` and `node tools/check_load.mjs dress-up/index.html`. That is the whole gate. Other checks run after the release.
4. Commit on `main`, tag `dress-up-X.Y.Z`, `git fetch` and rebase, then push `main` **before** the tag.
5. Confirm it is live: fetch `version.json` and a changed file over HTTPS with python's `urllib` (no curl on the laptop) until the new number shows (about a minute).
6. Afterwards, read the speed run the tag starts (`gh run list -R matthewhammer/kids-choice-games -w "Dress Up speed (after a release)"`, or `dress-up/speed.json`). If it says slow or broken, mint a ticket and fix it in the next version.
7. Never undo a released version or rewrite pushed history. If you released from another worktree, fast-forward `~/kids-choice-games` too: http://localhost:8133 serves that copy.

**VERSIONS.md** says what a player sees and does, not the code. Name settings by their on-screen labels, emoji included. Start a fix with **Fixed:** and say what used to go wrong. Write plain sentences: parents and the Hazel team read it too.

## The first rule: 60 frames a second

Matthew, 2026-10-16: "The priority is 60 FPS at all times, for all actions that a game controller does in the scene." The kids play on slow machines (the black laptop, an old iPad).

- A costly background effect becomes optional and off by default: an entry in `PERF_FEATURES`, a `PERF.<id>` flag, a row in ⚙️ Advanced.
- A step of movement calls `moved()` (draw only), never `changed()`. Refreshing the controls and saving happen in `settle()`, a few times a second.
- Never: a mask on anything redrawn every frame; writing an attribute to the value it already has; reading layout inside `draw()`; SMIL animating a CSS property in many copies.
- Find a cost by hiding or freezing one thing at a time, never by guessing. The browser's painting usually costs more than the game's own drawing.
- 🧪 in ⚙️ Advanced measures a computer: its `DATA {...}` line is what compares devices.

## Design rules (Matthew's calls)

- **The bar for a place is the tree house's and the witch's woods'.** Things move, there is light and depth, there are small surprises. Use the shared helpers (`leafyTree`, `pineTree`, `bushSvg`, `grassTuft`, `rockSvg`, `farLayers`), never lollipop trees.
- **Connected views share their settings.** A place seen from elsewhere (a window, a far view, inside and outside) is drawn from that place's own settings, by its own code where possible.
- **A new angle is its own drawing**, never a squashed or skewed copy of another (the top-down friend, lying in the tent). A new view should honour every costume and setting; the game's own sheets show whether it does.
- **Depth.** Everything standing is an object (`obj(name, z, svg)`), and the friend is drawn behind whatever stands nearer than their feet. An object's depth must lie within its own collision box.
- **The wind is outdoors.** Nothing sways indoors without a reason.
- **Nothing scary unless asked for.** Cartoon bodies, no anatomy.
- **Every setting has a visible label with an emoji**, and shows only where it applies (`SHOWN_WHEN`).
- **The settings decide the picture.** Use time only through `picClock()` and chance only through a seed kept in the settings, never `Math.random()` or `performance.now()` in a drawing.
- **Nothing a player made is lost** to a resize or a reorganization.
- **Doorways go somewhere sensible**, with a way back; scenery never promises a place that isn't there.
- **Features over performance work while Matthew is around** (2026-10-17): performance tickets are long runs for later.

## Where things are

| What | Where |
|---|---|
| The game | `dress-up/index.html`, `style.css`, and `dress-up/js/`: about 30 classic scripts run in order, sharing one global scope. Top-level code may use only what earlier parts declare. No build step; it runs from disk. `26-drags-and-start.js` is last. |
| Versions | `dress-up/VERSIONS.md`, tags `dress-up-X.Y.Z` |
| Reports | `dress-up/reports/NNN/` (below) |
| Inventories | `dress-up/OBJECTS.md` (what stands where), `SEATS.md`, `BAKED-IN.md` |
| Live | http://matthewhammer.org/kids-choice-games/dress-up/ |
| Local | http://localhost:8133/dress-up.html (this working copy) |
| Archives | [dress-up-pictures](https://github.com/matthewhammer/dress-up-pictures) and [dress-up-music](https://github.com/matthewhammer/dress-up-music): every version in pictures and sound |
| Licences | Code Apache 2.0, everything else CC BY 4.0, credit "Matthew Hammer and family (M and N)". A new part gets the two-line notice under its `"use strict";`. |

## The code, in brief

- **State.** `DEFAULTS` holds every setting and `state` is the friend. Old saves must still load: a missing field takes its default, and a changed meaning gets an `upgrade…` function. A saved `.json` alone decides the picture.
- **Controls.** `TABS` lists each tab's rows as `[kind, key, label, …]` (`range`, `choice`, `color`, `toggle`, `group`, …). `SHOWN_WHEN["part.key"]` hides a row where it doesn't apply.
- **A new place** is one line in each of: `PLACES`, `PLACE_GROUPS` (exactly one), `SCENES`, `SCENE_FIG`, `SCENE_FAR`, `ARRIVE`, `PLACE_PHRASE`, `SCENE_TUNE`, and the scripting list in `25-scripting.js`. A scene function returns SVG text on a fixed stage (ground at 320); a doorway is `<g class="portal" data-to="…">`.
- **Caching.** Scenes are built from `part(name, inputs, build)` pieces. Pass every input a piece reads, and nothing that changes per frame.
- **Costumes.** `ANIMALS` (suits), `COSTUME_CLOTHES` (what each costume wears as shirt and pants), and per view `TD_GEAR` (from above) and `LIE_GEAR` (asleep) for hats, wings, tails and held things. A new costume adds an entry to each.
- **The world.** `state.world` is a grid of squares (`25-world.js`); crossing kinds (`CROSS_KINDS`) have eight ways. `SMOOTH_KINDS` scroll between squares.
- **Scripting.** 📜 rules run in Hazel by default, with JS and Fumola beside them (`25-scripting.js`, `25-fumola.js`). Anything the game starts while carrying out an event takes a hold (`scriptHold`, `scriptHeld`), so the 🪵 log knows when the event is over.

## The Dress Up reports

A series in `dress-up/reports/NNN/index.html`, one question each, written as the Hazel report series is.

- Call a report `^du_report(N)`. Every report opens with the series line, linked: the series, itself, the date, the game, and the report before it.
- Show the game's own pictures, not mock-ups.
- **Publishing a report means three edits:** the series index (`dress-up/reports/index.html`), the landing page (`hazel/dress-up/reports/index.html` in matthewhammer.github.io), and the nav (`nav/nav.js`). Then run `python3 ~/matthewhammer.github.io/tools/og_previews.py all` for the link previews, push both repositories, and check all three live.
- A draft waits for Matthew's word, unless he asks for a public work-in-progress draft.

## Testing

- **No browser runs on the laptop for long jobs:** it shuts down under load. Run one heavy job at a time. Browser checks run on GitHub: push a branch other than `main`, and `.github/workflows/dress-up-tests.yml` runs the checks in `tools/checks/`.
- **Silence.** Test browsers run muted (`--mute-audio`), and so does the game (🔇) before any click.
- **Without a browser:** load the parts in node as `tools/check_load.mjs` does, call `drawNow()`, and render the SVG with ffmpeg (`ffmpeg -i x.svg x.png`).
- **The safety net for a refactor:** `tools/same_friend.mjs <old page> <new page>` compares the friend byte for byte across every costume and pose, and `sweep.mjs` does the same for every place.
- **A hidden browser pane** runs no `requestAnimationFrame` and stalls Web Animations. Stub them, or finish them by hand, before calling a trip broken.
- **Contact sheets beat screenshots.** Draw every case into one grid and look at it at full size. Give each copied SVG its own ids.
- **Checking a drawing:** does each line end on its shape's outline? Does it follow the room's perspective? Does everything hang from or stand on something? Are layers in depth order? Is anything hidden behind the friend?
- **Old saves:** after changing a setting's meaning, load a save from the last release and compare.

## Working with Matthew

- **Show, then ask:** a picture or the live page before "is this right?".
- **Tickets** are on the Hazel Work Dashboard, under [hazel-work-notes' rules](https://github.com/matthewhammer/hazel-work-notes/blob/main/agent-instructions.md). Mint and queue a ticket for each new request.
- **Time the work** with `date`. Estimates have run about five times too long.
