# Kids' Choice Games: agent instructions

> **DRAFT for Matthew to read** (2026-10-15, ^ticket(95)). It is committed locally and has not been pushed. This repository is public, so nothing here goes live until he has read it and says to push.

Read this before changing anything in this repository. The [README](README.md) says what the games are and why they exist. This file covers how to work on them: who decides what, how a change goes live, how the code is laid out, and how to test without disturbing anyone.

**Keep this file in sync as you go.** The games are where Hazel features are prototyped: in plain HTML and JavaScript, for the best-case UX, with as little friction as possible between an idea and something the kids can play. So the prototype's shape keeps changing, and so does how we work on it. When a change moves something this file describes (a registry, a control kind, a castle setting, a release step, a rule Matthew states, a testing trick that turns out to matter), update this file in the same commit. Treat the code map below as a snapshot: check that a name still exists before relying on it, and fix this file when it doesn't.

## Who decides

- **The players decide what comes next.** The players are Matthew's kids, **M** (his daughter) and **N** (his son). Their requests reach you through Matthew. In anything published (commits, VERSIONS.md, the README, issues), call them M and N and nothing else. Credit a request to one of them only when Matthew said whose it was. A castle can belong to someone else too (D's castle); use the letter he uses.
- **Matthew decides releases and design calls.** When a request is ambiguous, ask him. A call he has made is a rule (see below); don't reopen it.
- **The game is the prototype.** The game is played first, by real players, to find the best UX when nothing stands in the way. Its features are then rebuilt as user-defined livelits in Hazel (the Livelit Playground slides), and the gap between the two is what the Hazel work closes. So name things plainly and keep features recognizable: the Hazel versions follow the game's options, names and layering. A new idea, with no player experience yet, goes into the game first.

## Going live: push = deploy

The repository's own GitHub Pages site serves `main` at http://matthewhammer.org/kids-choice-games/. **A push to `main` is a deploy** of a public game that the kids, and anyone else, play.

1. **Commit each change locally**, and add a line for it under `## Unreleased` at the top of [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md).
2. **Don't bump the version, and don't push, until Matthew says so in his current message.** An earlier "when you can" is not enough. A version is a tested bundle of changes, about one a day, not one per change. If a push is refused, don't work around it. Give him the one-line command instead: `git -C ~/kids-choice-games push origin HEAD dress-up-X.Y.Z`.
3. **To release:**
   - Turn `## Unreleased` into `## X.Y.Z (YYYY-MM-DD)`. Open it with a one-line summary ("Everything in X.Y.Z−1, plus …").
   - Commit, and tag `dress-up-X.Y.Z`.
   - Before pushing, extract the page's `<script>` and run `node --check` on it. A duplicate `const` once broke the whole page.
   - Push the branch and the tag.
4. **After the push:**
   - Run `git fetch` and `git ls-remote` to confirm `main` moved. One push looked done but never landed.
   - Watch the Pages run (`gh run list -R matthewhammer/kids-choice-games`). It takes about two minutes.
   - Load the live page in a fresh browser profile, and check for a string that only the new version has.
5. **Never undo a released version**, and never rewrite history that has been pushed.

### How VERSIONS.md is written

- Each entry describes what a player sees and does, not the code.
- Name settings by their on-screen labels, emoji included, in quotes ("🚪 doors in its walls").
- Each version lists everything since the last one. A fix starts with **Fixed:** and says what used to go wrong.
- Write plain full sentences. Readers include the kids' parents and the Hazel team.

## Design rules (Matthew's calls)

