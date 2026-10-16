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
2. **Release new features as soon as they're done and checked.** Matthew's call, 2026-10-15: "all new features to Dress Up get pushed and made public, with a version bump, asap", ahead of other work such as the archives. The kids want to see the progress. (Before that, a version waited for his word and bundled about a day of changes.) Still ask him first when a push would publish something he asked to read beforehand. If a push is refused, don't work around it. Give him the one-line command instead: `git -C ~/kids-choice-games push origin HEAD dress-up-X.Y.Z`.
3. **To release:**
   - Turn `## Unreleased` into `## X.Y.Z (YYYY-MM-DD)`. Open it with a one-line summary ("Everything in X.Y.Z−1, plus …").
   - Set the version in two places, to the same number and date: `const VERSION = { number, released }` in `dress-up/index.html` (shown after the game's name) and `dress-up/version.json` (ticket 134). Every open copy of the game asks for version.json each minute and offers a newer number as a chip after its own; clicking it loads the new version at `?v=X.Y.Z`, keeping the friend, the place and every setting (they are saved in localStorage as always). A version.json ahead of the page offers players a version that is not there yet; one behind offers nothing.
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
- **The wind is outdoors.** Indoors nothing sways in a breeze, and leaves and small branches don't grow without sun: a tree's limbs passing through a room are bare and still, and nothing hangs swinging unless something gives it a reason (a creature, a fire, a pendulum). Show the weather through the windows instead: the tree house rooms' windows show the tree's limbs, with leaf pads, swaying (E) and fluttering (D). Matthew's call, 2026-10-15.
- **Depth: the friend passes behind what stands nearer, and is smaller farther back** (ticket 99, Matthew's call). The scenes are pseudo-3D. Every thing that stands in a place (a tree, a table, a cook, a duck) is an object with a depth, and the friend, wherever they are put or dragged, is drawn behind everything standing nearer than their feet. Flat things on the ground and the backdrop (sky, far hills, back walls and what hangs on them) are not objects. Anything painted over the whole place (darkness, glows, steam, the sign toward us at the bottom) is an object in front of everything, so the friend is always under it. Each place lists its objects with an 👁️ chip each, to hide or show one; the list is the formal record of what can stand in front of the friend.
- **Cartoon bodies:** plain skin shapes, no anatomy.
- **Nothing scary unless asked for.** Skeletons are off by default (one slider per dungeon room, starting at 0), because M found them scary.
- **Every setting has a visible label with an emoji.** A choice that names a place or room shows that place's own emoji, so the same thing looks the same everywhere.
- **Settings appear only where they apply.** Use `SHOWN_WHEN`, or a group's "here" test. Inside a castle room, only that room's settings show.
- **Doorways go somewhere sensible.** Every way out of a place is a doorway (`class="portal"`) that leads somewhere, with a way back. A picture is one doorway as a whole: the doorways painted inside it are made inert.

## Where things are

| What | Where |
|---|---|
| The game | [`dress-up/index.html`](dress-up/index.html): one file holding all the HTML, CSS and JavaScript, about 12,400 lines. No build step and no dependencies. It also plays from disk. |
| Its versions | [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md), newest first, with tags `dress-up-X.Y.Z`. |
| Its objects | [`dress-up/OBJECTS.md`](dress-up/OBJECTS.md): every place's standing things, back to front, with their depths (ticket 99). Made from the depth sheets' `objects.json` (below) by `~/du-shots/tools/objects_md.py <objects.json> dress-up/OBJECTS.md <version>`; make it again after changing what stands in a place. |
| Live | http://matthewhammer.org/kids-choice-games/dress-up/ (Pages, from `main` at `/`, with `.nojekyll`). |
| Local | Any static server over `dress-up/`. On Matthew's laptop, http://localhost:8133/dress-up.html serves this working copy through a symlink. The kids test there before a release, so whatever you commit locally is what they play. |
| Saved state | `localStorage["dress-up-v1"]` holds the whole `state`. Save writes PNG, SVG and JSON (`{app: "dress-up", version: 1, state}`), and Load reads the JSON back. Save is a menu (💾 Save ▾): the kinds of file, the button, and the links to what was saved, which keep it open. |
| The page's layout | (ticket 116, Matthew and M: the picture as large as possible at all times, no wasted margins.) The whole window, in three columns: the picture's (`.stage`), a divider to drag (`#divider`), the controls (`.side`, with the title at its top). `fitPic()` sizes the picture to the largest that fits its area at its own shape, the caption and buttons right under it; it runs after every draw and when its area changes size. `setSplit()` sets the picture's column (`--split`): where the divider was dragged (remembered in `localStorage["dress-up-split"]` as a share of the window), or, never dragged or double-clicked, as wide as the picture can use at the window's height, between 40% and 70% of the window and leaving the controls 320 px. On a phone (760 px or less) the picture is pinned at the top at 40% of the screen's height, the controls under it, no divider. Full screen fits the picture to the window, less the HUD. Check a layout change at several window sizes by measuring the picture (`getBoundingClientRect`), not by eye. |

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
- An animation in time with an LFO takes its `begin` from `lfoBegin`, which reads the kept gap between the picture's clock and the music's (`picGapNow`, measured again only when it moves by more than `PIC_GAP_SLACK`: the music starting, stopping or jumping). Never write `pic.getCurrentTime()` or `performance.now()` into a scene's text: the picture's clock moves once a frame and the music's all the time, so the text changes from draw to draw, and the scene is rebuilt on every move (ticket 117: a drag ground to a halt and the music stuttered). A figure's own animations may, since the figure is drawn afresh anyway.
- Never animate a CSS property (stroke-width, stroke-opacity, opacity, fill...) with SMIL in something that has many copies: a browser restyles every SMIL animation of a CSS property on every frame (ticket 118: the fumes' 300 to 400 such animations held the witch's places to 13 to 17 frames a second idle in Chrome). Attributes such as x1, cx, d are fine. The fumes (`helixSvg`) keep their widths and see-through-ness in `data-helix` and play them as Web Animations (`startHelix` after a scene is mounted, at the picture clock's place in their 2.4 s loop); checked against the SMIL version at four clock times (within 5%).
- The picture's animations go on during a drag (ticket 133: the ducks keep paddling; pausing them, ticket 118's, bought nothing once the fumes were Web Animations, measured in Chrome and Firefox). During a drag `picGapNow` keeps the gap as it was (`picDragging`, set when a drag starts and cleared in `letGo`), so a press that starts the music rebuilds the scene once the drag ends, not in the middle of it.
- A drag's moves update the state at once and draw at most once a frame (`dragChanged`: a frame, or a 50 ms timer where frames do not come; `letGo` draws the last move first). Never call `changed()` per pointer move: mice send 125 moves a second and pencils 240. `pointercancel` lets go too (an iPad's scroll or gesture), or the friend stays held.
- Never read layout (clientWidth, offsetHeight, getBoundingClientRect, getBBox) inside `draw()` or anything it calls on every drawing: after the drawing changed the picture, it makes the browser lay out the whole page again, on every move. `fitPic` measures the picture's area only when a ResizeObserver, the window or the big-picture switch says it changed (ticket 133; it was half of a drag's drawing time).
- The music is sent to the audio clock `MUSIC_AHEAD` (0.5 s) ahead, by a 25 ms timer, every frame while a tune plays, and every `changed()` and treading frame (`feedMusic`). Timers alone are not enough: a drag holds them back by up to a fifth of a second while frames still come, and a note more than 20 ms late is skipped (ticket 133: the music glitched during drags).
- To measure: `~/du-shots/tools/perf133.mjs` (Chrome: a drag into the duck pond, posing a hand, treading; per case the draw times, frames, a timer's and the music feed's worst gaps, scene rebuilds; `MUSIC=1`, `W/H/DPR`, `PROFILE`, `PARTS`, `DIFF`), `perf133ff.py` (the same in Firefox, `KIND=`). Load the page with a fresh `?v=` query: a cached copy measured the old code once.

