"use strict";
// (ticket 178) Part 16 of 26 of the game's script, run in order by index.html.

// each group's objects put in order by depth, in the places they held (a
// picture of a place, or the view out of a window, is in the same order)
function sortObjects(root) {
  const objs = [...root.querySelectorAll("[data-obj]")];
  for (const parent of new Set(objs.map(n => n.parentNode))) {
    const here = objs.filter(n => n.parentNode === parent), sorted = here.slice().sort((a, b) => (objDepth(a) - objDepth(b)) || 0);   // (two in front tie, in their text order)
    if (sorted.every((n, i) => n === here[i])) continue;
    const slots = here.map(n => { const m = n.ownerDocument.createComment(""); n.before(m); return m; });
    sorted.forEach((n, i) => slots[i].replaceWith(n));
  }
}
function sceneObjects(root) {
  sortObjects(root);
  return [...root.querySelectorAll("[data-obj]")].filter(n => {
    for (let q = n.parentNode; q && q !== root; q = q.parentNode)
      if (q.hasAttribute("transform") || q.hasAttribute("data-obj") || q.hasAttribute("data-drag") || q.classList.contains("portal")) return false;
    return true;
  }).map(n => ({ name: n.dataset.obj, z: objDepth(n), node: n }));
}
const objectAhead = feet => (bgShown.objs.find(o => o.z > feet) || {}).node || null;
// which list of hidden objects a place keeps: a castle room's by its style,
// a room in the tree house by its number, any other by its kind
function objPlace(B) {
  if (B.kind === "castleroom") return "castleroom:" + (castleOf(B).rooms[Math.round(B.castleRoom ?? 1) - 1] ?? "king");
  if (B.kind === "treeroom") return "treeroom:" + Math.round(B.inside ?? 1);
  return B.kind;
}
const objectsOff = B => new Set(((B.objectsOff || {})[objPlace(B)]) || []);
function showObjects() {
  const off = objectsOff(state.background);
  // (ticket 163: written only when it changes; every drawing, each write
  // made the browser restyle that object, every frame of a walk)
  for (const o of bgShown.objs) { const d = off.has(o.name) ? "none" : ""; if (o.node.style.display !== d) o.node.style.display = d; }
}
// the scene's element, its pieces those of the last scene where their text
// is the same (see SEP), the rest parsed
function mountScene(text) {
  const tMount = performance.now();   // (⏱️ a trip being timed)
  const NS = "http://www.w3.org/2000/svg", root = document.createElementNS(NS, "g"), stack = [root], kept = new Map();
  root.id = "bg";
  bgShown.parsed = 0;
  for (const piece of text.split(SEP)) {
    if (!piece) continue;
    if (piece === "</g>") { stack.pop(); continue; }
    let node;
    if (/^<g [^>]*>$/.test(piece)) {   // a group's own tag, made new (it is small)
      const holder = document.createElementNS(NS, "g");
      holder.innerHTML = piece + "</g>";
      node = holder.firstChild;
      stack[stack.length - 1].append(node);
      stack.push(node);
      continue;
    }
    node = bgShown.kept.get(piece);
    if (!node || kept.has(piece)) {
      node = document.createElementNS(NS, "g");
      node.innerHTML = piece;
      bgShown.parsed += piece.length;
    }
    kept.set(piece, node);
    stack[stack.length - 1].append(node);
  }
  bgShown.kept = kept;
  if (tripTimer) tripWork("building the place", tMount);
  return root;
}
// the figure's size and place in its scene (k about its feet, at y = g),
// and the scene's frame: for dragging the figure, and the face in it
// A background's stage: the frame the usual figure got in a scene, its
// ground at 320 (the usual figure's), in picture units.
const SCENE = { left: -405.9, top: -195, bottom: 406.2, ground: 320 };
// the frame the figure itself needs (before a stage replaces it), for
// fitting it to the stage
let naturalFrame = { left: -200, top: -200, ground: 0 };
let figureT = { k: 1, dx: 0, dy: 0, g: 0, sg: 0 }, sceneFrame = { left: -200, top: -200, right: 200, bottom: 200, ground: 0, back: -Infinity };   // where the face is, for dragging it
// (ticket 145) A solid back wall: the deepest the friend's feet go in a
// place whose back wall can't be walked through (the imagination's: its
// ladders are the way up), a little in front of the wall's foot, in the
// stage's units; else the frame's own limit. The controller, a drag and the
// place control all keep to it (figYMin, a figY).
const SCENE_BACK = { imagination: () => imaginationWall(SCENE.ground, (SCENE.bottom - SCENE.top) / 700) + 3, emptyroom: () => imaginationWall(SCENE.ground, (SCENE.bottom - SCENE.top) / 700) + 3, bubblespace: () => imaginationWall(SCENE.ground, (SCENE.bottom - SCENE.top) / 700) + 3 };
const figYMin = F => Math.max((F.top - F.ground) * 0.6, (F.back ?? -Infinity) - F.ground);
// (ticket 149) What the friend can't walk through. A castle room's walls,
// from its perspective (roomFrame, as the room is drawn): the back wall's
// foot is SCENE_BACK's, and the side walls close in toward it, so how far
// across the friend's feet can go depends on how deep they are (walls: the
// half width at a depth). And the things one sits on (SEATS: a barrel, a
// bench, a chair, a throne), as boxes on the ground: across their top's
// span (x0 to x1) and from the floor in front of them (z, where a sitter's
// feet go) back by half their height, at most SOLID_DEPTH of their width;
// their height is their top's above that floor. Low ones can be jumped: while jumping, lower than half
// the friend's legs by the short jump, lower than their legs by the high
// one. The controller and a drag move the friend through solidMove, which
// slides along what they meet; already inside one (put there by a setting,
// or arriving), they can walk out. Closed ticket 50's "collision shape for
// the places it makes no sense to stand", begun with what we know the
// shape of.
const SOLID_DEPTH = 0.4, SOLID_MARGIN = 6;
let wallsMemo = { text: undefined, kind: null, W: null };
function castleWalls(B) {
  if (B.kind !== "castleroom" && B.kind !== "treeroom") return null;   // (ticket 223: the tree house rooms are square rooms too)
  if (wallsMemo.text === bgShown.text && wallsMemo.kind === B.kind && bgShown.text) return wallsMemo.W;
  wallsMemo = { text: bgShown.text, kind: B.kind, W: castleWallsOf(B) };
  return wallsMemo.W;
}
function castleWallsOf(B) {
  if (B.kind === "treeroom") { const { floor, bw, vy } = roomFrame(stageC()); return { back: floor, stairs: false, half: y => Math.max(0, bw * (y - vy) / (floor - vy)) }; }
  const style = castleOf(B).rooms[Math.round(B.castleRoom ?? 1) - 1], deep = style === "hallway" || style === "dining";
  const c = deep ? { ...stageC(), eye: 0.3 } : stageC(), { floor, bw, vy } = roomFrame(c);
  const back = vy + (floor - vy) / (1 + (deep ? HALL_STRETCHES * 0.8 : 0));
  return { back, stairs: style === "spiral", half: y => Math.max(0, bw * (y - vy) / (floor - vy)) };
}
// (read once a drawing, before the drawing mounts the place's scene: worked out afresh, not memoized on the scene's text)
// (not the spiral stair's room: walking up it is going up the stairs, to its doors higher up)
SCENE_BACK.castleroom = () => { const W = castleWallsOf(state.background); return W && !W.stairs ? W.back + 3 : -Infinity; };
// (ticket 176) The flat rooms' back walls: where each one's floor meets its
// wall as the room is drawn (livingroomScene, treeroomScene, witchroomScene,
// healerroomScene; the tent's far wall, tentScene), in front of which the
// friend stops, as in the imagination
for (const [kind, up] of [["livingroom", 120], ["treeroom", 110], ["witchroom", 100], ["healerroom", 100], ["tent", 70]])
  SCENE_BACK[kind] = () => SCENE.ground - up * (SCENE.bottom - SCENE.top) / 700 + 3;
