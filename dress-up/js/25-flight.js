"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 178) A part of the game's script, run in order by index.html.

// ===================== FLYING, THE WORLD SEEN FROM ABOVE =====================
// (ticket 691, Matthew 2026-11-04: "I'd like to support a new rendering modality for each background that we have now. currently,
// we have a one-screen view for each background, that provides a perspective of a 3rd party looking into the scene, mostly
// sideways, like another viewer in the scene. I'd like to support: flight in an air balloon, or on bubbles, or another craft. we
// see the current world from above; each background is a square in a quilt and we see them woven together at some scale dep on
// our 'height', not one at a time. In this 'top down' view for each background, we may need to reconsider each object (trees,
// rocks, buildings) as having a top down view too.")
// A craft is an item (kind "craft", ITEMS): 🎈 the hot-air balloon, 🫧 a big bubble to ride. Used from 🔹 or 🔸 (or 🛫 on its
// tile in 🎒 your items), the friend takes off from the square of the world they are in. The picture is then the world's grid
// (state.world) seen from above, a quilt: each square a tile, its place's ground and landmarks seen from above (FLY_LOOKS: the
// lake's water, the castle's walls and towers, a house's roof, a forest's crowns), its ways as paths that meet its neighbours'
// at their shared edges, its things from above (flyThingSvg: a tree's crown, a rock, a chest), and the quilt's seams between
// them. The friend rides at the middle of the picture, seen from above as in the dungeon (topDownSvg, ticket 621), in the
// balloon's basket or inside the bubble, its shadow on the ground below them. Their height (flight.h, 0 to 1) is how much of the
// world is seen: low, about one square across; high, the whole world, clouds between. The arrows (a controller's, the
// on-screen one's, the keyboard's) fly them about, as a tap on the quilt does; ⬆️ and ⬇️ (the jumps and crouch on a controller,
// Page Up and Page Down or + and - on the keyboard) climb and sink; down at the ground over a place, they land there, in its
// usual view (worldEnter). 🛬, or the craft's own button again, brings them down where they are.
// (60 fps first) The quilt is built once for the world as it is (flyBuilt: rebuilt only when the world changes), and flying
// only moves and scales it: one transform, its squares out of view hidden, its things left out once high up (.fly-high).
const FLY_T = 800;   // a square's side, in the quilt's units: the scene's own width, so a thing's x is where it stands across
const FLY_CRAFTS = { balloon: { name: "the hot-air balloon" }, bubbleride: { name: "a big bubble" } };
let flight = null, flyBuilt = null, flyLoop = 0, flySayT = 0;
const flyKeys = new Set(), flyHud = { up: false, down: false };

// ---- the quilt's pieces: shapes in a square's own units (0 to FLY_T each way, north at the top) ----
const flyR = (key, i) => sceneR(i + 1, (key.split(",").reduce((a, n) => a * 31 + Number(n) + 7, 17)) % 997);   // (each square's own, the same every time)
const flyC = (x, y, r, fill, more = "") => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"${more}/>`;
const flyE = (x, y, rx, ry, fill, more = "") => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}"${more}/>`;
const flyRect = (x, y, w, h, fill, more = "") => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}"${more}/>`;
const flyPath = (d, fill, more = "") => `<path d="${d}" fill="${fill}"${more}/>`;
const flyPoly = pts => "M" + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L") + " Z";
const FLY_SHADE = "#00000033";
// trees' crowns from above, n of them in a box, each its shadow (to the lower right, the sun's) then its crown
function flyCrowns(key, n, [x0, y0, x1, y1], r0, r1, colors, salt = 0) {
  let s = "", sh = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * flyR(key, salt + i * 3), y = y0 + (y1 - y0) * flyR(key, salt + i * 3 + 1), r = r0 + (r1 - r0) * flyR(key, salt + i * 3 + 2);
    sh += `M${f1(x + 0.25 * r + r)} ${f1(y + 0.3 * r)} a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0 a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0 `;
    s += flyC(x, y, r, colors[i % colors.length]);
  }
  return flyPath(sh, FLY_SHADE) + s;
}
// a roof from above: two halves either side of its ridge, the far one lighter (the sun's)
const flyRoof = (x, y, w, h, c) => flyRect(x + 10, y + 12, w, h, FLY_SHADE) + flyRect(x, y, w, h / 2, lighter(c)) + flyRect(x, y + h / 2, w, h / 2, c) + `<path d="M${f1(x)} ${f1(y + h / 2)} H${f1(x + w)}" stroke="${darker(c)}" stroke-width="6"/>`;
const flyPool = (x, y, rx, ry, deep = "#2f6fb0", shore = "#7fb3d9") => flyE(x, y, rx + 18, ry + 14, shore) + flyE(x, y, rx, ry, deep);
const FT = FLY_T, FTOP = 0.36 * FLY_T;   // (the far third of a square is where its scene's own backdrop stands: its landmarks)
// Each place from above: its ground, then its landmarks, in a square's units. (The insides put in a square, and the places of
// their own, have a roof or a floor of their own: flyLookOf.)
// Each place from above, as its own scene draws it (its landmarks where they stand in the scene: across by their share of its
// width, X; its far things at the top of the square, its near ones at the bottom), from the place's own settings (o, the
// background's, shared by every square of that place) and the square's own (cell: a crossing's floor and ways, a cave's kind).
// First its ground, one shape (its paths go just over it); then its landmarks; its finer things in flyNear, seen only low down.
const flyX = s => FT * (0.5 + s);
// (pieces the places share: a leafy tree's crown, a pine's, a stone, a palm, an umbrella, a horse, a hen, a tent)
const flyOak = (x, y, r, c = "#3f7a32") => flyC(x + 0.3 * r, y + 0.35 * r, r, FLY_SHADE) + flyC(x, y, r, c) + flyC(x - 0.3 * r, y - 0.3 * r, 0.45 * r, lighter(c));
const flyPine = (x, y, r) => flyC(x + 0.3 * r, y + 0.35 * r, r, FLY_SHADE) + flyC(x, y, r, "#2f5a2c") + flyC(x, y, 0.5 * r, "#3f7038");
const flyStone = (x, y, r, c = "#8f8a80", seed = 1) => flyPath(flyPoly([0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3, q = r * (0.78 + 0.3 * sceneR(seed, i)); return [x + q * Math.cos(a), y + 0.8 * q * Math.sin(a)]; })), c, ` stroke="${darker(c)}" stroke-width="3"`);
const flyPalm = (x, y, r) => flyC(x + 0.3 * r, y + 0.3 * r, 0.8 * r, FLY_SHADE) + [0, 60, 120].map(a => flyE(x, y, r, 0.24 * r, "#3f8f3a", ` transform="rotate(${a} ${f1(x)} ${f1(y)})"`)).join("") + flyC(x, y, 0.16 * r, "#8a6a3a");
const flyUmbrella = (x, y, r, c1, c2) => flyC(x + 12, y + 14, r, FLY_SHADE) + flyC(x, y, r, c1) + flyPath([0, 1, 2, 3].map(i => { const a = i * Math.PI / 2, b = a + Math.PI / 4;
  return `M${f1(x)} ${f1(y)} L${f1(x + r * Math.cos(a))} ${f1(y + r * Math.sin(a))} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + r * Math.cos(b))} ${f1(y + r * Math.sin(b))} Z`; }).join(" "), c2);
