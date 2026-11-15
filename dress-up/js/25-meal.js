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
// The foods are M's (ticket 743's list): a 🥪 sandwich, a 🍎 apple, a 🍌 banana, 🍞 bread, a 🧃 juice box and a 🥛 milk box;
// and (ticket 746) M's 🍊 orange, and in place of the sandwich, Matthew's 🌮 tacos or 🍚 fried rice ("with peas, carrots, eggs
// and tofu chunks"), the main dish chosen at the table. All of it vegetarian, as M and N are (Matthew: "no meat as protein.
// Our proteins are: beans, and lentils, and chickpeas; hummus; seeds; nuts; eggs; cheeses; tofu"): the sandwich cheese,
// lettuce and tomato, the tacos beans and cheese.
const MEAL_MAINS = [{ id: "sandwich", name: "🥪 cheese sandwich", emoji: "🥪", bites: 6 }, { id: "tacos", name: "🌮 bean tacos", emoji: "🌮", bites: 6 },
                    { id: "friedrice", name: "🍚 fried rice", emoji: "🍚", bites: 8 },
                    // (ticket 749, Matthew: "another main meal --- pizza slice, in the style of Amy's spinach and cheese")
                    { id: "pizza", name: "🍕 spinach and cheese pizza", emoji: "🍕", bites: 6 }];
const MEAL_SIDES = [{ id: "apple", name: "🍎 apple", bites: 5 }, { id: "banana", name: "🍌 banana", bites: 5 }, { id: "orange", name: "🍊 orange", bites: 5 },
  { id: "bread", name: "🍞 bread", bites: 4 }, { id: "juice", name: "🧃 juice box", bites: 4, drink: true }, { id: "milk", name: "🥛 milk box", bites: 4, drink: true }];
// (ticket 748, Matthew 2026-11-15: "let's also offer dessert options: ice cream sundae; ice cream bar; italian ice -- with
// lemon, and other flavor options") A dessert course: a dessert chosen, the plate cleared and the dessert served on it, eaten
// bite by bite as the rest; the things off the plate (the bread, the orange, the drinks) stay as they were
const MEAL_DESSERTS = [{ id: "sundae", name: "🍨 ice cream sundae", emoji: "🍨", bites: 7 }, { id: "icebar", name: "ice cream bar", emoji: "", bites: 5 },
                       { id: "italianice", name: "🍧 Italian ice", emoji: "🍧", bites: 6 }];
const MEAL_ICE_FLAVORS = [["lemon", "🍋 lemon", "#fff59d", "#f2d335"], ["cherry", "🍒 cherry", "#ef5350", "#c62828"], ["blueraspberry", "🫐 blue raspberry", "#64b5f6", "#1e6fc2"],
                          ["mango", "🥭 mango", "#ffc260", "#f08a00"], ["watermelon", "🍉 watermelon", "#ff8a99", "#e84a5f"]];
const MEAL_OFF_PLATE = new Set(["orange", "bread", "juice", "milk"]);
let mealIceFlavor = "lemon";
// (a dish's chip: its emoji, or for the ice cream bar, which has none, a little bar on its stick; x its chip's left, y its top)
const mealChipIcon = (m, x, y, cw, u) => m.id === "icebar"
  ? `<g transform="translate(${f1(x + cw / 2)} ${f1(y + 5 * u)}) rotate(-30)"><rect x="${f1(-2 * u)}" y="${f1(-3.6 * u)}" width="${f1(4 * u)}" height="${f1(6 * u)}" rx="${f1(1.8 * u)}" fill="#5a3a22"/><rect x="${f1(-0.6 * u)}" y="${f1(2.2 * u)}" width="${f1(1.2 * u)}" height="${f1(2.6 * u)}" fill="#e6c690"/></g>`
  : `<text x="${f1(x + cw / 2)}" y="${f1(y + 7.2 * u)}" text-anchor="middle" font-size="${f1(6 * u)}" font-family="sans-serif">${m.emoji}</text>`;