**Depth** (ticket 99).
- `obj(name, z, svg)` marks a standing thing: `<g data-obj="name" data-z="z">`. `z` is the y where it stands on the ground, in the stage's units (the friend's feet are at `SCENE.ground + figY`); something flying takes the ground under it, and `Infinity` (written `front`) is in front of everything. `byDepth([[name, z, svg], …])` writes a list of them in order.
- Names are plain words a child reads, and stay the same as settings change: number a row from our end or by its index (`duck 3`, `chair, left 2`). A row of like things far from one another can be one object at its middle depth (`pines, far row`).
- `sceneObjects` puts each group's objects in order by depth in the places they held (`sortObjects`), and lists the ones that count: an object inside a transform group, a doorway, a dragged thing or another object is drawn but not listed. Wrap a thing outside its `<g transform>`. Pictures and window views of a place are sorted too (`pictureSvg`), so they paint as the place does.
- `draw()` puts the friend just before the first listed object deeper than their feet (`objectAhead`), else last. So whatever a scene paints after its objects must be an object itself, at `Infinity`; a light that belongs to one object goes inside it, so hiding the object hides its light.
- **The friend's size by depth:** `depthSize(B, figY)` scales the friend on top of their size slider and the place's own size (`SCENE_FIG`): (feet − v) / (arrival − v), where v is the place's vanishing height (`sceneVanish`: a castle room's from `roomFrame`'s eye; `SCENE_VANISH` for rooms drawn flatter; 60 otherwise) and the arrival spot is `ARRIVE`'s, else the ground line. So the friend is exactly the place's own size where they arrive, smaller farther back, bigger nearer, between 0.3 and 1.5. Matthew's call: the place's own size stays the setting, and depth is a factor on top.
- The objects control (`objects`, in the background tab) shows the list as small chips, 👁️ or 🙈 and the name, with 🧍 where the friend stands among them. A tap hides or shows one; hidden names are kept per place in `background.objectsOff[objPlace(B)]` (a castle room by its style, a tree house room by its number).