const flyHorse = (x, y, coat, d = 1) => flyE(x + 6, y + 8, 46, 20, FLY_SHADE) + flyE(x, y, 44, 19, coat) + flyE(x + d * 52, y - 4, 18, 11, coat) +
  `<path d="M${f1(x + d * 20)} ${f1(y - 14)} L${f1(x + d * 48)} ${f1(y - 10)} M${f1(x - d * 44)} ${f1(y)} q${f1(-d * 16)} 6 ${f1(-d * 22)} 18" stroke="${darker(coat)}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
const flyHen = (x, y) => flyE(x, y, 12, 9, "#f8f4ea") + flyC(x + 9, y - 3, 3.5, "#d9372b");
const flyTent = (x, y, c, k = 1) => flyPath(flyPoly([[x - 66 * k, y + 54 * k], [x - 66 * k, y - 42 * k], [x + 74 * k, y - 42 * k], [x + 74 * k, y + 54 * k]]), FLY_SHADE) +
  flyPath(flyPoly([[x - 70 * k, y - 50 * k], [x, y - 50 * k], [x, y + 50 * k], [x - 70 * k, y + 50 * k]]), lighter(c)) + flyPath(flyPoly([[x, y - 50 * k], [x + 70 * k, y - 50 * k], [x + 70 * k, y + 50 * k], [x, y + 50 * k]]), c);
// (a stream's bed and its ripples: d its middle line, w its width)
const flyStream = (d, w, deep = "#3f86c9") => flyPath(d, "none", ` stroke="${deep}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round"`);
const flyRipples = d => flyPath(d, "none", ` stroke="#9fd0f5" stroke-width="4" stroke-dasharray="16 28"`);
// (the woods along the square's far edge: crowns in a band)
const flyFarWoods = (key, n = 9, salt = 0, cols = ["#2f5f2a", "#3d6e30", "#4f8f5a"]) => flyCrowns(key, n, [20, 6, FT - 20, 0.16 * FT], 40, 66, cols, salt);
const FLY_LOOKS = {
  // (the forest: two rows of pines across the back; the meadow, a pale oval in its middle, flowers; four big leafy trees, two
  // each side, one at the edge and one nearer the middle)
  forest: k => flyRect(0, 0, FT, FT, "#5f8f3e") + flyCrowns(k, 9, [20, 6, FT - 20, 0.12 * FT], 40, 60, ["#2f5a2c", "#3a6a33"]) + flyCrowns(k, 8, [20, 0.1 * FT, FT - 20, 0.24 * FT], 44, 64, ["#2f5a2c", "#3f7038"], 30) +
    flyE(FT / 2, 0.6 * FT, 0.24 * FT, 0.14 * FT, "#93b866") + flyOak(flyX(-0.45), 0.52 * FT, 92) + flyOak(flyX(-0.27), 0.7 * FT, 80, "#47803a") + flyOak(flyX(0.45), 0.5 * FT, 92) + flyOak(flyX(0.28), 0.72 * FT, 80, "#47803a") +
    flyNear(flyFlowers(k, 16, [flyX(-0.2), 0.42 * FT, flyX(0.2), 0.9 * FT])),
  // (the clearing: woods round its back, four oaks at its sides; sand paths fanning from the near middle to what it shows far
  // off (each its own setting): the house, the tree house, the castle, the witch's hut, the healer's round hut; flowers)
  clearing: (k, o) => { const far = [["seeHouse", -0.36, 0.3], ["seeTree", -0.2, 0.2], ["seeCastle", 0.1, 0.18], ["seeWitch", 0.25, 0.26], ["seeHealer", 0.36, 0.42]].filter(([s]) => o[s] !== false);
    let t = flyRect(0, 0, FT, FT, "#6f9a3e") + flyPath(far.map(([, s, v]) => `M${FT / 2} ${0.95 * FT} L${f1(flyX(s))} ${f1(v * FT + 40)}`).join(" "), "none", ` stroke="#d9c08a" stroke-width="30" stroke-linecap="round"`) +
      flyFarWoods(k, 10) + flyOak(flyX(-0.46), 0.5 * FT, 70) + flyOak(flyX(-0.45), 0.8 * FT, 64) + flyOak(flyX(0.46), 0.62 * FT, 70) + flyOak(flyX(0.45), 0.86 * FT, 64);
    for (const [s, x, v] of far) { const cx = flyX(x), cy = v * FT;
      t += s === "seeHouse" ? flyRoof(cx - 46, cy - 30, 92, 60, "#3d2b22") : s === "seeTree" ? flyOak(cx, cy, 66) : s === "seeCastle" ? flyRect(cx - 50, cy - 34, 100, 68, "#b8b8c4") + [[-50, -34], [50, -34], [-50, 34], [50, 34]].map(([dx, dy]) => flyC(cx + dx, cy + dy, 16, "#3b5ea8")).join("")
        : s === "seeWitch" ? flyRoof(cx - 36, cy - 26, 72, 52, "#6b4a2b") : flyCone(cx, cy, 40, "#c9a45a"); }
    return t + flyNear(flyFlowers(k, 16, [flyX(-0.4), 0.55 * FT, flyX(0.4), 0.95 * FT])); },
  // (the fairy forest: pines and oaks in two rows at the back; the great tree at the left, the fairy house in its trunk (its
  // round green door, its lit windows, lanterns on its branches) unless hidden; the toadstool ring to the right of the middle
  // (its mushrooms setting); a bush at the right edge, stones; the fairies' lights)
  fairyforest: (k, o) => { const n = Math.max(4, Math.min(20, Math.round(o.mushrooms ?? 14))), rx = 0.24 * FT, ry = 0.08 * FT, rcx = flyX(0.06), rcy = 0.7 * FT;
    return flyRect(0, 0, FT, FT, "#5d8f54") + flyCrowns(k, 9, [20, 6, FT - 20, 0.14 * FT], 40, 60, ["#3f7f6a", "#2f6b4a"]) + flyCrowns(k, 7, [20, 0.12 * FT, FT - 20, 0.26 * FT], 44, 64, ["#4f8f5a", "#6f5aa8"], 30) +
      flyOak(flyX(-0.3), 0.42 * FT, 130, "#3f7f5a") + ((o.fairyHouseSeen ?? 100) > 0 ? flyC(flyX(-0.3), 0.42 * FT + 118, 26, "#3f9a4a", ` stroke="#2a6a30" stroke-width="5"`) : "") + flyOak(flyX(0.47), 0.56 * FT, 56) +
      flyNear([...Array(n)].map((_, i) => { const a = i / n * 2 * Math.PI; return flyC(rcx + rx * Math.cos(a), rcy + ry * Math.sin(a), 11, "#d9372b") + flyC(rcx + rx * Math.cos(a) - 3, rcy + ry * Math.sin(a) - 3, 3, "#ffffff"); }).join("") +
        flyStone(flyX(-0.4), 0.8 * FT, 22, "#9a968c", 3) + flyStone(flyX(0.2), 0.84 * FT, 18, "#9a968c", 5) + [0, 1, 2, 3, 4, 5].map(i => flyC(flyX(-0.3) + 160 * Math.cos(i * 1.1), 0.42 * FT + 120 * Math.sin(i * 1.1), 7, "#fff7a8")).join("")); },
  // (the wood path: thick woods either side, and the path winding from the near middle off to the far trees, drifting a
  // little to the right and narrowing; four trunks with ferns, four red mushrooms)
  woodpath: k => flyRect(0, 0, FT, FT, "#3f6b2e") + flyPath(`M${flyX(0)} ${FT} C${flyX(-0.06)} ${0.7 * FT} ${flyX(0.1)} ${0.45 * FT} ${flyX(0.06)} 0`, "none", ` stroke="#b8955c" stroke-width="64" stroke-linecap="round"`) +
    flyCrowns(k, 8, [10, 10, 0.32 * FT, FT - 10], 55, 90, ["#2f5f2a", "#3d6e30"]) + flyCrowns(k, 8, [0.7 * FT, 10, FT - 10, FT - 10], 55, 90, ["#2f5f2a", "#3d6e30"], 40) +
    flyNear([-0.46, -0.3, 0.33, 0.47].map((s, i) => flyC(flyX(s), (0.55 + 0.1 * i) * FT, 22, "#5e3d22") + flyE(flyX(s) + 24, (0.55 + 0.1 * i) * FT + 18, 26, 12, "#5fa84a")).join("") +
      [-0.38, -0.25, 0.27, 0.4].map((s, i) => flyC(flyX(s), (0.78 - 0.06 * i) * FT, 10, "#d9372b")).join("")),
  // (the crossing: its own floor colour with leaf litter, woods in its corners; its paths are its ways, drawn as every square's)
  crossing: (k, o, cell = {}) => flyRect(0, 0, FT, FT, cell.crossFloor || "#76843a") + flyCrowns(k, 3, [10, 10, 200, 200], 55, 85, ["#2f5f2a", "#3d6e30"]) + flyCrowns(k, 3, [FT - 200, 10, FT - 10, 200], 55, 85, ["#2f5f2a", "#3d6e30"], 20) +
    flyCrowns(k, 3, [10, FT - 200, 200, FT - 10], 55, 85, ["#36662d"], 40) + flyCrowns(k, 3, [FT - 200, FT - 200, FT - 10, FT - 10], 55, 85, ["#36662d"], 60) +
    flyNear([...Array(14)].map((_, i) => flyE(60 + (FT - 120) * flyR(k, 300 + i), 60 + (FT - 120) * flyR(k, 330 + i), 8, 4, ["#a8743f", "#c9822b", "#8a6a2a"][i % 3], ` transform="rotate(${Math.round(180 * flyR(k, 360 + i))} ${f1(60 + (FT - 120) * flyR(k, 300 + i))} ${f1(60 + (FT - 120) * flyR(k, 330 + i))})"`)).join("")),
  // (the mountain trail: the peaks at the back, snow on their tops, and down in the far valley a lake and a village (farLake);
  // the dirt trail from the near middle curving off to the far left; grey rocks with tufts, and pines, at the sides)
  mountains: (k, o) => flyRect(0, 0, FT, FT, "#8c8a6c") + [[0.2, 0.14, 150], [0.52, 0.1, 180], [0.84, 0.16, 140]].map(([u, v, r]) => { const x = u * FT, y = v * FT;
      return flyPath(flyPoly([[x - r, y + 0.6 * r], [x, y - 0.75 * r], [x + 0.1 * r, y + 0.9 * r]]), "#b3aa98") + flyPath(flyPoly([[x, y - 0.75 * r], [x + r, y + 0.55 * r], [x + 0.1 * r, y + 0.9 * r]]), "#7a7262") + flyC(x + 0.02 * r, y - 0.42 * r, 0.24 * r, "#f4f6f8"); }).join("") +
    (o.farLake !== false ? flyE(flyX(0.04), 0.34 * FT, 90, 34, "#4f8fd0") + flyRect(flyX(0.12), 0.3 * FT, 22, 16, "#a8463a") + flyRect(flyX(0.17), 0.33 * FT, 18, 14, "#c9a45a") : "") +
    flyPath(`M${flyX(0)} ${FT} C${flyX(0.05)} ${0.75 * FT} ${flyX(-0.3)} ${0.65 * FT} ${flyX(-0.42)} ${0.42 * FT}`, "none", ` stroke="#b8955c" stroke-width="50" stroke-linecap="round"`) +
    [-0.46, -0.4, 0.4, 0.48].map((s, i) => flyPine(flyX(s), (0.5 + 0.12 * i) * FT, 40)).join("") +
    flyNear([-0.42, -0.3, -0.18, 0.2, 0.3, 0.44, 0.36, -0.36].map((s, i) => flyStone(flyX(s), (0.55 + 0.05 * i) * FT, 20, ["#8f8a80", "#b4afa4", "#7a7262"][i % 3], 10 + i) + flyC(flyX(s) + 18, (0.55 + 0.05 * i) * FT + 14, 6, "#6f8a3a")).join("") +
      [-0.5, -0.36, 0.36, 0.5].map((s, i) => flyPine(flyX(s), (0.62 + 0.08 * i) * FT, 32)).join("")),
  // (the pasture: the rail fence across the back with its shut gate near the middle, a bird on its post; the big tree at the
  // left, the trough farther back; its horses (bay, grey and chestnut, as many as pastureHorses); flowers)
  pasture: (k, o) => { const nh = Math.max(0, Math.min(3, Math.round(o.pastureHorses ?? 3))), nf = Math.max(0, Math.min(24, Math.round(o.pastureFlowers ?? 10)));
    return flyRect(0, 0, FT, FT, "#93bf5c") + flyPath(`M0 ${0.24 * FT} H${flyX(0.0)} M${flyX(0.07)} ${0.24 * FT} H${FT}`, "none", ` stroke="#8a6a3a" stroke-width="9"`) + flyFarWoods(k, 6, 10, ["#4f8f5a", "#5c9c63"]) +
      flyRect(flyX(0.0), 0.24 * FT - 6, flyX(0.07) - flyX(0), 12, "#a8743f") + flyOak(flyX(-0.4), 0.42 * FT, 96) + flyRect(flyX(-0.3) - 40, 0.3 * FT, 80, 22, "#7a8a9a", ` rx="6"`) +
      [[0.18, 0.62, "#7b4a2a"], [0.335, 0.74, "#b8b8b0"], [-0.12, 0.68, "#a0522d"]].slice(0, nh).map(([s, v, c], i) => flyHorse(flyX(s), v * FT, c, i % 2 ? -1 : 1)).join("") +
      flyNear(flyC(flyX(0.0), 0.24 * FT, 7, "#3a3a4a") + flyFlowers(k, nf, [40, 0.5 * FT, FT - 40, FT - 30])); },
  // (the lake: woods along its far shore, oaks and pines; the water across the middle, lily pads on it, its ducks (o.ducks);
  // the near shore's dirt with a sandy beach in the middle, pebbles on it; cattails each side (o.cattails))
  lake: (k, o) => { const nd = Math.max(0, Math.min(8, Math.round(o.ducks ?? 5))), nc = Math.max(0, Math.min(16, Math.round(o.cattails ?? 14)));   // (from above, at most 8 ducks and 16 cattails)
    return flyRect(0, 0, FT, FT, "#7a8a4a") + flyFarWoods(k, 10, 0, ["#2f5f2a", "#3d6e30", "#2f5a2c"]) + flyRect(0, 0.18 * FT, FT, 0.48 * FT, "#3f86c9") + flyRect(0, 0.18 * FT, FT, 0.06 * FT, "#2f6fb0") +
      flyE(FT / 2, 0.72 * FT, 0.24 * FT, 0.07 * FT, "#e2cf98") +
      flyNear([...Array(7)].map((_, i) => flyC(60 + (FT - 120) * flyR(k, 400 + i), 0.3 * FT + 0.3 * FT * flyR(k, 410 + i), 14, "#5fa84a")).join("") +
        [...Array(nd)].map((_, i) => { const x = 100 + (FT - 200) * flyR(k, 420 + i), y = 0.32 * FT + 0.26 * FT * flyR(k, 430 + i); return flyE(x, y, 13, 8, i % 2 ? "#f8f4ea" : "#8a6a4a") + flyC(x + 11, y - 2, 6, i % 2 ? "#f8f4ea" : "#2f6b3a") + flyC(x + 17, y - 2, 2.5, "#f2a12e"); }).join("") +
        [...Array(nc)].map((_, i) => { const left = i % 2 === 0, x = left ? 30 + 160 * flyR(k, 440 + i) : FT - 30 - 160 * flyR(k, 440 + i), y = 0.66 * FT + 0.05 * FT * flyR(k, 470 + i); return flyC(x, y, 5, "#6b4a2b"); }).join("") +
        [...Array(6)].map((_, i) => flyC(FT / 2 - 120 + 240 * flyR(k, 480 + i), 0.7 * FT + 40 * flyR(k, 490 + i), 5, "#a8a49a")).join("")); },
  // (open water: waves all over it, the sun's glitter on the right)
  sea: k => flyRect(0, 0, FT, FT, "#2d6fb3") + [0, 1, 2, 3, 4, 5, 6].map(i => { const x = 60 + (FT - 160) * flyR(k, i), y = 60 + (FT - 120) * flyR(k, 20 + i); return `<path d="M${f1(x)} ${f1(y)} q25 -16 50 0 q25 16 50 0" fill="none" stroke="#9fd0f5" stroke-width="7" stroke-linecap="round"/>`; }).join("") +
    flyNear([...Array(10)].map((_, i) => flyRect(flyX(0.25) + 160 * flyR(k, 50 + i) - 80, 0.3 * FT + 0.4 * FT * flyR(k, 60 + i), 26, 5, "#fff7c2", ` opacity="0.8"`)).join("")),
  // (the deep sea's floor: dark sand with ridges at the back, dark rocks at the sides, kelp in clumps both sides, a vent
  // bubbling on the left)
  deepsea: k => flyRect(0, 0, FT, FT, "#4f5f72") + flyPath([0, 1, 2].map(i => `M30 ${40 + i * 40} q${FT / 4} -20 ${FT / 2} 0 t${FT / 2 - 60} 0`).join(" "), "none", ` stroke="#3c4a5c" stroke-width="10"`) +
    [-0.46, -0.36, 0.36, 0.44].map((s, i) => flyStone(flyX(s), (0.4 + 0.15 * i) * FT, 44, "#3a3f4a", 20 + i)).join("") + flyC(flyX(-0.2), 0.6 * FT, 24, "#2a2f38") +
    flyNear([-0.42, -0.3, 0.3, 0.42].map((s, i) => flyCrowns(k, 3, [flyX(s) - 40, (0.62 + 0.06 * i) * FT, flyX(s) + 40, (0.72 + 0.06 * i) * FT], 12, 20, ["#2f8f4e", "#3f9f5e"], 600 + 9 * i)).join("") +
      [0, 1, 2].map(i => flyC(flyX(-0.2) + 14 * i - 14, 0.6 * FT - 30 - 18 * i, 6 - i, "#cfe9fb", ` opacity="0.7"`)).join("")),
  // (under the lake: the sandy bottom seen through the water, far kelp at the back; blue-grey rocks and seaweed at the sides;
  // the shipwreck at the left, tilted, its chest; the picnic table and its bench at the right, a shark at each end; a clam; fish)
  underwater: k => flyRect(0, 0, FT, FT, "#9fb49a") + flyPath([...Array(9)].map((_, i) => `M${40 + i * 90} 10 v70`).join(" "), "none", ` stroke="#3f8f5a" stroke-width="12" stroke-linecap="round"`) +
    flyPath(`M${flyX(-0.42)} ${0.5 * FT} L${flyX(-0.18)} ${0.4 * FT} L${flyX(-0.12)} ${0.5 * FT} L${flyX(-0.36)} ${0.62 * FT} Z`, "#6e4a26", ` stroke="#3e2a16" stroke-width="6"`) + flyRect(flyX(0.18), 0.6 * FT, 130, 70, "#8a5a2b") +
    [-0.46, -0.4, 0.42, 0.46, -0.08].map((s, i) => flyStone(flyX(s), (0.3 + 0.13 * i) * FT, 30, "#7a8a9a", 30 + i)).join("") +
    flyNear(flyRect(flyX(-0.32), 0.48 * FT, 34, 22, "#8a5a2b", ` stroke="#e8b923" stroke-width="3"`) + flyRect(flyX(0.18), 0.74 * FT, 130, 18, "#6e4a26") +
      [flyX(0.16), flyX(0.36)].map((x, i) => flyE(x, 0.66 * FT + 50 * i, 36, 10, "#8a96a6") + flyPath(`M${f1(x - 36)} ${f1(0.66 * FT + 50 * i)} l-14 -10 v20 Z`, "#8a96a6")).join("") +
      flyE(flyX(0.08), 0.86 * FT, 16, 10, "#f8e1c7") + [0, 1, 2, 3].map(i => flyE(80 + (FT - 160) * flyR(k, 500 + i), 0.2 * FT + 0.3 * FT * flyR(k, 510 + i), 14, 7, "#ffb347")).join("")),
  // (the beach: the ocean the far band, its foam where it meets the sand; striped blankets, purple and yellow on the left and
  // green and white on the right; a palm at each side; an umbrella and a chair each side; a sand castle each side)
  beach: k => flyRect(0, 0, FT, FT, "#ead49c") + flyRect(0, 0, FT, 0.3 * FT, "#2d6fb3") + `<path d="M0 ${f1(0.3 * FT)} q100 26 200 0 t200 0 t200 0 t200 0" fill="none" stroke="#f4fbff" stroke-width="16"/>` +
    flyPalm(flyX(-0.46), 0.55 * FT, 80) + flyPalm(flyX(0.46), 0.6 * FT, 80) + flyUmbrella(flyX(-0.3), 0.5 * FT, 54, "#e53935", "#ffffff") + flyUmbrella(flyX(0.3), 0.52 * FT, 54, "#3b82f6", "#f2c12e") +
    [[-0.2, "#7c3aed", "#f2c12e"], [0.2, "#22c55e", "#ffffff"]].map(([s, a, b]) => flyRect(flyX(s) - 44, 0.64 * FT, 88, 120, a) + flyPath([0, 1, 2].map(i => `M${f1(flyX(s) - 44)} ${f1(0.64 * FT + 20 + i * 36)} h88`).join(" "), "none", ` stroke="${b}" stroke-width="12"`)).join("") +
    flyNear([-0.3, 0.3].map(s => flyRect(flyX(s) - 20, 0.82 * FT, 40, 40, "#d8bd7d", ` stroke="#b89a5a" stroke-width="3"`) + [[-20, 0], [20, 0], [-20, 40], [20, 40]].map(([dx, dy]) => flyC(flyX(s) + dx, 0.82 * FT + dy, 8, "#cfb070")).join("")).join("") +
      [-0.3, 0.3].map(s => flyRect(flyX(s) + 40, 0.52 * FT, 24, 44, "#ffffff", ` stroke="#8a8a8a" stroke-width="2"`)).join("")),
  // (the jungle waterfall: the mossy cliff across the back, the falls down it in the middle (as wide as fallWidth), its pool
  // below, the mist over the pool's foot; jungle trees each side, flowers, vines down the cliff, parrots)
  waterfall: (k, o) => { const fw = 60 * clamp((o.fallWidth ?? 100) / 100, 0.3, 3);
    return flyRect(0, 0, FT, FT, "#3f7f3a") + flyRect(flyX(-0.36), 0, flyX(0.38) - flyX(-0.36), 0.22 * FT, "#6b6355") + flyRect(flyX(-0.36), 0.18 * FT, flyX(0.38) - flyX(-0.36), 0.05 * FT, "#5a8a3a") +
      flyRect(FT / 2 - fw, 0, 2 * fw, 0.26 * FT, "#cfe9fb") + flyPool(FT / 2, 0.42 * FT, 0.22 * FT, 0.12 * FT) + flyE(FT / 2, 0.3 * FT, 0.14 * FT, 0.05 * FT, "#ffffff", ` opacity="${(0.2 + 0.5 * clamp((o.mist ?? 60) / 100, 0, 1)).toFixed(2)}"`) +
      flyOak(flyX(-0.43), 0.55 * FT, 100, "#2a6a30") + flyOak(flyX(0.43), 0.58 * FT, 100, "#2a6a30") + flyCrowns(k, 6, [10, 0.7 * FT, FT - 10, FT - 10], 40, 64, ["#2a6a30", "#357a35"]) +
      flyNear([...Array(Math.max(0, Math.min(16, Math.round(o.vines ?? 8))))].map((_, i) => flyRect(flyX(-0.34) + (flyX(0.36) - flyX(-0.34)) * flyR(k, 520 + i), 0.02 * FT, 6, 0.18 * FT, "#4f8f3a")).join("") +
        [...Array(Math.max(0, Math.min(4, Math.round(o.parrots ?? 2))))].map((_, i) => flyE(flyX(i % 2 ? 0.43 : -0.43) + 30, 0.5 * FT + 20 * i, 10, 6, ["#d9372b", "#3b82f6", "#f2c12e", "#22c55e"][i])).join("") + flyFlowers(k, 10, [20, 0.64 * FT, FT - 20, FT - 20])); },
  // (the witch's woods: two rows of dead trees at the back; the log hut on its dark mound, its roof brown, its red door, farther
  // or nearer (hutNear); the palisade of stakes across, a skull on every fourth; the giant dead tree at the far left, a smaller
  // one at the right edge; skeleton arms out of the ground; the green cauldron over its fire)
  witch: (k, o) => { const nr = clamp((o.hutNear ?? 0) / 100, 0, 1), hy = (0.2 + 0.12 * nr) * FT, hs = 1 + 0.4 * nr;
    const dead = (x, y, r) => `<path d="M${f1(x - r)} ${f1(y)} H${f1(x + r)} M${f1(x)} ${f1(y - r)} V${f1(y + r)} M${f1(x - 0.7 * r)} ${f1(y - 0.7 * r)} L${f1(x + 0.7 * r)} ${f1(y + 0.7 * r)} M${f1(x + 0.7 * r)} ${f1(y - 0.7 * r)} L${f1(x - 0.7 * r)} ${f1(y + 0.7 * r)}" stroke="#4a3f36" stroke-width="${f1(0.14 * r)}" stroke-linecap="round"/>`;
    return flyRect(0, 0, FT, FT, "#3f4a30") + [...Array(8)].map((_, i) => dead(50 + i * 100, 40 + 30 * (i % 2), 34)).join("") +
      flyE(flyX(0.19), hy + 20, 150 * hs, 90 * hs, "#2f3626") + flyRoof(flyX(0.19) - 70 * hs, hy - 40 * hs, 140 * hs, 90 * hs, "#6b4a2b") + flyRect(flyX(0.19) - 12, hy + 50 * hs, 24, 12, "#a8322a") +
      flyPath(`M0 ${0.48 * FT} H${FT}`, "none", ` stroke="#6e5a44" stroke-width="12" stroke-dasharray="10 8"`) + dead(flyX(-0.42), 0.34 * FT, 110) + dead(flyX(0.46), 0.6 * FT, 60) +
      flyC(flyX(0.32), 0.72 * FT, 34, "#8a8a80") + flyC(flyX(0.32), 0.72 * FT, 26, "#1f1f22") + flyC(flyX(0.32), 0.72 * FT, 18, "#5fbf4a") +
      flyNear([...Array(14)].map((_, i) => flyC(18 + i * 72, 0.48 * FT, 6, "#f4efe0")).join("") + [-0.14, 0.12, -0.44, 0.45].map((s, i) => flyPath(`M${f1(flyX(s))} ${f1((0.62 + 0.07 * i) * FT)} l14 -10 l8 4 M${f1(flyX(s) + 14)} ${f1((0.62 + 0.07 * i) * FT - 10)} l4 -10`, "none", ` stroke="#f4efe0" stroke-width="5" stroke-linecap="round"`)).join("")); },
  // (the cemetery: small far stones in a row; the near stones (a tall stag stone, headstones, a Celtic cross); the brook from
  // far right winding down to the near edge, widening, stones along it, the weeping willow on its bank; bushes, pink, green,
  // yellow and white; flowers)
  cemetery: k => flyRect(0, 0, FT, FT, "#6e7d58") + flyFarWoods(k, 7, 0, ["#4a5a3a", "#55503f"]) + flyStream(`M${flyX(0.2)} ${0.2 * FT} C${flyX(0.3)} ${0.4 * FT} ${flyX(0.32)} ${0.6 * FT} ${flyX(0.4)} ${FT}`, 40) +
    flyC(flyX(0.38), 0.34 * FT, 90, "#8fbf6a") + flyPath([...Array(7)].map((_, i) => `M${f1(flyX(0.38) - 70 + 23 * i)} ${f1(0.34 * FT - 60)} v120`).join(" "), "none", ` stroke="#6f9f4a" stroke-width="6"`) +
    [-0.42, -0.3, -0.18, -0.04, 0.1].map(s => flyRect(flyX(s) - 14, 0.3 * FT, 28, 12, "#a8a8a0", ` stroke="#7a7a72" stroke-width="3"`)).join("") +
    [[-0.36, 40, 16], [-0.2, 30, 14], [0.26, 34, 34], [0.44, 30, 14]].map(([s, w, h]) => flyRect(flyX(s) - w / 2, 0.62 * FT, w, h, "#b4b4ac", ` stroke="#7a7a72" stroke-width="3"`)).join("") +
    flyNear(flyRipples(`M${flyX(0.2)} ${0.2 * FT} C${flyX(0.3)} ${0.4 * FT} ${flyX(0.32)} ${0.6 * FT} ${flyX(0.4)} ${FT}`) + [[-0.47, "#f472b6"], [-0.12, "#4f8a3a"], [-0.28, "#f2c12e"], [0.36, "#f8f4ea"]].map(([s, c], i) => flyC(flyX(s), (i === 2 ? 0.4 : 0.76) * FT, 26, c)).join("") +
      flyFlowers(k, 14, [30, 0.5 * FT, flyX(0.15), FT - 20])),
  // (the house and yard: the house a little left of the middle, its dark brown roof and its brick chimney on the right; the
  // garage to its right, its roof dark brown too; the driveway from the garage toward us on the right, the stone walk from the
  // door to us in the middle; bushes and a flower bed along the front; an oak each side (treeSize); toys on the lawn (toys))
  house: (k, o) => { const hs = clamp((o.houseSize ?? 100) / 100, 0.5, 1.6), ts = clamp((o.treeSize ?? 100) / 100, 0.4, 2), nt = Math.max(0, Math.min(16, Math.round(o.toys ?? 6)));
    const hx = flyX(-0.08), hw = 0.34 * FT * hs, hh = 0.24 * FT * hs, hy = 0.12 * FT;
    return flyRect(0, 0, FT, FT, "#7caa4c") + flyRect(flyX(0.26) - 50, hy + 0.2 * FT, 100, FT - hy - 0.2 * FT, "#a8a8a8") + flyRoof(hx - hw / 2, hy, hw, hh, "#3d2b22") + flyRect(hx + 0.28 * hw, hy + 10, 24, 30, "#a8463a") +
      flyRoof(flyX(0.26) - 70, hy + 0.06 * FT, 140, 0.14 * FT, "#3d2b22") + flyOak(flyX(-0.42), 0.42 * FT, 90 * ts) + flyOak(flyX(0.44), 0.36 * FT, 84 * ts) +
      flyNear([...Array(5)].map((_, i) => flyC(hx, hy + hh + 30 + i * 54, 14, "#b4afa4")).join("") + flyRect(hx - hw / 2, hy + hh + 6, hw, 18, "#7a5232") + flyFlowers(k, Math.min(24, Math.round((o.flowers ?? 18) / 2)), [hx - hw / 2, hy + hh + 6, hx + hw / 2, hy + hh + 24]) +
        flyBushes(k, 4, [hx - hw / 2, hy + hh + 24, hx + hw / 2, hy + hh + 50], 540) +
        [...Array(nt)].map((_, i) => { const x = (i % 2 ? flyX(-0.35) : flyX(0.05)) + 140 * flyR(k, 560 + i), y = 0.6 * FT + 0.3 * FT * flyR(k, 580 + i); return flyC(x, y, 9, ["#e53935", "#3b82f6", "#f2c12e", "#22c55e"][i % 4], ` stroke="#ffffff" stroke-width="2"`); }).join("")); },
  // (the farm yard: crop strips behind the post-and-rail fence at the back; the red barn left of the middle; the farmhouse at
  // the right, white, its roof dark red; the windpump at the left, its trough; the red tractor; the haystack; three hens; the
  // packed earth with wheel ruts)
  farmyard: k => flyRect(0, 0, FT, FT, "#b8955c") + [0, 1, 2, 3].map(i => flyRect(0, i * 0.05 * FT, FT, 0.05 * FT, ["#8fae56", "#c9b45a", "#7a9a48", "#d8c070"][i])).join("") +
    flyPath(`M0 ${0.21 * FT} H${FT}`, "none", ` stroke="#6e4a26" stroke-width="8"`) + flyRoof(flyX(-0.17) - 90, 0.28 * FT, 180, 140, "#b03a2e") + flyRoof(flyX(0.36) - 70, 0.26 * FT, 140, 110, "#8e3b2f") +
    flyPath(`M${flyX(-0.31) - 34} ${0.36 * FT} l68 68 M${flyX(-0.31) + 34} ${0.36 * FT} l-68 68`, "none", ` stroke="#8a8f98" stroke-width="7"`) + flyRect(flyX(-0.31) + 40, 0.46 * FT, 70, 24, "#7a8a9a") +
    flyRect(flyX(0.13) - 34, 0.6 * FT, 68, 44, "#d9372b") + flyC(flyX(0.38), 0.68 * FT, 46, "#e8c35a") +
    flyNear(flyPath(`M${flyX(-0.05)} ${FT} C${flyX(-0.05)} ${0.7 * FT} ${flyX(0)} ${0.55 * FT} ${flyX(0.05)} ${0.44 * FT} M${flyX(0.03)} ${FT} C${flyX(0.03)} ${0.7 * FT} ${flyX(0.08)} ${0.55 * FT} ${flyX(0.13)} ${0.44 * FT}`, "none", ` stroke="#8a6a3a" stroke-width="6"`) +
      [[-34, -22], [34, -22], [-34, 22], [34, 22]].map(([dx, dy]) => flyC(flyX(0.13) + dx, 0.6 * FT + 22 + dy, 9, "#1f1f22")).join("") + [0, 1, 2].map(i => flyHen(flyX(-0.1) + 60 * i, 0.78 * FT + 20 * (i % 2))).join("")),
  // (the camp site: pines in a row at the back; its tents (tents: orange at the left, blue at the right, green), the ring of
  // stones and the fire (fireOn), a pot of soup or sausages over it (campFood); logs to sit on, left, right and near)
  campsite: (k, o) => { const n = Math.max(0, Math.min(3, Math.round(o.tents ?? 2))), fire = o.fireOn !== false, fx = FT / 2, fy = 0.62 * FT;
    return flyRect(0, 0, FT, FT, "#7a9a48") + flyCrowns(k, 9, [20, 6, FT - 20, 0.16 * FT], 44, 66, ["#2f5a2c", "#3a6a33"]) +
      [[-0.32, 0.36, "#d9822b"], [0.33, 0.38, "#3b82f6"], [-0.12, 0.28, "#22c55e"]].slice(0, n).map(([s, v, c]) => flyTent(flyX(s), v * FT, c)).join("") +
      flyC(fx, fy, 44, "#8a8a80") + flyC(fx, fy, 32, fire ? "#ff8a1c" : "#4a3f36") + (fire ? flyC(fx, fy, 14, "#ffd84a") : "") +
      [[-150, 0, 0], [150, 0, 0], [0, 100, 90]].map(([dx, dy, a]) => flyRect(fx + dx - 50, fy + dy - 14, 100, 28, "#8a5a2b", ` rx="12" transform="rotate(${a + 90} ${f1(fx + dx)} ${f1(fy + dy)})"`)).join("") +
      flyNear(o.campFood === "soup" ? flyC(fx, fy, 20, "#2a2a2a") + flyC(fx, fy, 14, "#c9822b") : o.campFood === "sausages" ? flyPath(`M${fx - 40} ${fy - 10} l80 8 M${fx - 40} ${fy + 10} l80 -8`, "none", ` stroke="#a8743f" stroke-width="4"`) : ""); },
  // (the grass hut: a far row of woods; the round stick huts, thatched (hutRooms of them in a ring, hutCluster's, a bigger one
  // in the middle with hutCenter); the sand path from the door toward us, flowers either side; the woodpile at the right)
  hut: (k, o) => { const n = Math.max(1, Math.min(6, Math.round(o.hutRooms ?? 1))), c = o.hutCenter === true, cx = FT / 2, cy = 0.4 * FT;
    const spots = n === 1 ? [[cx, cy]] : [...Array(n)].map((_, i) => { const a = Math.PI * (1.15 + 0.7 * i / Math.max(1, n - 1)); return [cx + 210 * Math.cos(a) * -1, cy + 120 * Math.sin(a) + 60]; });
    return flyRect(0, 0, FT, FT, "#7a9a48") + flyPath(`M${cx} ${cy + 90} L${cx} ${FT}`, "none", ` stroke="#d9c08a" stroke-width="44" stroke-linecap="round"`) + flyFarWoods(k, 8) +
      (c ? flyCone(cx, cy - 20, 130, "#c9c25a") : "") + spots.map(([x, y]) => flyCone(x, y, n === 1 ? 120 : 80, "#c9c25a") + flyC(x, y, n === 1 ? 70 : 46, "#a8a23e", ` opacity="0.7"`)).join("") +
      [0, 1, 2, 3, 4].map(i => flyC(flyX(0.32) + 16 * (i % 3), 0.64 * FT + 14 * Math.floor(i / 3), 8, "#a8743f", ` stroke="#6e4a26" stroke-width="2"`)).join("") +
      flyNear(flyFlowers(k, 14, [cx - 160, 0.6 * FT, cx + 160, FT - 20])); },
  // (the desert: rippled sand, dunes at the back (or mesas, desertFar); its cacti where the scene stands them: saguaros, a Joshua
  // tree, an agave, an ocotillo, a prickly pear, a barrel cactus; rocks; the lizard on its stone; a tumbleweed)
  desert: (k, o) => flyRect(0, 0, FT, FT, "#e3c07a") + (o.desertFar === "mesas" ? [[0.18, 140], [0.55, 200], [0.86, 120]].map(([u, w]) => flyRect(u * FT - w / 2, 10, w, 90, "#c26a48", ` rx="20"`) + flyRect(u * FT - w / 2 + 14, 16, w - 28, 50, "#d98a60", ` rx="14"`)).join("")
      : [0, 1].map(i => `<path d="M${f1(20 + 60 * i)} ${f1(50 + i * 60)} q160 -50 320 0 t320 0" fill="none" stroke="#f0d79a" stroke-width="24" stroke-linecap="round"/>`).join("")) +
    [[-0.12, 0.32, "saguaro"], [0.33, 0.34, "joshuatree"], [-0.2, 0.46, "agave"], [0.17, 0.52, "ocotillo"], [0.38, 0.8, "pricklypear"], [-0.43, 0.82, "saguaro"], [-0.24, 0.9, "barrelcactus"]].map(([s, v, kind]) => flyThingSvg({ kind, x: s * 811.8, z: 240 + 170 * (v - FTOP / FT) / (1 - FTOP / FT - 30 / FT), size: kind === "saguaro" ? 140 : 110 })).join("") +
    flyStone(flyX(0.1), 0.42 * FT, 26, "#c9a070", 41) + flyStone(flyX(0.02), 0.3 * FT, 22, "#b8905a", 42) +
    flyNear(flyStone(flyX(0.18), 0.66 * FT, 16, "#b8905a", 43) + flyE(flyX(0.18) + 4, 0.66 * FT - 4, 12, 4, "#5f9a3a") + flyC(flyX(-0.05), 0.72 * FT, 20, "none", ` stroke="#a8743f" stroke-width="4" stroke-dasharray="5 4"`) +
      flyPath(`M${flyX(-0.3)} ${0.6 * FT} q20 -10 40 0 t40 0 t40 0`, "none", ` stroke="#c9a060" stroke-width="3" stroke-dasharray="3 6"`)),
  // (the garden: the white picket fence across the back, the rose arbor in its middle, the tall flowers along it; the stepping
  // stones from the arbor toward us; the beds either side of them (gardenBeds), in rows; the shed at the left, its green roof,
  // its rain barrel; the apple tree at the right, the bench; the wheelbarrow)
  garden: (k, o) => { const nb = Math.max(0, Math.min(6, Math.round(o.gardenBeds ?? 4)));
    return flyRect(0, 0, FT, FT, "#7caa4c") + flyPath(`M0 ${0.12 * FT} H${FT}`, "none", ` stroke="#f8f4ea" stroke-width="10" stroke-dasharray="10 8"`) + flyPath(`M${FT / 2 - 50} ${0.12 * FT} a50 30 0 0 1 100 0`, "none", ` stroke="#e85d75" stroke-width="12"`) +
      flyRoof(flyX(-0.33) - 70, 0.2 * FT, 140, 110, "#4f8a4a") + flyC(flyX(-0.33) + 84, 0.2 * FT + 100, 20, "#4a6a8a") + flyOak(flyX(0.31), 0.32 * FT, 86, "#4f8a32") + flyRect(flyX(0.4) - 18, 0.56 * FT, 36, 70, "#8a5a2b") +
      [...Array(nb)].map((_, i) => { const left = i % 2 === 0, j = Math.floor(i / 2), x = left ? flyX(-0.3) : flyX(0.08), y = 0.5 * FT + j * 0.15 * FT; return flyRect(x, y, flyX(0.3) - flyX(0.08), 0.1 * FT, "#7a5232"); }).join("") +
      flyNear([...Array(6)].map((_, i) => flyC(FT / 2, 0.2 * FT + i * 0.13 * FT, 16, "#b4afa4")).join("") + flyFlowers(k, 18, [20, 0.13 * FT, FT - 20, 0.17 * FT]) +
        [...Array(nb)].map((_, i) => { const left = i % 2 === 0, j = Math.floor(i / 2), x = left ? flyX(-0.3) : flyX(0.08), y = 0.5 * FT + j * 0.15 * FT; return flyPath(`M${f1(x + 10)} ${f1(y + 20)} h${f1(flyX(0.3) - flyX(0.08) - 20)} M${f1(x + 10)} ${f1(y + 50)} h${f1(flyX(0.3) - flyX(0.08) - 20)}`, "none", ` stroke="#5fbf4a" stroke-width="10" stroke-dasharray="12 10"`); }).join("") +
        [0, 1, 2, 3, 4].map(i => flyC(flyX(0.31) - 50 + 25 * i, 0.32 * FT - 30 + 20 * (i % 2), 7, "#d9372b")).join("") + flyRect(flyX(-0.16) - 20, 0.86 * FT, 40, 26, "#5a6f9a", ` rx="6"`)); },
  // (the spring: woods round its back; the round pool in the middle, ringed by mossy stones, lily pads on it, reeds at both
  // ends, its frogs (springFrogs) at the edge, its bubbles; the mossy rock and the log, near)
  spring: (k, o) => { const nf = Math.max(0, Math.min(3, Math.round(o.springFrogs ?? 2))), px = FT / 2, py = 0.48 * FT, rx = 0.19 * FT, ry = 0.13 * FT;
    return flyRect(0, 0, FT, FT, "#6f9e45") + flyFarWoods(k, 10) + flyCrowns(k, 3, [10, 0.2 * FT, 120, 0.5 * FT], 44, 66, ["#2f5f2a"], 40) + flyCrowns(k, 3, [FT - 120, 0.2 * FT, FT - 10, 0.5 * FT], 44, 66, ["#2f5f2a"], 60) +
      [...Array(10)].map((_, i) => flyC(px + (rx + 22) * Math.cos(i * 0.628), py + (ry + 18) * Math.sin(i * 0.628), 22, "#8a9a6c")).join("") + flyPool(px, py, rx, ry, "#3f8fd9", "#a9d6f5") +
      flyStone(flyX(-0.185), 0.78 * FT, 34, "#7f8a6a", 51) + flyRect(flyX(0.185) - 60, 0.76 * FT, 120, 30, "#8a5a2b", ` rx="14"`) +
      flyNear([0, 1, 2, 3].map(i => flyC(px - rx * 0.6 + rx * 0.4 * i, py - ry * 0.3 + ry * 0.25 * (i % 2), 12, "#5fa84a")).join("") + [-1, 1].map(sd => flyPath([0, 1, 2, 3].map(j => `M${f1(px + sd * (rx + 4) + 6 * j)} ${f1(py - 20 + 12 * j)} v-26`).join(" "), "none", ` stroke="#4f6b3a" stroke-width="4"`)).join("") +
        [...Array(nf)].map((_, i) => flyE(px + (i ? rx * 0.7 : -rx * 0.8), py + ry * 0.9, 12, 9, "#5fbf4a")).join("") +
        [...Array(Math.max(0, Math.min(8, Math.round(o.springBubbles ?? 5))))].map((_, i) => flyC(px - 40 + 80 * flyR(k, 600 + i), py - 20 + 40 * flyR(k, 610 + i), 4, "#e0f2fe", ` opacity="0.8"`)).join("") + flyC(flyX(-0.185) - 12, 0.78 * FT - 10, 12, "#6f9a3a")); },
  // (the dungeon: already seen from above in its own scene: its walls round a tiled floor, open at its ways; torches)
  dungeon: (k, o, cell = {}) => { const open = ways => FLY_EDGE[ways] ? 1 : 0, ws = worldWays(cell);
    return flyRect(0, 0, FT, FT, "#3a3640") + flyRect(70, 70, FT - 140, FT - 140, "#6a6472") + flyPath([1, 2, 3, 4, 5].map(i => `M70 ${70 + i * (FT - 140) / 6} H${FT - 70} M${70 + i * (FT - 140) / 6} 70 V${FT - 70}`).join(" "), "none", ` stroke="#57525e" stroke-width="3"`) +
      // (each way open, a gap in the wall there: a side's middle, or a corner)
      ws.filter(open).map(w => { const at = e => e === 1 ? FT - 80 : e === 0 ? 0 : FT / 2 - 60, wd = e => e === 0.5 ? 120 : 80, [ex, ey] = FLY_EDGE[w];
        return flyRect(at(ex), at(ey), wd(ex), wd(ey), "#6a6472"); }).join("") +
      flyNear([[110, 110], [FT - 110, 110], [110, FT - 110], [FT - 110, FT - 110]].map(([x, y]) => flyC(x, y, 12, "#ff8a1c") + flyC(x, y, 5, "#ffd84a")).join("")); },
  // (the cave crossing: rock walls round a worn floor, open at its ways; its crystals, moss, ice or stalagmites, crossCave's)
  cavecross: (k, o, cell = {}) => { const kind = cell.crossCave || "stone", dot = { crystal: "#7fe0f0", moss: "#5fa84a", ice: "#cfe9fb", stone: "#8a8690" }[kind] || "#8a8690";
    return flyRect(0, 0, FT, FT, "#2a282e") + flyE(FT / 2, FT / 2, 0.36 * FT, 0.32 * FT, "#57535c") + flyNear([...Array(12)].map((_, i) => { const a = i * 0.52, x = FT / 2 + 0.4 * FT * Math.cos(a), y = FT / 2 + 0.36 * FT * Math.sin(a);
      return kind === "crystal" ? flyPath(flyPoly([[x, y - 14], [x + 8, y], [x, y + 14], [x - 8, y]]), dot) : flyC(x, y, 10, dot); }).join("")); },
  emptyroom: k => flyRect(0, 0, FT, FT, "#d9d9de") + flyRect(50, 50, FT - 100, FT - 100, "#ececf0"),
  // (our imagination: an empty white room, the map board of place pictures on its far wall, a ladder by each column)
  imagination: k => flyRect(0, 0, FT, FT, "#f4f4f8") + flyRect(0, 0, FT, 0.14 * FT, "#e6e2f0") + flyNear([...Array(12)].map((_, i) => flyRect(40 + i * 62, 24, 50, 40, ["#7caa4c", "#2d6fb3", "#e3c07a", "#b8b8c4", "#6b4a2b", "#c7b4e8"][i % 6])).join("") +
    [0, 1, 2, 3].map(i => flyRect(90 + i * 190, 70, 12, 40, "#a8743f")).join("")),
  // (bubble space: its pale blue floor, its bubbles in its own colours)
  bubblespace: (k, o) => flyRect(0, 0, FT, FT, "#bfe3f7") + [...Array(Math.max(4, Math.min(14, Math.round((o.bubbleCount ?? 30) / 2.5))))].map((_, i) => flyC(80 + (FT - 160) * flyR(k, i), 80 + (FT - 160) * flyR(k, 20 + i), 22 + 36 * flyR(k, 40 + i), "#ffffff40", ` stroke="${o.bubbleAColor || "#ffffff"}" stroke-width="4"`)).join(""),
  treehouse: (k, o) => flyTreehouse(k, o),
  castle: (k, o) => flyCastle(k, o),
};
FLY_LOOKS.bubbleroom = FLY_LOOKS.bubblespace;
// (ticket 691, Matthew: "let's add more detail to the top-down views for each square -- the tree house tree? the castle doesn't
// show a moat, or nearby trees/bushes, etc.") A square's finer things, seen only low down (.fly-near, left out high up as its
// things are): its look's own small pieces. The look reads the place's own settings (o: the background's, which every square
// of that place shares), as its scene does.
const flyNear = svg => svg ? `<g class="fly-near">${svg}</g>` : "";
// bushes from above: small crowns, a lighter top on each
const flyBushes = (key, n, box, salt = 500, col = "#4f8a3a") => [...Array(n)].map((_, i) => { const x = box[0] + (box[2] - box[0]) * flyR(key, salt + 2 * i), y = box[1] + (box[3] - box[1]) * flyR(key, salt + 2 * i + 1), r = 18 + 10 * flyR(key, salt + 40 + i);
  return flyC(x, y, r, col) + flyC(x - 0.3 * r, y - 0.3 * r, 0.45 * r, lighter(col)); }).join("");