// (ticket 214, Matthew: "the horz blue line in each scene is wrong, and always too high -- it doesn't correspond with
// where we'd walk or run -- we'd need to fly") Each outdoor place's back limit at the far edge of its own ground, as
// drawn (in the frame's units, k = its height / 700, as the scenes draw): the meadow's edge, the shore, a lake's far
// side, the water's horizon, a fence, a moat, a house's wall. Without one, a place had the frame's stand-in, 60% of the
// way up to the picture's top: among the trees and clouds. Each value is how far above the ground line (g) its far
// edge is, from the scene's code where it says (the forest path's far ground, the crossing's far line, the beach's
// sea, the lake's far shore, open water's horizon), else read from a picture of it (ticket 214's audit).
const SCENE_FAR = { forest: 60, underwater: 40, deepsea: 30, witch: 22, cemetery: 100, house: 175, treehouse: 90, clearing: 140,
                    fairyforest: 110, mountains: 110, waterfall: 90, campsite: 100, cave: 60, castle: 35,
                    woodpath: 165, crossing: 295, beach: 165, sea: 225, lake: 245 };
for (const [kind, up] of Object.entries(SCENE_FAR))
  SCENE_BACK[kind] = (top = SCENE.top, bottom = SCENE.bottom) => SCENE.ground - up * (bottom - top) / 700 + 3;
// (ticket 176) The things that stand in a place and can't be walked
// through, by their name in the scene (the words before any comma or
// number: "rock, left" and "toadstool 3" are a rock and a toadstool), each a
// box under its drawing: across its drawing's width (a tree, a lamp or a
// sign only its trunk or post: TRUNK of that width, at least 16 units,
// under its middle), and from where it stands back as a seat's, by half
// its height, at most SOLID_DEPTH of its width; its height is its drawing's
// top above where it stands, so a low one (a rock, a log, a bush) is jumped
// as a low seat is. Not solid: what one goes into or up (houses, huts,
// doors, ladders, stairs), what is alive (people, animals), what hangs or
// flies, what lies flat, any object hidden (objectsOff), a seat (already
// one), and anything where one swims.
const STANDING = new Set(["anvil", "armor", "barrels", "basket", "bookcase", "box", "bucket", "buckets", "bunk beds", "bush", "cage", "campfire",
  "cat tree", "cauldron", "chest", "chest of gold", "coal heap", "column", "counter", "crate", "drum kit", "easel", "firewood", "flour sack", "forge",
  "fountain", "green bush", "hay cart", "hay heap", "keyboard", "log", "mushroom", "oven", "paint table", "picnic table", "pink bush", "plant", "potion shelves",
  "rock", "sand castle", "snake tank", "soup pot", "stone", "stove", "table", "tea table", "telescope", "toadstool", "toy chest", "tree trunk",
  "water barrel", "water trough", "well", "white bush", "worktable", "yellow bush"]);
