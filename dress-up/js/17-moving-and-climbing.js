"use strict";
// (ticket 178) Part 17 of 26 of the game's script, run in order by index.html.

function waterRow(at, y, step) {
  // (tried every 8 across, and where it goes in or out of the water, the
  // edge found to within one by halving)
  const yc = y + step / 2, segs = [];
  const edge = (a, b, wa) => { for (let i = 0; i < 3; i++) { const m = (a + b) / 2; if (at(m, yc) === wa) a = m; else b = m; } return (a + b) / 2; };
  let from = null, prev = false, px = WATER_X0;
  for (let x = WATER_X0; x <= WATER_X1; x += 8) {
    const wet = at(x, yc);
    if (x === WATER_X0) { if (wet) from = x; }
    else if (wet !== prev) { const e = edge(px, x, prev); if (wet) from = e; else { segs.push([from, e]); from = null; } }
    prev = wet; px = x;
  }
  if (from !== null) segs.push([from, WATER_X1]);
  return segs;
}
function waterRuns(B, bgText, x0, x1, y0, y1, step = 2) {
  const at = waterHere(B), key = B.kind + ":" + step, runs = [];
  if (!at) return runs;
  if (waterRows.key !== key || waterRows.bg !== bgText) waterRows = { key, bg: bgText, rows: new Map() };
  for (let y = Math.floor(y0 / step) * step; y < y1; y += step) {
    let segs = waterRows.rows.get(y);
    if (!segs) waterRows.rows.set(y, segs = waterRow(at, y, step));
    for (const [a, b] of segs) { const l = Math.max(a, x0), r = Math.min(b, x1); if (r > l) runs.push([l, y, r - l]); }
  }
  return runs;
}
// (ticket 50) Where people can sit, place by place: SEATS[kind](c, B), with c
// the stage (stageC) and B the place's settings, gives the place's seats
// (SEATS itself is declared at the top, with SCENE_FIG, as each place's
// lines come before this),
// each { name, x0, x1, y, z, facing }: its name as a child reads it (the
// object's own name in the objects list, where it is one), the span of its
// top across (x0 to x1, stage units), the height of its top, where a
// sitter's hips go (y), the depth of the floor in front of it, where their
// feet go (z, as an object's depth: a sitter is sorted among the objects
// there), and the ways one can face on it, the usual first ("front",
// "left", "right"). Built from the same helpers as the place's drawing, so
// the two can't drift. A place's lines sit next to its scene function.
const seatsHere = B => { try { return (SEATS[B.kind]?.(stageC(), B) ?? []).filter(Boolean); } catch (e) { return []; } };
// the seat the friend sits on now (a seat here of the name kept, while they sit), or null
const seatNow = () => { const B = state.background; if (!state.body.sit || !B.seat || B.kind === "none") return null;
  return seatsHere(B).find(t => t.name === B.seat) || null; };
