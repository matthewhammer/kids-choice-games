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
const FLY_LOOKS = {
  forest: k => flyRect(0, 0, FT, FT, "#4f7a34") + flyCrowns(k, 16, [30, 20, FT - 30, FTOP + 60], 55, 95, ["#2f5f2a", "#3d6e30", "#47803a"]) + flyCrowns(k, 6, [20, FTOP, 160, FT - 40], 50, 80, ["#36662d", "#2f5f2a"], 60) + flyCrowns(k, 6, [FT - 160, FTOP, FT - 20, FT - 40], 50, 80, ["#36662d", "#3d6e30"], 90),
  clearing: k => flyRect(0, 0, FT, FT, "#6f9a3e") + flyCrowns(k, 12, [20, 10, FT - 20, FTOP - 40], 55, 90, ["#2f5f2a", "#3d6e30"]) + flyCrowns(k, 5, [10, FTOP, 120, FT - 20], 50, 80, ["#36662d"], 60) + flyCrowns(k, 5, [FT - 120, FTOP, FT - 10, FT - 20], 50, 80, ["#36662d"], 90) + flyC(FT / 2 + 10, FTOP + 2, 72, FLY_SHADE) + flyC(FT / 2, FTOP - 8, 70, "#c9a45a") + flyC(FT / 2, FTOP - 8, 22, "#a8843f"),
  fairyforest: k => flyRect(0, 0, FT, FT, "#5d8f54") + flyCrowns(k, 14, [30, 20, FT - 30, FTOP + 40], 50, 85, ["#3f7f6a", "#6f5aa8", "#3f8f5a"]) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => flyC(80 + (FT - 160) * flyR(k, 200 + i), FTOP + (FT - FTOP - 60) * flyR(k, 220 + i), 7, "#fff7a8")).join(""),
  woodpath: k => flyRect(0, 0, FT, FT, "#3f6b2e") + flyCrowns(k, 9, [10, 10, 0.34 * FT, FT - 10], 55, 90, ["#2f5f2a", "#3d6e30"]) + flyCrowns(k, 9, [0.66 * FT, 10, FT - 10, FT - 10], 55, 90, ["#2f5f2a", "#3d6e30"], 40),
  crossing: k => flyRect(0, 0, FT, FT, "#5e7f36") + flyCrowns(k, 3, [10, 10, 200, 200], 55, 85, ["#2f5f2a", "#3d6e30"]) + flyCrowns(k, 3, [FT - 200, 10, FT - 10, 200], 55, 85, ["#2f5f2a", "#3d6e30"], 20) + flyCrowns(k, 3, [10, FT - 200, 200, FT - 10], 55, 85, ["#36662d"], 40) + flyCrowns(k, 3, [FT - 200, FT - 200, FT - 10, FT - 10], 55, 85, ["#36662d"], 60),
  mountains: k => flyRect(0, 0, FT, FT, "#8c8a6c") + [[0.22, 0.2, 170], [0.55, 0.14, 210], [0.84, 0.24, 150]].map(([u, v, r]) => { const x = u * FT, y = v * FT;
    return flyPath(flyPoly([[x - r, y + 0.6 * r], [x, y - 0.75 * r], [x + 0.1 * r, y + 0.9 * r]]), "#b3aa98") + flyPath(flyPoly([[x, y - 0.75 * r], [x + r, y + 0.55 * r], [x + 0.1 * r, y + 0.9 * r]]), "#7a7262") + flyC(x + 0.02 * r, y - 0.42 * r, 0.24 * r, "#f4f6f8"); }).join("") + flyCrowns(k, 4, [40, FTOP + 60, FT - 40, FT - 40], 40, 60, ["#4f6b3a"], 30),
  pasture: k => flyRect(0, 0, FT, FT, "#93bf5c") + flyPath(`M40 ${f1(FTOP)} H${FT - 40}`, "none", ` stroke="#8a6a3a" stroke-width="10" stroke-dasharray="40 24"`) + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => flyE(60 + (FT - 120) * flyR(k, i), 60 + (FT - 120) * flyR(k, 30 + i), 26, 12, "#7aa94a")).join(""),
  lake: k => flyRect(0, 0, FT, FT, "#6f9e45") + flyCrowns(k, 6, [20, 10, FT - 20, 120], 50, 80, ["#2f5f2a", "#3d6e30"]) + flyPool(FT / 2, 0.42 * FT, 0.38 * FT, 0.24 * FT) + flyE(0.44 * FT, 0.36 * FT, 0.16 * FT, 0.06 * FT, "#4f8fd0") + flyRect(0.62 * FT, 0.58 * FT, 26, 90, "#8a5a2b"),
  sea: k => flyRect(0, 0, FT, FT, "#2d6fb3") + [0, 1, 2, 3, 4, 5, 6].map(i => { const x = 60 + (FT - 160) * flyR(k, i), y = 60 + (FT - 120) * flyR(k, 20 + i); return `<path d="M${f1(x)} ${f1(y)} q25 -16 50 0 q25 16 50 0" fill="none" stroke="#9fd0f5" stroke-width="7" stroke-linecap="round"/>`; }).join(""),
  deepsea: k => flyRect(0, 0, FT, FT, "#173f6e") + [0, 1, 2, 3].map(i => flyE(80 + (FT - 160) * flyR(k, i), 80 + (FT - 160) * flyR(k, 9 + i), 90, 50, "#1d4c82")).join(""),
  underwater: k => flyRect(0, 0, FT, FT, "#1f5d93") + [0, 1, 2, 3, 4].map(i => flyE(80 + (FT - 160) * flyR(k, i), 80 + (FT - 160) * flyR(k, 9 + i), 22, 10, "#ffb347")).join(""),
  beach: k => flyRect(0, 0, FT, FT, "#ead49c") + flyRect(0, 0, FT, FTOP - 20, "#2d6fb3") + `<path d="M0 ${f1(FTOP - 20)} q100 30 200 0 t200 0 t200 0 t200 0" fill="none" stroke="#f4fbff" stroke-width="16"/>` + flyE(0.7 * FT, 0.75 * FT, 60, 34, "#d8bd7d"),
  waterfall: k => flyRect(0, 0, FT, FT, "#3f7f3a") + flyRect(0, 0, FT, 90, "#6b6355") + flyRect(0.36 * FT, 0, 0.28 * FT, 110, "#cfe9fb") + flyPool(FT / 2, 0.3 * FT, 0.2 * FT, 0.12 * FT) + flyPath(`M${0.45 * FT} ${0.38 * FT} C${0.4 * FT} ${0.6 * FT} ${0.6 * FT} ${0.7 * FT} ${0.5 * FT} ${FT} H${0.6 * FT} C${0.7 * FT} ${0.7 * FT} ${0.5 * FT} ${0.6 * FT} ${0.56 * FT} ${0.38 * FT} Z`, "#3f86c9") + flyCrowns(k, 8, [10, 100, 0.3 * FT, FT - 10], 50, 85, ["#2a6a30", "#357a35"]) + flyCrowns(k, 8, [0.7 * FT, 100, FT - 10, FT - 10], 50, 85, ["#2a6a30", "#357a35"], 40),
  witch: k => flyRect(0, 0, FT, FT, "#3f4a30") + flyCrowns(k, 10, [20, 10, FT - 20, FTOP], 45, 80, ["#4a4a3a", "#3a3f2e", "#55503f"]) + flyRoof(0.38 * FT, FTOP - 130, 0.24 * FT, 150, "#4a3456") + flyC(0.66 * FT, FTOP + 60, 34, "#1f1f22") + flyC(0.66 * FT, FTOP + 60, 22, "#5fbf4a"),
  cemetery: k => flyRect(0, 0, FT, FT, "#6e7d58") + flyCrowns(k, 5, [20, 10, FT - 20, 140], 45, 75, ["#4a5a3a", "#55503f"]) + [0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c => flyRect(150 + c * 110, FTOP + 40 + r * 120, 50, 26, "#a8a8a0", ` stroke="#7a7a72" stroke-width="4"`)).join("")).join("") + flyRect(40, 40, FT - 80, FT - 80, "none", ` stroke="#2a2a2a" stroke-width="6" stroke-dasharray="6 18"`),
  house: k => flyRect(0, 0, FT, FT, "#7caa4c") + flyRoof(0.27 * FT, 40, 0.46 * FT, 0.3 * FT, "#a8463a") + flyRect(0.47 * FT, 0.34 * FT, 0.06 * FT, 0.2 * FT, "#c9b48a") + flyCrowns(k, 3, [20, 30, 0.22 * FT, FTOP], 55, 80, ["#3d6e30"]) + flyCrowns(k, 3, [0.78 * FT, 30, FT - 20, FTOP], 55, 80, ["#3d6e30"], 20),
  farmyard: k => flyRect(0, 0, FT, FT, "#8fae56") + flyRoof(0.12 * FT, 40, 0.34 * FT, 0.26 * FT, "#b03a2e") + flyRect(0.55 * FT, 40, 0.38 * FT, 0.5 * FT, "#8a6a3a") + [0, 1, 2, 3, 4, 5].map(i => flyRect(0.57 * FT, 60 + i * 0.08 * FT, 0.34 * FT, 14, "#5f9a3a")).join(""),
  treehouse: k => flyRect(0, 0, FT, FT, "#6f9a3e") + flyC(FT / 2 + 40, 0.3 * FT + 40, 0.3 * FT, FLY_SHADE) + flyC(FT / 2, 0.3 * FT, 0.3 * FT, "#3f7a32") + flyC(FT / 2 - 40, 0.27 * FT, 0.18 * FT, "#4f8a3a") + flyRect(0.54 * FT, 0.33 * FT, 0.2 * FT, 0.12 * FT, "#a8743f", ` stroke="#6e4a26" stroke-width="5"`) + flyCrowns(k, 4, [20, FTOP, 160, FT - 30], 45, 70, ["#3d6e30"]),
  campsite: k => flyRect(0, 0, FT, FT, "#7a9a48") + flyCrowns(k, 9, [20, 10, FT - 20, 150], 50, 80, ["#2f5f2a", "#3d6e30"]) + [[0.25, 0.3, "#d9822b"], [0.5, 0.24, "#3f7fbf"], [0.75, 0.3, "#c0392b"]].map(([u, v, c]) => { const x = u * FT, y = v * FT;
    return flyPath(flyPoly([[x - 70, y + 50], [x - 70, y - 40], [x + 70, y - 40], [x + 70, y + 50]]), FLY_SHADE) + flyPath(flyPoly([[x - 70, y - 50], [x, y - 50], [x, y + 50], [x - 70, y + 50]]), lighter(c)) + flyPath(flyPoly([[x, y - 50], [x + 70, y - 50], [x + 70, y + 50], [x, y + 50]]), c); }).join("") + flyC(FT / 2, 0.6 * FT, 44, "#8a8a80") + flyC(FT / 2, 0.6 * FT, 28, "#ff8a1c") + flyC(FT / 2, 0.6 * FT, 12, "#ffd84a"),
  castle: k => flyRect(0, 0, FT, FT, "#7caa4c") + flyRect(0.16 * FT, 30, 0.68 * FT, 0.5 * FT, "#8f8a80") + flyRect(0.22 * FT, 30 + 0.06 * FT, 0.56 * FT, 0.38 * FT, "#b8b2a6") + flyRoof(0.38 * FT, 70, 0.24 * FT, 0.2 * FT, "#6a6f80") +
    [[0.16, 0], [0.84, 0], [0.16, 0.5], [0.84, 0.5]].map(([u, v]) => flyC(u * FT + 8, 30 + v * FT + 10, 58, FLY_SHADE) + flyC(u * FT, 30 + v * FT, 58, "#a39d92", ` stroke="#6f6a60" stroke-width="6"`) + flyC(u * FT, 30 + v * FT, 30, "#5a6f9a")).join("") + flyRect(0.45 * FT, 0.48 * FT, 0.1 * FT, 0.08 * FT, "#6e4a26"),
  hut: k => flyRect(0, 0, FT, FT, "#7a9a48") + flyC(FT / 2 + 14, FTOP - 30, 120, FLY_SHADE) + flyC(FT / 2, FTOP - 40, 120, "#c9a45a") + flyC(FT / 2, FTOP - 40, 70, "#b8913f") + flyC(FT / 2, FTOP - 40, 20, "#8a6a2a") + flyCrowns(k, 6, [20, 10, FT - 20, 160], 45, 75, ["#3d6e30"]),
  desert: k => flyRect(0, 0, FT, FT, "#e3c07a") + [0, 1, 2, 3].map(i => `<path d="M${f1(40 + 120 * flyR(k, i))} ${f1(120 + i * 170)} q160 -60 320 0 t320 0" fill="none" stroke="#f0d79a" stroke-width="18" stroke-linecap="round"/>`).join("") + flyPath(flyPoly([[0.2 * FT, 0.2 * FT], [0.4 * FT, 0.05 * FT], [0.5 * FT, 0.25 * FT]]), "#c9a060"),
  garden: k => flyRect(0, 0, FT, FT, "#7caa4c") + [0, 1, 2].map(r => [0, 1].map(c => flyRect(110 + c * 320, FTOP + r * 150 - 40, 260, 100, "#7a5232") + [0, 1, 2, 3, 4].map(i => flyC(140 + c * 320 + i * 50, FTOP + r * 150 + 10, 14, ["#e84a6f", "#ffd84a", "#5fbf4a"][(i + r) % 3])).join("")).join("")).join(""),
  spring: k => flyRect(0, 0, FT, FT, "#6f9e45") + flyCrowns(k, 7, [20, 10, FT - 20, 150], 50, 80, ["#2f5f2a", "#3d6e30"]) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => flyC(FT / 2 + 130 * Math.cos(i * 0.785), 0.45 * FT + 90 * Math.sin(i * 0.785), 26, "#9a968c")).join("") + flyPool(FT / 2, 0.45 * FT, 100, 66, "#3f8fd9", "#a9d6f5"),
  dungeon: k => flyRect(0, 0, FT, FT, "#4a4652") + flyRect(60, 60, FT - 120, FT - 120, "#6a6472") + `<path d="M60 ${FT / 2} H${FT - 60} M${FT / 2} 60 V${FT - 60}" stroke="#57525e" stroke-width="4"/>`,
  cavecross: k => flyRect(0, 0, FT, FT, "#3c3a40") + flyE(FT / 2, FT / 2, 0.34 * FT, 0.3 * FT, "#57535c"),
  emptyroom: k => flyRect(0, 0, FT, FT, "#d9d9de") + flyRect(50, 50, FT - 100, FT - 100, "#ececf0"),
  imagination: k => flyRect(0, 0, FT, FT, "#c7b4e8") + [0, 1, 2, 3, 4].map(i => flyE(80 + (FT - 160) * flyR(k, i), 80 + (FT - 160) * flyR(k, 9 + i), 110, 60, "#f4ecff")).join(""),
  bubblespace: k => flyRect(0, 0, FT, FT, "#bfe3f7") + [0, 1, 2, 3, 4, 5].map(i => flyC(80 + (FT - 160) * flyR(k, i), 80 + (FT - 160) * flyR(k, 9 + i), 30 + 40 * flyR(k, 20 + i), "#ffffff55", ` stroke="#ffffff" stroke-width="4"`)).join(""),
};
FLY_LOOKS.bubbleroom = FLY_LOOKS.bubblespace;
// (the places reached through a door, put in a square: a roof over them; the cave's, rock)
const FLY_ROOFS = { livingroom: "#a8463a", witchroom: "#4a3456", treeroom: "#8a5a2b", treetop: "#8a5a2b", healerroom: "#c9a45a", tent: "#d9822b",
                    castleroom: "#6a6f80", hutroom: "#c9a45a", hutbed: "#c9a45a", hutpotion: "#c9a45a", hutcenter: "#c9a45a" };
function flyLookOf(kind, key) {
  if (FLY_LOOKS[kind]) return FLY_LOOKS[kind](key);
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
  const look = flyLookOf(cell.kind, key), cut = look.indexOf("/>") + 2;
  return `<g data-tile="${key}" transform="translate(${c * FT} ${r * FT})">${look.slice(0, cut)}${flyPathsSvg(cell.kind, worldLiveWays(W, key))}${look.slice(cut)}` +
    (things ? `<g class="fly-things">${things}</g>` : "") + `</g>`;
}
// (an empty square of the grid, and the land round the world: meadow, a few trees, so the quilt goes on past its own squares)
const flyWildSvg = (key, c, r) => `<g data-tile="${key}" data-wild="" transform="translate(${c * FT} ${r * FT})">${flyRect(0, 0, FT, FT, "#8aa862")}${flyCrowns(key, 3, [60, 60, FT - 60, FT - 60], 45, 80, ["#5f8a44", "#6f9a4a"])}</g>`;
// the world's text, for whether the quilt must be built again
const flyWorldKey = W => JSON.stringify([W.id, W.cols, W.rows, W.cells]);
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