// flowers: dots of colour in the grass
const flyFlowers = (key, n, box, salt = 700) => [...Array(n)].map((_, i) => flyC(box[0] + (box[2] - box[0]) * flyR(key, salt + 2 * i), box[1] + (box[3] - box[1]) * flyR(key, salt + 2 * i + 1), 6, ["#f2c12e", "#e85d75", "#ffffff", "#c084fc"][i % 4])).join("");
// a cone roof from above (a tower's, a round hut's): its ring, its sunny half, its point
const flyCone = (x, y, r, c) => flyC(x + 0.18 * r, y + 0.22 * r, r, FLY_SHADE) + flyC(x, y, r, c, ` stroke="${darker(c)}" stroke-width="4"`) + flyPath(`M${f1(x)} ${f1(y - r)} A${f1(r)} ${f1(r)} 0 0 0 ${f1(x)} ${f1(y + r)} Z`, lighter(c), ` opacity="0.55"`) + flyC(x, y, 0.16 * r, darker(c));
// a little flag from above: its pole's foot and the cloth blowing out to the east
const flyFlag = (x, y, c, c2) => flyPath(`M${f1(x)} ${f1(y)} l34 -8 l-6 12 l6 12 Z`, c, ` stroke="${c2}" stroke-width="3"`) + flyC(x, y, 4, "#3a2414");
// The castle from above, from its own settings (castleOf, as castleScene draws it): its moat round the walls (as wide as its
// moat setting; none at 0), lily pads on it; the drawbridge down over it at the gate, to the south (toward us in the scene);
// the curtain walls with their battlements, the stone its own; a tower at each corner, bigger with more levels, its cone roof
// in the castle's roof colour, and the keep's in the middle; flags in its owner's two colours; the fence outside the moat on
// the near side; its trees round it behind and beside (its trees setting); the road out from the bridge with a pennant either
// side; the hay cart on the left, the well on the right, bushes and flowers about.
function flyCastle(key, o) {
  const K = castleOf(o), st = K.stone, L = K.levels, m = Math.max(0, K.moat);   // (castleOf's moat: 1 at its setting's 100)
  const x0 = 0.2 * FT, x1 = 0.8 * FT, y0 = 70, y1 = 0.52 * FT, tr = 34 + 7 * L, mw = 26 + 46 * m, cx = FT / 2;
  let s = flyRect(0, 0, FT, FT, "#7caa4c");
  // (the trees round it: behind it and to each side, the more the further out)
  const n = Math.max(0, Math.min(16, Math.round(K.trees ?? 6)));
  s += flyCrowns(key, Math.ceil(n / 2), [20, 10, 150, y1 + 60], 44, 70, ["#2f6b3a", "#3c7d45"], 20) + flyCrowns(key, Math.floor(n / 2), [FT - 150, 10, FT - 20, y1 + 60], 44, 70, ["#2f6b3a", "#3c7d45"], 50);
  if (m > 0) s += flyRect(x0 - mw, y0 - mw, x1 - x0 + 2 * mw, y1 - y0 + 2 * mw, "#3f86c9", ` rx="${f1(mw + tr)}"`) + flyNear(flyRect(x0 - mw + 6, y0 - mw + 6, x1 - x0 + 2 * mw - 12, y1 - y0 + 2 * mw - 12, "none", ` rx="${f1(mw + tr)}" stroke="#7fb3e8" stroke-width="5"`) +
    [[x0 - mw / 2, y0 + 60], [x1 + mw / 2, y1 - 40], [cx + 120, y1 + mw / 2]].map(([x, y]) => flyC(x, y, 11, "#5fa84a")).join(""));
  // (the walls, their walk, the battlements as a dashed edge)
  s += flyRect(x0, y0, x1 - x0, y1 - y0, darker(st)) + flyRect(x0 + 18, y0 + 18, x1 - x0 - 36, y1 - y0 - 36, "#b9a98a") +
    flyNear(flyRect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8, "none", ` stroke="${st}" stroke-width="10" stroke-dasharray="14 10"`));
  // (the keep, its roof)
  s += flyRect(cx - 0.12 * FT + 10, y0 + 70, 0.24 * FT, 0.16 * FT, FLY_SHADE) + flyRect(cx - 0.12 * FT, y0 + 60, 0.24 * FT, 0.16 * FT, st, ` stroke="${darker(st)}" stroke-width="4"`) + flyCone(cx, y0 + 60 + 0.08 * FT, 0.07 * FT, K.roof);
  // (the corner towers, their roofs, flags on the far two and the keep)
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) s += flyCone(x, y, tr, K.roof);
  s += flyNear(flyFlag(x0, y0 - tr, K.flagA, K.flagB) + flyFlag(x1, y0 - tr, K.flagB, K.flagA) + flyFlag(cx, y0 + 60 - 0.07 * FT, K.flagA, K.flagB));
  // (the gate in the near wall, the drawbridge down across the moat, its chains)
  const bw = 92, by1 = y1 + (m > 0 ? mw : 10) + 6;
  s += flyRect(cx - bw / 2, y1 - 10, bw, by1 - y1 + 10, "#8a5a2b", ` stroke="#5e3d22" stroke-width="4"`) + flyNear(`<path d="M${f1(cx - bw / 2 + 6)} ${f1(y1)} V${f1(by1 - 4)} M${f1(cx + bw / 2 - 6)} ${f1(y1)} V${f1(by1 - 4)}" stroke="#3a3a3a" stroke-width="3" stroke-dasharray="5 4"/>` +
    flyRect(cx - 0.6 * bw, y1 - 16, 1.2 * bw, 14, "#3a3a3a"));
  // (the road out to the south, the pennants either side of its foot; the fence outside the moat on its near side)
  s += flyRect(cx - 0.55 * bw, by1, 1.1 * bw, FT - by1, "#cdb487");
  s += flyNear(flyFlag(cx - 0.75 * bw, by1 + 40, K.flagA, K.flagB) + flyFlag(cx + 0.75 * bw - 30, by1 + 40, K.flagB, K.flagA) +
    `<path d="M${f1(x0 - mw - 20)} ${f1(y1 - 30)} V${f1(by1 + 16)} H${f1(cx - 0.7 * bw)} M${f1(cx + 0.7 * bw)} ${f1(by1 + 16)} H${f1(x1 + mw + 20)} V${f1(y1 - 30)}" fill="none" stroke="#8a5a2b" stroke-width="7" stroke-dasharray="4 14" stroke-linecap="round"/>` +
    // (the hay cart on the left: its bed, the hay heaped; the well on the right: its stones, the dark water)
    flyRect(0.16 * FT, 0.74 * FT, 90, 54, "#8a5a2b", ` rx="6"`) + flyE(0.16 * FT + 45, 0.74 * FT + 27, 38, 20, "#e8c35a") +
    flyC(0.82 * FT, 0.76 * FT, 30, "#9a968c", ` stroke="#6f6a60" stroke-width="5"`) + flyC(0.82 * FT, 0.76 * FT, 17, "#1f3f66") +
    flyBushes(key, 5, [40, y1 + 90, FT - 40, FT - 40]) + flyFlowers(key, 10, [40, y1 + 80, FT - 40, FT - 30]));
  return s;
}
// The tree house from above (its tree as treehouseScene draws it, by its own settings: o.houses, o.bridges, o.ladders): the
// great tree's crown in the middle of the square's far half, the stream winding past it from the far edge to the near one;
// round the crown, where they sit on the tree (TREE_SLOTS: left and right of the trunk, the higher ones further back), each
// house on its platform, its roof in its animal's colour with the animal's ears (a fox's, an owl's tufts, a bunny's long ones);
// the rope bridges from house to house; the ladders down; the round room at the top of the tree, its thatch, over the crown;
// bushes and flowers in the grass.
function flyTreehouse(key, o) {
  const n = Math.max(1, Math.min(6, Math.round(o.houses ?? 4))), nb = Math.max(0, Math.round(o.bridges ?? 2)), nl = Math.max(0, Math.round(o.ladders ?? 3));
  const cx = FT / 2, cy = 0.3 * FT, at = ([x, y]) => [cx + x * 0.92, cy + 150 + y * 0.42];
  let s = flyRect(0, 0, FT, FT, "#6f9a3e");
  s += flyPath(`M${0.62 * FT} 0 C${0.75 * FT} ${0.25 * FT} ${0.85 * FT} ${0.45 * FT} ${0.72 * FT} ${0.62 * FT} S${0.58 * FT} ${0.85 * FT} ${0.66 * FT} ${FT}`, "none", ` stroke="#3f86c9" stroke-width="34" stroke-linecap="round"`) +
    flyNear(flyPath(`M${0.62 * FT} 0 C${0.75 * FT} ${0.25 * FT} ${0.85 * FT} ${0.45 * FT} ${0.72 * FT} ${0.62 * FT} S${0.58 * FT} ${0.85 * FT} ${0.66 * FT} ${FT}`, "none", ` stroke="#9fd0f5" stroke-width="5" stroke-dasharray="18 26"`));
  s += flyCrowns(key, 7, [20, 10, FT - 20, 90], 40, 64, ["#4f8f5a", "#5c9c63"], 10);
  // (the crown: a great one, lighter tops on it, its shadow to the lower right)
  s += flyC(cx + 50, cy + 60, 0.27 * FT, FLY_SHADE) + flyC(cx, cy, 0.27 * FT, "#3f7a32") + flyC(cx - 60, cy - 50, 0.15 * FT, "#4f8a3a") + flyC(cx + 70, cy + 30, 0.12 * FT, "#47803a") + flyC(cx - 20, cy + 70, 0.1 * FT, "#4a8536");
  // (the round room at the top, its thatch)
  s += flyCone(cx, cy - 10, 46, "#c9a45a");
  // (the houses where they sit, the bridges between them, the ladders down from the lowest)
  const H = treeHouses(o, n, 1).map(h => ({ ...h, p: at([h.x, h.y]) }));
  let near = "";
  const byI = [...H].sort((a, b) => a.i - b.i);
  for (let i = 0; i + 1 < byI.length && i < nb * 2; i += 1) { const [a, b] = [byI[i].p, byI[i + 1].p]; if (Math.sign(byI[i].x) === Math.sign(byI[i + 1].x)) continue;
    near += `<path d="M${f1(a[0])} ${f1(a[1])} Q${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2 + 30)} ${f1(b[0])} ${f1(b[1])}" fill="none" stroke="#8a5a2b" stroke-width="10" stroke-dasharray="8 6"/>`; }
  for (const h of [...H].sort((a, b) => b.y - a.y).slice(0, nl)) near += flyRect(h.p[0] - 9, h.p[1] + 40, 18, 90, "#a8743f", ` stroke="#6e4a26" stroke-width="3" stroke-dasharray="6 6"`);
  s += flyNear(near);
  for (const h of H) { const [x, y] = h.p, w = h.look.walls || HOUSE_WALLS[h.animal] || "#b98a5a", ear = HOUSE_EARS[h.animal] || "";
    s += flyC(x, y + 6, 58, "#a8743f", ` stroke="#6e4a26" stroke-width="5"`) + flyRect(x - 38 + 8, y - 30 + 10, 76, 60, FLY_SHADE) + flyRect(x - 38, y - 30, 76, 30, lighter(w)) + flyRect(x - 38, y, 76, 30, w) +
      flyNear(ear.replace(/X/g, f1(x)).replace(/Y/g, f1(y - 30)).replace(/C/g, darker(w))); }
  s += flyNear(flyBushes(key, 7, [30, 0.62 * FT, FT - 30, FT - 30]) + flyFlowers(key, 14, [30, 0.6 * FT, FT - 30, FT - 20]));
  return s;
}
// (each animal's ears, from above, over its house's far edge: X and Y where the roof's far edge's middle is, C their colour)
const HOUSE_EARS = { fox: `<path d="MX Y m-30 0 l10 -24 l12 24 Z m40 0 l10 -24 l12 24 Z" fill="C"/>`, owl: `<path d="MX Y m-34 0 l4 -20 l14 20 Z m50 0 l12 -20 l4 20 Z" fill="C"/>`,
  bunny: `<path d="MX Y m-22 0 q-6 -46 8 -46 q8 0 6 46 Z m30 0 q-2 -46 8 -46 q14 0 8 46 Z" fill="C"/>`, bear: `<path d="MX Y m-24 0 a12 12 0 1 1 0.1 0 Z m48 0 a12 12 0 1 1 0.1 0 Z" fill="C"/>`,
  cat: `<path d="MX Y m-34 0 l6 -26 l18 26 Z m46 0 l18 -26 l6 26 Z" fill="C"/>`, frog: `<path d="MX Y m-20 4 a12 12 0 1 1 0.1 0 Z m40 0 a12 12 0 1 1 0.1 0 Z" fill="C"/>` };
