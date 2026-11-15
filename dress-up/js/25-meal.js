"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 178) A part of the game's script, run in order by index.html.

// ===================== A MEAL AT THE TABLE, SEEN FROM ABOVE =====================
// (ticket 744, M, through Matthew 2026-11-15: "a close-up view of a plate of food, where we click on the food (or tap, etc)
// to eat it, bite by bite. It's a full screen view within the game world where the 'background' is a place setting, viewed
// from above --- plate, with knife, fork and spoon and napkin, and drinks.") Tapped, the dining room's table is sat down at:
// while `meal` is set, drawNow hands the picture to mealDraw (as flying hands it to flightDraw), the table from above, a
// place set on a mat: the plate, its food, the fork on the napkin at its left, the knife and the spoon at its right, the
// drinks above it. A tap on a food takes a bite of it (a sip, of a drink), its bites showing, till it is gone, crumbs left;
// ⬅️ back to the table (or Escape) gets up again. The meal is runtime only, not saved; a new one is laid each time.
// The foods are M's (ticket 743's list): a 🥪 sandwich, a 🍎 apple, a 🍌 banana, 🍞 bread, a 🧃 juice box and a 🥛 milk box.
const MEAL_FOODS = [
  { id: "sandwich", name: "🥪 sandwich", bites: 6 }, { id: "apple", name: "🍎 apple", bites: 5 }, { id: "banana", name: "🍌 banana", bites: 5 },
  { id: "bread", name: "🍞 bread", bites: 4 }, { id: "juice", name: "🧃 juice box", bites: 4, drink: true }, { id: "milk", name: "🥛 milk box", bites: 4, drink: true }];
const mealXY = (x, y) => `${f1(x)} ${f1(y)}`;
const MEAL_SAYS = ["nom!", "crunch!", "yum!", "munch!", "mmm!"], MEAL_SIPS = ["slurp!", "sip!", "gulp!", "ahh!"];
let meal = null;   // (at the table: the bites left of each food, what the last bite said and where, how many bites in all)
const mealLaid = () => Object.fromEntries(MEAL_FOODS.map(f => [f.id, f.bites]));
// (from the dining room: walked to the table, then sat down at it, the view from above in place of the room)
function mealStart(door) {
  if (meal || entering) return;
  const B = state.background, k = (SCENE.bottom - SCENE.top) / 700;
  tripStart(door, "walk");
  walkTo(B.figX ?? 0, SCENE.ground + 30 * k, () => { meal = { left: mealLaid(), say: null, n: 0 }; document.body.classList.add("eating"); if (itemsOpen) itemsShow(false); changed(); });
}
function mealEnd() {
  if (!meal) return;
  meal = null;
  document.body.classList.remove("eating");
  const root = document.getElementById("pic").querySelector(":scope > #meal");
  if (root) root.remove();
  changed();
}
// a bite of food id (a sip of a drink); what it says, where
function mealBite(id, x, y) {
  const f = MEAL_FOODS.find(q => q.id === id);
  if (!meal || !f || !(meal.left[id] > 0)) return;
  meal.left[id]--; meal.n++;
  const words = f.drink ? MEAL_SIPS : MEAL_SAYS;
  meal.say = { text: meal.left[id] ? words[meal.n % words.length] : f.drink ? "all gone! 😋" : "all eaten! 😋", at: performance.now(), x, y };
  mealDraw();
}
// ---- the place setting, from above, in its own units: the plate's middle at (0, 0), u a unit (a plate is 60 across) ----
// (bites out of a food, Matthew 2026-11-15: "It's important that the blobs cover from one edge or corner in some continuous
// way") A food is eaten from one place on its edge, a corner or an end (S), the eaten part growing across it a bite at a
// time: after `taken` of `total` bites, all of it within taken/total of the way to its far side (D) from S is gone, the
// edge of what is left a row of teeth marks. A mask: the food where it is white, gone where black, so a bite cuts only
// the food, and what is under it shows (the plate, or an apple's inside). a0, a1: the angles from S across the food.
// (inset: a food's inside, under its skin, eaten that much behind the skin's edge: the cut face, a band along the bite)
function mealBitten(id, [sx, sy], a0, a1, D, taken, total, inner, inset = 0) {
  if (!taken) return inner;
  const R = Math.max(0, D * taken / total - inset), n = 6, rs = Math.max(D / total * 0.42, 1);
  let holes = `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f1(R)}" fill="#000000"/>`;
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
    holes += `<circle cx="${f1(sx + Math.cos(a) * R)}" cy="${f1(sy + Math.sin(a) * R)}" r="${f1(rs)}" fill="#000000"/>`; }
  const M = D + 2 * rs;
  return `<mask id="meal-bites-${id}" maskUnits="userSpaceOnUse" x="${f1(sx - M)}" y="${f1(sy - M)}" width="${f1(2 * M)}" height="${f1(2 * M)}">` +
    `<rect x="${f1(sx - M)}" y="${f1(sy - M)}" width="${f1(2 * M)}" height="${f1(2 * M)}" fill="#ffffff"/>${holes}</mask><g mask="url(#meal-bites-${id})">${inner}</g>`;
}
const mealCrumbs = (cx, cy, s, col) => [[-0.6, 0.2], [0.3, -0.5], [0.7, 0.4], [-0.2, 0.7], [0.1, 0.05]].map(([dx, dy], i) =>
  `<circle cx="${f1(cx + dx * s)}" cy="${f1(cy + dy * s)}" r="${f1(s * (0.07 + 0.03 * (i % 2)))}" fill="${col}"/>`).join("");