// (ticket 750) the salad maker, a choice at the table too: its chip after the main dishes
const MEAL_SALAD_CHIP = { id: "salad", name: "🥗 make a salad", emoji: "🥗" };   // (the Italian ice's flavor last chosen, for this visit)
const MEAL_FOODS = [...MEAL_MAINS, ...MEAL_SIDES, ...MEAL_DESSERTS];
let mealMainPick = "sandwich";   // (the main dish last chosen at the table, for this visit)
const mealOnTable = main => [MEAL_MAINS.find(m => m.id === main) || MEAL_MAINS[0], ...MEAL_SIDES];
const mealXY = (x, y) => `${f1(x)} ${f1(y)}`;
const MEAL_SAYS = ["nom!", "crunch!", "yum!", "munch!", "mmm!"], MEAL_SIPS = ["slurp!", "sip!", "gulp!", "ahh!"];
let meal = null;   // (at the table: the main dish, the bites left of each food, what the last bite said and where, how many bites in all)
const mealLaid = (main = mealMainPick) => Object.fromEntries(mealOnTable(main).map(f => [f.id, f.bites]));
const mealNew = (main = mealMainPick) => ({ main, course: "main", dessert: null, left: mealLaid(main), say: null, n: 0 });
// what is on the table now: the main course's dish and sides, or the dessert and what is off the plate
const mealHere = () => meal.course === "dessert" ? [MEAL_DESSERTS.find(d => d.id === meal.dessert), ...MEAL_SIDES.filter(f => MEAL_OFF_PLATE.has(f.id))] : mealOnTable(meal.main);
// (from the dining room: walked to the table, then sat down at it, the view from above in place of the room)
function mealStart(door) {
  if (meal || entering) return;
  const B = state.background, k = (SCENE.bottom - SCENE.top) / 700;
  tripStart(door, "walk");
  walkTo(B.figX ?? 0, SCENE.ground + 30 * k, () => { meal = mealNew(); document.body.classList.add("eating"); if (itemsOpen) itemsShow(false); changed(); });
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
  if (id === "sandwich") {   // a cheese sandwich, two halves cut corner to corner: bread, and lettuce, tomato and cheese showing at the cut
    const x = -9 * u, y = -2 * u, s = 13 * u;
    if (!L) return mealCrumbs(x, y, s, "#d9a35c");
    return g(mealBitten(id, [x - s - 1 * u, y - s - 1 * u], -10, 100, 2.9 * s, taken, f.bites, `<path d="M${mealXY(x - s, y - s)} L${mealXY(x + s, y - s)} L${mealXY(x - s, y + s)} Z" fill="#f3d9a4" stroke="#c99a52" stroke-width="${f1(1.4 * u)}"/>` +
      `<path d="M${mealXY(x - s + 2 * u, y + s - 4 * u)} L${mealXY(x + s - 4 * u, y - s + 2 * u)}" stroke="#7dbb4a" stroke-width="${f1(2.4 * u)}" stroke-linecap="round"/>` +
      `<path d="M${mealXY(x + s + 2 * u, y - s + 4 * u)} L${mealXY(x + s + 2 * u, y + s + 2 * u)} L${mealXY(x - s + 4 * u, y + s + 2 * u)} Z" fill="#f3d9a4" stroke="#c99a52" stroke-width="${f1(1.4 * u)}"/>` +
      `<path d="M${mealXY(x + s, y - s + 7 * u)} L${mealXY(x - s + 7 * u, y + s)}" stroke="#e0705a" stroke-width="${f1(2 * u)}" stroke-linecap="round"/>` +
      `<path d="M${mealXY(x - s + 4.5 * u, y + s - 6 * u)} L${mealXY(x + s - 6 * u, y - s + 4.5 * u)}" stroke="#f2c12e" stroke-width="${f1(1.6 * u)}" stroke-linecap="round"/>` +
      `<path d="M${mealXY(x + s + 2 * u, y - s + 9.5 * u)} L${mealXY(x - s + 9.5 * u, y + s + 2 * u)}" stroke="#f2c12e" stroke-width="${f1(1.6 * u)}" stroke-linecap="round"/>`), x, y, s * 1.2);
  }
  if (id === "tacos") {   // two tacos lying on the plate: folded shells, their filling at the open edge (beans, cheese, lettuce, salsa)
    const x = -9 * u, y = -2 * u;
    if (!L) return mealCrumbs(x, y, 12 * u, "#d9a441");
    const shell = (tx, ty) => { const R = 12 * u;
      return `<g transform="rotate(-25 ${f1(tx)} ${f1(ty)})"><path d="M${mealXY(tx - R, ty)} A${f1(R)} ${f1(R * 0.62)} 0 0 0 ${mealXY(tx + R, ty)} Z" fill="#f2c879" stroke="#c9952e" stroke-width="${f1(1.2 * u)}"/>` +
        [[-6, 3], [2, 5], [7, 2.4], [-1, 1.6]].map(([dx, dy]) => `<circle cx="${f1(tx + dx * u)}" cy="${f1(ty + dy * u)}" r="${f1(0.9 * u)}" fill="#d9a441"/>`).join("") +
        `<path d="M${mealXY(tx - R + 1 * u, ty - 0.6 * u)} H${f1(tx + R - 1 * u)}" stroke="#5cb85c" stroke-width="${f1(3 * u)}" stroke-linecap="round"/>` +
        [...Array(7)].map((_, i) => `<circle cx="${f1(tx - R + 3 * u + i * 3.1 * u)}" cy="${f1(ty - 1.2 * u + (i % 2) * 0.8 * u)}" r="${f1(1.1 * u)}" fill="#4a2c3a"/>`).join("") +
        [...Array(6)].map((_, i) => `<path d="M${mealXY(tx - R + 4 * u + i * 3.4 * u, ty - 2.6 * u)} l${f1(1.6 * u)} ${f1(1.4 * u)}" stroke="#f6d743" stroke-width="${f1(1 * u)}" stroke-linecap="round"/>`).join("") +
        [...Array(4)].map((_, i) => `<circle cx="${f1(tx - R + 5 * u + i * 5.2 * u)}" cy="${f1(ty - 0.2 * u)}" r="${f1(0.9 * u)}" fill="#e0402b"/>`).join("") + `</g>`; };
    return g(mealBitten(id, [x - 17 * u, y - 2 * u], -55, 55, 36 * u, taken, f.bites, shell(x - 2 * u, y - 7 * u) + shell(x + 2 * u, y + 6 * u)), x, y, 15 * u);
  }
  if (id === "friedrice") {   // a heap of fried rice: its grains, peas, bits of carrot, scrambled egg and cubes of tofu
    const x = -9 * u, y = -2 * u, r = 14 * u, R = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
    if (!L) return mealCrumbs(x, y, 12 * u, "#e8d29a");
    let heap = `<path d="M${mealXY(x - r, y)} Q${mealXY(x - r, y - r * 1.05)} ${mealXY(x, y - r)} Q${mealXY(x + r * 1.1, y - r)} ${mealXY(x + r, y + r * 0.1)} Q${mealXY(x + r * 0.9, y + r * 1.05)} ${mealXY(x - r * 0.1, y + r)} Q${mealXY(x - r * 1.1, y + r * 0.9)} ${mealXY(x - r, y)} Z" fill="#efdcaa" stroke="#d8bf7c" stroke-width="${f1(1 * u)}"/>`;
    const at = i => { const a = R(i, 1) * Math.PI * 2, d = Math.sqrt(R(i, 2)) * r * 0.85; return [x + Math.cos(a) * d, y + Math.sin(a) * d]; };
    for (let i = 0; i < 70; i++) { const [gx, gy] = at(i); heap += `<ellipse cx="${f1(gx)}" cy="${f1(gy)}" rx="${f1(1.3 * u)}" ry="${f1(0.6 * u)}" fill="${i % 3 ? "#fbf3dc" : "#e6c98a"}" transform="rotate(${Math.round(R(i, 3) * 180)} ${f1(gx)} ${f1(gy)})"/>`; }
    for (let i = 70; i < 82; i++) { const [gx, gy] = at(i); heap += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${f1(1.2 * u)}" fill="#6aa84f" stroke="#4e8a35" stroke-width="${f1(0.3 * u)}"/>`; }   // peas
    for (let i = 82; i < 92; i++) { const [gx, gy] = at(i); heap += `<rect x="${f1(gx - 0.9 * u)}" y="${f1(gy - 0.9 * u)}" width="${f1(1.8 * u)}" height="${f1(1.8 * u)}" fill="#f08a24" transform="rotate(${Math.round(R(i, 4) * 90)} ${f1(gx)} ${f1(gy)})"/>`; }   // carrots
    for (let i = 92; i < 100; i++) { const [gx, gy] = at(i); heap += `<path d="M${mealXY(gx - 1.6 * u, gy)} q${f1(1 * u)} ${f1(-1.4 * u)} ${f1(2.2 * u)} ${f1(-0.4 * u)} q${f1(1.2 * u)} ${f1(1 * u)} ${f1(-0.4 * u)} ${f1(1.8 * u)} q${f1(-1.4 * u)} ${f1(0.4 * u)} ${f1(-1.8 * u)} ${f1(-1.4 * u)} Z" fill="#f6d743"/>`; }   // egg
    for (let i = 100; i < 107; i++) { const [gx, gy] = at(i); heap += `<rect x="${f1(gx - 1.4 * u)}" y="${f1(gy - 1.4 * u)}" width="${f1(2.8 * u)}" height="${f1(2.8 * u)}" rx="${f1(0.4 * u)}" fill="#f7efdc" stroke="#d8c39a" stroke-width="${f1(0.4 * u)}" transform="rotate(${Math.round(R(i, 5) * 90)} ${f1(gx)} ${f1(gy)})"/>`; }   // tofu
    return g(mealBitten(id, [x - r - 1 * u, y + r * 0.6], -80, 30, 2.2 * r, taken, f.bites, heap), x, y, r * 1.1);
  }
  if (id === "orange") {   // a round orange above the plate, a leaf at its top; eaten from its right side, its segments showing
    const x = -8 * u, y = -38 * u, r = 7 * u;
    if (!L) return [0, 1, 2].map(i => `<path d="M${mealXY(x - 3 * u + i * 3 * u, y + 2 * u)} q${f1(1.5 * u)} ${f1(-2 * u)} ${f1(3 * u)} 0" stroke="#f39c12" stroke-width="${f1(1.4 * u)}" fill="none" stroke-linecap="round"/>`).join("");
    const S = [x + r + 0.5 * u, y], inside = `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.95)}" fill="#ffc06a"/>` +
      [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + Math.cos(a) * r * 0.9)}" y2="${f1(y + Math.sin(a) * r * 0.9)}" stroke="#fff3d6" stroke-width="${f1(0.6 * u)}"/>`; }).join("");
    return g(mealBitten(id + "-in", S, 100, 260, 2.05 * r, taken, f.bites, inside, 1.6 * u) + mealBitten(id, S, 100, 260, 2.05 * r, taken, f.bites,
      `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#f39c12" stroke="#c8780a" stroke-width="${f1(u)}"/>` +
      [[-3, -2], [2, 3], [-1, 4], [3, -3], [-4, 2]].map(([dx, dy]) => `<circle cx="${f1(x + dx * u)}" cy="${f1(y + dy * u)}" r="${f1(0.45 * u)}" fill="#e08a0a"/>`).join("") +
      `<circle cx="${f1(x - 2.4 * u)}" cy="${f1(y - 2.4 * u)}" r="${f1(1.6 * u)}" fill="#ffd08a" opacity="0.6"/><circle cx="${f1(x)}" cy="${f1(y - r + 1 * u)}" r="${f1(0.8 * u)}" fill="#6b8e23"/>` +
      `<path d="M${mealXY(x, y - r + 1 * u)} q${f1(-4 * u)} ${f1(-3 * u)} ${f1(-6 * u)} ${f1(-1 * u)} q${f1(3 * u)} ${f1(2.6 * u)} ${f1(6 * u)} ${f1(1 * u)} Z" fill="#4caf50"/>`), x, y, r * 1.3);
  }
  if (id === "pizza") {   // a slice of spinach and cheese pizza: tomato sauce at its edge, melted mozzarella, ricotta, spinach; its crust at the back; eaten from its tip to the crust
    const tipX = -25 * u, tipY = 8 * u, cA = [0, -19 * u], cB = [4 * u, 9 * u];   // (its tip, on the plate's left; its crust's two ends, at the right)
    if (!L) return mealCrumbs(-2 * u, -2 * u, 10 * u, "#d9a35c");
    const R = (i, j) => { const v = Math.sin(i * 57.3 + j * 211.9) * 43758.5453; return v - Math.floor(v); };
    const inSlice = (a, b) => { const w = 1 - a; return [tipX + (cA[0] - tipX) * a * (1 - b) + (cB[0] - tipX) * a * b, tipY + (cA[1] - tipY) * a * (1 - b) + (cB[1] - tipY) * a * b]; };
    let pz = `<path d="M${mealXY(tipX, tipY)} L${mealXY(...cA)} Q${mealXY(6 * u, -6 * u)} ${mealXY(...cB)} Z" fill="#e2563a"/>` +   // sauce
      `<path d="M${mealXY(tipX + 2 * u, tipY - 0.6 * u)} L${mealXY(cA[0] - 1 * u, cA[1] + 2.4 * u)} Q${mealXY(3 * u, -5 * u)} ${mealXY(cB[0] - 2 * u, cB[1] - 1 * u)} Z" fill="#fbe9b7"/>`;   // mozzarella
    for (let i = 0; i < 9; i++) { const [px, py] = inSlice(0.3 + 0.6 * R(i, 1), 0.15 + 0.7 * R(i, 2)); pz += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(1.2 * u)}" fill="#f3c86a" opacity="0.7"/>`; }   // browned cheese
    for (let i = 0; i < 8; i++) { const [px, py] = inSlice(0.25 + 0.65 * R(i, 3), 0.15 + 0.7 * R(i, 4)), a = Math.round(R(i, 5) * 180);
      pz += `<path d="M${mealXY(px - 2.4 * u, py)} q${f1(2.4 * u)} ${f1(-2.4 * u)} ${f1(4.8 * u)} 0 q${f1(-2.4 * u)} ${f1(2 * u)} ${f1(-4.8 * u)} 0 Z" fill="${i % 2 ? "#2e7d32" : "#3f8f3a"}" transform="rotate(${a} ${f1(px)} ${f1(py)})"/>`; }   // spinach
    for (let i = 0; i < 5; i++) { const [px, py] = inSlice(0.35 + 0.55 * R(i, 6), 0.2 + 0.6 * R(i, 7)); pz += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(1.6 * u)}" fill="#ffffff" stroke="#efe6d2" stroke-width="${f1(0.3 * u)}"/>`; }   // ricotta
    pz += `<path d="M${mealXY(...cA)} Q${mealXY(6 * u, -6 * u)} ${mealXY(...cB)}" fill="none" stroke="#c98a3c" stroke-width="${f1(4.4 * u)}" stroke-linecap="round"/>` +   // the crust
      `<path d="M${mealXY(cA[0] + 0.6 * u, cA[1] + 1 * u)} Q${mealXY(5.4 * u, -6 * u)} ${mealXY(cB[0] - 0.4 * u, cB[1] - 1 * u)}" fill="none" stroke="#e3b06a" stroke-width="${f1(1.4 * u)}" stroke-linecap="round"/>`;
    return g(mealBitten(id, [tipX - 1 * u, tipY + 0.4 * u], -60, 30, 34 * u, taken, f.bites, pz), -10 * u, -2 * u, 15 * u);
  }
  if (id === "sundae") {   // a glass bowl on the plate: three scoops (vanilla, chocolate, strawberry), whipped cream, chocolate sauce, sprinkles, a cherry
    const bowl = `<circle cx="0" cy="0" r="${f1(21 * u)}" fill="#eaf6fb" stroke="#a9cfe2" stroke-width="${f1(1.6 * u)}"/><circle cx="0" cy="0" r="${f1(17 * u)}" fill="none" stroke="#ffffff" stroke-width="${f1(1 * u)}" opacity="0.7"/>`;
    const spoon = `<line x1="${f1(16 * u)}" y1="${f1(14 * u)}" x2="${f1(27 * u)}" y2="${f1(25 * u)}" stroke="#9aa3ab" stroke-width="${f1(1.6 * u)}" stroke-linecap="round"/><ellipse cx="${f1(14 * u)}" cy="${f1(12 * u)}" rx="${f1(2.4 * u)}" ry="${f1(3.6 * u)}" fill="#c7ced4" transform="rotate(-45 ${f1(14 * u)} ${f1(12 * u)})"/>`;
    if (!L) return bowl + `<path d="M${mealXY(-8 * u, 4 * u)} q${f1(6 * u)} ${f1(-4 * u)} ${f1(12 * u)} 0" stroke="#d8b8a0" stroke-width="${f1(2 * u)}" fill="none" stroke-linecap="round" opacity="0.7"/>` + spoon;
    const scoops = [["#fbf3dc", -6, -4], ["#6b4226", 6, -5], ["#f8a5b8", 0, 6]].map(([col, dx, dy]) => `<circle cx="${f1(dx * u)}" cy="${f1(dy * u)}" r="${f1(8 * u)}" fill="${col}" stroke="#00000022" stroke-width="${f1(0.6 * u)}"/>`).join("") +
      `<path d="M${mealXY(-10 * u, -9 * u)} q${f1(5 * u)} ${f1(6 * u)} ${f1(10 * u)} ${f1(1 * u)} t${f1(8 * u)} ${f1(10 * u)} M${mealXY(-6 * u, 8 * u)} q${f1(4 * u)} ${f1(-5 * u)} ${f1(10 * u)} ${f1(-1 * u)}" stroke="#3e2412" stroke-width="${f1(1.4 * u)}" fill="none" stroke-linecap="round"/>` +
      [0, 1, 2, 3, 4].map(i => { const a = i * 1.26; return `<circle cx="${f1(Math.cos(a) * 3.2 * u)}" cy="${f1(Math.sin(a) * 3.2 * u - 1 * u)}" r="${f1(3 * u)}" fill="#ffffff"/>`; }).join("") +
      [["#e85d75", -9, 2], ["#5dade2", 9, 3], ["#f2c12e", -2, 11], ["#8bc34a", 4, -10], ["#e85d75", 11, -2], ["#5dade2", -4, -11]].map(([col, dx, dy], i) => `<rect x="${f1(dx * u)}" y="${f1(dy * u)}" width="${f1(2.2 * u)}" height="${f1(0.8 * u)}" rx="${f1(0.4 * u)}" fill="${col}" transform="rotate(${i * 37} ${f1(dx * u)} ${f1(dy * u)})"/>`).join("") +
      `<circle cx="${f1(1 * u)}" cy="${f1(-2 * u)}" r="${f1(2.6 * u)}" fill="#d62f2f"/><path d="M${mealXY(1 * u, -4.4 * u)} q${f1(1 * u)} ${f1(-3 * u)} ${f1(4 * u)} ${f1(-4 * u)}" stroke="#4e7a2a" stroke-width="${f1(0.7 * u)}" fill="none"/>`;
    return g(bowl + mealBitten(id, [-22 * u, 2 * u], -65, 65, 40 * u, taken, f.bites, scoops) + spoon, 0, 0, 22 * u);
  }
  if (id === "icebar") {   // an ice cream bar lying on the plate: chocolate outside, vanilla inside, on its stick; eaten from its top down to the stick
    const bar = (w, h, col, extra = "") => `<rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w * 0.45)}" fill="${col}"${extra}/>`;
    const stick = `<rect x="${f1(-2.4 * u)}" y="${f1(13 * u)}" width="${f1(4.8 * u)}" height="${f1(12 * u)}" rx="${f1(2.4 * u)}" fill="#e6c690" stroke="#c4a060" stroke-width="${f1(0.6 * u)}"/>`;
    const rot = inner => `<g transform="rotate(-30)">${inner}</g>`;
    if (!L) return rot(stick + `<rect x="${f1(-1.6 * u)}" y="${f1(12 * u)}" width="${f1(3.2 * u)}" height="${f1(2 * u)}" fill="#fbf3dc" opacity="0.7"/>`);
    const S = [0, -17 * u];
    return g(rot(stick + mealBitten(id + "-in", S, 50, 130, 31 * u, taken, f.bites, bar(13 * u, 29 * u, "#fbf3dc"), 1.4 * u) +
      mealBitten(id, S, 50, 130, 31 * u, taken, f.bites, bar(14 * u, 30 * u, "#5a3a22", ` stroke="#3e2412" stroke-width="${f1(0.8 * u)}"`) +
        `<path d="M${mealXY(-4 * u, -9 * u)} q${f1(2 * u)} ${f1(6 * u)} 0 ${f1(14 * u)}" stroke="#7a5236" stroke-width="${f1(1.4 * u)}" fill="none" stroke-linecap="round"/>`)), 0, 0, 18 * u);
  }
  if (id === "italianice") {   // a paper cup of Italian ice, its flavor's color, grainy, and a little wooden scoop; eaten a spoonful at a time from one side
    const F = MEAL_ICE_FLAVORS.find(q => q[0] === mealIceFlavor) || MEAL_ICE_FLAVORS[0], [, , col, dark] = F;
    const cup = `<circle cx="0" cy="0" r="${f1(17 * u)}" fill="#ffffff" stroke="#d0d0d0" stroke-width="${f1(1 * u)}"/>` +
      [...Array(16)].map((_, i) => { const a = i * Math.PI / 8; return `<line x1="${f1(Math.cos(a) * 14.5 * u)}" y1="${f1(Math.sin(a) * 14.5 * u)}" x2="${f1(Math.cos(a) * 17 * u)}" y2="${f1(Math.sin(a) * 17 * u)}" stroke="${i % 2 ? "#e53935" : "#ffffff"}" stroke-width="${f1(1.6 * u)}"/>`; }).join("");
    const scoop = `<g transform="rotate(35 ${f1(16 * u)} ${f1(16 * u)})"><rect x="${f1(14.8 * u)}" y="${f1(8 * u)}" width="${f1(2.4 * u)}" height="${f1(14 * u)}" rx="${f1(1.2 * u)}" fill="#e6c690"/><ellipse cx="${f1(16 * u)}" cy="${f1(7 * u)}" rx="${f1(2.6 * u)}" ry="${f1(3 * u)}" fill="#e6c690"/></g>`;
    if (!L) return cup + `<circle cx="${f1(-4 * u)}" cy="${f1(5 * u)}" r="${f1(3 * u)}" fill="${col}" opacity="0.5"/>` + scoop;
    const R = (i, j) => { const v = Math.sin(i * 91.7 + j * 47.3) * 43758.5453; return v - Math.floor(v); };
    const ice = `<circle cx="0" cy="0" r="${f1(13.5 * u)}" fill="${col}"/>` + [...Array(40)].map((_, i) => { const a = R(i, 1) * 6.283, d = Math.sqrt(R(i, 2)) * 12.5 * u;
      return `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="${f1((0.5 + 0.5 * R(i, 3)) * u)}" fill="${i % 3 ? "#ffffff" : dark}" opacity="${i % 3 ? 0.55 : 0.35}"/>`; }).join("");
    return g(cup + mealBitten(id, [15 * u, -2 * u], 115, 245, 30 * u, taken, f.bites, ice) + scoop, 0, 0, 18 * u);
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
  for (const f of mealHere()) t += mealFoodSvg(f.id, u);
  // what a bite said, rising and fading where it was taken
  const S = meal.say;
  if (S && performance.now() - S.at < 900) t += `<text class="meal-say" x="${f1(S.x - cx)}" y="${f1(S.y - cy - 8 * u)}" text-anchor="middle" font-size="${f1(6 * u)}" font-weight="bold" fill="#c0392b" stroke="#ffffff" stroke-width="${f1(0.8 * u)}" paint-order="stroke" font-family="sans-serif">${S.text}</text>`;
  t += `</g>`;
  // the words at the top, and the way back
  // (the dessert course is done when its dessert is: the bread and the drinks off the plate are the main course's)
  const all = meal.course === "dessert" ? !meal.left[meal.dessert] : mealHere().every(f => !meal.left[f.id]), ice = meal.course === "dessert" && meal.dessert === "italianice" && !all;
  const title = all ? "😋 All eaten up!" : ice ? "🍧 Italian ice: pick a flavor" : meal.course === "dessert" ? "🍨 Dessert! Tap to take a bite" : "🍽️ Tap the food to take a bite";
  // (ticket 748) the Italian ice's flavors, beside the words at the top, the one in the cup ringed
  const fl = ice ? MEAL_ICE_FLAVORS.length * 10.5 * u : 0, tx = cx - (ice ? fl / 2 + 3 * u : 0);
  t += `<text x="${f1(tx)}" y="${f1(vb.y + 8 * u)}" text-anchor="middle" font-size="${f1(5 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${title}</text>`;
  if (ice) { const x0f = tx + 37 * u;
    t += MEAL_ICE_FLAVORS.map(([id, name, col, dark], i) => { const on = id === mealIceFlavor, x = x0f + i * 10.5 * u;
      return `<g data-meal-flavor="${id}" style="cursor:pointer"><title>${name}</title><circle cx="${f1(x + 4.5 * u)}" cy="${f1(vb.y + 6.4 * u)}" r="${f1(4.5 * u)}" fill="${col}" stroke="${on ? "#4a3a28" : dark}" stroke-width="${f1((on ? 1.4 : 0.6) * u)}"/>` +
        `<text x="${f1(x + 4.5 * u)}" y="${f1(vb.y + 8.3 * u)}" text-anchor="middle" font-size="${f1(4.6 * u)}" font-family="sans-serif">${name.split(" ")[0]}</text></g>`; }).join(""); }
  const by = vb.y + vb.height - 18 * u;
  const btn = (x, w, label, attr) => `<g ${attr} style="cursor:pointer"><rect x="${f1(x)}" y="${f1(by)}" width="${f1(w)}" height="${f1(10 * u)}" rx="${f1(5 * u)}" fill="#ffffff" stroke="#8a7a60" stroke-width="${f1(0.8 * u)}"/>` +
    `<text x="${f1(x + w / 2)}" y="${f1(by + 6.6 * u)}" text-anchor="middle" font-size="${f1(4.4 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${label}</text></g>`;
  t += btn(vb.x + 4 * u, 24 * u, "⬅️ back", "data-meal-leave=\"1\"") + (all ? btn(vb.x + vb.width - 30 * u, 26 * u, "🍽️ more", "data-meal-more=\"1\"") : "");
  // (tickets 746 and 748) the main dish and the dessert, chosen: a chip for each, between the buttons; the one on the plate ringed
  const cw = 9.5 * u, gap = 1 * u, split = 3 * u, chips = [...MEAL_MAINS.map(m => ["main", m]), ["salad", MEAL_SALAD_CHIP], ...MEAL_DESSERTS.map(d => ["dessert", d])];
  const x0 = cx - (chips.length * cw + (chips.length - 1) * gap + split) / 2;
  t += chips.map(([kind, m], i) => { const on = kind === meal.course && (kind === "main" ? m.id === meal.main : m.id === meal.dessert), x = x0 + i * (cw + gap) + (kind === "dessert" ? split : 0);
    const icon = mealChipIcon(m, x, by, cw, u);
    return `<g data-meal-${kind}="${m.id}" style="cursor:pointer"><title>${m.name}</title><rect x="${f1(x)}" y="${f1(by)}" width="${f1(cw)}" height="${f1(10 * u)}" rx="${f1(3 * u)}" fill="${on ? "#fff3c4" : "#ffffff"}" stroke="${on ? "#c0392b" : "#8a7a60"}" stroke-width="${f1((on ? 1.4 : 0.8) * u)}"/>` + icon + `</g>`; }).join("");
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
  if (e.target.closest("[data-meal-salad]")) { saladFromTable(); return; }   // (ticket 750)
  if (e.target.closest("[data-meal-more]")) {
    if (meal.course === "dessert") { meal.left[meal.dessert] = MEAL_FOODS.find(f => f.id === meal.dessert).bites; meal.say = null; } else meal = mealNew(meal.main);
    mealDraw(); return; }
  const pick = e.target.closest("[data-meal-main]");
  if (pick) { const main = pick.dataset.mealMain;
    if (main === meal.main) meal.course = "main";   // (back from dessert to the same dish, as it was left)
    else { mealMainPick = main; const was = meal.left; meal = { ...meal, main, course: "main", left: { ...was, [main]: MEAL_FOODS.find(f => f.id === main).bites } }; }
    mealDraw(); return; }
  const sweet = e.target.closest("[data-meal-dessert]");
  if (sweet) { const d = sweet.dataset.mealDessert;
    if (!(meal.course === "dessert" && meal.dessert === d)) { meal.left[d] = MEAL_FOODS.find(f => f.id === d).bites; meal.course = "dessert"; meal.dessert = d; meal.say = null; }
    mealDraw(); return; }
  const flavor = e.target.closest("[data-meal-flavor]");
  if (flavor) { const fl = flavor.dataset.mealFlavor; if (fl !== mealIceFlavor) { mealIceFlavor = fl; meal.left.italianice = MEAL_FOODS.find(f => f.id === "italianice").bites; } mealDraw(); return; }
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