// (the places reached through a door, put in a square: a roof over them; the cave's, rock)
const FLY_ROOFS = { livingroom: "#a8463a", witchroom: "#4a3456", treeroom: "#8a5a2b", treetop: "#8a5a2b", healerroom: "#c9a45a", tent: "#d9822b",
                    castleroom: "#6a6f80", hutroom: "#c9a45a", hutbed: "#c9a45a", hutpotion: "#c9a45a", hutcenter: "#c9a45a" };
function flyLookOf(kind, key, o = state.background, cell = {}) {
  if (FLY_LOOKS[kind]) return FLY_LOOKS[kind](key, o, cell || {});
  if (kind === "cave" || kind === "caveroom") return FLY_LOOKS.cavecross(key);
  return flyRect(0, 0, FT, FT, "#7caa4c") + flyRoof(0.2 * FT, 0.16 * FT, 0.6 * FT, 0.5 * FT, FLY_ROOFS[kind] || "#8a6a5a");
}
const FLY_WET = new Set(["sea", "deepsea", "underwater", "bubblespace", "bubbleroom", "imagination", "emptyroom"]);   // (no paths drawn on them)
// a square's ways, as paths from its middle to the edges it leads off, meeting the neighbour's there
const FLY_EDGE = { N: [0.5, 0], NE: [1, 0], E: [1, 0.5], SE: [1, 1], S: [0.5, 1], SW: [0, 1], W: [0, 0.5], NW: [0, 0] };
function flyPathsSvg(kind, ways) {
  if (FLY_WET.has(kind) || !ways.length) return "";
  const d = ways.filter(w => FLY_EDGE[w]).map(w => `M${FT / 2} ${FT / 2} L${f1(FLY_EDGE[w][0] * FT)} ${f1(FLY_EDGE[w][1] * FT)}`).join(" ");
  const dirt = kind === "castle" || kind === "dungeon" ? "#b0aa9e" : kind === "desert" || kind === "beach" ? "#cfae6a" : "#b8955c";
  // (square ends at the edges, where the neighbour's path goes on; a round hub at the middle, where they meet)
  return `<path d="${d}" fill="none" stroke="${darker(dirt)}" stroke-width="74"/>${flyC(FT / 2, FT / 2, 37, darker(dirt))}<path d="${d}" fill="none" stroke="${dirt}" stroke-width="58"/>${flyC(FT / 2, FT / 2, 29, dirt)}`;
}
// a thing from above, where it stands in its square: across by its x, and its depth (z) in the near two thirds
function flyThingSvg(t) {
  const x = clamp((Number(t.x) || 0) + 405.9, 20, 791.8) * FT / 811.8, y = FTOP + (FT - FTOP - 30) * clamp(((Number(t.z) || 330) - 240) / 170, 0, 1);
  const k = clamp((Number(t.size) || 100) / 100, 0.3, 3.5), col = t.color || t.tone, sh = (r, dx = 0.3) => flyC(x + dx * r, y + 0.35 * r, r, FLY_SHADE);
  switch (t.kind) {
    case "tree": case "oak": { const r = 64 * k, leaf = t.leaves === "autumn" ? "#d9822b" : t.leaves === "winter" ? "#9a8a72" : "#4f8a32"; return sh(r) + flyC(x, y, r, leaf) + flyC(x - 0.25 * r, y - 0.25 * r, 0.45 * r, lighter(leaf)); }
    case "pine": { const r = 50 * k; return sh(r) + flyC(x, y, r, "#2f5a2c") + flyC(x, y, 0.5 * r, "#3f7038"); }
    case "deadtree": case "joshuatree": { const r = 48 * k, c = t.kind === "deadtree" ? "#6e5a44" : "#4f6b3a";
      return `<path d="M${f1(x - r)} ${f1(y)} H${f1(x + r)} M${f1(x)} ${f1(y - r)} V${f1(y + r)} M${f1(x - 0.7 * r)} ${f1(y - 0.7 * r)} L${f1(x + 0.7 * r)} ${f1(y + 0.7 * r)}" stroke="${c}" stroke-width="${f1(0.18 * r)}" stroke-linecap="round"/>`; }
    case "rock": case "lichen": { const r = 30 * k, P = [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3, q = r * (0.75 + 0.3 * sceneR(t.seed || 1, i)); return [x + q * Math.cos(a), y + 0.8 * q * Math.sin(a)]; });
      return sh(0.9 * r) + flyPath(flyPoly(P), col || "#8f8a80") + flyC(x - 0.25 * r, y - 0.25 * r, 0.3 * r, lighter(col || "#8f8a80")); }
    case "bush": case "moss": case "seagrass": case "sealettuce": case "kelp": case "agave": case "flowerbed": case "veggies": { const r = 30 * k; return sh(r) + flyC(x, y, r, col || "#4f8a3a") + flyC(x - 0.3 * r, y - 0.3 * r, 0.4 * r, lighter(col || "#4f8a3a")); }
    case "toadstool": case "cavemushroom": { const r = 18 * k; return flyC(x, y, r, t.kind === "toadstool" ? "#d9372b" : "#9a6ad0") + flyC(x - 0.3 * r, y - 0.2 * r, 0.25 * r, "#ffffff"); }
    case "chest": { const w = 50 * k, h = 32 * k; return flyRect(x - w / 2 + 6, y - h / 2 + 6, w, h, FLY_SHADE) + flyRect(x - w / 2, y - h / 2, w, h, "#8a5a2b", ` stroke="#e8b923" stroke-width="4"`); }
    case "barrel": case "cauldron": case "bubblemaker": { const r = 22 * k, c = t.kind === "barrel" ? "#8a5a2b" : t.kind === "cauldron" ? "#1f1f22" : "#5fb3e8"; return sh(r) + flyC(x, y, r, c) + flyC(x, y, 0.6 * r, t.kind === "cauldron" ? "#5fbf4a" : lighter(c)); }
    case "campfire": { const r = 26 * k; return flyC(x, y, r, "#8a8a80") + flyC(x, y, 0.65 * r, "#ff8a1c") + flyC(x, y, 0.3 * r, "#ffd84a"); }
    case "log": case "bench": case "sign": case "signpost": case "fencepiece": case "palisade": case "lever": { const w = (t.kind === "palisade" || t.kind === "fencepiece" ? 120 : t.kind === "log" || t.kind === "bench" ? 80 : 30) * k; return flyRect(x - w / 2, y - 8 * k, w, 16 * k, "#8a5a2b", ` stroke="#5e3d22" stroke-width="3"`); }
    case "cow": case "pig": case "chicken": { const r = (t.kind === "chicken" ? 12 : 26) * k, c = t.kind === "pig" ? "#f2a7b5" : "#f8f4ea"; return sh(r) + flyE(x, y, 1.4 * r, r, c) + (t.kind === "cow" ? flyC(x + 0.4 * r, y - 0.2 * r, 0.35 * r, "#2a2a2a") : "") + flyC(x + 1.3 * r, y, 0.45 * r, c); }
    case "saguaro": case "pricklypear": case "barrelcactus": case "ocotillo": { const r = 20 * k; return sh(r) + flyC(x, y, r, "#4f8a4a") + `<path d="M${f1(x - r)} ${f1(y)} H${f1(x + r)} M${f1(x)} ${f1(y - r)} V${f1(y + r)}" stroke="#3a6a36" stroke-width="4"/>`; }
    case "barn": { const w = 160 * k, h = 110 * k; return flyRoof(x - w / 2, y - h / 2, w, h, "#b03a2e"); }
    case "puddle": case "cascade": { const r = 34 * k; return flyE(x, y, 1.4 * r, 0.8 * r, "#5fa3e0"); }
    case "passage": case "trapdoor": { const r = 26 * k; return t.kind === "trapdoor" ? flyRect(x - r, y - r, 2 * r, 2 * r, "#6e4a26", ` stroke="#3e2a16" stroke-width="4"`) : flyE(x, y, 1.3 * r, r, "#1f1d22"); }
    default: { const r = 14 * k; return flyC(x, y, r, col || "#d8c8a0", ` stroke="#00000055" stroke-width="3"`); }
  }
}
// a square's tile: its place's ground, its paths, the rest of its look, its things (in a group of their own, left out once high up)
function flyTileSvg(W, key) {
  const cell = W.cells[key], [c, r] = key.split(",").map(Number);
  const things = (cell.things || []).map(flyThingSvg).join("");
  // (its paths just over its ground, the look's first shape: under its water, its roofs and its trees, as a trail goes)
  const look = flyLookOf(cell.kind, key, state.background, cell), cut = look.indexOf("/>") + 2;
  return `<g data-tile="${key}" transform="translate(${c * FT} ${r * FT})">${look.slice(0, cut)}${flyPathsSvg(cell.kind, worldLiveWays(W, key))}${look.slice(cut)}` +
    (things ? `<g class="fly-things">${things}</g>` : "") + `</g>`;
}
// (an empty square of the grid, and the land round the world: meadow, a few trees, so the quilt goes on past its own squares)
const flyWildSvg = (key, c, r) => `<g data-tile="${key}" data-wild="" transform="translate(${c * FT} ${r * FT})">${flyRect(0, 0, FT, FT, "#8aa862")}${flyCrowns(key, 3, [60, 60, FT - 60, FT - 60], 45, 80, ["#5f8a44", "#6f9a4a"])}</g>`;
// the world's text, for whether the quilt must be built again
const flyWorldKey = W => { const { figX, figY, things, ...B } = state.background; return JSON.stringify([W.id, W.cols, W.rows, W.cells, B]); };   // (and the places' own settings: the castle's, the tree's)
function flyQuiltSvg(W) {
  let s = flyRect(-12 * FT, -12 * FT, (W.cols + 24) * FT, (W.rows + 24) * FT, "#88a660");   // (the land going on, as far as can be seen)
  for (let r = -1; r <= W.rows; r++) for (let c = -1; c <= W.cols; c++) { const key = `${c},${r}`; s += W.cells[key] ? flyTileSvg(W, key) : flyWildSvg(key, c, r); }
  // the seams between the squares, stitched (a line the same thinness at every height)
  let d = "";
  for (let r = 0; r <= W.rows; r++) d += `M0 ${r * FT} H${W.cols * FT} `;
  for (let c = 0; c <= W.cols; c++) d += `M${c * FT} 0 V${W.rows * FT} `;
  return s + `<path d="${d}" fill="none" stroke="#fff8e0" stroke-opacity="0.7" stroke-width="2.5" stroke-dasharray="9 7" vector-effect="non-scaling-stroke"/>`;
}