**The friend's joints** (ticket 99). `body.elbows` (−150 to 150, up is +) and `body.knees` (0 to 150, out, so the friend crouches) bend both arms and both legs alike. At 0 every arm and leg is drawn exactly as before. A bent limb is a polyline through its joints (`armJoints`, `legJoints`, drawn by `limbThrough`); sleeves (`alongArm`), pants, stockings and skirt lengths follow the joints. **Posing by touch** (ticket 121, M's games on the iPad do it): a press on a hand, a foot, an elbow or a knee in the picture takes hold of that joint (`onJoint`, from the joints `draw()` leaves in `poseJoints`), ahead of the face and of moving the friend; but only when it is really on it (ticket 135): a hand or foot within its own size plus 8 screen pixels for a mouse or pen, 18 for a finger, an elbow or knee within its limb's width. (It was 30 pixels round every joint, which in a place, where the friend is small, covered most of the torso, so dragging the friend took an arm.) Under a mouse or pen, what a press would take glows (`hoverAt`, `hoverGlowSvg`, `#hover-glow` drawn over the picture and again after each drawing): the joint's orb, or the body from the shoulders to the hips when a press would move the friend; nothing over the face, which a press bends into a smile or a frown. Dragging a hand or a foot reaches it for the finger, two equal bones from the shoulder or hip, the elbow or knee bending the way it already bent (`poseTo`); an elbow or a knee swings the whole limb round its shoulder or hip. Each limb's own turn and bend are kept as `body.poseArmL/R`, `poseElbowL/R`, `poseLegL/R`, `poseKneeL/R` (degrees, by the friend's own side: L is their left, on our right, side 1), on top of the sliders' (`poseOf`), so the sliders still move both alike; all zero, every limb is drawn exactly as before (checked on 200 random friends against 0.0.46). A posed leg's feet need not be level: the friend stands on the lower foot, or kneels on a knee lower still, and posed pants follow each thigh and shin, mitred at the knee. While a joint is held, the ground the friend stood on (`poseHeld`) and, with no background, the picture's frame are kept as they were, so the limb stays under the finger; letting go settles them. The arms and legs tab says how to pose, and "🧍 stand straight again" (shown only when posed) zeroes the pose.