function mealFoodSvg(id, u) {
  const L = meal.left[id], f = MEAL_FOODS.find(q => q.id === id), taken = f.bites - L;
  const g = (inner, x, y, r) => `<g data-food="${id}" style="cursor:pointer"><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#000000" opacity="0"/>${inner}</g>`;
  if (id === "sandwich") {   // two halves, cut corner to corner: bread, and the filling showing at the cut
    const x = -9 * u, y = -2 * u, s = 13 * u;
    if (!L) return mealCrumbs(x, y, s, "#d9a35c");
    return g(mealBitten(id, [x - s - 1 * u, y - s - 1 * u], -10, 100, 2.9 * s, taken, f.bites, `<path d="M${mealXY(x - s, y - s)} L${mealXY(x + s, y - s)} L${mealXY(x - s, y + s)} Z" fill="#f3d9a4" stroke="#c99a52" stroke-width="${f1(1.4 * u)}"/>` +
      `<path d="M${mealXY(x - s + 2 * u, y + s - 4 * u)} L${mealXY(x + s - 4 * u, y - s + 2 * u)}" stroke="#7dbb4a" stroke-width="${f1(2.4 * u)}" stroke-linecap="round"/>` +
      `<path d="M${mealXY(x + s + 2 * u, y - s + 4 * u)} L${mealXY(x + s + 2 * u, y + s + 2 * u)} L${mealXY(x - s + 4 * u, y + s + 2 * u)} Z" fill="#f3d9a4" stroke="#c99a52" stroke-width="${f1(1.4 * u)}"/>` +
      `<path d="M${mealXY(x + s, y - s + 7 * u)} L${mealXY(x - s + 7 * u, y + s)}" stroke="#e0705a" stroke-width="${f1(2 * u)}" stroke-linecap="round"/>`), x, y, s * 1.2);
  }
  if (id === "apple") {   // red and round, a stem and a leaf; bitten, its white inside shows
    const x = 15 * u, y = -9 * u, r = 8 * u;
    if (!L) return `<path d="M${mealXY(x - 2 * u, y - 4 * u)} Q${mealXY(x + 3 * u, y)} ${mealXY(x - 2 * u, y + 4 * u)}" stroke="#f3e6b8" stroke-width="${f1(3 * u)}" stroke-linecap="round"/>` + `<line x1="${f1(x - 2 * u)}" y1="${f1(y - 4 * u)}" x2="${f1(x - 3 * u)}" y2="${f1(y - 7 * u)}" stroke="#6b4423" stroke-width="${f1(u)}"/>`;
    // (its pale inside, under the skin: what a bite shows)
    const S = [x + r + 0.5 * u, y];
    return g(mealBitten(id + "-in", S, 100, 260, 2.05 * r, taken, f.bites, `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.95)}" fill="#f7efd2"/>`, 1.8 * u) + mealBitten(id, S, 100, 260, 2.05 * r, taken, f.bites, `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#d62f2f" stroke="#9a1f1f" stroke-width="${f1(u)}"/><circle cx="${f1(x - 3 * u)}" cy="${f1(y - 3 * u)}" r="${f1(2.2 * u)}" fill="#ff8a80" opacity="0.7"/>` +
      `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + 1 * u)}" y2="${f1(y - 3 * u)}" stroke="#6b4423" stroke-width="${f1(1.2 * u)}" stroke-linecap="round"/><path d="M${mealXY(x + 1 * u, y - 2 * u)} q${f1(4 * u)} ${f1(-3 * u)} ${f1(6 * u)} 0 q${f1(-3 * u)} ${f1(3 * u)} ${f1(-6 * u)} 0 Z" fill="#5cb85c"/>`), x, y, r * 1.3);
  }
  if (id === "banana") {   // a yellow crescent, its tips brown; eaten from its right end along to its left
    const x = 4 * u, y = 15 * u, w = 17 * u;
    if (!L) return `<path d="M${mealXY(x - w, y - 2 * u)} q${f1(4 * u)} ${f1(5 * u)} ${f1(9 * u)} ${f1(4 * u)}" stroke="#e8c84a" stroke-width="${f1(2.5 * u)}" fill="none" stroke-linecap="round"/>`;
    const S = [x + w + 1 * u, y - 2 * u];
    return g(mealBitten(id + "-in", S, 120, 240, 2.1 * w, taken, f.bites, `<path d="M${mealXY(x - w, y - 2 * u)} Q${mealXY(x, y + 9 * u)} ${mealXY(x + w, y - 2 * u)} Q${mealXY(x, y + 2 * u)} ${mealXY(x - w, y - 2 * u)} Z" fill="#fff3c4"/>`, 1.6 * u) +
      mealBitten(id, S, 120, 240, 2.1 * w, taken, f.bites,
        `<path d="M${mealXY(x - w, y - 2 * u)} Q${mealXY(x, y + 9 * u)} ${mealXY(x + w, y - 2 * u)} Q${mealXY(x, y + 2 * u)} ${mealXY(x - w, y - 2 * u)} Z" fill="#f6d743" stroke="#c9a227" stroke-width="${f1(1.2 * u)}"/>` +
        [x - w, x + w].map(e => `<circle cx="${f1(e)}" cy="${f1(y - 2 * u)}" r="${f1(1.4 * u)}" fill="#6b4423"/>`).join("")), x, y + 3 * u, w * 0.8);
  }
  if (id === "bread") {   // a slice on the little plate at the top left: its crust, its crumb
    const x = -36 * u, y = -30 * u, s = 9 * u;
    if (!L) return mealCrumbs(x, y, s, "#c98a3c");
    return g(mealBitten(id, [x + s + 0.5 * u, y - s * 1.2], 80, 190, 2.4 * s, taken, f.bites, `<path d="M${mealXY(x - s, y + s)} V${f1(y - s * 0.3)} Q${mealXY(x - s, y - s * 1.2)} ${mealXY(x, y - s * 1.2)} Q${mealXY(x + s, y - s * 1.2)} ${mealXY(x + s, y - s * 0.3)} V${f1(y + s)} Z" fill="#f6e2b3" stroke="#b9772f" stroke-width="${f1(2 * u)}"/>`), x, y, s * 1.2);
  }
  // the drinks, at the top right: a box seen from above, its straw; each sip squeezes it a little, at the last it is flat
  const juice = id === "juice", x = juice ? 30 * u : 48 * u, y = juice ? -34 * u : -26 * u, w = 11 * u, h = 15 * u, sq = 1 - 0.13 * taken, flat = !L;
  const box = juice ? ["#ff8c42", "#ffb37a", "#7dbb4a"] : ["#ffffff", "#5dade2", "#2f6fb0"];
  // (all gone, the box is a picture only, no more to tap)
  const drink = inner => flat ? inner : g(inner, x, y, h * 0.75);
  return drink(`<g transform="translate(${f1(x)} ${f1(y)}) scale(${(flat ? 0.55 : sq).toFixed(2)} 1)">` +
    `<rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(1.5 * u)}" fill="${box[0]}" stroke="#00000044" stroke-width="${f1(u)}"${flat ? ` opacity="0.75"` : ""}/>` +
    (juice ? `<circle cx="0" cy="${f1(2 * u)}" r="${f1(3.2 * u)}" fill="${box[2]}"/><circle cx="${f1(-1 * u)}" cy="${f1(1 * u)}" r="${f1(1.2 * u)}" fill="#ffffff" opacity="0.6"/>`
           : `<path d="M${mealXY(-w / 2, -2 * u)} H${f1(w / 2)}" stroke="${box[1]}" stroke-width="${f1(2 * u)}"/><text x="0" y="${f1(4.5 * u)}" text-anchor="middle" font-size="${f1(4 * u)}" font-weight="bold" fill="${box[2]}" font-family="sans-serif">MILK</text>`) +
    `</g>` +
    (flat ? "" : `<path d="M${mealXY(x + 2 * u, y - h / 2 + 1 * u)} l${f1(4 * u)} ${f1(-9 * u)}" stroke="${juice ? "#f2c12e" : "#e85d75"}" stroke-width="${f1(1.6 * u)}" stroke-linecap="round"/>`));
}
function mealSvg(vb) {
  const u = Math.min(vb.width / 150, vb.height / 112), cx = vb.x + vb.width / 2, cy = vb.y + vb.height * 0.53;
  // the cloth, the whole picture: white, a faint weave; the red band at its edge, near us
  let t = `<defs><pattern id="meal-weave" patternUnits="userSpaceOnUse" width="${f1(4 * u)}" height="${f1(4 * u)}"><rect width="${f1(4 * u)}" height="${f1(4 * u)}" fill="#fbf7ee"/>` +
    `<path d="M0 ${f1(2 * u)} H${f1(4 * u)} M${f1(2 * u)} 0 V${f1(4 * u)}" stroke="#efe7d6" stroke-width="${f1(0.6 * u)}"/></pattern>` +
    `<style>@keyframes meal-say { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(-${f1(12 * u)}px) } } .meal-say { animation: meal-say 0.9s ease-out forwards; }</style></defs>` +
    `<rect x="${f1(vb.x - 10)}" y="${f1(vb.y - 10)}" width="${f1(vb.width + 20)}" height="${f1(vb.height + 20)}" fill="url(#meal-weave)"/>` +
    `<rect x="${f1(vb.x - 10)}" y="${f1(vb.y + vb.height - 6 * u)}" width="${f1(vb.width + 20)}" height="${f1(3 * u)}" fill="#c0392b"/>`;
  t += `<g transform="translate(${f1(cx)} ${f1(cy)})">`;
  // the mat, woven
  t += `<rect x="${f1(-66 * u)}" y="${f1(-46 * u)}" width="${f1(132 * u)}" height="${f1(88 * u)}" rx="${f1(10 * u)}" fill="#e3c27a" stroke="#c4a058" stroke-width="${f1(1.2 * u)}"/>` +
    [...Array(9)].map((_, i) => `<line x1="${f1(-62 * u)}" y1="${f1(-40 * u + i * 10 * u)}" x2="${f1(62 * u)}" y2="${f1(-40 * u + i * 10 * u)}" stroke="#d4b36a" stroke-width="${f1(0.8 * u)}"/>`).join("");
  // the napkin at the left, folded, checked red, the fork on it
  t += `<g transform="rotate(-6 ${f1(-46 * u)} ${f1(6 * u)})"><rect x="${f1(-56 * u)}" y="${f1(-12 * u)}" width="${f1(20 * u)}" height="${f1(36 * u)}" rx="${f1(1.5 * u)}" fill="#ffffff" stroke="#e0b3b3" stroke-width="${f1(0.8 * u)}"/>` +
    [0, 1, 2, 3, 4].map(i => `<rect x="${f1(-56 * u)}" y="${f1(-12 * u + i * 8 * u)}" width="${f1(20 * u)}" height="${f1(3 * u)}" fill="#e85d75" opacity="0.45"/>`).join("") +
    [0, 1].map(i => `<rect x="${f1(-52 * u + i * 9 * u)}" y="${f1(-12 * u)}" width="${f1(3 * u)}" height="${f1(36 * u)}" fill="#e85d75" opacity="0.35"/>`).join("") + `</g>` +
    `<g stroke="#9aa3ab" stroke-linecap="round"><line x1="${f1(-46 * u)}" y1="${f1(-6 * u)}" x2="${f1(-46 * u)}" y2="${f1(22 * u)}" stroke-width="${f1(1.8 * u)}"/>` +
    [-1.6, -0.5, 0.5, 1.6].map(d => `<line x1="${f1(-46 * u + d * u)}" y1="${f1(-13 * u)}" x2="${f1(-46 * u + d * u)}" y2="${f1(-6 * u)}" stroke-width="${f1(0.8 * u)}"/>`).join("") +
    `<path d="M${mealXY(-48 * u, -6 * u)} H${f1(-44 * u)}" stroke-width="${f1(1.6 * u)}"/></g>`;
  // the knife and the spoon at the right
  t += `<g stroke-linecap="round"><line x1="${f1(40 * u)}" y1="${f1(-10 * u)}" x2="${f1(40 * u)}" y2="${f1(24 * u)}" stroke="#9aa3ab" stroke-width="${f1(1.8 * u)}"/>` +
    `<path d="M${mealXY(39 * u, -12 * u)} Q${mealXY(43 * u, -4 * u)} ${mealXY(41 * u, 6 * u)} L${mealXY(39 * u, 6 * u)} Z" fill="#c7ced4" stroke="#9aa3ab" stroke-width="${f1(0.6 * u)}"/>` +
    `<line x1="${f1(50 * u)}" y1="${f1(-2 * u)}" x2="${f1(50 * u)}" y2="${f1(24 * u)}" stroke="#9aa3ab" stroke-width="${f1(1.8 * u)}"/>` +
    `<ellipse cx="${f1(50 * u)}" cy="${f1(-6 * u)}" rx="${f1(3.6 * u)}" ry="${f1(5.4 * u)}" fill="#c7ced4" stroke="#9aa3ab" stroke-width="${f1(0.8 * u)}"/></g>`;
  // a glass of water above the plate, the little bread plate at the top left, and the big plate
  t += `<circle cx="${f1(14 * u)}" cy="${f1(-36 * u)}" r="${f1(7 * u)}" fill="#d6ecf7" stroke="#8fb3c7" stroke-width="${f1(1.2 * u)}"/><circle cx="${f1(12 * u)}" cy="${f1(-38 * u)}" r="${f1(2 * u)}" fill="#ffffff" opacity="0.7"/>` +
    `<circle cx="${f1(-36 * u)}" cy="${f1(-30 * u)}" r="${f1(13 * u)}" fill="#ffffff" stroke="#9fb7c9" stroke-width="${f1(1.2 * u)}"/>` +
    `<circle cx="0" cy="0" r="${f1(30 * u)}" fill="#ffffff" stroke="#9fb7c9" stroke-width="${f1(1.4 * u)}"/><circle cx="0" cy="0" r="${f1(22 * u)}" fill="none" stroke="#dbe6ee" stroke-width="${f1(1.2 * u)}"/>` +
    `<circle cx="0" cy="0" r="${f1(28 * u)}" fill="none" stroke="#2f6fb0" stroke-width="${f1(0.8 * u)}" stroke-dasharray="${f1(2 * u)} ${f1(2 * u)}" opacity="0.6"/>`;
  // the food
  for (const f of MEAL_FOODS) t += mealFoodSvg(f.id, u);
  // what a bite said, rising and fading where it was taken
  const S = meal.say;
  if (S && performance.now() - S.at < 900) t += `<text class="meal-say" x="${f1(S.x - cx)}" y="${f1(S.y - cy - 8 * u)}" text-anchor="middle" font-size="${f1(6 * u)}" font-weight="bold" fill="#c0392b" stroke="#ffffff" stroke-width="${f1(0.8 * u)}" paint-order="stroke" font-family="sans-serif">${S.text}</text>`;
  t += `</g>`;
  // the words at the top, and the way back
  const all = MEAL_FOODS.every(f => !meal.left[f.id]);
  t += `<text x="${f1(cx)}" y="${f1(vb.y + 8 * u)}" text-anchor="middle" font-size="${f1(5 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${all ? "😋 All eaten up!" : "🍽️ Tap the food to take a bite"}</text>`;
  const btn = (x, label, attr) => `<g ${attr} style="cursor:pointer"><rect x="${f1(x)}" y="${f1(vb.y + vb.height - 18 * u)}" width="${f1(54 * u)}" height="${f1(10 * u)}" rx="${f1(5 * u)}" fill="#ffffff" stroke="#8a7a60" stroke-width="${f1(0.8 * u)}"/>` +
    `<text x="${f1(x + 27 * u)}" y="${f1(vb.y + vb.height - 11.4 * u)}" text-anchor="middle" font-size="${f1(4.4 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${label}</text></g>`;
  t += btn(vb.x + 4 * u, "⬅️ back to the table", "data-meal-leave=\"1\"") + (all ? btn(vb.x + vb.width - 58 * u, "🍽️ more food", "data-meal-more=\"1\"") : "");
  return t;
}
function mealDraw() {
  const pic = document.getElementById("pic");
  // (the friend's own patterns, the defs drawNow left, kept; the rest of the picture taken away while at the table, as flying)
  for (const c of [...pic.childNodes]) if (c.nodeName !== "defs" && c.id !== "meal") c.remove();
  let root = pic.querySelector(":scope > #meal");
  if (!root) { root = document.createElementNS("http://www.w3.org/2000/svg", "g"); root.id = "meal"; pic.append(root); }
  fitPic();
  root.innerHTML = mealSvg(pic.viewBox.baseVal);
}
// a tap at the table: a food, a bite of it; the way back, up; anything else, nothing (before the picture's own walking)
for (const ev of ["pointerdown", "click"]) document.addEventListener(ev, e => {
  if (!meal || !e.target.closest || !e.target.closest("#pic")) return;
  e.stopPropagation(); e.preventDefault();
  if (ev !== "pointerdown") return;
  if (e.target.closest("[data-meal-leave]")) { mealEnd(); return; }
  if (e.target.closest("[data-meal-more]")) { meal.left = mealLaid(); meal.say = null; mealDraw(); return; }
  const food = e.target.closest("[data-food]");
  if (!food) return;
  const pic = document.getElementById("pic"), m = pic.getScreenCTM();
  const p = m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 };
  mealBite(food.dataset.food, p.x, p.y);
}, true);
// the keyboard at the table: Escape gets up; the game's own keys rest (no walking about the room unseen)
document.addEventListener("keydown", e => {
  if (!meal || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === "Escape") mealEnd();
}, true);