// ---- the friend, riding: drawn in the picture's own units, the ground under them at (0, 0) ----
function flyRiderSvg() {
  const B = { ...state.body, facing: flight.facing, anim: "none", pose: "stand", sit: false };
  return `<g transform="translate(0 6) scale(0.62)">${topDownSvg(state, B, 0, 100)}</g>`;
}
function flyCraftSvg() {
  const rider = flyRiderSvg();
  if (flight.craft === "bubbleride")
    return `<g class="fly-bob">${flyC(0, -34, 78, "#d8f0ff38", ` stroke="#bfe6ff" stroke-width="3"`)}${rider}${flyE(-34, -82, 22, 11, "#ffffffaa", ` transform="rotate(-30 -34 -82)"`)}` +
      `${flyC(66, -96, 16, "#d8f0ff30", ` stroke="#bfe6ff" stroke-width="2"`)}${flyC(-70, -6, 11, "#d8f0ff30", ` stroke="#bfe6ff" stroke-width="2"`)}</g>`;
  // (the balloon: its basket, the friend in it, the basket's near rim over their legs; its ropes; its envelope above, the gores
  // in turn, from high up and in front, as the friend is seen)
  const gore = (a0, a1, c) => { const p = a => [f1(Math.cos(a) * 104), f1(-168 + Math.sin(a) * 100)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `<path d="M0 -168 L${x0} ${y0} A104 100 0 0 1 ${x1} ${y1} Z" fill="${c}"/>`; };
  return `<g class="fly-bob">${flyRect(-38, -44, 76, 58, "#8a5a2b", ` rx="10" stroke="#5e3d22" stroke-width="4"`)}${flyRect(-30, -38, 60, 44, "#5e3d22", ` rx="6"`)}${rider}` +
    `${flyRect(-38, -2, 76, 16, "#a8743f", ` rx="6" stroke="#5e3d22" stroke-width="3"`)}<path d="M-34 -40 L-62 -90 M34 -40 L62 -90" stroke="#5e3d22" stroke-width="3"/>` +
    `${flyE(0, -168, 104, 100, "#e84a3a")}${[0, 1, 2, 3, 4, 5].map(i => gore(i * Math.PI / 3, i * Math.PI / 3 + Math.PI / 6, "#ffd84a")).join("")}` +
    `${flyE(-34, -206, 30, 18, "#ffffff40")}${flyC(0, -168, 20, "#c0392b")}</g>`;
}

// ---- the view: how much of the world is seen at a height; where the camera is ----
function flySpan(h = flight.h, W = state.world, vb = document.getElementById("pic").viewBox.baseVal) {
  const most = Math.max(W.cols, W.rows * vb.width / Math.max(1, vb.height)) + 1;
  return 0.95 * Math.pow(Math.max(1.1, most / 0.95), h);   // (squares across the picture)
}
// built: the quilt (once per world), the shadow, the clouds, the friend riding; then placed (flyPlace)
function flightDraw() {
  const pic = document.getElementById("pic"), W = state.world, key = flyWorldKey(W);
  let root = pic.querySelector(":scope > #fly");
  if (!root || !flyBuilt || flyBuilt.key !== key) {
    // (the friend's own patterns, the defs drawNow left, kept for the rider; the rest of the picture taken away while flying)
    for (const c of [...pic.childNodes]) if (c.nodeName !== "defs") c.remove();
    const clouds = [0, 1, 2, 3, 4, 5].map(i => `<g data-cloud="${i}">${flyE(0, 0, 150, 60, "#ffffff")}${flyE(-80, 18, 90, 44, "#ffffff")}${flyE(90, 14, 100, 46, "#ffffff")}</g>`).join("");
    pic.insertAdjacentHTML("beforeend", `<g id="fly"><g id="fly-ground">${flyQuiltSvg(W)}<ellipse id="fly-shadow" rx="80" ry="56" fill="#00000040"/></g>` +
      `<g id="fly-clouds" opacity="0">${clouds}</g><g id="fly-craft"></g></g>`);
    root = pic.querySelector(":scope > #fly");
    flyBuilt = { key, tiles: [...root.querySelectorAll("[data-tile]")], shown: null };
  }
  const craft = root.querySelector("#fly-craft"), was = craft.dataset.look, look = JSON.stringify([flight.craft, flight.facing, state.face, state.hair, state.shirt, state.pants, state.costume, state.shoes, state.hands]);
  if (was !== look) { craft.innerHTML = flyCraftSvg(); craft.dataset.look = look; }
  fitPic();   // (the picture fitted to its space, as drawNow does at its end: full screen, or the window resized, while flying)
  flyPlace();
}
function flyPlace() {
  const pic = document.getElementById("pic"), root = pic.querySelector(":scope > #fly");
  if (!root || !flight) return;
  const vb = pic.viewBox.baseVal, W = state.world, S = flySpan(flight.h, W, vb), g = vb.width / (S * FT);
  const cx = vb.x + vb.width / 2, cy = vb.y + vb.height * 0.62;   // (where the craft is, its ground below it: a little below the middle, the envelope above)
  const gx = flight.x * FT, gy = flight.y * FT;
  root.querySelector("#fly-ground").setAttribute("transform", `translate(${f1(cx - gx * g)} ${f1(cy - gy * g)}) scale(${+g.toFixed(5)})`);
  // (the shadow: the craft's own size on the ground, off toward the lower right the higher they are)
  const off = 0.9 * (S - 0.9) * 60, sh = root.querySelector("#fly-shadow");
  sh.setAttribute("cx", f1(gx + off)); sh.setAttribute("cy", f1(gy + off * 0.7));
  root.querySelector("#fly-craft").setAttribute("transform", `translate(${f1(cx)} ${f1(cy)}) scale(${(1 - 0.35 * flight.h).toFixed(3)})`);   // (a little smaller, high up)
  // (the clouds, between: seen once up, sliding faster than the ground, as nearer)
  const cl = root.querySelector("#fly-clouds"), op = clamp((S - 1.6) / 3, 0, 0.55);
  cl.setAttribute("opacity", op.toFixed(2));
  if (op > 0) cl.querySelectorAll("[data-cloud]").forEach((n, i) => {
    const span = vb.width + 400, hs = vb.height + 300, k = 1.8 * g;
    const px = ((((sceneR(i, 3) * span - gx * k) % span) + span) % span) - 200 + vb.x, py = ((((sceneR(i, 7) * hs - gy * k) % hs) + hs) % hs) - 150 + vb.y;
    n.setAttribute("transform", `translate(${f1(px)} ${f1(py)}) scale(${(0.6 + 0.5 * sceneR(i, 9)).toFixed(2)})`); });
  // (only the squares in view; the things left out once high up)
  const half = S / 2 + 0.8, ratio = vb.height / vb.width, c0 = Math.floor(flight.x - half), c1 = Math.floor(flight.x + half), r0 = Math.floor(flight.y - half * ratio - 0.6), r1 = Math.floor(flight.y + half * ratio + 0.6);
  const shown = [c0, c1, r0, r1].join(",");
  if (flyBuilt && flyBuilt.shown !== shown) { flyBuilt.shown = shown;
    for (const n of flyBuilt.tiles) { const [c, r] = n.dataset.tile.split(",").map(Number), on = c >= c0 && c <= c1 && r >= r0 && r <= r1; if ((n.style.display === "none") === on) n.style.display = on ? "" : "none"; } }
  root.classList.toggle("fly-high", S > 3.2);
  flyHudShow();
}

// ---- taking off, flying, landing ----
// (taken off from the square of the world they are in; inside, or somewhere off the grid, they cannot)
function flightStart(craft) {
  const W = state.world, key = W && W.at;
  if (!key || !W.cells[key]) { flySay("🎈 Take off from outside: from a square of the world."); return false; }
  const [c, r] = key.split(",").map(Number), B = state.background;
  if (itemsOpen) itemsShow(false);
  itemLetGo();
  flight = { craft: FLY_CRAFTS[craft] ? craft : "balloon", x: c + 0.5 + clamp((Number(B.figX) || 0) / FT, -0.4, 0.4), y: r + 0.68, h: 0, want: 0.28,
             facing: "front", goal: null, landing: false, last: 0, pad: [0, 0], padUp: false, padDown: false };
  document.body.classList.add("flying");
  flyBuilt = null;
  changed();
  flyGo();
  return true;
}
function flightLand(now = false) {
  if (!flight) return;
  if (!now) { flight.landing = true; flight.want = null; flight.goal = null; flyGo(); return; }
  const W = state.world, c = Math.floor(flight.x), r = Math.floor(flight.y), key = `${c},${r}`;
  if (!W.cells[key]) { flight.landing = false; flight.want = 0.12; flySay("🌫️ Nowhere to land here: fly over a place first."); flyGo(); return; }
  flight = null; flyBuilt = null;
  document.body.classList.remove("flying");
  const pic = document.getElementById("pic"), root = pic.querySelector(":scope > #fly");
  if (root) root.remove();
  if (key !== W.at) worldEnter(key, null, false);
  flyHudShow();
  changed();
}
// (a craft's button: off, it takes off; flying, it brings them down)
function flightToggle(craft) { if (flight) flightLand(); else flightStart(craft); }
function flyGo() { if (!flyLoop && flight) { flight.last = 0; flyLoop = requestAnimationFrame(flyTick); } }
function flyTick(t) {
  flyLoop = 0;
  if (!flight || itemsOpen) return;
  const dt = flight.last ? Math.min(0.1, (t - flight.last) / 1000) : 1 / 60;
  flight.last = t;
  const W = state.world, S = flySpan();
  // the way: the arrows held (the keyboard's, the controller's), else toward a spot tapped
  let vx = (flyKeys.has("ArrowRight") ? 1 : 0) - (flyKeys.has("ArrowLeft") ? 1 : 0) + flight.pad[0], vy = (flyKeys.has("ArrowDown") ? 1 : 0) - (flyKeys.has("ArrowUp") ? 1 : 0) + flight.pad[1];
  if (vx || vy) flight.goal = null;
  else if (flight.goal) { const dx = flight.goal[0] - flight.x, dy = flight.goal[1] - flight.y, d = Math.hypot(dx, dy);
    if (d < 0.01) flight.goal = null; else { const s = Math.min(1, d / (0.25 * S)); vx = dx / d * s; vy = dy / d * s; } }
  const len = Math.hypot(vx, vy);
  if (len > 1) { vx /= len; vy /= len; }
  const speed = 0.55 * S;
  flight.x = clamp(flight.x + vx * speed * dt, 0.02, W.cols - 0.02);
  flight.y = clamp(flight.y + vy * speed * dt, 0.02, W.rows - 0.02);
  if (Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2) { const f = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : vy > 0 ? "front" : "back";
    if (f !== flight.facing) { flight.facing = f; flightDraw(); } }
  // the height: climbing or sinking while held; toward a height wanted (taking off); down, landing
  const up = flyKeys.has("up") || flyHud.up || flight.padUp, down = flyKeys.has("down") || flyHud.down || flight.padDown;
  if (up || down) { flight.want = null; flight.landing = false; flight.h = clamp(flight.h + (up ? 0.5 : -0.5) * dt, 0, 1); }
  else if (flight.landing) flight.h = Math.max(0, flight.h - Math.max(0.5, 1.6 * flight.h) * dt);
  else if (flight.want != null) { const d = flight.want - flight.h; flight.h += Math.sign(d) * Math.min(Math.abs(d), 0.4 * dt); if (Math.abs(d) < 0.002) flight.want = null; }
  if (flight.h <= 0 && (flight.landing || down)) { flightLand(true); return; }
  flyPlace();
  if (vx || vy || up || down || flight.landing || flight.want != null || flight.goal) flyLoop = requestAnimationFrame(flyTick);
}
// (padPoll, while flying: the arrows or the stick fly them, the jumps climb, crouching sinks, the craft's own button lands)
function flightPad(g, held, hit, btn) {
  const stick = v => (Math.abs(v ?? 0) > 0.25 ? v : 0), now = i => g.buttons[i] && g.buttons[i].pressed;
  flight.pad = [clamp((now(15) ? 1 : 0) - (now(14) ? 1 : 0) + stick(g.axes[0]), -1, 1), clamp((now(13) ? 1 : 0) - (now(12) ? 1 : 0) + stick(g.axes[1]), -1, 1)];
  flight.padUp = held("jumpShort") || held("jumpHigh"); flight.padDown = held("crouch");
  for (const [s, a] of SLOTS) if (hit(a) && itemOf(itemIn(s)) && itemOf(itemIn(s)).kind === "craft") flightLand();
  if (flight && (flight.pad[0] || flight.pad[1] || flight.padUp || flight.padDown)) flyGo();
}

// ---- the flight's own buttons, over the picture: where they are, how high, ⬆️ ⬇️ and 🛬 ----
const flyHudEl = document.getElementById("fly-hud");
function flyHudShow() {
  if (!flyHudEl) return;
  flyHudEl.hidden = !flight;
  if (!flight) return;
  const W = state.world, key = `${Math.floor(flight.x)},${Math.floor(flight.y)}`, cell = W.cells[key];
  const where = cell ? `${placeName(cell.kind)} · ${squareName(key)}` : "🌾 over the wild";
  const w = flyHudEl.querySelector(".fly-where");
  if (w.textContent !== where && !(flySayT > performance.now())) w.textContent = where;
  flyHudEl.querySelector(".fly-level").style.height = `${Math.round(100 * flight.h)}%`;
}
function flySay(text) {
  if (!flyHudEl) return;
  if (!flight) { flyHudEl.hidden = false; flyHudEl.classList.add("fly-saying"); }
  flyHudEl.querySelector(".fly-where").textContent = text; flySayT = performance.now() + 2600;
  setTimeout(() => { if (performance.now() < flySayT) return; flyHudEl.classList.remove("fly-saying"); if (!flight) flyHudEl.hidden = true; else flyHudShow(); }, 2700);
}
if (flyHudEl) {
  const hold = (id, k) => { const b = flyHudEl.querySelector(id), set = v => { flyHud[k] = v; setPressed(b, v); if (v) flyGo(); };
    b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { /* (a synthetic press) */ } set(true); });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, () => set(false)); };
  hold("#fly-up", "up"); hold("#fly-down", "down");
  flyHudEl.querySelector("#fly-land").addEventListener("click", () => flightLand());
}
// a tap or a click on the quilt: fly there (before the picture's own walking and choosing: nothing else in it is there to touch)
for (const ev of ["pointerdown", "click"]) document.addEventListener(ev, e => {
  if (!flight || !e.target.closest || !e.target.closest("#pic")) return;
  e.stopPropagation(); e.preventDefault();
  if (ev !== "pointerdown") return;
  const pic = document.getElementById("pic"), m = pic.getScreenCTM();
  if (!m) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()), vb = pic.viewBox.baseVal, g = vb.width / (flySpan() * FT);
  flight.goal = [flight.x + (p.x - (vb.x + vb.width / 2)) / g / FT, flight.y + (p.y - (vb.y + vb.height * 0.62)) / g / FT];
  flyGo();
}, true);
// the keyboard, flying: the arrows fly, Page Up and + climb, Page Down and - sink (before the game's own keys)
const FLY_QUIET = new Set(["b", "f", "u", "t", "enter", " "]);
const FLY_KEY = { ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", PageUp: "up", "+": "up", "=": "up", PageDown: "down", "-": "down", _: "down" };
document.addEventListener("keydown", e => {
  if (!flight || itemsOpen || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
  const k = FLY_KEY[e.key];
  if (!k) { if (FLY_QUIET.has(e.key.toLowerCase())) { e.preventDefault(); e.stopPropagation(); } return; }   // (the game's own keys rest: no 🫧, 🔥, tool or pot from up here)
  e.preventDefault(); e.stopPropagation();
  flyKeys.add(k); flyGo();
}, true);
document.addEventListener("keyup", e => { const k = FLY_KEY[e.key]; if (k) flyKeys.delete(k); });
window.addEventListener("blur", () => { flyKeys.clear(); flyHud.up = flyHud.down = false; });