- **The bar for a scene is the tree house's and the witch's woods' level of detail.** A new place is a place, not a backdrop: things move (smoke, water, flames, swaying), it has light and depth, and it has small surprises.
- **Use the shared organic helpers, never lollipop trees:** `leafyTree`, `pineTree`, `bushSvg`, `grassTuft`, `rockSvg` (built on the tree house's pads), plus `snowCap`, `sunbeamsSvg` and `starsSvg`.
- **Connected views share their settings.** A place seen from somewhere else must be drawn from that place's own settings, and where possible by its own drawing code. Examples: a far tree house, a picture on a wall, a window's view, a hut seen from inside and from outside, the cave and the waterfall it hides behind. Otherwise, as Matthew put it, the illusion of being connected is broken, for a kid or for an adult using their imagination. Check by comparing the drawings, not by eye.
- **Cartoon bodies:** plain skin shapes, no anatomy.
- **Nothing scary unless asked for.** Skeletons are off by default (one slider per dungeon room, starting at 0), because M found them scary.
- **Every setting has a visible label with an emoji.** A choice that names a place or room shows that place's own emoji, so the same thing looks the same everywhere.
- **Settings appear only where they apply.** Use `SHOWN_WHEN`, or a group's "here" test. Inside a castle room, only that room's settings show.
- **Doorways go somewhere sensible.** Every way out of a place is a doorway (`class="portal"`) that leads somewhere, with a way back. A picture is one doorway as a whole: the doorways painted inside it are made inert.

## Where things are

| What | Where |
|---|---|
| The game | [`dress-up/index.html`](dress-up/index.html): one file holding all the HTML, CSS and JavaScript, about 9,700 lines. No build step and no dependencies. It also plays from disk. |
| Its versions | [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md), newest first, with tags `dress-up-X.Y.Z`. |
| Live | http://matthewhammer.org/kids-choice-games/dress-up/ (Pages, from `main` at `/`, with `.nojekyll`). |
| Local | Any static server over `dress-up/`. On Matthew's laptop, http://localhost:8133/dress-up.html serves this working copy through a symlink. The kids test there before a release, so whatever you commit locally is what they play. |
| Saved state | `localStorage["dress-up-v1"]` holds the whole `state`. Save writes PNG, SVG and JSON (`{app: "dress-up", version: 1, state}`), and Load reads the JSON back. |

## The code, by section

The file reads top to bottom: settings and defaults, then the friend (face, hair, body, costumes), then scenes, then music, then the controls.

**State and old saves.**
- `DEFAULTS` holds every part's settings, and `state` is the friend being made.
- A save made by an older version must still load: missing fields take their defaults.
- When a setting's meaning changes, an `upgrade…` function converts old saves (see `upgradeFace`, `upgradeHands`, `upgradeFeet`, `upgradeInside` and `upgradeFigSize`). Never break a saved friend.

**Controls.** `TABS` lists each tab's controls as rows `[kind, key, label, …]`, where the key is the setting's name in that part.

| Kind | What it is |
|---|---|
| `range` | `min, max, everyday min, everyday max`. Surprise me stays inside the everyday range. |
| `choice` | Options `[value, text, ok?]`. `text` may be a function of the part's settings; `ok(b)` hides an option that doesn't apply. |
| `color`, `toggle`, `turn`, `flip`, `pair` | A color; an on/off; an angle; one chip that names which way it is and turns over on a tap; and two choices placed as the friend's hands are. |
| `group` | `[ "group", key, title, rows, here? ]`: a dashed box of controls, shown only where `here(b)` holds. |
| `castlejump` | The "🚶 go straight to" chips: the castle and each of its rooms. |
| `of` | Shows another tab's control here, for example the ghost's see-through-ness. |
| `master` | The full-body slider, which sets every part at once. |
| `tunes`, `mixer`, `transport`, `note`, `every`, `nudge`, `places`, `place`, `pad`, `action` | The music tab and other one-off controls. |

`SHOWN_WHEN["part.key"]` hides a control unless its part's settings call for it. Each range and turn control can be pinned to the HUD.

**Scenes.** To add a place, add one line in each of these:
- `PLACES`: its value and its label with an emoji;
- `PLACE_GROUPS`: exactly one kind (an assertion checks this);
- `SCENES`: its scene function;
- `SCENE_FIG`: the friend's size there;
- `ARRIVE`: where the friend lands;
- `PLACE_PHRASE`: the caption's words, such as "in the 🌲 forest" or "at the 🏕️ camp site";
- `SCENE_TUNE`, if it has its own music.

A scene function returns SVG text and draws on the fixed stage (`SCENE`, ground at 320). Doorways are `<g class="portal" data-to="place">`. `flyInto` animates the trip, and the back chip undoes it.

**Fast redraws.** A drag must stay smooth, so scenes are cached by piece:
- `part(name, inputs, build)` caches a piece by its name and inputs. Pass every input the drawing reads, and nothing it doesn't, or the cache goes stale.
- `partByReads(name, opts, build)` records which settings a piece read, and caches on just those.
- `SEP`, `OPEN` and `CLOSE` mark pieces in the scene text. `mountScene` then keeps each piece's element while its text is unchanged.
- Anything that varies per frame must not end up in a piece's text, or every frame re-parses it. Animation is SMIL or CSS, begun at a rounded phase.

**Castles.**
- `castleOf(o)` reads one castle's settings (N's, M's or D's) into a model:
  - `rooms`, by number (up to six, each a style from `ROOM_STYLES`);
  - `hall[n]`, each hallway's doors and its stairs' end;
  - its color themes, A (the castle's own) and `themeB`;
  - `roomTheme[n]`, which theme each room takes;
  - its carpet and roof.
- Settings keys end with the castle's letter, such as `castleRoom3N` or `castleHallDoor2_1M`.
- `castleroomScene` draws a room by its style, in its theme, and `castleWays` adds its exits. A hallway's and a king's room's side doors are drawn in perspective by `hallSideDoor`.
- **To add a room style:**
  - add it to `ROOM_STYLES` with its emoji;
  - add its drawing to the `draw` table in `castleroomScene`;
  - give it exits: add it to `SIDE_DOOR_ROOMS` for doors in its side walls and a sign out toward us, set per room like the king's room's (it then takes a color theme too), or give it its own branch in `castleWays`;
  - add any settings of its own to the room's group in `TABS`, shown only for that style;
  - pass its inputs to its `part(…)` key. Something with many settings of its own, such as the cat room's cats, gets a `part` of its own, so its settings redraw only it.
- **The cat room's cats** belong to the castle, not to a room (`castleOf(o).cats`, keys `castleCat<j><What><id>`), so a castle with two cat rooms shows the same cats in both. Their places are `CAT_SPOTS`, laid out in `catRoomPlaces`. They are drawn back to front with the rope bridge among them, so depth comes out right.

**Music.** The music is a Web Audio sequencer inside the page:
- tunes are written as text (MIDI note numbers, sections, drum patterns);
- about 30 instruments are synthesized in the page;
- the mixing board sets each part's level, echo, room, pan and so on;
- LFOs A to D (`LFO_BEATS`, from 1/32 beat to 32 beats) drive both sounds and pictures: fading parts, fairy wings, the fairy house;
- LFOs belong to the scene's tune. A place without a tune uses the defaults. Write mixer settings through `chan(id, key)`.
- **A scene that follows an LFO must read it through its options**, as `o["lfo:A"]` (see `sceneOpts`). Scenes are cached by the background settings they read (`partByReads`), and the mixer's LFOs are not background settings. Without that read, a change on the mixing board never reaches the scene. The fairy house had this bug until the cat room's release.
- **Everything that moves with an LFO keeps its own phase**, so things side by side never move in lockstep (Matthew's call for the cats' wags). Each cat has its own offset into the cycle, and its own pace when it follows no LFO. An LFO too fast to show is drawn as a blur of copies spread round the cycle (`LFO_BLUR`), in time with nothing.

## Drawing gotchas, and a routine for finding them

Each picture is a hand-drawn illusion of depth, and a few kinds of slip break it at once. Matthew and M have caught each of these by eye:

1. **A line runs past the thing it belongs to, or stops short of it.** Examples: floor tiles that carry on up into the walls (the castle rooms' floors); veins that run off a leaf's edge or stop well inside it; lead lines in a window that cross its arch. Every seam, vein, grid, tile line and plank edge must end on its shape's outline. There are two ways to make sure:
   - work out its ends on the outline (on a perspective floor at height `y`, the floor spans `x` within ±`bw·(y − vy)/(floor − vy)`);
   - or draw it inside a `clipPath` of the shape.
2. **A line that should follow the perspective doesn't.** In a room, everything on a side wall, the floor or the ceiling converges on the vanishing point `(0, vy)` from `roomFrame`. A grid or mesh drawn as an upright screen rectangle on a side wall looks pasted on. Place every point with `at(X, Y, z)` (or `out`), and draw the grid between projected points. The spacing grows toward us, as 1/(1 + z); it is not even.
3. **A thing hangs from nothing, or stands on nothing.** M found lanterns hanging in the air beside the fairy forest's great tree, with no branch to hang from. Anything that hangs needs its branch, hook, chain or beam. Anything that stands needs its floor, shelf or ground under it, at the same depth.
4. **Layers are out of depth order.** Examples: a door's sign drawn over a cat on a cat tree; a cat on a far shelf drawn in front of the near rope bridge. Draw back to front (sort by depth, as the cat room's cats are sorted), and keep a room's signs clear of what it holds.
5. **Things hidden behind the friend.** The friend stands in the middle of every scene and covers about a third of its width, from mid-height down. Put what matters to the sides, and always check a scene with the friend hidden too.

**The routine, after drawing or changing a scene:**
1. **Render a contact sheet** in muted headless Chrome. Include the scene as it starts, the same with the friend hidden, and the extremes of its settings (the most and fewest of everything, each color theme). Use the picture's full size, with its animations removed, or caught at a few moments.
2. **Look at it at full size, region by region,** not as a thumbnail: corners, where floors meet walls, windows, what hangs, what stands. Ask the five questions above of each part.
3. **Check the code you touched** for lines spanning fixed screen widths (`-W - pad` to `W + pad`), evenly spaced grids inside a room, and points inside a room not placed with `at()` or `out()`.
4. **Fix, re-render, and confirm** that nothing else changed: compare every other scene's markup with the last commit's (the byte-identical check).

## Testing

- **Silence.** Every test browser runs muted: start headless Chrome with `--mute-audio`. A dispatched click counts as a user gesture and starts the music; one test once played through the laptop's speakers. In a visible browser, mute the game (🔇) before clicking anything. Test audio only at volume 0, or render it offline with `OfflineAudioContext` at 22 kHz or more (at 8 kHz the hi-hats render silent).
- **Clean up.** Close every test browser and tab when you're done, and check that `pactl list short sink-inputs` is empty.
- **One heavy job at a time.** The laptop this is developed on shuts down under load. Never run two browsers, or a browser and a build, at once.
- **Pictures.**
  - A contact sheet beats one screenshot. In headless Chrome over the DevTools protocol, set the settings in `state` and call `changed()`. Then serialize `#pic` with its `<animate>` elements removed, and draw each into a canvas grid.
  - Evaluate with `Runtime.evaluate` after the page has loaded: it sees the page's top-level names (`state`, `changed`). WebDriver's script execution once did not.
  - If you put several serialized SVGs into one page, give each its own ids, or their clip paths will borrow from each other.
- **A hidden browser pane stalls Web Animations,** so a trip through a doorway never lands. When testing mechanics there, replace `flyInto` with one that arrives at once: `flyInto = (b, arrive) => { arrive(); changed(); }`.
- **Drags** use real input events (`Input.dispatchMouseEvent`) and are timed by frames, not by function calls.
- **Old saves.** After changing a setting's meaning, load a JSON saved by the last release and check that it looks the same.

## Working with Matthew

- **Time your work.** Run `date` when you start and when you finish, and leave out pauses. Drawing work has run about five times faster than estimated: a hallway estimated at an hour took 12 minutes. Scale your estimates by what has actually been timed, and give a range.
- **Tickets** live on the Hazel Work Dashboard, under the rules in [`hazel-work-notes/agent-instructions.md`](https://github.com/matthewhammer/hazel-work-notes/blob/main/agent-instructions.md). Each ticket records when it opened and closed, the exchanges with Matthew, and minutes of work.
- **Show, then ask.** For a visual change, show him a picture (or the local page) before asking whether it's right.

## Open questions for Matthew (delete once answered)

1. Should this file be public at all, or kept outside the repository (in hazel-work-notes, next to the dashboard's instructions)?
2. Should the test drivers (contact sheets, drag timing, tune rendering) move into the repository, as a `tools/` folder? They live outside it today.
3. Should the README link here, or leave it for agents to find?