**The Body tab: poses, facing, animations** (tickets 129 and 132, Matthew's). The "🧍 Body" tab comes first, before the face (his call: top level), with three rows of chips: poses (`body.pose`: standing, sitting, cross-legged meditating, dancing), facing (`body.facing`, moved here from the arms and legs tab with sitting), and animations (`body.anim`, `ANIMS`). Choosing a pose calls `strikePose(which)` (from `set`), which zeroes every pose key and applies `POSES[which]`; standing and sitting keep the way the friend faces, the others face us; sitting on a seat or standing up from one keeps `body.pose` true. The poses: "stand" is all zero (eyes open); "meditate" is cross-legged on the ground (each thigh out and a little down, each shin back across the other, the feet turned soles up, the hands together in the lap) with `face.closed`; "dance" picks one of `POSES.dance` at random, never the last one again. A pose is only pose keys, so it can be posed further by touch. **Animations** (ticket 132) run as treading does: `moveNow()` returns turns and bends added to the pose's in `draw()` (`poseT`), a `lift` off the ground, a turn about the hips (`rot`) or a ladder's phase, from LFO B's wave (2 beats a stride), and `treadTick` draws the friend about 30 times a second while any is on (1.3 to 1.9 ms a drawing). Without one chosen, deep water still treads (`treadNow`, the only one with `water`, which moves the waterline and bobs inside the water mask). Walking, running and crawling are seen from the side (choosing one facing us turns the friend to our right); facing us, walking and running step in place. Swimming is treading, anywhere. Crawling turns the friend about the hips by as much as puts their hands and knees on the ground together (cos turn = (arm − thigh) / body, 50 to 100 degrees): thighs straight down, shins level behind, feet soles up (the feet turn with `poseT("Foot")`), and they rest on the lowest of hands, knees and feet. Climbing faces us, a ladder behind them, its rungs going down two a stride. Any animation but swimming stands the friend up first. The feet turn about the ankle, as hands do: `body.feetTurn` (both, toes up +; "👣 feet turn") plus each foot's `poseFootL/R` (by side, in `POSE_KEYS`), drawn as a rotation round `footAt(side)`. A foot resting up at its knee's height or above (cross-legged) is drawn after the pants, over them (`feetOver`). `face.closed` ("😌 eyes closed") draws each eye as a lid's line curving down, as wide as the open eye, before stars, hearts or x eyes. Tune a pose's numbers with figsheet.py; a dance's arms must not cover the face (short arms raised and bent come down over the eyes).

**Shorts and swimsuits on posed legs** (ticket 128). Pants follow posed legs (above); underwear and swimsuits too: on posed or bent legs (`legPosed || knee`) the skin under them and swim trunks and briefs are drawn from `legFrame(side, t)` (a point down the thigh and the way out across it): facing us an outline down each thigh (`shortLegs`), its crotch rising as the thighs turn up; in profile a hip block and a band down each thigh (`hipsSide`, `sideLegs`), as profile pants are. Straight legs draw exactly as before. A bikini's and a one-piece's leg holes stay at the hips. `~/du-shots/tools/crouch128.sh` draws every outfit and costume in a crouch.

**Water** (ticket 122, Matthew's ask: "In water, by default, let's make the bottom half transparent, and add a 'wake' effect").
- `WATER` holds a test for each place with water to stand in: is a point on the stage (the friend's feet, `figX`, `SCENE.ground + figY`) in it? Each test uses the same helpers as the place's drawing, so the two can't drift:
  - the lake: between `lakeLines`' horizon and its near shore, but not the little beach (`lakeBeach`);
  - the beach: the sea (`beachLines`) down to the sand, the foam included;
  - the waterfall: the pool's ellipse (`poolOf`), up to the near bank;
  - a castle: the moat's near half (`castleAt`, `moatOf`), but not the drawbridge (`bridgeHalf`), and nothing when its moat is 0. A friend in the far half stands behind the whole castle object anyway;
  - the tree house's stream (`streamAt`) and the cemetery's brook (`brookAt`), as their outlines are drawn (`sampled`, `inRibbon`).

  A wavy ground edge is found with `landY`, which mirrors `backgroundSvg`'s `land`: change one, and change the other. The sea floor (`underwater`) isn't in the list, since the friend is under water there already. `waterHere(B)` gives a place's test, or null; `inWater(B, x, y)` asks it.
- Two settings in the background tab, shown only where `waterHere` finds water: "🌊 see-through under the water" (`waterSee`, 0 to 100, default 70, so the part under water is at 30%), and "💧 a wake round the friend in the water" (`waterWake`, 0 to 250, default 100). At 0 each is off.
- In `draw()`, when the feet are in water, everything of the friend after `figAt` goes through `wading(B, inner, wl, hw, most)`:
  - **the friend stands in the water, not on it** (Matthew, 0.0.50: the ripples hovered above the water, by half a body): the waterline `wl` is placed where the friend stands, on the water's surface in the picture (`figureT.g = wl` instead of the ground of their feet), so what is below it sinks into the water, and their shadow is not drawn. Depth sorting and size by depth still go by where they stand;
  - a mask (`water-line`, in the friend's own units) shows them whole above a gentle wave at the waterline `wl`, and below it faint, and **only where the water is in the picture** (Matthew, 0.0.51: legs reaching into the sand, the shore or the grass broke the illusion). `waterRuns` finds the water's shape round where they stand from the place's `WATER` test, row by row (2 units apart; each row tried every 8 across and its edges found by halving), kept while the place and the spot are the same (as while treading); it becomes rects in the friend's units, in the mask and as the clip of the ripples (`water-area`). About 2 to 6 ms a draw in water. `inRibbon` finds its piece of a stream by halving (its points go down the picture). The waterline is the waist (`L`), or the knees in the shallow stream and brook (`SHALLOW_WATER`: the tree house and the cemetery), so a little stream doesn't come up to the friend's waist. The wave stays still, since a moving mask would redraw the whole friend every frame;
  - (ticket 42) the stream's and the brook's ripples flow (`flowRipples`): each, a `g.flow`, moves in its loop from where it starts to where the next one starts, along the water and growing with its width, every part of it (its line too) in proportion to the width, so the row flows on with no jump when the loop begins again (2.2 s a step on the stream, 2.8 s on the brook; their own pace, not an LFO);
  - the wake is three rings that spread and fade, as the waterfall pool's do, and dashed foam that goes round them. Each ring's far half is behind the friend and its near half in front (clip paths `water-far`, `water-near`). The rings begin at fixed times (0, −0.8 and −1.6 s), so redrawing on every drag move keeps them in step, and a saved PNG (drawn at time 0) shows all three. They spread no farther than the nearer bank (`waterAcross`, `most`), so they stay on the water in a moat or a stream.

  On dry ground the friend's markup is exactly what it was before.
- **Treading water** (ticket 123): in deep water (any `WATER` place but the shallow ones), `treadNow()` gives the stroke for now: both arms scull out and in together, the legs kick in turn, and the friend bobs twice a stroke, one stroke to LFO B's wave (2 beats to start), so it moves with the music. Its turns and bends are added to the pose's in `draw()` (`poseT`), but the friend floats where their legs as posed would stand (`still`), so a kick never jolts them; the bob moves the friend inside the water mask (`wading`'s `bob`), not the waterline. Treading, the friend is in deeper (Matthew: the arms should be in the water): the waterline is half an arm below the shoulders (`8 + armLen / 2`, never above 12, never below the waist), and the stroke keeps the arms angled down with the forearms near level, so even short arms sweep under the surface. While treading, `draw()` asks for the next frame and `treadTick` draws the friend again about 30 times a second (not during a drag, nor while the page is hidden; the scene is kept, about 2.5 ms a redraw). "🏊 treading water where it's deep" (`waterTread`, 0 to 200, default 100; 0 stands still), shown only in places with deep water. On dry ground, or in a stream or brook, nothing changes.
- A new place with water to stand in gets a line in `WATER`, built from a helper its drawing shares.

**Facing and sitting** (ticket 124). `body.facing` ("front", "left", "right"; `facingOf(B)` gives 0, -1, 1, `dir` in `draw()`) and `body.sit`. Facing us, standing, the friend is drawn exactly as before. In profile:
- the body is narrower (`w` × 0.62), the arms come from the shoulder and the legs from under the hip, both pointing the way they face (each limb's `out`); the side nearer us is their `-dir` side (facing our right, their right shoulder is toward us), so the far arm, its sleeve and hand are drawn behind the body (`farArms`) and the near ones wholly in front (`nearArms`), the far leg first (`legOrder`); shoes point the way they face; a suit's tail swings out behind;
- pants are a leg along each thigh and shin under a rounded block for the hips (no one-piece outline, which tangled when both thighs point forward);
- the face shows only its features on our side (`face-near`: one eye and brow), moved to the front; the mouth is its far half carried to the front edge (`face-far`), so a smile turns up toward the cheek; a nose is a bump out of the front edge (a witch's, her side nose there); an ear shows where the hair leaves it;
- hair is drawn from the side (`sideHair`): a cap over the top and back of the head with the hairline at the forehead (as low as the bangs reach, in the hairdo's locks), long hair coming down in front of the ear; behind, long hair down the back, curls, one pigtail, an afro's puff;
- a hood (`hoodSide`) covers the top and back, open in a rounded oval at the front, the animal's face on the brim on our side only; the hood's back and ears sit a little back;
- a witch's hat bends back and its buckle, and her belt's, are seen edge on at her front;
- (ticket 131) the sick puddle is drawn on its own (`faceSvg`'s `sick`), not in the mouth's group, whose far half is clipped and carried to the front: the stream falls from where the lips meet the face's front edge (`profileEdge`), and the pile is whole under it, 0.4 as wide as facing us (`sickPile`'s `sx` and `wide`);
- (ticket 130, a hug) in a place, and not in water, the far arm, its sleeve and hand (the svg from `farAt`, `farDeep`) are drawn apart in `#figure-far`, with the friend's transform and the shirt's see-through, and put among the place's things a body's depth (26 of the friend's units) behind their feet, so an arm can go behind someone they stand just in front of while the near arm is in front.

Wings in profile: wings on the back (a fairy's, a falcon's or eagle's) are turned away from us (`turnedAway`): only the half that spread behind them, narrowed to 0.42, out from the back of the shoulders, the far wing a copy a little behind and above, shaded; a bird suit's wings along the arms are drawn nearly edge on (`armWing`'s `edge` 0.3). Matthew: wings seen from the side should be in perspective, or edge on, never flat.

**Ears** (ticket 125, M's). `face.ears` ("none", "free", "attached", "elf"; "free" to start) and `face.earSize`; `earSvg(kind, k, color, x0, y, s)` draws one in the face's units, its base at x0 on the head, sticking out to side s, in the skin's color with a curl for the rim. Facing us they stick out at the sides at the eyes' height, behind the head: under long hair, which covers them, but over shorter hair, and an elf's always over the hair, so its tips poke through. In profile the same shape shows on the side of the head (`sideHair`'s `ear`), unless long hair covers it. Hoods hide them.

Sitting (`legBase`): facing us, the thighs come toward us and are drawn short (0.3), the shins straight down, with a crease across each pants knee (two round knees in pants looked like a seat, Matthew said) or round bare knees; in profile the thighs go forward, level, and the shins hang down. The pose (121) adds to these, and posing works in profile and sitting (`poseTo` uses each limb's `out`, the sitting angles and the short thigh). Contact sheets: `~/du-shots/tools/figsheet.py <out.png> <cols> '<[state setters]>'` (headless Firefox, the friend alone, framed to them).

**Seats** (ticket 50): `SEATS[kind](c, B)` lists a place's seats (see `seatsHere`), its lines just before the place's scene function, built from that scene's own expressions. Places with seats: the living room's couch; the healer's two chairs; a tree house's beanbag (the reading nook; not the bottom bunk, where a sitter's head went through the top bunk); and in a castle (`ROOM_SEATS`, by room style) the dining room's chairs but our end's, which faces away (`diningPlaces`, shared with its drawing), the king's throne, the cat room's window seat, the spiral staircase's steps 2 to 5, and the stable's hay heap. Outdoors: the camp's logs by the fire (each facing it), the beach chairs, the picnic bench under the sea, the fairy ring's three biggest toadstools, the path's outer mushrooms, three mountain rocks (the nearest of each cluster), the castle's crate and two barrels, the house's front step and the toy wagon, the tree house's swing, and the witch's big root (`sceneR` and `rockTop` repeat backgroundSvg's and rockSvg's own placing: keep them alike). Letting go of the friend with their feet between a seat's top and the floor in front of it sits them on it (`dropOnSeat`); one sitting on a seat and let go of elsewhere stands up; the background tab's 🪑 chips sit them on a seat or stand them up (`sitOn`, `standUp`). Seated, the friend is sorted among the objects at the seat's depth and sized by it (`seatNow`), not by where their feet hang. On the tree house's swing they swing with its seat (ticket 42): the friend's group gets the same rotation as the swing's (`additive="sum"`, about the hook in the friend's own units, timed by the same `lfoTimed(o, "slow", 0.15, ...)`), so the two stay together; not while a joint is held.

**Castles.**
- `castleOf(o)` reads one castle's settings (N's, M's or D's) into a model:
  - `rooms`, by number (up to six, each a style from `ROOM_KINDS`);
  - `hall[n]`, each room's own exits;
  - its color themes, A (the castle's own) and `themeB`;
  - `roomTheme[n]`, which theme each room takes;
  - its carpet and roof;
  - its residents (`cats`, `horses`, …), from `RESIDENTS`.
- Settings keys end with the castle's letter, such as `castleRoom3N` or `castleHallDoor2_1M`.
- `castleroomScene` draws a room by its style, in its theme, and `castleWays` adds its exits.
- Rooms are drawn in perspective with `roomSpace(c)`:
  - `at(X, Y, z)` is a point on the back wall's plane, brought z toward us (z < 0); a side wall is X = ±bw;
  - `Yh(h)` is a height on the back wall, as a share of it.

  Side doors come from `hallSideDoor`.

**Music and LFOs.** The music is a Web Audio sequencer inside the page:
- tunes are written as text (MIDI note numbers, sections, drum patterns);
- about 30 instruments are synthesized in the page;
- the mixing board sets each part's level, echo, room, pan and so on;
- seven LFOs, A to G (`LFO_NAMES`, `LFO_DEFAULT`, lengths from 1/32 beat to 32 beats), drive both sounds and pictures.
  - D, E, F and G are the scenes' own to start with: D for quick things, E for slow ones, F and G for wings.
  - Seven, with the whole tune's strip first, sit evenly on the mixing board.
- LFOs belong to the scene's tune. A place without a tune uses the defaults. Write mixer settings through `chan(id, key)`.
- A tune line in one meter over chords in another is `crossOf` (the funked waltzes' basses).

## Recipes: adding things

Each kind of thing has one table. Add an entry there, and the rest follows from it. Check every change with the safety net, below.

**A place.** Add one line in each of these:
- `PLACES`: its value and its label with an emoji;
- `PLACE_GROUPS`: exactly one kind (an assertion checks this);
- `SCENES`: its scene function;
- `SCENE_FIG`: the friend's size there;
- `ARRIVE`: where the friend lands;
- `PLACE_PHRASE`: the caption's words, such as "in the 🌲 forest" or "at the 🏕️ camp site";
- `SCENE_TUNE`, if it has its own music;
- `SCENE_LFO_THINGS`: its quick, slow and winged things;
- `WATER`, if it has water to stand in (see Water).

Wrap each thing that stands in it with `obj` (see Depth), make its depth sheet, and add its list to `OBJECTS.md`.

Every place moves at least one quick thing and one slow thing with the music. A scene function returns SVG text and draws on the fixed stage (`SCENE`, ground at 320). Doorways are `<g class="portal" data-to="place">`; `flyInto` animates the trip, and the back chip undoes it.

**A castle room style.** One entry in `ROOM_KINDS`:
- its label (emoji first) and whose idea it was;
- its drawing, `(c, K, r) => …`, where `r` carries what `castleroomScene` works out for this room: a trap room's `pits`, a dungeon's `bones`, a hallway's `hallEnd` ("none" when its stairs lead nowhere, and it ends in a wall). Anything new in `r` must also go into the inputs of the room's `part`, or the cached drawing won't change with it;
- its exits:
  - `side`: doors in its side walls, set per room, a sign toward us (its way out), and a color theme, as the king's room has;
  - `spiral`: the same, but its doors come out onto its steps at four heights (`spiralDoorAt`, from the room's own geometry, `spiralGeom`); a hallway's stairs ("the first spiral stairs") lead to the castle's first spiral staircase;
  - `long`: the same, but for a long room drawn as the hallway is (seen from its height, `eye: 0.3` in `castleroomScene`): its doors run down its walls, as the hallway's do (the dining room);
  - `hall`: a hallway's doors and stairs;
  - `trap`: one arch (its way out), and two pits into the dungeons;
  - `ladder`: a ladder up (its way out; the usual way, up to the trap room);
  - `all`: an arch to every other room but the dungeons, and one more (its way out) where that leads elsewhere;
- its stone's tone.

**How a castle's rooms connect.** A castle has up to `ROOM_MAX` (13) rooms by number. Every room but a hallway has a way out, set per room (`castleOut<n><castle>`). "✨ The usual way" is out of the castle from room 1, up to the trap room from a dungeon, and back to room 1 from any other room: only room 1 leads outside to start with. Doors default the same way (`hallDoorDefault`). In a room with a sign, a door that leads where the sign does is that sign, and isn't drawn twice.
- **The castle's helpers** (`helperSvg`): the kitchen's two cooks and the smith, drawn as the healer is (feet at the origin, about 240 tall), from a short description: skin, hair, shirt, legs or skirt, apron, hat or beard, and a pose (`stir`, `chop`, `hammer`), their work timed by the scene's quick LFO with `lfoTimed`. The room places each one so their work lands where it should: the ladle in the pot, the hammer on the anvil. They are to join ticket 92's cast of friends, with settings of their own.
- **Room for every way:** a castle of 13 rooms gives the greenhouse up to 12 ways. Its back wall holds six archways, its stone side walls four doors (two a side, in perspective), and any more are signs at the bottom, toward us. Matthew asked for the walls and the signs.
- **⬇️ The door behind you** (ticket 112, Matthew's idea): the bottom edge of a picture is a door we can't see, behind the friend. Where a room has nothing at the bottom already (a hallway, the trap room, the greenhouse), it is an optional way, `castleBack<n><castle>`, "🧱 nowhere" by default; set, it is a sign at the bottom toward us (`bottomSign`), and an exit of kind `back` in `roomExits`, so the designer can use it: `mapAddDoor` fills a free one before adding a door in a wall, which is how a door back from the trap room fixes castle N's one-way greenhouse archway. Rooms with a sign at the bottom already (the king's room and its kind) have that sign as their door behind you; a dungeon never has one (a pit has no way in but from above). Outside the castle, the living room (`livingBack`) and each tree house room (`treeBack1`..`treeBack6`) have the same setting, leading to any place (`BEHIND_PLACES`, drawn by `behindSign`).
- **Where a hallway's doors stand** (ticket 116): `hallDoors` places them, and the dining room's, a pair to each span of `HALL_DOOR_Z`, packed toward us; the torches along the walls stand in the gaps (`HALL_LIGHT_Z`). Every sign is at least `HALL_SIGN_MIN` (0.8) of its size at the corridor's mouth, and a farther door's sign goes up above a nearer one's on the same side where they would overlap: check that none overlap after a change (the signs' rects, by `getBoundingClientRect`).
- **How many doors** (ticket 113, M's idea): `roomDoorMax(style)` says how many doors a room's walls hold: a hallway 8 (four a side, a pair to each stretch of the corridor), the dining room 6 (three a side), the others 4 (two a side). `castleOf` keeps a room to its most, the "🚪 doors in its walls" slider stops there (a range control's optional limit, its fifth number: a function of the settings), the door menus show up to it, and the designer adds doors up to it. `DOOR_JS` lists the door numbers, 1 to `DOOR_MAX` (8). With its far wall and its near wall, a hallway has up to 10 ways and the dining room 8: the dining room's far wall has a door of its own, to the left of the fireplace (`castleFar<n><castle>`, nowhere by default; `farWallDoor`, an exit of kind `far`).
- **One source of truth:** `roomExits(K, n)` lists a room's ways (kind, where it leads: 0 is outside, a number a room, null nowhere; and the setting that says so, or none when it is fixed). `castleWays` draws them, and the castle designer maps them. Change one, and both follow.
- **The castle designer** (`castledesigner` control, in the rooms' box): the castle as a map, drawn with [Cytoscape.js](https://js.cytoscape.org/) 3.30.4, loaded from cdnjs (with its integrity hash) the first time the designer opens. It is the game's only outside script, and the game works without it; the designer's lists still work if it fails to load. `castleProblems` finds rooms that can't be reached, rooms with no way back out, ways to rooms the castle doesn't have, and one-way doors (a pit is one way by design). `mapPlan` says how to fix each, and does it: a door back where there's space, else lead the way to a room that has a way back, else close the door. Doors are two-way by default: setting where a way leads gives the room it leads to a door back.

Then:
- add any settings of its own to the room's group in `TABS`, shown only for that style;
- pass its inputs to its `part(…)` key in `castleroomScene`;
- add its line to `SCENE_LFO_THINGS` as `"castleroom:<style>"`.

**A resident** (who lives in a room style, like the cat room's cats). One entry in `RESIDENTS`:
- its room style;
- its key prefix, its list of starting ones, and its count `[setting, most, to start with]`;
- its group's and boxes' keys and titles;
- its name on the mixing board;
- `fields`, each as `[key word, control, label, colors / choices / [min, max, everyday min, everyday max] / the "none" choice's name, default]`.

From this come its settings' keys and defaults, `castleOf`'s list, the controls, when they show, and the mixing board's names. Residents belong to the castle, not to a room, so two cat rooms show the same cats. Draw them in a `part` of their own, back to front, with what stands in front of them drawn after them (as the cat room does with its rope bridge).

**Something that moves with an LFO.**
- **In a scene, a new animation:** use `sceneLfo(o, pace, off, attr, val, own)`, where `pace` is `"fast"`, `"slow"` or `"wings"` and `own` is what it does with no LFO.
- **In a scene, an animation that already exists:** wrap it in `lfoTimed(o, pace, off, own)`, which times it to the LFO as it is written.
- **Shared helpers:**
  - `swaying(o, inner, x, y, deg, off)` sways a thing slowly about its foot or hook;
  - `butterfliesSvg` makes butterflies.
- **Elsewhere** (a costume, a part, a resident): add a line to `LFO_FOLLOWERS`, so the mixing board names it and an LFO change redraws it.
- **Each thing gets its own `off`set**, so things side by side never move in lockstep.
- **A part holding one takes `sceneLfoKey(o, pace)` among its inputs.** Scenes read an LFO through their options (`sceneOpts`, `o["lfo:A"]`). Without that, a change on the mixing board never reaches the scene, which is how the fairy house's bug happened.
- **An LFO too fast to show is drawn as a blur** of copies spread round its cycle (`LFO_BLUR`, `wagged`), in time with nothing.

## The safety net

A refactor must not change any drawing. Before and after each step, run:
- **The sweep** (`sweep.mjs`): draws every place at each time of day, every castle room style in both themes, and every costume, from the defaults with every LFO off. It hashes each picture's markup (74 pictures, the tree house's six rooms each on its own); compare the two lists.
- **The structure dump** (`structure.mjs`): the defaults, the controls, every show-when rule over a set of castle states, and `castleOf` for them. These are what the pictures can't show; compare these too.
**The archives.** Every past version of the game, in pictures and in sound, is kept by day in two public repositories of their own, apart from the game: [dress-up-pictures](https://github.com/matthewhammer/dress-up-pictures) (`~/dress-up-pictures`, browsable at http://matthewhammer.org/dress-up-pictures/) and [dress-up-music](https://github.com/matthewhammer/dress-up-music) (`~/dress-up-music`, at http://matthewhammer.org/dress-up-music/). Being able to look back at all prior versions matters a great deal to Matthew. They will reach GitHub's limits before the game does, and can move to other storage then. Each holds `YYYY/MM/DD/` folders, each with a `source.json` (the game version and commit drawn from), and the tools that made it in `tools/`.
- **To archive a day:** `~/du-shots/tools/archive-today.sh [pictures|music|both] [--push]`. It copies the game as it is now, runs the tools below, writes each archive's front page, and commits in each repo. Run it after a release. It's two heavy jobs, run one after the other.
- **Unchanged files cost nothing:** a file the same as on the latest earlier day (a picture, byte for byte; a tune, by its fingerprint) is a relative symlink to that day's real file, and the day's page links straight to the real file.
- **The pictures** (`archive.mjs <port> <page> ~/dress-up-pictures/YYYY/MM/DD [music url]`): every background with and without the friend, and every chip menu's options against the defaults. Each picture is a 1920-wide PNG, an SVG and its settings `.json` (the game's save format), with an index.
  - A menu repeated per castle, room, cat or horse is taken once.
  - A menu hidden under the defaults is shown with the one setting of its tab that brings it out, named in its label ("with …"); one that no single setting brings out is listed as such, with no picture.
  - Names stay the same from day to day, so two days can be compared folder by folder.
  - In a script injected into the page as a template literal, write `[0-9]`, not `\d`: the backslash is lost, and the filter for repeated menus once quietly matched the letter d.
- **The thumbnails** (`thumbs.mjs <day dir>`, in the pictures repo): each picture at 480 wide as WebP, in the day's `thumbs/`, one ffmpeg at a time. `days_index.mjs` also writes each archive's `days.json`. Both feed the pages at http://matthewhammer.org/hazel/dress-up/ (ticket 119): an explainer, a music player and a picture viewer, which read the newest day themselves, so a new day needs no change there.
- **The music** (`music.mjs <port> <page> ~/dress-up-music YYYY/MM/DD [release dir] [pictures url]`): every tune at its default settings, one loop plus a short tail for its echoes, rendered offline in the page (44.1 kHz stereo, through a limiter) and encoded with `lame -V 2`, into the day's folder with a manifest and a page of players.
  - Each tune has a fingerprint: its notes, sections, tempo and levels, the code of each instrument it uses, and the player's and mixer's code. A tune whose fingerprint matches an earlier day's is a relative symlink to that day's file, not a new recording.
  - A busy tune takes minutes to render (forest, 3 minutes of music, about 2). The manifest is written after each tune, and a re-run the same day keeps every recording whose fingerprint still matches, so a stopped run resumes.
  - With a release dir, real copies of the day's MP3s go there with a public page.

The archive tools live in the archives' own repositories (`~/du-shots/tools/` links to them). The other test drivers live on Matthew's laptop, in `~/du-shots/tools/` (see the open questions).

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
- **Drags** use real input events (`Input.dispatchMouseEvent`) and are timed by frames, not by function calls. Count `mountScene` calls too (wrap it from `Runtime.evaluate`): after a first drag (the click starts the music, which rightly re-times the scene once), a drag in any place must build no scene again. Measure every place, from `PLACES`, with the music playing.
- **Depth sheets** (`~/du-shots/tools/depthsheet.mjs <port> <url> <outdir> [place,…]`, places as `castleroom:<style>` and `treeroom:<n>`; all of them when none are named): for each place, the friend standing just behind each of its objects in turn, one contact sheet per place, and `objects.txt` and `objects.json`, the lists. Look at every sheet a change touches: each object should hide the friend's feet, and the friend should look the same (lit or dark) behind an object as in front of everything.
- **Old saves.** After changing a setting's meaning, load a JSON saved by the last release and check that it looks the same.

## Working with Matthew

- **Time your work.** Run `date` when you start and when you finish, and leave out pauses. Drawing work has run about five times faster than estimated: a hallway estimated at an hour took 12 minutes. Scale your estimates by what has actually been timed, and give a range.
- **Tickets** live on the Hazel Work Dashboard, under the rules in [`hazel-work-notes/agent-instructions.md`](https://github.com/matthewhammer/hazel-work-notes/blob/main/agent-instructions.md). Each ticket records when it opened and closed, the exchanges with Matthew, and minutes of work.
- **Show, then ask.** For a visual change, show him a picture (or the local page) before asking whether it's right.

## Open questions for Matthew (delete once answered)

1. Should the other test drivers (the safety net's `sweep.mjs` and `structure.mjs`, contact sheets, drag timing) move into the repository, as a `tools/` folder? They live outside it today, in `~/du-shots/tools/`. (The archive tools now live in the archive repositories.)
2. Should the README link here, or leave it for agents to find?