const TRUNKED = new Set(["tree", "great tree", "jungle tree", "palm tree", "palm", "pine", "willow", "lamp", "umbrella", "sign", "signpost"]);
// (ticket 214's audit: the living room's plant had a box as wide as its leaves) a pot's plant stands on its pot: its foot,
// as a trunk's is found, but however short
const POTTED = new Set(["plant"]);
const TRUNK = 0.14, SWIM_PLACES = new Set(["lake", "underwater", "deepsea"]);
const objBase = name => name.split(",")[0].replace(/\s+\d+$/, "").trim();
// a box (x, y, width, height) through a matrix, as the box round its four corners
function boxThrough(r, m) {
  const pts = [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}
// (Matthew: "palm trees, and other curved things, need about 4 or 5 different collision boxes, not just one") A trunk's
// boxes, TRUNK_BANDS of them stacked from its foot to its top, each as wide as the trunk is at that height: its parts
// (the tall shapes standingHere found) followed along their length (getPointAtLength, through each one's matrix; a
// stroked one grown by half its stroke), so a palm's leaning trunk has its boxes leaning with it. Each band: x0, x1,
// and lo, hi, its heights above the ground where the thing stands (z).
const TRUNK_BANDS = 5;
function trunkBands(parts, z, n = TRUNK_BANDS) {
  const pts = [];
  for (const [sh, m] of parts) {
    let L = 0; try { L = sh.getTotalLength(); } catch (e) { continue; }
    const st = sh.getAttribute("stroke"), hw = st && st !== "none" ? (parseFloat(sh.getAttribute("stroke-width")) || 1) / 2 * Math.hypot(m.a, m.b) : 0;
    for (let i = 0; i <= 48 && L > 0; i++) { const p = sh.getPointAtLength(L * i / 48); pts.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f, hw]); }
  }
  if (pts.length < 2) return null;
  const top = Math.min(...pts.map(p => p[1] - p[2])), bot = Math.max(z, ...pts.map(p => p[1])), out = [];
  for (let i = 0; i < n; i++) {
    const yA = top + (bot - top) * i / n, yB = top + (bot - top) * (i + 1) / n, inb = pts.filter(p => p[1] + p[2] >= yA && p[1] - p[2] <= yB);
    if (inb.length) out.push({ x0: Math.min(...inb.map(p => p[0] - p[2])), x1: Math.max(...inb.map(p => p[0] + p[2])), lo: Math.max(0, z - yB), hi: z - yA });
  }
  return out.length ? out : null;
}
function standingHere(B, seats) {
  if (SWIM_PLACES.has(B.kind) || !bgShown.node) return [];
  const off = objectsOff(B), k = (SCENE.bottom - SCENE.top) / 700, out = [];
  // (its box in the friend's units, through the screen, as ladderAt does: the scene may sit in a nested svg of its own)
  const picEl = document.getElementById("pic"), P = picEl && picEl.getScreenCTM(), Pinv = P ? P.inverse() : null;
  for (const o of bgShown.objs) {
    // (ticket 241) a drawing that marks its trunk (data-trunk: the tree house's braid) is a trunk, measured by it alone
    const marked = o.node.querySelector("[data-trunk]"), root = marked || o.node;
    const base = objBase(o.name), trunk = TRUNKED.has(base) || !!marked, potted = POTTED.has(base);
    if (!(trunk || STANDING.has(base)) || !Number.isFinite(o.z) || off.has(o.name) || seats.has(o.name)) continue;
    let b = null;
    // (ticket 214's audit: a cauldron's box stood up past the picture's top, its fumes measured as the pot) what rises
    // from a thing, .fumes, is no part of its box: hidden while it is measured
    const fumes = [...o.node.querySelectorAll(".fumes")];
    for (const f of fumes) f.style.display = "none";
    try {   // (Firefox throws for a drawing not shown)
      const r = root.getBBox(), E = root.getScreenCTM(), m = Pinv && E ? Pinv.multiply(E) : null;
      if (m && r.width > 0 && r.height > 0) {
        const pts = [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
        b = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      }
    } catch (e) { continue; }
    finally { for (const f of fumes) f.style.display = ""; }
    if (!b || !(b.width > 0) || !(b.height > 0)) continue;
    // (0.0.147, Matthew: "the sign post and trees each have a box that looks misaligned") a trunk or a post is not
    // always in the middle of its drawing: a canopy spreads to one side, a signpost's boards hang off its post. Its
    // box is where its tall parts reach its foot (the trunk, the post: each at least a quarter of its height, ending
    // in its lowest tenth, not as wide as the whole), else the middle, as before.
    // (0.0.153: each part measured as the whole is, its own box through its own matrix: the beach's palms, a trunk drawn
    // as one stroked curve, were missed through the screen's boxes, and stood on their crowns' middles)
    let foot = null, bands = null;
    // (ticket 257) a drawing that gives its trunk's spine ([data-spine]: pieces along it, each as wide as the trunk there,
    // as a palm's stacked segments do) is measured by it, in as many bands as it asks (data-bands)
    const spines = trunk && Pinv ? [...o.node.querySelectorAll("[data-spine]")] : [];
    if (spines.length) {
      const parts = []; for (const sh of spines) { try { const E = sh.getScreenCTM(); if (E) parts.push([sh, Pinv.multiply(E)]); } catch (e) { /* (not shown) */ } }
      bands = parts.length ? trunkBands(parts, o.z, +spines[0].dataset.bands || TRUNK_BANDS) : null;
    } else if ((trunk || potted) && Pinv) {
      const parts = [];
      for (const sh of root.querySelectorAll("rect, path, polygon, polyline, line, ellipse")) {
        let m, q;
        try { const E = sh.getScreenCTM(); m = E && Pinv.multiply(E); q = m && boxThrough(sh.getBBox(), m); } catch (e) { continue; }
        if (!q || (!q.width && !q.height)) continue;
        if (q.y + q.height < b.y + 0.9 * b.height || (trunk && q.height < 0.25 * b.height) || q.width > 0.6 * b.width) continue;
        parts.push([sh, m, q]);
      }
      if (parts.length) {
        foot = [Math.min(...parts.map(p => p[2].x)), Math.max(...parts.map(p => p[2].x + p[2].width))];
        if (trunk) bands = trunkBands(parts, o.z);
      }
    }
    // (a trunk's foot is its lowest band's width, the part on the ground)
    if (bands) { const fb = bands[bands.length - 1]; foot = [fb.x0, fb.x1]; }
    const mid = foot ? (foot[0] + foot[1]) / 2 : b.x + b.width / 2, h = Math.max(0, o.z - b.y);
    const w = foot ? (potted ? foot[1] - foot[0] : Math.min(0.4 * b.width, Math.max(16 * k, foot[1] - foot[0]))) : trunk ? Math.min(b.width, Math.max(16 * k, TRUNK * b.width)) : b.width;
    out.push({ name: o.name, x0: mid - w / 2, x1: mid + w / 2, back: o.z - clamp(0.5 * h, 8, Math.max(8, SOLID_DEPTH * w)), front: o.z, h, standing: true, ...(bands ? { bands } : {}) });
  }
  return out;
}
// (ticket 237, Matthew: "collision detection should avoid walking over the trap doors in the floor of the tree houses")
// a hole in the floor (a tree room's trapdoor: data-hole, its box on the floor), a solid as low as a step: the feet
// don't walk onto it, a walk goes round it (planPath), a jump clears it, and ♿'s collision boxes show it; its ladder
// down is taken from its near edge, as before
const HOLE_H = 30;
const holesHere = () => bgShown.node ? [...bgShown.node.querySelectorAll("[data-hole]")].map(el => {
  const [x0, x1, back, front] = el.dataset.hole.split(" ").map(Number); return { name: "trapdoor", x0, x1, back, front, h: HOLE_H }; }) : [];
// (the solids here, made again only when the place, its seats or its hidden objects change)
let solidMemo = { text: undefined, kind: null, off: "", list: [] };
function solidsHere() {
  const B = state.background;
  if (B.kind === "none") return [];
  const offKey = [...objectsOff(B)].join("|");
  if (solidMemo.text !== bgShown.text || solidMemo.kind !== B.kind || solidMemo.off !== offKey || !bgShown.text) {
    const seats = seatsHere(B);
    solidMemo = { text: bgShown.text, kind: B.kind, off: offKey, list: seats.map(t => { const w = t.x1 - t.x0, d = clamp(0.5 * (t.z - t.y), 8, Math.max(8, SOLID_DEPTH * w));   // (as deep as half its height, at most SOLID_DEPTH of its width: a couch is not as deep as it is wide)
      return { name: t.name, x0: t.x0, x1: t.x1, back: t.z - d, front: t.z, h: t.z - t.y }; }).concat(standingHere(B, new Set(seats.map(t => t.name))), holesHere()) };
  }
  return solidMemo.list;
}
// the friend's legs, hip to foot, in the stage's units (for what a jump clears)
const legReach = () => poseJoints && poseJoints.legs && poseJoints.legs.length
  ? figureT.k * Math.max(...poseJoints.legs.map(l => Math.hypot(l.F[0] - l.H[0], l.F[1] - l.H[1]))) : 100 * figureT.k;
// what stops the friend's feet at (x, z): a wall, a solid, or null
// (Matthew: "two small collision boxes under the current friend, not one ... Place one under each foot, about the
// size of the foot"; "the more that they coincide with 'the bottom of a shoe' in size the more realistic the game play
// will become") The friend meets things with the soles of their feet: a box under each foot, where it is drawn (its
// middle from poseJoints' foot, at the friend's scale, figureT.k), as wide as the shoe seen this way (across, facing
// us; its length, in profile: footR), a step deep. feetSoles(x, z): the two, were the feet at (x, z); feetSpan(): how
// far they reach either side of the middle, and how deep.
// (0.0.153, with the trunks' bands) each box also has its heights above the ground, [4] and [5]: a sole's from the
// ground to the ankle, the torso's from the hips to the crown (youHeights), so a thing meets the boxes at its heights
function youHeights() {
  const J = poseJoints, T = figureT;
  if (!J || !J.legs || !J.legs.length || !T || !(T.k > 0)) return { ankle: 20, hips: 80, crown: 200 };
  const foot = Math.max(...J.legs.map(l => l.F[1])), hips = Math.max(...J.legs.map(l => l.H[1])), crown = faceFrame.ty + headCrown(state.face) * faceFrame.s;
  return { ankle: Math.max(4, 0.2 * (foot - hips) * T.k), hips: Math.max(0, (foot - hips) * T.k), crown: Math.max(0, (foot - crown) * T.k) };
}
function feetSoles(x, z) {
  const J = poseJoints, T = figureT;
  if (!J || !J.legs || !J.legs.length || !T || !(T.k > 0)) return [[x - SOLID_MARGIN, x + SOLID_MARGIN, z - 3, z + 3, 0, 20]];
  const prof = facingOf(state.body) !== 0, hw = T.k * Math.max(8, Math.min(45, (J.footR || 50) * (prof ? 0.6 : 0.42))), hd = Math.max(2.5, hw * 0.35), up = youHeights().ankle;
  return J.legs.map(l => { const fx = x + T.k * l.F[0]; return [fx - hw, fx + hw, z - hd, z + hd, 0, up]; });
}
const feetSpan = () => { const S = feetSoles(0, 0); return [Math.max(...S.map(s => Math.max(-s[0], s[1]))), Math.max(...S.map(s => s[3]))]; };
// (Matthew: "one final box, that coincides with the center of the torso, but narrower, to indicate that we can sometimes
// squeeze -- Otherwise, the two feet can pass over a narrow pole, and we won't collide"; "the feet gap is the same gap as
// the width of the box above them, for the torso -- it extends from the crotch through the head") Under the middle of
// the torso, between the soles, a box as wide as the gap between them (none when they meet), as deep as a sole: a pole
// that would pass between the feet meets it. youBoxes(x, z): the soles and it, all that solidAt tests.
// (0.0.153) With the feet together (in profile, the soles overlap) a sliver still, so a palm's leaning trunk, at the
// body's height, is met side on as well.
function torsoBox(x, S) {
  if (!S.length) return null;
  const [a, b] = S.length < 2 || S[0][0] <= S[1][0] ? [S[0], S[1] || S[0]] : [S[1], S[0]], gap = b[0] - a[1], half = Math.max(gap / 2, 2 * (figureT.k || 1)), H = youHeights();
  return [x - half, x + half, a[2], a[3], H.hips, H.crown];
}
const youBoxes = (x, z) => { const S = feetSoles(x, z), t = torsoBox(x, S); return t ? S.concat([t]) : S; };
// a solid's boxes up from the ground: a trunk's bands, else one as tall as the thing (o.h)
const solidBands = o => o.bands || [{ x0: o.x0, x1: o.x1, lo: 0, hi: o.h > 0 ? o.h : Infinity }];
// (ticket 240, Matthew: "the swing's collision box does not swing at the tree house. our collision boxes don't swing
// either") The tree house's swing as it is now, read from its drawing (its seat's group is turned by the swing's own
// animation, which the screen matrix includes): the angle it hangs at, its hook on the screen, and how far its seat is
// from where it hangs at rest, across, in the stage's units. Its box (a seat's, solidsHere) is met where the seat is;
// ♿'s collision boxes turn its box, and the friend's on it, about the hook (swingHud).
const SWING_HOOK = [395, -346], SWING_SEAT = [395, -66];   // (in the tree's units: treeInner's "tree-swing")
function swingNow() {
  const seat = state.background.kind === "treehouse" && bgShown.node ? bgShown.node.querySelector("[data-swing-seat]") : null, g = seat && seat.parentNode;
  const M = g && g.getScreenCTM(), P = g && g.parentNode.getScreenCTM(), S = pic.getScreenCTM();
  if (!M || !P || !S) return null;
  const Si = S.inverse(), at = (m, [x, y]) => new DOMPoint(x, y).matrixTransform(m), stage = q => q.matrixTransform(Si);
  return { deg: (Math.atan2(M.b, M.a) - Math.atan2(P.b, P.a)) * 180 / Math.PI, hook: at(P, SWING_HOOK), dx: stage(at(M, SWING_SEAT)).x - stage(at(P, SWING_SEAT)).x };
}
// (ticket 248: all, every one, and whether past a wall: { wall, list }; solidMove lets the friend out of the ones they
// are in, and into no other)
function solidAt(x, z, all = false) {
  const B = state.background, W = castleWalls(B), S = youBoxes(x, z), sw = B.kind === "treehouse" ? swingNow() : null;
  const wall = !!(W && S.some(s => Math.max(Math.abs(s[0]), Math.abs(s[1])) > W.half(z)));
  if (wall && !all) return { wall: true };
  const sitting = state.body.sit && B.seat, a = state.body.anim, jumping = isJump(a);
  const clears = jumping ? (a === "jumphigh" ? 1 : 0.5) * legReach() : 0, list = [];
  for (const o0 of solidsHere()) {
    const o = sw && o0.name === "swing" ? { ...o0, x0: o0.x0 + sw.dx, x1: o0.x1 + sw.dx } : o0;   // (ticket 240: where the seat is now)
    if (sitting && o.name === B.seat) continue;
    if (o.h < clears) continue;
    if (S.some(s => s[3] > o.back && s[2] < o.front && solidBands(o).some(b => s[1] > b.x0 && s[0] < b.x1 && s[5] > b.lo && s[4] < b.hi))) {   // (a sole, or the torso's box, over one of its boxes, at its heights)
      if (!all) return o;
      list.push(o);
    }
  }
  return all ? { wall, list } : null;
}
// a move of the friend's feet from (x0, y0) to (x, y) (figX, figY): where
// they end up, sliding along a wall or a solid they meet; inside one
// already, any move that does not go deeper into it
// (ticket 229) the last thing a move was stopped by (a solid's name, or "wall"), and when: ♿'s collision boxes glow it
let solidHit = { name: null, n: 0, t: 0 };
function solidMove(x0, y0, x, y) {
  const g = SCENE.ground, hit = solidAt(x, g + y);
  if (!hit) return [x, y];
  const was = solidAt(x0, g + y0, true);
  // (inside a solid already: let them out, by any move that does not go deeper into it, nearer its middle. 0.0.152: any
  // move at all, as it was, once the soles swung with the feet (0.0.150) let a walk through everything: the front foot
  // swung into a cauldron, a rock, the couch, and the next step counted as getting out)
  // (ticket 223: past a side wall already, a castle room's or a tree room's, come back from a door in it: any move toward the middle)
  // (ticket 248: out of every one they are in, and into no other: one foot inside a toy chest let a walk on into the tree
  // trunk beyond it, the move counted as getting out of the chest)
  const deeper = (o, xx, yy) => { const cx = (o.x0 + o.x1) / 2, cz = (o.back + o.front) / 2;
    return Math.abs(xx - cx) < Math.abs(x0 - cx) - 0.01 || Math.abs(g + yy - cz) < Math.abs(g + y0 - cz) - 0.01; };
  const ok = (xx, yy) => { const now = solidAt(xx, g + yy, true);
    if (now.wall && !(was.wall && Math.abs(xx) <= Math.abs(x0))) return false;
    return now.list.every(o => was.list.some(p => p.name === o.name) && !deeper(o, xx, yy)); };
  if ((was.wall || was.list.length) && ok(x, y)) return [x, y];
  { const now = performance.now(), name = hit.wall ? "wall" : hit.name;
    if (name !== solidHit.name || now - solidHit.t > 120) solidHit = { name, n: solidHit.n + 1, t: now }; }
  if (ok(x, y0)) return [x, y0];
  if (ok(x0, y)) return [x0, y];
  // (a wall alone: the farthest across it lets them, at the new depth)
  const W = castleWalls(state.background);
  if (W && !was.wall && !was.list.length) { const h = W.half(g + y) - feetSpan()[0] - 0.5, cx = clamp(x, -h, h); if (ok(cx, y)) return [cx, y]; }
  return [x0, y0];
}
// (ticket 215, Matthew: "when the player clicks a picture, or another
// passageway, we should plan a path for walking, swimming or climbing to it,
// and do it in a natural way, avoiding obstacles in the room, and walking (or
// swimming) around them"; "something very simple for now") A path for the
// feet, in figX/figY terms, from (x0, y0) to (x1, y1): straight when nothing
// stands in the way; else round the corners of the solids in the way (each
// grown by the margin the feet keep, and PATH_PAD more), the shortest, deeper
// counting 1/0.6 as far, as walking does. The solids are boxes on the floor
// (solidsHere), so a corner each is enough; a castle room's side walls only
// narrow toward the back, so a corner past them is left out, and a straight
// line between two points inside stays inside. A solid they start or end in
// is left out (let out, or let in). The points after the start, the end last;
// just the end when no way round is found. walkPath keeps the last one made,
// for showing it (ticket 217).
const PATH_PAD = 5;
let walkPath = null;
function segBox(ax, az, bx, bz, x0, z0, x1, z1) {   // (does the segment pass through the box's inside? Liang-Barsky)
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dz, az - z0], [dz, z1 - az]]) {
    if (p === 0) { if (q <= 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t1 - t0 > 1e-6;
}
function planPath(x0, y0, x1, y1) {
  // (the boxes grown by the soles' reach either side, and their depth: the middle kept that far out)
  const [sx, sz] = feetSpan(), g = SCENE.ground, z0 = g + y0, z1 = g + y1;
  // (0.0.157, Matthew: "planned path goes through the pit --- they don't seem registered in the collision system, but
  // they should have their own status as something to avoid when planning a path") a trap room's pits, the holes one
  // falls into (pitsHere, PIT_EDGE of each), gone round too, unless the walk starts or ends in one; it is the middle of
  // the feet that falls in, so a pit is kept PATH_PAD off, not grown by the soles' reach as a solid is
  const gx = o => o.pit ? PATH_PAD : sx, gz = o => o.pit ? PATH_PAD : sz;
  const inside = (o, x, z, e = 0) => x > o.x0 - gx(o) - e && x < o.x1 + gx(o) + e && z > o.back - gz(o) - e && z < o.front + gz(o) + e;
  // (0.0.156: the soles' reach can touch a thing the walk starts or ends beside, the healer's soup pot, the bunk beds;
  // such a thing was left out altogether, and the walk went straight through it. Left out now only when the middle of
  // the feet is in it; touched, a leg from or to that end must miss its own box, not grown)
  const rawIn = (o, x, z) => x > o.x0 && x < o.x1 && z > o.back && z < o.front;
  const pits = pitsHere().map(q => ({ name: "pit", pit: true, x0: q.cx - PIT_EDGE * q.rx, x1: q.cx + PIT_EDGE * q.rx, back: q.cy - PIT_EDGE * q.ry, front: q.cy + PIT_EDGE * q.ry }));
  // (ticket 248: each across as wide as its boxes up to the friend's crown, as walking meets them, not its foot's alone: a
  // tree's trunk wider above its foot, the tree house's, had a planned walk brush through it)
  const crown = youHeights().crown, wide = o => { const bs = solidBands(o).filter(b => b.lo < crown);
    return bs.length ? { ...o, x0: Math.min(o.x0, ...bs.map(b => b.x0)), x1: Math.max(o.x1, ...bs.map(b => b.x1)) } : o; };
  const solids = solidsHere().map(wide).concat(pits).filter(o => !rawIn(o, x0, z0) && !rawIn(o, x1, z1));
  const nearA = new Set(solids.filter(o => inside(o, x0, z0))), nearB = new Set(solids.filter(o => inside(o, x1, z1)));
  const hits = (ax, az, bx, bz, a = false, b = false) => solids.some(o => (a && nearA.has(o)) || (b && nearB.has(o))
    ? segBox(ax, az, bx, bz, o.x0, o.back, o.x1, o.front) : segBox(ax, az, bx, bz, o.x0 - gx(o), o.back - gz(o), o.x1 + gx(o), o.front + gz(o)));
  if (!solids.length || !hits(x0, z0, x1, z1, true, true)) return [[x1, y1]];
  const W = castleWalls(state.background), F = sceneFrame;
  const free = (x, z) => !solids.some(o => inside(o, x, z, 1)) && (!W || Math.abs(x) < W.half(z) - sx) && x > F.left && x < F.right && z - g >= figYMin(F) && z <= F.bottom;
  const pts = [[x0, z0], [x1, z1]];
  for (const o of solids) { const mx = gx(o) + PATH_PAD, mz = gz(o) + PATH_PAD;
    for (const p of [[o.x0 - mx, o.back - mz], [o.x1 + mx, o.back - mz], [o.x0 - mx, o.front + mz], [o.x1 + mx, o.front + mz]]) if (free(...p)) pts.push(p); }
  const cost = (a, b) => Math.hypot(b[0] - a[0], (b[1] - a[1]) / 0.6), n = pts.length;
  const dist = Array(n).fill(Infinity), prev = Array(n).fill(-1), done = Array(n).fill(false);
  dist[0] = 0;
  for (;;) {   // (Dijkstra over the corners each sees: a few dozen at most)
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === 1) break;
    done[u] = true;
    for (let v = 0; v < n; v++) if (!done[v] && !hits(pts[u][0], pts[u][1], pts[v][0], pts[v][1], u === 0 || v === 0, u === 1 || v === 1)) {
      const d = dist[u] + cost(pts[u], pts[v]);
      if (d < dist[v]) { dist[v] = d; prev[v] = u; }
    }
  }
  if (dist[1] === Infinity) return [[x1, y1]];
  const out = [];
  for (let v = 1; v > 0; v = prev[v]) out.unshift([pts[v][0], pts[v][1] - g]);
  return out;
}
// (after a jump: landed inside a solid, out of it)
// (ticket 248: the nearest spot across that is clear of every solid, back the way they came first when as near: a high
// jump stopped in the air by a tree just past a mushroom came down inside the mushroom, and its nearer edge was inside
// the tree)
// (at most `most` across: a walk's stop is settled a step at most, never carried off past what it stood between)
function solidUnstick(most = 400) {
  const B = state.background, x = B.figX ?? 0, z = SCENE.ground + (B.figY ?? 0), o = solidAt(x, z);
  if (!o || o.wall) return;
  const F = sceneFrame, f = state.body.facing, back = f === "left" ? 1 : f === "right" ? -1 : x - o.x0 < o.x1 - x ? -1 : 1;
  for (let d = 1; d <= most; d++) for (const xx of [x + back * d, x - back * d])
    if (xx > F.left && xx < F.right && !solidAt(xx, z)) { B.figX = Math.round(xx + Math.sign(xx - x)); return; }
}

// The parts of the body each with its own visibility: a slider each
// (0 invisible to 100 all there), and the shirt and pants stand for the
// body and the legs under them.
const VISIBLE_PARTS = ["head", "eyes", "hair", "shirt", "pants", "feet", "hands"];
const visibility = () => Object.fromEntries(VISIBLE_PARTS.map(k =>
  [k, Math.max(0, Math.min(100, Number(state.visible?.[k] ?? 100))) / 100]));
// The masks the see-through layers need: each layer of a part but its last
// is hidden where the part's later layers are drawn (their shapes, inked
// black over white); the last one needs none.
function unveil(svg, layers) {
  // (ticket 161: without exact see-through, each layer its own see-through, no masks)
  if (!PERF.exactSeeThrough) return svg.replace(/ data-veil="(\w+) (\d+)"/g, "");
  let masks = "";
  for (const [g, N] of Object.entries(layers))
    for (let n = 1; n < N; n++) {
      masks += `<mask id="veil-m-${g}-${n}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">` +
               `<rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>`;
      for (let m = n + 1; m <= N; m++) masks += `<use href="#veil-${g}-${m}" filter="url(#veil-ink)"/>`;
      masks += `</mask>`;
    }
  svg = svg.replace(/ data-veil="(\w+) (\d+)"/g, (_, g, n) => Number(n) < layers[g] ? ` mask="url(#veil-m-${g}-${n})"` : "");
  if (!masks) return svg;
  return `<defs><filter id="veil-ink" x="-0.5" y="-0.5" width="2" height="2" color-interpolation-filters="sRGB">` +
         `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>${masks}</defs>` + svg;
}

// WATER (ticket 122): where in a place the friend stands in water. Each
// place with water to stand in has a test of whether a point on the stage
// (in its units, the ground line at 320) is in it, made from the same lines
// the place's drawing uses: lakeLines and lakeBeach, beachLines, poolOf,
// castleAt and moatOf, streamAt and brookAt. Under the sea is not here: the
// friend is all under water there already.
// (the stage as a scene function sees it, in the picture: backgroundSvg's c)
const stageC = () => { const x0 = SCENE.left, y0 = SCENE.top, x1 = -SCENE.left, y1 = SCENE.bottom, W = x1 - x0, H = y1 - y0;
  return { x0, y0, x1, y1, g: SCENE.ground, W, H, k: H / 700, pad: Math.max(W, H) }; };
// (a curve from a to b, bowed by q halfway across: its height at x, or null past its ends)
const bowY = (a, q, b, x) => { const t = (x - a[0]) / (b[0] - a[0]);
  return t < 0 || t > 1 ? null : (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * q[1] + t * t * b[1]; };
// (the height at x of the wavy edge backgroundSvg's land(at, amp, fill, phase)
// draws: a bow to each twelfth of its width; keep the two alike)
const landY = ({ x0, W, k, pad }, at, amp, phase, x) => {
  const span = W + 2 * pad, i = Math.max(1, Math.min(12, Math.ceil((x - x0 + pad) / span * 12)));
  const xa = x0 - pad + span * (i - 1) / 12, xb = x0 - pad + span * i / 12;
  return bowY([xa, at], [xb - span / 24, at + amp * k * Math.sin(i * 1.7 + phase)], [xb, at], x) ?? at;
};
// (a winding ribbon of water, drawn through its points [middle, y, half its
// width] going down the picture, as a stream is (sampled): is (x, y) in it?)
const inRibbon = (pts, x, y) => {
  // (the first piece whose lower end is at or below y, found by halving)
  if (pts.length < 2 || y < pts[0][1] || y > pts[pts.length - 1][1]) return false;
  let lo = 1, hi = pts.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid][1] < y) lo = mid + 1; else hi = mid; }
  const [xa, ya, ha] = pts[lo - 1], [xb, yb, hb] = pts[lo];
  const t = yb > ya ? (y - ya) / (yb - ya) : 0;
  return Math.abs(x - (xa + (xb - xa) * t)) < ha + (hb - ha) * t;
};
const WATER = {
  // the lake, from its far shore to its near one, but for the little beach
  lake: c => { const { horizon, shore } = lakeLines(c), [a, q, b] = lakeBeach(c, shore);
    return (x, y) => y > horizon && y < landY(c, shore, 5, 1.1, x) && y < (bowY(a, q, b, x) ?? Infinity); },
  // (ticket 186) open water: all of it, from the horizon down
  sea: c => { const hz = seaHorizon(c); return (x, y) => y > hz; },
  // the sea, from the horizon to the sand (the foam at its edge is sea too)
  beach: c => { const { sea, shore } = beachLines(c); return (x, y) => y > sea && y < landY(c, shore + 4 * c.k, 6, 1.4, x); },
  // the falls' pool, but where the near bank covers it
  waterfall: c => { const p = poolOf(c);
    return (x, y) => (x / p.rx) * (x / p.rx) + ((y - p.cy) / p.ry) * ((y - p.cy) / p.ry) < 1 && y < landY(c, p.near, 4, 1.1, x); },
  // the moat's near half, but for the drawbridge (its far half is behind the
  // walls, and a friend standing there is behind the whole castle); none
  // when the castle has no moat
  castle: (c, B) => { const K = castleOf(B); if (K.moat <= 0) return null;
    const { foot, z } = castleAt(c, K), M = moatOf(K.moat);
    return (x, y) => { const u = x / z, v = (y - foot) / z;
      return v > 0 && (u / M.rx) * (u / M.rx) + ((v - M.cy) / M.ry) * ((v - M.cy) / M.ry) < 1 && !(v < M.len && Math.abs(u) < bridgeHalf(v)); }; },
  // the tree house's stream and the cemetery's brook, as their outlines are drawn
  treehouse: c => { const pts = sampled(streamAt(c), 30); return (x, y) => inRibbon(pts, x, y); },
  cemetery: c => { const pts = sampled(brookAt(c), 20); return (x, y) => inRibbon(pts, x, y); },
};
// a place's test, or null where there is no water to stand in
const waterHere = B => WATER[B.kind]?.(stageC(), B) ?? null;
const inWater = (B, x, y) => { const at = waterHere(B); return !!at && at(x, y); };
// (a stream and a brook are shallow: in them the friend is in to the knees,
// not the waist)
const SHALLOW_WATER = { treehouse: true, cemetery: true };
// (how far the water reaches across from (x, y), to the nearer bank, up to
// `most`: a wake keeps to the water, in a narrow stream as in a lake)
const waterAcross = (B, x, y, most) => { const at = waterHere(B); let d = 0;
  while (d < most && at && at(x - d - 4, y) && at(x + d + 4, y)) d += 4;
  return d; };
// (the water's own shape round a spot on the stage: rows `step` apart, each
// the runs across it of points in the place's water, as [x, y, width])
// (ticket 163) Each row is worked out once for a place, across the whole
// stage and past it, and kept until the place's drawing changes; a drawing
// takes the rows round the friend and cuts them to its window. Before, the
// runs round the friend were worked out again whenever they moved, hundreds
// of tests of the place's water every drawing, and a swim in the duck pond
// drew 12 times a second on a computer 6 times slower than Matthew's.
const WATER_X0 = -1000, WATER_X1 = 1000;
let waterRows = { key: null, bg: null, rows: new Map() };