// (ticket 123) In deep water (not the shallow stream or brook) the friend
// treads water: both arms scull out and in together, the legs kick in turn,
// and they bob a little, twice a stroke; one stroke to LFO B's wave (2 beats
// to start), so it moves with the music. As much as "🏊 treading water"
// says; none while a joint is held. The turns and bends for now (degrees,
// as the pose's, by side), and the bob, or null.
function treadNow() {
  const W = state.background, amt = Math.max(0, Number(W.waterTread ?? 100) || 0) / 100;
  if (!amt || poseHeld || W.kind === "none" || SHALLOW_WATER[W.kind] || !inWater(W, W.figX ?? 0, SCENE.ground + (W.figY ?? 0))) return null;
  return { ...treadStroke(amt, lfoNow("B").phase), water: true };
}
// (the arms angled down and sweeping out and in under the surface, the
// forearms near level: not lifted out of the water)
function treadStroke(amt, u) {
  const s = Math.sin(2 * Math.PI * u), c = Math.cos(2 * Math.PI * u), arm = amt * (6 + 10 * s), elbow = amt * (18 + 18 * c);
  return { ArmL: arm, ArmR: arm, ElbowL: elbow, ElbowR: elbow,
           LegL: amt * (12 + 10 * c), LegR: amt * (12 - 10 * c), KneeL: amt * (45 + 35 * s), KneeR: amt * (45 - 35 * s),
           bob: amt * 4 * Math.cos(4 * Math.PI * u) };
}
// (ticket 132) The friend's animation for now, chosen in the Body tab: its
// turns and bends (degrees, by side: L their left), added to the pose's;
// how far it lifts them off the ground (lift), a turn of the whole friend
// about the hips (rot, crawling), and a ladder's rungs going by (ladder,
// climbing). One stride to LFO B's wave (2 beats to start), as treading,
// so it moves with the music. Without one chosen, deep water still treads.
const ANIMS = [["none", "⏸️ still"], ["walk", "🚶 walking"], ["run", "🏃 running"], ["swim", "🏊 swimming"], ["crawl", "🐛 crawling"], ["climb", "🪜 climbing (with ladder)"], ["climbup", "🧗 climbing"], ["jump", "🐸 short, fast jump"], ["jumphigh", "🦘 high, slow jump"], ["crouch", "🧎 crouching down"]];
// (walking, running and crawling are seen from the side: chosen facing us, the friend turns to our right)
const ANIM_SIDEWAYS = { walk: true, run: true, crawl: true };
// (ticket 137) Climbing a ladder that stands in the place ("🧗 climbing"):
// the friend goes to the ladder nearest them, just in front of it at its
// depth, facing it (away from us), and climbs it, CLIMB_SPEED stage units a second at the
// size they are there; at the top they go through it if it is a doorway (a
// dungeon's ladder up, a tree house room's ladder up, a ladder up the tree
// to its house: the house), or stay up there holding on (the hay loft).
// A place's ladders are its drawing's [data-ladder] groups, measured when
// a climb starts (startClimb, after a drawing, never in draw()). climb is
// null (to look for one), { none } (no ladder here, or, put down, none
// within reach: far), or the ladder: { place (the place it is in), x, z
// (its depth), top, door (its doorway's data-to and data-house, found
// again at the top: the scene's text, and so its nodes, may change on the
// way up, as the music starting re-times it), start, done, through }.
// Chosen, or in a new place, they go to the nearest ladder anywhere; put
// down by a drag, only to one within reach (CLIMB_REACH)
// (ticket 145) Climbed by hand, with the controller (climb.manual): at a
// ladder's foot, up gets on it (mountLadder); up and down move them on it
// (climb.got, in the picture's units, as draw() lifts them), and down at
// its foot, or an arrow to the side there, steps off. Their stroke follows
// how far they have climbed (CLIMB_STROKE of their own units a stroke),
// and they hold still while the arrows do.
let climb = null, climbLook = 0, climbAnywhere = true;
const CLIMB_SPEED = 70, CLIMB_REACH = 140, CLIMB_HAND = 300, CLIMB_STROKE = 160;
// (ticket 174) a climbing hand's height above its shoulder, as a share of the
// arm's length: reaching up (HI) and pulled down near the shoulder (LO); and
// the share of a cycle a hand spends holding a rung and pulling (the rest
// it reaches up for the next)
const CLIMB_HAND_HI = 0.92, CLIMB_HAND_LO = 0.25, CLIMB_PULL = 0.62;
const climbPlace = BG => [BG.kind, BG.inside, BG.castleRoom, BG.tent].join(":");
// (a [data-ladder] group, in the picture's own units, the friend's: through
// the screen, as the scene may sit in a nested svg of its own; its depth is
// the object it is in, else its foot; and the doorway it is, if it is one)
function ladderAt(el, Pinv) {
  const b = el.getBBox(), E = el.getScreenCTM(), m = Pinv && E ? Pinv.multiply(E) : null;
  if (!m || !b.height) return null;
  const at = (x, y) => new DOMPoint(x, y).matrixTransform(m), lo = at(b.x + b.width / 2, b.y + b.height), hi = at(b.x + b.width / 2, b.y);
  const ob = el.closest("[data-obj]"), z = ob && Number.isFinite(Number(ob.dataset.z)) ? Number(ob.dataset.z) : lo.y;
  const p = el.closest(".portal"), house = el.dataset.house;
  const door = p ? { to: p.dataset.to, house: p.dataset.house, room: p.dataset.room, tent: p.dataset.tent } : house ? { to: "treeroom", house } : null;
  return { x: lo.x, z, top: Math.min(lo.y, hi.y), door, hands: el.dataset.top === "hands" };
}
function startClimb() {
  climbLook = 0;
  const B = state.body, BG = state.background, node = bgShown.node;
  if (B.anim !== "climbup" || drag || entering || BG.kind === "none" || !node || climb) return;
  const fx = BG.figX ?? 0, fz = SCENE.ground + (BG.figY ?? 0), P = pic.getScreenCTM(), Pinv = P ? P.inverse() : null;
  let best = null;
  for (const el of node.querySelectorAll("[data-ladder]")) {
    const L = ladderAt(el, Pinv);
    if (!L) continue;
    const d = Math.hypot(L.x - fx, L.z - fz);
    if (!best || d < best.d) best = { ...L, d };
  }
  const anywhere = climbAnywhere;
  climbAnywhere = true;
  if (!best || (!anywhere && best.d > CLIMB_REACH)) { climb = { none: true, far: !!best, place: climbPlace(BG) }; changed(); return; }
  BG.figX = Math.round(best.x); BG.figY = Math.round(best.z - SCENE.ground + 2);
  B.facing = "back";   // (facing the ladder, away from us: ticket 138)
  climb = { place: climbPlace(BG), x: best.x, z: best.z + 2, top: best.top, door: best.door, hands: best.hands, start: performance.now(), done: false, through: false };
  changed();
}
// (ticket 145) A place's ladders and its pictures (and windows: a doorway
// with a view of its own, a nested svg), in the picture's units, measured
// after its drawing is mounted (never in draw(): it reads layout) and again
// whenever the scene's text changes; only while a controller is in use,
// which is all that needs them. marks.pics' box is the doorway's own
// bounds in its own units, for its glow.
let marks = { text: null, ladders: [], pics: [] }, marksLook = 0;
function measureMarks() {
  marksLook = 0;
  const node = bgShown.node, P = pic.getScreenCTM();
  if (!node || !P) return;
  const Pinv = P.inverse(), ladders = [], pics = [];
  for (const el of node.querySelectorAll("[data-ladder]")) {
    const L = ladderAt(el, Pinv);
    if (!L) continue;
    ladders.push(L);
    // (ticket 173: a ladder that is a way somewhere glows, as pictures and doors do, and X climbs it)
    if (!L.door) continue;
    const r = el.getBoundingClientRect(), M = el.getScreenCTM();
    if (!r.width || !r.height || !M) continue;
    const a = new DOMPoint(r.x, r.y).matrixTransform(Pinv), b = new DOMPoint(r.x + r.width, r.y + r.height).matrixTransform(Pinv), bb = el.getBBox();
    pics.push({ x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y), el, box: { x: bb.x, y: bb.y, width: bb.width, height: bb.height }, ladder: true });
  }
  for (const d of node.querySelectorAll(".portal")) {
    const view = d.querySelector(":scope > svg, :scope > image");
    // (ticket 147: a door glows too, its box its doorway's own: the first shape in it, not its sign)
    if (!view && d.hasAttribute("data-door")) {
      const shape = d.querySelector("path, rect"), M = d.getScreenCTM();
      if (!shape || !M) continue;
      const r = shape.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const a = new DOMPoint(r.x, r.y).matrixTransform(Pinv), b = new DOMPoint(r.x + r.width, r.y + r.height).matrixTransform(Pinv);
      const Mi = M.inverse(), p = new DOMPoint(r.x, r.y).matrixTransform(Mi), q = new DOMPoint(r.x + r.width, r.y + r.height).matrixTransform(Mi);
      const box = { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), width: Math.abs(q.x - p.x), height: Math.abs(q.y - p.y) };
      pics.push({ x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y), el: d, box, door: true });
      continue;
    }
    if (!view) continue;
    const r = svgBox(view);
    if (!r.width || !r.height) continue;
    const a = new DOMPoint(r.x, r.y).matrixTransform(Pinv), b = new DOMPoint(r.x + r.width, r.y + r.height).matrixTransform(Pinv);
    // (its glow's box: its frame, the doorway's own rects but the shadow
    // (see-through); else the view, a little larger. Not the doorway's
    // bounds: the scene inside a picture spills past it, hidden)
    const frames = [...d.querySelectorAll(":scope > rect:not([opacity])")].map(f => f.getBBox()).filter(f => f.width && f.height);
    const vb = { x: view.x.baseVal.value, y: view.y.baseVal.value, width: view.width.baseVal.value, height: view.height.baseVal.value };
    const box = frames.length ? frames.reduce((u, f) => { const x = Math.min(u.x, f.x), y = Math.min(u.y, f.y); return { x, y, width: Math.max(u.x + u.width, f.x + f.width) - x, height: Math.max(u.y + u.height, f.y + f.height) - y }; })
                              : { x: vb.x - 0.04 * vb.width, y: vb.y - 0.04 * vb.height, width: 1.08 * vb.width, height: 1.08 * vb.height };
    pics.push({ x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y), el: d, box });
  }
  marks = { text: bgShown.text, ladders, pics };
  showEnterGlow();
}
// (the ladder whose foot the friend stands at, if any)
function ladderNear() {
  const BG = state.background, fx = BG.figX ?? 0, fz = SCENE.ground + (BG.figY ?? 0), k = figureT.k;
  if (marks.text !== bgShown.text) return null;
  let best = null;
  for (const L of marks.ladders) {
    const dx = Math.abs(L.x - fx), dz = Math.abs(L.z - fz);
    if (dx > Math.max(24, 150 * k) || dz > Math.max(16, 110 * k)) continue;
    if (!best || dx + dz < best.d) best = { ...L, d: dx + dz };
  }
  return best;
}
function mountLadder(L) {
  const B = state.body, BG = state.background;
  if (BG.seat) standUp();
  if (B.pose !== "stand") strikePose("stand");
  B.anim = "climbup"; B.facing = "back";
  BG.figX = Math.round(L.x); BG.figY = Math.round(L.z - SCENE.ground + 2);
  climb = { place: climbPlace(BG), x: L.x, z: L.z + 2, top: L.top, door: L.door, hands: L.hands, start: performance.now(), done: false, through: false, manual: true, got: 0 };
}
// (ticket 145) The picture the controller's ✨ would go into: of those whose
// box is within reach of the friend's chest (twice the chest's height: about an arm's length) and
// whose bottom edge their feet are not far below (about their height, so
// one standing well in front of a wall can't reach up into its picture),
// the one whose middle is nearest. It glows: a rounded frame over the
// picture, inside its doorway (so it is in front of the picture and behind
// whatever stands nearer), kept while it stays the one.
let enterAt = null, enterGlow = null;
function enterTarget() {
  const BG = state.background, J = poseJoints, T = figureT;
  if (!padName || BG.kind === "none" || !J || !J.arms.length || !J.legs.length || entering || marks.text !== bgShown.text) return null;
  const at = (x, y) => [T.dx + T.k * x, T.dy + T.sg + T.k * (y - T.g)];
  const mean = ps => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  const A = mean(J.arms.map(a => a.A)), H = mean(J.legs.map(l => l.H)), [cx, cy] = at((A[0] + H[0]) / 2, (A[1] + H[1]) / 2);
  const torso = T.k * Math.hypot(A[0] - H[0], A[1] - H[1]), feet = Math.max(...J.legs.map(l => at(l.F[0], l.F[1])[1]));
  // (each within reach scored by how far it is over how far reach goes, so a
  // way and a picture can be weighed against each other: the lowest wins)
  let best = null;
  for (const p of marks.pics) {
    if (!p.el.isConnected) continue;
    // (ticket 185: a world square's way out is on the ground: near by the feet, on the floor, in depth: wayNearness)
    if (p.el.dataset && p.el.dataset.way) {
      const n = wayNearness(p.el.dataset.way);
      if (n < 1 && (!best || n < best.n)) best = { n, p };
      continue;
    }
    const d = Math.hypot(Math.max(p.x0 - cx, 0, cx - p.x1), Math.max(p.y0 - cy, 0, cy - p.y1));
    if (d > 2 * torso || feet - p.y1 > 3.6 * torso) continue;
    const n = Math.hypot((p.x0 + p.x1) / 2 - cx, (p.y0 + p.y1) / 2 - cy) / (2 * torso);
    if (!best || n < best.n) best = { n, p };
  }
  return best && best.p;
}
function showEnterGlow() {
  const p = enterTarget();
  enterAt = p;
  // (a way out glows on its own arrow, over the picture: not a frame in the picture under it)
  const way = p && p.el.dataset && p.el.dataset.way || null;
  worldWaysAim(way);
  if (way) { if (enterGlow) enterGlow.remove(); enterGlow = null; return; }
  if (enterGlow && enterGlow.isConnected && p && enterGlow.parentNode === p.el) return;
  if (enterGlow) enterGlow.remove();
  enterGlow = null;
  if (!p) return;
  const b = p.box, e = Math.max(2, 0.03 * Math.min(b.width, b.height)), r = 3 * e;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "enter-glow"); g.setAttribute("pointer-events", "none");
  g.innerHTML = `<rect x="${f1(b.x - e)}" y="${f1(b.y - e)}" width="${f1(b.width + 2 * e)}" height="${f1(b.height + 2 * e)}" rx="${f1(r)}" fill="#fff6a0" fill-opacity="0.14" stroke="#ffd23f" stroke-opacity="0.75" stroke-width="7" vector-effect="non-scaling-stroke"/>` +
                `<rect x="${f1(b.x - e)}" y="${f1(b.y - e)}" width="${f1(b.width + 2 * e)}" height="${f1(b.height + 2 * e)}" rx="${f1(r)}" fill="none" stroke="#fffbe0" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
  p.el.append(g);
  enterGlow = g;
}
function enterPicture() {
  const p = enterAt;
  if (!p || !p.el.isConnected || entering) return;
  if (p.ladder && climb && !climb.none) return;   // (on a ladder already: climbing it)
  if (climb && !climb.none) climb.through = true;   // (off the ladder, arriving: see draw)
  if (enterGlow) enterGlow.remove();
  enterGlow = null; enterAt = null;
  if (p.ladder) climbLadder(p.el);   // (ticket 173)
  else enterScene(p.el);
}
// (at the top of a ladder that is a doorway: through it, as a click would)
function climbThrough() {
  const c = climb, node = bgShown.node;
  if (!c || !c.door || !node || entering || state.body.anim !== "climbup") return;
  const door = node.querySelector(`.portal[data-to="${c.door.to}"]` + ["house", "room", "tent"].map(k => c.door[k] ? `[data-${k}="${c.door[k]}"]` : "").join(""));
  if (!door) return;
  c.through = true;
  enterScene(door);
}
// (ticket 142: two of them, "jump" short and fast and "jumphigh" high and
// slow, each with its own height and speed in the Body tab)
// (ticket 138) Jumping, once, not in a loop: crouching, arms back (the
// beginning), up in the air with the arms up and down again (the middle),
// landing on bent knees and standing up (the end); then back to what they
// were doing (jumpPrev: from the chip, standing still). JUMP_TIMES: where
// each part ends, in seconds. Their shadow stays on the ground.
let jumpStart = 0, jumpPrev = "none", jumpEnd = 0;
const JUMP_TIMES = [0.24, 0.82, 1.12];
const isJump = a => a === "jump" || a === "jumphigh";
// (ticket 143) where they stand is deep water (not a shallow stream)
const deepHere = () => { const W = state.background; return W.kind !== "none" && !SHALLOW_WATER[W.kind] && inWater(W, W.figX ?? 0, SCENE.ground + (W.figY ?? 0)); };
// (ticket 143) The jumps in deep water, moving the friend inside the water's
// mask (bob, a transform in their units: the waterline stays on the water),
// over JUMP_TIMES as the jumps on land. The short one, as in a pool jumping
// for a ball: a dip, up fast till the waist is out, the arms reaching up,
// and back in. The high one, turned to the side, a dolphin's dive: sinking
// a little, the arms going up in front of the head, out of the water in an
// arc, head first, the body turning over (from leaning forward to head
// down), in again ahead of where they left, and a roll back upright under
// the water; endJump moves them on by as much (jumpAhead). Facing us or away,
// the high one goes straight up and down, the arms overhead. A splash where
// they leave the water and where they come back in (splash: where, how far on).
let jumpAhead = 0;
function waterJump(B, hi, t, H, dir, lean, both) {
  const [c, f, l] = JUMP_TIMES, ease = x => x * x * (3 - 2 * x), Lb = state.shirt.length ?? 150;
  const up = side => -90 - (B.arms ?? 0) - lean(side), straight = -(B.elbows ?? 0), mixA = (a, b, u) => a + (b - a) * u;
  const splashAt = (x, t0) => t >= t0 && t < t0 + 0.32 ? { x, p: (t - t0) / 0.32 } : null;
  if (hi && dir) {
    const Hd = 1.2 * H, D = 0.9 * H;
    let dy, angle, dx = 0, armsUp, legs = 0;
    if (t < c) { const u = ease(t / c); dy = 18 * u; angle = 25 * u; armsUp = u; }
    else if (t < f) { const u = (t - c) / (f - c); dy = 18 * (1 - u) + 40 * u - Hd * Math.sin(Math.PI * u); angle = 25 + 130 * u; dx = D * u; armsUp = 1; }
    else { const u = ease((t - f) / (l - f)); dy = 40 * (1 - u); angle = 155 + 205 * u; dx = D; armsUp = 1 - u; legs = Math.sin(Math.PI * u); }
    jumpAhead = dir * D;
    return { ...both("Arm", sd => mixA(0, up(sd) + 4 * sd, armsUp)), ...both("Elbow", () => mixA(0, straight, armsUp)),
             ...both("Leg", sd => 14 * legs * sd), ...both("Knee", () => 20 * legs), water: true, jump: true,
             bob: `translate(${f1(dir * dx)} ${f1(dy)}) rotate(${f1(dir * angle)} 0 ${f1(Lb)})`, splash: splashAt(0, c + 0.05) || splashAt(dir * D, f - 0.06) };
  }
  jumpAhead = 0;
  const Hs = hi ? 1.2 * H : 1.4 * H, reach = hi ? 1 : 0.85;
  let dy, arms, knees;
  if (t < c) { const u = ease(t / c); dy = 10 * u; arms = 0; knees = 40 * u; }
  else if (t < f) { const u = (t - c) / (f - c); dy = 10 * (1 - u) - Hs * Math.sin(Math.PI * u); arms = Math.min(1, 2 * u) * reach; knees = 40 * (1 - u) + 25 * Math.sin(2 * Math.PI * u); }
  else { const u = (t - f) / (l - f); dy = 12 * Math.sin(Math.PI * u); arms = reach * (1 - u); knees = 15 * Math.sin(Math.PI * u); }
  return { ...both("Arm", sd => mixA(0, up(sd) + (hi ? 4 : 16) * sd, arms)), ...both("Elbow", () => mixA(0, hi ? straight : 12, arms)),
           ...both("Leg", sd => 6 * sd), ...both("Knee", () => knees), water: true, jump: true,
           bob: `translate(0 ${f1(dy)})`, splash: splashAt(0, c + 0.05) || splashAt(0, f - 0.04) };
}
function startJump(prev = "none", kind = "jump") {
  if (!isJump(prev)) jumpPrev = prev;
  jumpStart = performance.now();
  state.body.anim = kind;
}
function endJump() {
  jumpEnd = 0;
  // (after a dolphin's dive, they are where they came back up: ticket 143)
  if (jumpAhead) { const F = sceneFrame, BG = state.background; BG.figX = Math.round(clamp((BG.figX ?? 0) + jumpAhead * figureT.k, F.left, F.right)); jumpAhead = 0; }
  if (isJump(state.body.anim)) { state.body.anim = jumpPrev || "none"; solidUnstick(); changed();   // (ticket 149)
    // (ticket 162: landing on a pit's hole falls in)
    const BG = state.background, pit = !entering && BG.kind !== "none" ? pitAt(BG.figX ?? 0, SCENE.ground + (BG.figY ?? 0)) : null;
    if (pit) enterScene(pit); }
}
function moveNow() {
  const B = state.body, a = B.anim;
  if (!a || a === "none" || poseHeld) return treadNow();
  const u = lfoNow("B").phase, T = 2 * Math.PI, sin = f => Math.sin(T * u * f), cos = f => Math.cos(T * u * f);
  const dir = facingOf(B), lean = side => dir ? (side === dir ? -14 : 4) : 0;
  const both = (k, f) => ({ [k + "L"]: f(1), [k + "R"]: f(-1) });
  if (a === "swim") return treadNow() || treadStroke(1, u);
  // (ticket 141) swimming fast (the controller's run, in water): the stroke twice as quick
  if (a === "swimfast") return { ...treadStroke(1, (2 * u) % 1), water: true };
  // (ticket 141) crouching down, held there: the knees bent, the arms a little forward
  if (a === "crouch") return { ...both("Leg", () => 34), ...both("Knee", () => 75), ...both("Arm", sd => -18 - lean(sd)), ...both("Elbow", () => 25), held: true, grounded: true };
  if (a === "walk") {
    // (each leg swinging forward and back, its knee bending as it comes
    // through; each arm swinging with the other leg; a small lift each step)
    // (ticket 140) toward us or away: each foot in turn raised as its leg
    // swings toward us (or away), the leg seen shorter (Step: how much
    // shorter, a share of it), never splayed out to the side, and the feet
    // seen front on (or from behind), the sole showing as a foot lifts
    // (frontFeet); a small lift each step
    const s = sin(1), c = cos(1);
    if (!dir) return { ...both("Step", sd => 0.16 * Math.max(0, sd * s)), ...both("Arm", sd => 8 * sd * s), ...both("Elbow", () => 10),
                       lift: 3 * Math.abs(s), frontFeet: 0.16 };
    return { ...both("Leg", sd => 24 * sd * s), ...both("Knee", sd => 30 * Math.max(0, sd * c)),
             ...both("Arm", sd => 20 * sd * s), ...both("Elbow", () => 14), lift: 3 * Math.abs(c) };
  }
  if (a === "run") {
    // (twice as quick: long strides, the back foot kicked high, the elbows
    // bent, the arms pumping, a bound each step)
    const s = sin(2), c = cos(2);
    if (!dir) return { ...both("Step", sd => 0.3 * Math.max(0, sd * s)), ...both("Arm", sd => 14 * sd * s - 10), ...both("Elbow", () => 80),
                       lift: 8 * Math.abs(s), frontFeet: 0.3 };
    return { ...both("Leg", sd => 40 * sd * s), ...both("Knee", sd => 25 + 70 * Math.max(0, sd * c)),
             ...both("Arm", sd => 32 * sd * s - 10), ...both("Elbow", () => 85), lift: 9 * Math.abs(c) };
  }
  if (a === "crawl") {
    // (on hands and knees: turned about the hips, by as much as puts the
    // hands and the knees on the ground together for this friend's arms,
    // thighs and body (cos turn = (arm - thigh) / body, between 50 and 100
    // degrees); each thigh straight down, each shin level behind, the feet
    // soles up, the arms straight down; a hand and the other knee forward
    // together)
    const body = Math.max(40, (state.shirt.length ?? 150) - 8), thigh = (B.legLen ?? 140) / 2, arm = B.armLen ?? 95;
    const tilt = Math.max(50, Math.min(100, Math.acos(Math.max(-1, Math.min(1, (arm - thigh) / body))) * 180 / Math.PI));
    const s = sin(1), t0 = (B.knees ?? 0) / 2, b0 = B.knees ?? 0, swing = sd => 12 * sd * s;
    return { ...both("Leg", sd => tilt - swing(sd) - t0), ...both("Knee", sd => 90 - swing(sd) - b0),
             ...both("Arm", sd => 90 - tilt - (B.arms ?? 0) - lean(sd) + 14 * sd * s), ...both("Elbow", () => -(B.elbows ?? 0)),
             ...both("Foot", () => -(180 - tilt)), rot: dir ? tilt * dir : 0 };
  }
  if (isJump(a)) {
    const hi = a === "jumphigh", rate = Math.max(0.1, Number(hi ? B.jumpHighS ?? 75 : B.jumpShortS ?? 150) || 100) / 100;
    const t = (performance.now() - jumpStart) / 1000 * rate, [c, f, l] = JUMP_TIMES, ease = x => x * x * (3 - 2 * x);
    const H = Math.max(0, Number(hi ? B.jumpHighH ?? 90 : B.jumpShortH ?? 30) || 0) / 100 * (B.legLen ?? 140);
    if (t >= l) { if (!jumpEnd) jumpEnd = setTimeout(endJump, 0); return treadNow(); }
    if (deepHere()) return waterJump(B, hi, t, H, dir, lean, both);
    let bend, arm, lift = 0;
    if (t < c) { const u = ease(t / c); bend = 0.8 * u; arm = 35 * u; }
    else if (t < f) { const u = (t - c) / (f - c); lift = H * 4 * u * (1 - u); bend = 0.8 * (1 - u) * (1 - u) + 0.35 * Math.sin(Math.PI * u); arm = 35 - 150 * Math.sin(Math.PI * Math.min(1, u * 1.6)); }
    else { const u = (t - f) / (l - f); bend = 0.7 * Math.sin(Math.PI * Math.min(1, u * 1.3)); arm = -25 * (1 - u); }
    return { ...both("Leg", () => 40 * bend), ...both("Knee", () => 85 * bend), ...both("Arm", () => arm), ...both("Elbow", () => 15), lift, jump: true, grounded: true };
  }
  if (a === "fall") {
    // (ticket 162) falling into a pit: the arms flung up, reaching as in
    // climbing; the legs a little apart and bent. Held (no frames of its
    // own): the drop moves the drawing, which a new drawing would undo
    const up = side => -80 - (B.arms ?? 0) - lean(side);
    return { ...both("Arm", sd => up(sd) + 18 * sd), ...both("Elbow", () => 22),
             ...both("Leg", sd => 10 * sd), ...both("Knee", () => 26), held: true };
  }
  if (a === "climbup") {
    // (ticket 137) up a ladder that stands in the place (see climb, below),
    // facing it, away from us: the stroke of climbing with a ladder of their own, without
    // one; still while there is no ladder to climb, and holding on, still,
    // at its top (held: no more frames)
    if (!climb || climb.none) return treadNow();
    // (ticket 174, Matthew: the arms "should be taking turns grabbing upward,
    // and pulling the body, but they just wave around instead") Each hand in
    // turn holds a rung while the body rises past it, its height above the
    // shoulder falling from CLIMB_HAND_HI to CLIMB_HAND_LO of the arm's length
    // exactly as far as the body rises, so the hand stays on the rung; then it
    // lets go and reaches up for the next, in a quick arc a little out. The
    // other hand is half a cycle behind: both hold for a moment between. A
    // cycle is reckoned by how far they have climbed (climb.at), not by the
    // clock, so the hands keep to the rungs at any speed, by hand or not, and
    // stop with the climb. The legs step on the same cycle. Each arm's two
    // bones from the shoulder to where its hand is, the elbow out (as posing
    // by touch solves them: poseTo).
    const J = poseJoints, al = J && J.armLen ? J.armLen : 120, half = al / 2, deg = r => r * 180 / Math.PI;
    const rise = (climb.at || 0) / (figureT.k || 1), cyc = (CLIMB_HAND_HI - CLIMB_HAND_LO) * al / CLIMB_PULL, w = ((rise / cyc) % 1 + 1) % 1;
    const hand = sd => {
      const p = (w + (sd > 0 ? 0 : 0.5)) % 1;
      let h, out;
      if (p < CLIMB_PULL) { h = CLIMB_HAND_HI - (CLIMB_HAND_HI - CLIMB_HAND_LO) * p / CLIMB_PULL; out = 0.12; }
      else { const q = (p - CLIMB_PULL) / (1 - CLIMB_PULL), e = q * q * (3 - 2 * q); h = CLIMB_HAND_LO + (CLIMB_HAND_HI - CLIMB_HAND_LO) * e; out = 0.12 + 0.22 * Math.sin(Math.PI * q); }
      // (in the arm's own terms: x out from the body, y down; the hand above the shoulder)
      const dx = out * al, dy = -h * al, d = Math.max(0.2 * half, Math.min(Math.hypot(dx, dy), 2 * half - 0.01));
      const phi = deg(Math.atan2(dy, dx)), g = deg(Math.acos(d / (2 * half)));
      return { up: phi + g, bend: 2 * g };
    };
    const hl = hand(1), hr = hand(-1), s = Math.sin(2 * Math.PI * w);
    return { ArmL: hl.up - (B.arms ?? 0) - lean(1), ArmR: hr.up - (B.arms ?? 0) - lean(-1), ElbowL: hl.bend - (B.elbows ?? 0), ElbowR: hr.bend - (B.elbows ?? 0),
             ...both("Leg", sd => 8 * Math.max(0, sd * s)), ...both("Knee", sd => 55 * Math.max(0, sd * s)), held: climb.manual || climb.done };
  }
  if (a === "climb") {
    // (ticket 137) seen from the side, the ladder in front of them: a hand
    // reaching up and forward for the next rung while the other pulls, the
    // knee on its side coming up to the next rung, the rungs going down
    if (dir) {
      const s = sin(1), up = side => -52 - (B.arms ?? 0) - lean(side);
      return { ...both("Arm", sd => up(sd) - 22 * sd * s), ...both("Elbow", sd => 6 + 14 * Math.max(0, -sd * s)),
               ...both("Leg", sd => 8 + 36 * Math.max(0, sd * s)), ...both("Knee", sd => 16 + 62 * Math.max(0, sd * s)), lift: 5 * Math.abs(s), ladder: u };
    }
    // (facing us on a ladder: a hand reaching up for the next rung while the
    // other pulls, the knee on its side lifting, the rungs going down)
    const s = sin(1), up = side => -80 - (B.arms ?? 0) - lean(side);
    return { ...both("Arm", sd => up(sd) + 30 * sd * s), ...both("Elbow", sd => 20 + 30 * Math.max(0, -sd * s)),
             ...both("Leg", sd => 8 * Math.max(0, sd * s)), ...both("Knee", sd => 55 * Math.max(0, sd * s)), lift: 5 * Math.abs(s), ladder: u };
  }
  return treadNow();
}
// The friend standing in water, in their own units: what was drawn of them
// (`inner`) see-through below the waterline, their waist (wl), as much as
// "🌊 see-through in the water" says; and a wake round them on the water as
// big as its slider says: rings spreading and fading, as at the foot of the
// falls, and foam going round where the water meets them, each ring's far
// half behind them and its near half in front. The waterline is a gentle
// wave, and still: a moving mask would draw all of them again every frame.
// The rings keep fixed times (constant begins), so drawing the friend again,
// as every move of a drag does, never jumps them. hw: their half width at
// the waist. With both settings at 0, nothing changes.
function wading(B, inner, wl, hw, most = Infinity, bob = 0, water = "") {
  const see = Math.max(0, Math.min(100, Number(B.waterSee ?? 70) || 0)) / 100, wake = Math.max(0, Number(B.waterWake ?? 100) || 0) / 100;
  // (treading, the friend bobs in the water: they move, the waterline doesn't)
  // (ticket 143: or a jump in the water, a whole transform)
  let svg = typeof bob === "string" ? `<g transform="${bob}">${inner}</g>` : bob ? `<g transform="translate(0 ${f1(bob)})">${inner}</g>` : inner;
  // (white above the waterline, a bow each 40 or so across, 4 up or down;
  // below it, white only where the water is in the picture (`water`, its
  // shape round them), and faint, so they are faint there and hidden where
  // the shore, the sand or the grass is in front of them)
  const X = hw + 80, n = 2 * Math.ceil(X / 40), st = 2 * X / n;
  let line = `M-5000 ${f1(wl)} H${f1(-X)}`;
  for (let i = 0; i < n; i++) line += ` q${f1(st / 2)} ${i % 2 ? 8 : -8} ${f1(st)} 0`;
  // (ticket 151) Two clipped copies, not a mask: the friend whole above the
  // wave, and below it, only where the water is, faint (1 - see). A mask is
  // drawn again offscreen, pixel by pixel, on every frame the friend moves:
  // walking in the castle's moat at 1920 wide it held the page to 49 frames
  // a second, and swimming in the duck pond to 52 (59 and 60 without it).
  const body = svg;
  svg = `<clipPath id="water-above"><path d="${line} H5000 V-5000 H-5000 Z"/></clipPath><g clip-path="url(#water-above)">${body}</g>` +
        (see < 1 && !sceneryStill() && !SPEED_TEST.noUnder ? `<clipPath id="water-below"><path d="${line} H5000 V5000 H-5000 Z"/></clipPath><clipPath id="water-in">${water}</clipPath>` +
                   `<g clip-path="url(#water-below)"><g clip-path="url(#water-in)"${see > 0 ? ` opacity="${(1 - see).toFixed(2)}"` : ""}>${body}</g></g>` : "");
  if (wake <= 0 || SPEED_TEST.noRings) return svg;
  const stillWake = sceneryStill();   // (ticket 164: on a slow computer, the rings held still)
  // (three rings a third of the way apart, as flat as the pool's; the foam
  // in dashes, going round)
  const r0 = hw + 12, r1 = Math.max(r0 + 20, Math.min(r0 + 220 * wake, most)), flat = 0.16;
  const ring = begin => { const t = `dur="2.4s" begin="${begin}" repeatCount="indefinite"`;
    return `<ellipse cx="0" cy="${f1(wl)}" rx="${f1(r0)}" ry="${f1(r0 * flat)}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.8">` +
      `<animate attributeName="rx" values="${f1(r0)};${f1(r1)}" ${t}/><animate attributeName="ry" values="${f1(r0 * flat)};${f1(r1 * flat)}" ${t}/>` +
      `<animate attributeName="opacity" values="0.8;0" ${t}/></ellipse>`; };
  const rf = hw + 6, rings = `<ellipse cx="0" cy="${f1(wl)}" rx="${f1(rf)}" ry="${f1(rf * flat)}" fill="none" stroke="#ffffff" stroke-width="7" stroke-dasharray="9 7" stroke-linecap="round" opacity="0.75">` +
    `<animate attributeName="stroke-dashoffset" values="0;-32" dur="1.2s" begin="0s" repeatCount="indefinite"/></ellipse>` +
    (stillWake ? "" : ["0s", "-0.8s", "-1.6s"].map(ring).join(""));   // (still: the foam only, without its dashes going round)
  const ringsHere = stillWake ? rings.replace(ANIMS_RE, "") : rings;
  // (the rings are on the water: only where it is, as the friend's under-water part)
  return `<clipPath id="water-far"><rect x="-5000" y="-5000" width="10000" height="${f1(wl + 5000)}"/></clipPath>` +
         `<clipPath id="water-near"><rect x="-5000" y="${f1(wl)}" width="10000" height="5000"/></clipPath>` +
         `<clipPath id="water-area">${water}</clipPath>` +
         `<g clip-path="url(#water-far)"><g clip-path="url(#water-area)">${ringsHere}</g></g>${svg}` +
         `<g clip-path="url(#water-near)"><g clip-path="url(#water-area)">${ringsHere}</g></g>`;
}

// A scene's options, as it reads them: its background's settings, and, as
// o["lfo:A"] (B, C), what it shows of an LFO: its length, shape and depth, and
// where its wave is. The mixer's LFOs are not background settings, so a scene
// following one reads it this way, and a change to that LFO on the mixing
// board draws that scene again (partByReads), and no other.
const sceneOpts = BG => new Proxy(BG, { get: (t, key) => typeof key === "string" && key.startsWith("lfo:") ? lfoStamp(key.slice(4)) : t[key] });
const lfoStamp = L => { const lf = lfoNow(L); return lf ? [lf.dur.toFixed(4), lf.shape, lf.amp.toFixed(2), lfoBegin(lf, 0)].join() : ""; };
// (ticket 121) The friend posed limb by limb: each arm's own turn at the
// shoulder and bend at the elbow, each leg's at the hip and knee, in
// degrees, added to the sliders' (which move both alike). By the friend's
// own side: L is their left, on our right (side 1); R their right (side -1).
// (ticket 124) which way the friend faces: 0 toward us, -1 in profile to our
// left, 1 to our right
const facingOf = B => B.facing === "left" ? -1 : B.facing === "right" ? 1 : 0;
// (ticket 144) facing us, turned partway: -1 to our left, 1 to our right, 0
// not turned. The cheap three-quarter view: the drawing facing us, the
// body narrower, the far arm behind it, the face's features slid the way
// they turn. Only facing us; set by the controller's diagonals toward us,
// and cleared wherever the facing is set otherwise.
const turnOf = B => B.facing !== "front" ? 0 : B.turn === "left" ? -1 : B.turn === "right" ? 1 : 0;
const POSE_KEYS = ["poseArmL", "poseArmR", "poseElbowL", "poseElbowR", "poseLegL", "poseLegR", "poseKneeL", "poseKneeR", "poseFootL", "poseFootR"];
// (ticket 129) the pose menu: whole poses for the friend, each the pose's
// own turns and bends (degrees, by side: L their left, on our right),
// with what else the pose needs. Standing is all of them zero.
const POSES = {
  // cross-legged on the ground, hands in the lap, eyes closed: each thigh
  // out and a little down, each shin back across in front of the other,
  // the feet turned soles up
  meditate: { pose: { poseLegL: 72, poseLegR: 72, poseKneeL: 158, poseKneeR: 150, poseFootL: 70, poseFootR: 70,
                      poseArmL: 30, poseArmR: 30, poseElbowL: -90, poseElbowR: -90 }, closed: true },
  // dances, one picked at random each time, never the same twice in a row
  // (ticket 136) jumping up into a hug, held up off the ground: the legs as
  // sitting (thighs forward, shins down), so in profile they wrap round the
  // one hugged, the near leg in front of them and the far one behind (see
  // legApart in draw); the arms reach forward round their neck
  hug: { pose: { poseArmL: -40, poseArmR: -34, poseElbowL: 40, poseElbowR: 34, poseKneeL: 12, poseKneeR: 12 } },
  dance: [
    { name: "disco", pose: { poseArmL: -105, poseElbowL: 10, poseArmR: 40, poseElbowR: 95, poseLegR: 28, poseKneeR: 40 } },
    { name: "ballet", pose: { poseArmL: -150, poseElbowL: -35, poseArmR: -45, poseElbowR: 15, poseLegL: 55, poseKneeL: 95, poseFootL: 40 } },
    { name: "hooray", pose: { poseArmL: -135, poseElbowL: -10, poseArmR: -135, poseElbowR: -10, poseLegL: 18, poseLegR: 18 } },
    { name: "robot", pose: { poseArmL: -55, poseElbowL: 90, poseArmR: -55, poseElbowR: -90, poseKneeL: 35, poseKneeR: 5 } },
    { name: "kick", pose: { poseArmL: -60, poseElbowL: 60, poseArmR: -60, poseElbowR: 60, poseLegR: 80, poseKneeR: 10, poseFootR: 30 } },
  ],
};
let lastDance = null;
function strikePose(which) {
  const B = state.body, F = state.face;
  for (const k of POSE_KEYS) B[k] = 0;
  B.pose = which; B.sit = which === "sit";
  // (standing and sitting keep the way they face; the others face us: ticket 132)
  if (which === "stand" || which === "sit") { F.closed = false; return; }
  // (a hug is seen from the side: facing us, they turn to our right)
  if (which === "hug") { F.closed = false; if (!facingOf(B)) B.facing = "right"; Object.assign(B, POSES.hug.pose); return; }
  B.facing = "front"; B.turn = "";
  let P = POSES[which];
  if (Array.isArray(P)) { const left = P.filter(d => d.name !== lastDance); P = left[Math.floor(Math.random() * left.length)]; lastDance = P.name; }
  Object.assign(B, P.pose);
  F.closed = !!P.closed;
}
const poseOf = (B, what, side) => Number(B["pose" + what + (side > 0 ? "L" : "R")]) || 0;
const posed = B => POSE_KEYS.some(k => Number(B[k]));
// where each joint was drawn, in the figure's units, for grabbing them
// (draw fills it in): shoulders, elbows, hands; hips, knees, feet, by side
let poseJoints = null;
// while a joint is held (the drag below): which, and the ground the friend
// stood on when it was grabbed, kept till it is let go, so the friend stays
// put under the finger even as the lower foot changes
let poseHeld = null;
// (ticket 123) the treading friend's own redraws: the next frame asked for, and when the last was drawn
let treadLoop = 0, treadLast = 0;
// (ticket 164) Is this a slow computer? The time a drawing takes, on
// average (a drawing that built the place anew leaves it out: that says
// nothing about the computer): over SLOW_IN ms, after 30 drawings, it is
// slow, and under SLOW_OUT it is not again (so it does not flip back and
// forth). Kept in this browser ("dress-up-slow"), so a slow computer starts
// still next time, and is measured again. On a slow computer the scenery's
// animations, the wake and the faint copy under the water hold still
// (sceneryStill), unless 🌀 moving scenery on a slow computer is on.
const SLOW_IN = 6, SLOW_OUT = 2.5;
let slowAvg = 0, slowN = 0, slowFlag = false;
try { slowFlag = localStorage.getItem("dress-up-slow") === "1"; } catch (e) { /* (measured afresh) */ }
// (ticket 164) Or frames dropping while the friend moves: the black laptop
// draws the friend in 1 ms, as fast as Matthew's laptop, yet the duck pond
// was choppy there. Over each CHOPPY_FRAMES (60) frames of movement (moved(), the
// controller's steps and a drag's frames; a gap over 250 ms is a pause,
// not a frame), more than CHOPPY_LATE of them later than 25 ms, in
// CHOPPY_WINDOWS such windows in a row, makes this computer choppy (the
// black laptop's duck pond: 62 to 100% late; a fast one has 0 to 9%), and
// it stays so for the visit (0.0.93: 60 frames a window, not 120: at the
// iPad's 22 frames a second two windows of 120 took 11 s of moving before
// the places were held still, on every visit): with the places held still its frames come
// back, and it would only flip back and forth. Not across visits (0.0.92,
// ticket 172): kept in the browser, one bad moment held Matthew's laptop
// still on every visit after (its 🧪 on 0.0.91: 57 to 61 frames a second
// in every pass, yet found choppy); each visit measures afresh. A trip
// through a doorway does not count: its arrival's frame is long by nature.
const CHOPPY_LATE = 0.25, CHOPPY_WINDOWS = 2, CHOPPY_FRAMES = 60;
let choppy = false, moveFrameLast = 0, moveFrames = 0, moveLate = 0, moveSuspend = false, choppyRun = 0;
try { localStorage.removeItem("dress-up-choppy"); } catch (e) { /* (nothing kept) */ }
function noteMoveFrame(t) {
  if (moveSuspend || entering) return;   // (🧪 the speed check; a trip)
  const g = t - moveFrameLast;
  moveFrameLast = t;
  if (g <= 0 || g > 250) return;
  moveFrames++;
  if (g > 25) moveLate++;
  if (moveFrames < CHOPPY_FRAMES) return;
  choppyRun = moveLate > CHOPPY_LATE * moveFrames ? choppyRun + 1 : 0;
  if (!choppy && choppyRun >= CHOPPY_WINDOWS) { choppy = true; setTimeout(changed, 0); }
  moveFrames = moveLate = 0;
}
// (SPEED_TEST.still: 🧪's passes held still; slowFlag would not do, as draw()
// takes it back after one drawing on a computer that draws fast: 0.0.92)
const sceneryStill = () => (SPEED_TEST.still || slowFlag || choppy) && !PERF.slowMoving;
// (ticket 164, 0.0.86) 🧪's test passes, each taking one part of a place
// away while the friend swims, to find what costs the black laptop its
// frames: holder, a group drawn instead of the place's scenery (empty, or
// the place as a still picture), with the friend in front of it all;
// noUnder, no faint copy of the friend under the water; noRings, no rings;
// (0.0.87) noPic, no still picture (below); bitmap, the still picture as a
// bitmap. Only the speed check sets them, and it puts them back.
const SPEED_TEST = { holder: null, noUnder: false, noRings: false, noPic: false, svg: false, still: false };
// (ticket 164, 0.0.87) On a slow computer, while the friend moves, the
// place is drawn as still pictures. The black laptop's 🧪 (0.0.86) swam the
// duck pond at 30 frames a second as it is, and at 59 with its scenery one
// still picture: Firefox paints a picture once instead of its ~1,000 shapes
// every frame. The scene is cut where the friend goes in it (before the
// first standing object nearer than their feet, and their far arm's place
// before that: see draw), and each part is one picture, so the friend stays
// behind and in front of the same things as ever. The scene itself stays,
// hidden, so doorways, ladders and the ✨ glow measure it as before (a copy
// of the glow is shown over its picture). The pictures are made before they
// are needed, for the place and the friend's depth, and again when the
// friend goes past an object's depth; until they are ready the scene is
// drawn as it is. STILL_PIC_HOLD ms after the last move the scene itself is
// shown again, where clicks reach it. Since 0.0.93 each part is a bitmap
// (drawn once into a canvas at the screen's own pixels): the iPad's 🧪 on
// 0.0.92 swam the pond at 24 frames a second with the parts as svg pictures
// (Safari draws an svg picture again every frame) and at 60 as bitmaps; an
// svg picture is the fallback where a bitmap can't be made (bitmapOk).
const STILL_PIC_HOLD = 400, STILL_PARTS = 6, STILL_RES = "defs, linearGradient, radialGradient, pattern, clipPath, mask, filter, symbol, marker, style";
const stillPic = { gen: 0, node: null, text: null, vb: null, bitmap: false, off: "", parts: new Map(), shown: [], on: false, onNode: null, glow: null, glowOf: null, bitmapOk: null, drawsOn: 0, draws: 0,
  painted: new WeakSet(), sceneHidden: false };   // (ticket 177: the pictures that have had a frame to paint; whether the scene is hidden)
let stillPicUntil = 0, stillPicEnd = 0;
const stillPicWanted = () => !!bgShown.node && sceneryStill() && !SPEED_TEST.holder && !SPEED_TEST.noPic;
// (the parts' pictures, kept while the place, its frame and its hidden objects stay as they are)
function stillPicReset() {
  const vb = pic.getAttribute("viewBox"), off = [...objectsOff(state.background)].join(",");
  // (the picture's size on the screen too, for a bitmap's pixels: in steps of 32 px)
  const bitmap = !SPEED_TEST.svg, size = bitmap ? Math.round(pic.getBoundingClientRect().width * (devicePixelRatio || 1) / 32) : 0;
  if (stillPic.node === bgShown.node && stillPic.text === bgShown.text && stillPic.vb === vb && stillPic.bitmap === bitmap && stillPic.size === size && stillPic.off === off) return;
  showStillPic(null);
  for (const p of stillPic.parts.values()) { if (p.img) p.img.remove(); if (p.url) URL.revokeObjectURL(p.url); }
  Object.assign(stillPic, { gen: stillPic.gen + 1, node: bgShown.node, text: bgShown.text, vb, bitmap, size, off, parts: new Map(), shown: [], painted: new WeakSet() });
}
// a part's picture: what the scene draws from just after object lo - 1 (from
// its start, for 0) to just before object hi (to its end, for the last),
// counting bgShown.objs in their drawing order
function stillPart(lo, hi) {
  const key = lo + ":" + hi;
  let p = stillPic.parts.get(key);
  if (p) return p;
  p = { lo, hi, img: null, url: null, ready: false, used: performance.now() };
  stillPic.parts.set(key, p);
  const gen = stillPic.gen, node = stillPic.node, bitmap = stillPic.bitmap, vb = stillPic.vb, NS = "http://www.w3.org/2000/svg";
  setTimeout(async () => {
    if (gen !== stillPic.gen || !node.isConnected || stillPic.parts.get(key) !== p) return;
    const objs = bgShown.objs;
    objs.forEach((o, i) => o.node.setAttribute("data-still-obj", i));
    for (const n of figShown) if (n.setAttribute) n.setAttribute("data-still-out", "");
    const copy = node.cloneNode(true);
    objs.forEach(o => o.node.removeAttribute("data-still-obj"));
    for (const n of figShown) if (n.removeAttribute) n.removeAttribute("data-still-out");
    copy.removeAttribute("style");
    for (const n of copy.querySelectorAll("[data-still-out], [data-still-pic], .enter-glow")) n.remove();
    const full = copy.cloneNode(true), defs = document.createElementNS(NS, "defs");
    // (pos: 0 before the first object, k + 1 from object k on)
    let pos = 0;
    const walk = el => {
      for (const c of [...el.children]) {
        if (c.matches(STILL_RES)) continue;
        const k = c.getAttribute("data-still-obj");
        if (k !== null) pos = +k + 1;
        else if (c.querySelector("[data-still-obj]")) { walk(c); continue; }   // (a group with objects in it, part by part)
        if (pos < lo || pos > hi) { for (const r of c.querySelectorAll(STILL_RES)) defs.append(r); c.remove(); }
      }
    };
    walk(copy);
    // (a shape drawn again elsewhere by <use>: kept for it, if the part left it out)
    for (const u of copy.querySelectorAll("use")) {
      const id = (u.getAttribute("href") || u.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "").replace(/^#/, "");
      if (!id || copy.querySelector(`[id="${CSS.escape(id)}"]`) || defs.querySelector(`[id="${CSS.escape(id)}"]`)) continue;
      const t = full.querySelector(`[id="${CSS.escape(id)}"]`);
      if (t) defs.append(t.cloneNode(true));
    }
    copy.prepend(defs);
    // (the picture's frame and 3% more round it: a scene may draw a sliver past the frame, at its edges)
    const [x, y, w, h] = (([x, y, w, h]) => [x - 0.03 * w, y - 0.03 * h, 1.06 * w, 1.06 * h])(vb.split(" ").map(Number));
    const doc = `<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${f1(w)}" height="${f1(h)}" viewBox="${f1(x)} ${f1(y)} ${f1(w)} ${f1(h)}">` +
                new XMLSerializer().serializeToString(copy) + `</svg>`;
    let url = URL.createObjectURL(new Blob([doc], { type: "image/svg+xml" }));
    if (bitmap) {
      // (drawn once into pixels at this screen's size: see above)
      try {
        const im = new Image(); im.src = url; await im.decode();
        // (pixels per unit as the screen shows the picture: its frame, without the 3% round it, across its box)
        const r = pic.getBoundingClientRect(), k = Math.min(r.width / (w / 1.06), r.height / (h / 1.06)) * (devicePixelRatio || 1);
        const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        const blob = await new Promise(res => c.toBlob(res, "image/png"));
        if (!blob) throw new Error("no bitmap");
        URL.revokeObjectURL(url); url = URL.createObjectURL(blob); stillPic.bitmapOk = true;
      } catch (e) { stillPic.bitmapOk = false; }
    }
    if (gen !== stillPic.gen || !node.isConnected || stillPic.parts.get(key) !== p) { URL.revokeObjectURL(url); return; }   // (a new place, or this part let go)
    const img = document.createElementNS(NS, "image");
    for (const [k, v] of [["x", x], ["y", y], ["width", w], ["height", h]]) img.setAttribute(k, f1(v));
    img.setAttribute("preserveAspectRatio", "none"); img.setAttribute("pointer-events", "none"); img.setAttribute("data-still-pic", "");
    img.style.visibility = "hidden";
    // (ticket 177: ready only once its pixels are decoded, not just loaded: a
    // picture shown before then paints nothing for a frame, and with the scene
    // hidden behind it that frame is the page's white, a flash while moving.
    // Decoded twice over, as browsers differ: the element's own decode() where
    // it has one, an Image of the same URL kept beside it, and decoding="sync"
    // so a picture not yet decoded is painted late, never blank)
    img.setAttribute("decoding", "sync");
    const pre = new Image();
    const loaded = new Promise(res => img.addEventListener("load", res, { once: true }));
    img.setAttribute("href", url);
    pre.src = url;
    // (0.0.97: the element's own decode() waits at most a quarter second. In
    // Chrome it never settled, for an <image> not yet in the page, so no
    // part was ever ready, and a slow computer drew its place live: the
    // gate's still-pictures case, 0% of drawings with them in 0.0.95 and
    // 0.0.96, 99% before. The kept Image's decode is the one that counts.)
    const own = img.decode ? Promise.race([img.decode().catch(() => {}), new Promise(r => setTimeout(r, 250))]) : null;
    // (0.0.116, Matthew: find why the still pictures never switch on in
    // Chrome. stills164 on GitHub: both decodes finish, but Chrome never
    // fires the <image>'s load, not in 3 s, so no part was ever ready: the
    // gate's 0% since 0.0.95. Its load waits at most a quarter second too;
    // the kept Image's decode, which does finish, still counts)
    const loadedOrNot = Promise.race([loaded, new Promise(r => setTimeout(r, 250))]);
    Promise.all([loadedOrNot, own, pre.decode().catch(() => {})])
      .then(() => { if (gen === stillPic.gen && stillPic.parts.get(key) === p) { p.pre = pre; p.ready = true; } });
    node.append(img);   // (hidden, at the scene's end, until wanted)
    Object.assign(p, { img, url });
  }, 0);
  return p;
}
// (from draw, before the friend is put in: the parts for where the friend
// goes, behind (their far arm's object) and ahead (their own), made if they
// are not yet; while the friend moves and all are ready, the parts, in their
// drawing order at the scene's end)
function stillLayers(farNode, behind, ahead) {
  if (!stillPicWanted()) return null;
  stillPicReset();
  const N = bgShown.objs.length, at = n => { const i = n ? bgShown.objs.findIndex(o => o.node === n) : -1; return i < 0 ? N : i; };
  const r = at(ahead), f = farNode ? at(behind) : r;
  const parts = [stillPart(0, f), f < r ? stillPart(f + 1, r) : null, r < N ? stillPart(r + 1, N) : null];
  // (at most STILL_PARTS kept: each is a picture the size of the screen in memory; the longest unused goes)
  const now = performance.now();
  for (const q of parts) if (q) q.used = now;
  if (stillPic.parts.size > STILL_PARTS) {
    const old = [...stillPic.parts.entries()].filter(([, q]) => !parts.includes(q)).sort((a, b) => a[1].used - b[1].used);
    for (const [k, q] of old.slice(0, stillPic.parts.size - STILL_PARTS)) {
      if (q.img) q.img.remove(); if (q.url) URL.revokeObjectURL(q.url);
      stillPic.parts.delete(k); stillPic.shown = stillPic.shown.filter(m => m !== q.img);
    }
  }
  if (!(performance.now() < stillPicUntil && !poseHeld && !entering && parts.every(q => !q || q.ready))) return null;
  const imgs = parts.filter(Boolean).map(q => q.img);
  if (imgs.some((m, i) => i && !(imgs[i - 1].compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING))) bgShown.node.append(...imgs);
  return parts;
}
// the pictures on (the scene hidden, the friend and the glow's copy shown)
// or off, written only when it changes
function showStillPic(parts) {
  const node = bgShown.node;
  if (stillPic.on && stillPic.onNode !== node) { stillPic.on = false; stillPic.shown = []; stillPic.sceneHidden = false; }
  const want = parts ? parts.filter(Boolean).map(q => q.img) : [];
  if (want.length !== stillPic.shown.length || want.some((m, i) => m !== stillPic.shown[i])) {
    for (const m of stillPic.shown) if (!want.includes(m)) m.style.visibility = "hidden";
    for (const m of want) m.style.visibility = "visible";
    stillPic.shown = want;
  }
  const on = !!parts;
  // (ticket 177) a picture shown for the first time may paint a frame late,
  // on a browser that decodes it only then: the scene stays visible under it
  // for that frame, and is hidden two frames on, so a late picture shows the
  // scene, never the page's colour (a white flash while moving)
  const fresh = on && want.some(m => !stillPic.painted.has(m));
  if (node && (on !== stillPic.on || stillPic.sceneHidden !== (on && !fresh))) {
    node.style.visibility = on && !fresh ? "hidden" : "";
    stillPic.sceneHidden = on && !fresh; stillPic.on = on; stillPic.onNode = node;
  }
  if (fresh) {
    const shownNow = stillPic.shown;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const m of shownNow) stillPic.painted.add(m);
      if (stillPic.on && stillPic.shown === shownNow && stillPic.onNode === node && node) { node.style.visibility = "hidden"; stillPic.sceneHidden = true; }
    }));
  }
  if (on) for (const n of figShown) if (n.style) n.style.visibility = "visible";
  // (the ✨ glow on a picture to go into: a copy over the part its picture is in)
  const g = on && enterGlow && enterGlow.isConnected ? enterGlow : null;
  if (stillPic.glow && (!g || stillPic.glowOf !== g)) { stillPic.glow.remove(); stillPic.glow = stillPic.glowOf = null; }
  if (g) {
    if (!stillPic.glow) {
      const m = pic.getScreenCTM().inverse().multiply(g.getScreenCTM()), w = document.createElementNS("http://www.w3.org/2000/svg", "g");
      w.setAttribute("transform", `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => +v.toFixed(4)).join(" ")})`);
      w.setAttribute("data-still-pic", ""); w.setAttribute("pointer-events", "none"); w.style.visibility = "visible";
      w.append(g.cloneNode(true));
      Object.assign(stillPic, { glow: w, glowOf: g });
    }
    let k = 0;
    for (const o of bgShown.objs) { if (o.node === g || o.node.contains(g)) { k++; break; } if (g.compareDocumentPosition(o.node) & Node.DOCUMENT_POSITION_FOLLOWING) break; k++; }
    const q = parts.find(q => q && q.lo <= k && k <= q.hi);
    if (q && stillPic.glow.previousSibling !== q.img) q.img.after(stillPic.glow);
  }
}
// (from moved(): the pictures hold while moves keep coming; after the last,
// one more drawing shows the scene itself)
function stillPicMoved(t) {
  stillPicUntil = t + STILL_PIC_HOLD;
  if (!stillPic.on && !stillPic.parts.size) return;
  clearTimeout(stillPicEnd);
  stillPicEnd = setTimeout(() => { stillPicEnd = 0; if (stillPic.on && performance.now() >= stillPicUntil) draw(); }, STILL_PIC_HOLD + 50);
}
