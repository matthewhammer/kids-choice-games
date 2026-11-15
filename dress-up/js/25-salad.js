"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 178) A part of the game's script, run in order by index.html.

// ===================== THE SALAD MAKER, ON THE KITCHEN COUNTER =====================
// (ticket 747, Matthew 2026-11-15: "let's also add a salad composer interface, as a sub-game. It looks like the place setting
// view, except it's got salad ingrediants on the L and R sides, and a big bowel in the middle. No meat or non-vegetarian
// options please." And: "Let's create the salad maker UI in the Kitchen, as something to engage with on the counter.")
// The kitchen's salad bowl, on its cutting board, tapped: the counter seen from above, as the dining table is (js/25-meal.js,
// whose way this follows: while `salad` is set, drawNow hands the picture to saladDraw, its taps taken first). A big
// wooden bowl in the middle; down the left and the right, little dishes of what goes in a salad, all vegetarian (M and N
// are: the proteins here are chickpeas, black beans, cheese, egg, seeds and walnuts). A tap on a dish drops a handful into
// the bowl; 🫗 pours dressing; 🥗 tosses it; 🍴 eats it, a bite at a time, from one edge across (mealBitten), the bowl left;
// 🗑️ empties it. The salad is kept while the game is open (saladKept), not saved.
const SALAD_LEFT = [["lettuce", "🥬 lettuce"], ["spinach", "🍃 spinach"], ["tomato", "🍅 tomatoes"], ["cucumber", "🥒 cucumber"], ["carrot", "🥕 carrots"], ["pepper", "🫑 peppers"], ["avocado", "🥑 avocado"]];
const SALAD_RIGHT = [["chickpea", "chickpeas"], ["bean", "black beans"], ["corn", "🌽 corn"], ["cheese", "🧀 cheese"], ["egg", "🥚 egg"], ["seed", "🌻 seeds"], ["walnut", "walnuts"]];
// (Matthew, 2026-11-15: "the salad bowels look really empty") a handful is a good many pieces, drawn big in the bowl, the greens
// a bed of leaves across its bottom; the dishes heaped full
const SALAD_LEAFY = new Set(["lettuce", "spinach"]), SALAD_MAX = 520, SALAD_BITES = 8;
const saladSize = kind => SALAD_LEAFY.has(kind) ? 1.9 : kind === "avocado" || kind === "egg" ? 1.5 : 1.6;
let salad = null, saladKept = null;
// (ticket 750, Matthew 2026-11-15: "Let's link that here, with another meal option chip? and when we do it here, let's link
// back to the other meal options, somehow.") Made from the dining table (its 🥗 chip): the meal as it was, kept to go back
// to; the salad maker shows the table's dishes in a row at its top, each going back to the table with that dish, and its
// ⬅️ back goes back to the table, not to the kitchen
let saladFrom = null, mealStash = null;
function saladFromTable() {
  if (!meal) return;
  mealStash = meal; meal = null;
  const root = document.getElementById("pic").querySelector(":scope > #meal");
  if (root) root.remove();
  salad = saladKept || saladNew(); saladFrom = "table";
  changed();
}
// (pick: "main:tacos" or "dessert:sundae", the dish chosen; none, the meal as it was left)
function saladToTable(pick) {
  saladKept = salad; salad = null; saladFrom = null;
  const root = document.getElementById("pic").querySelector(":scope > #salad");
  if (root) root.remove();
  meal = mealStash || mealNew(); mealStash = null;
  const [kind, id] = (pick || "").split(":"), f = MEAL_FOODS.find(q => q.id === id);
  if (kind === "main" && f) { if (id !== meal.main) { mealMainPick = id; meal = { ...meal, main: id, left: { ...meal.left, [id]: f.bites } }; } meal.course = "main"; }
  if (kind === "dessert" && f) { if (!(meal.course === "dessert" && meal.dessert === id)) { meal.left[id] = f.bites; meal.dessert = id; } meal.course = "dessert"; }
  changed();
}   // (the salad being made: its pieces, where each lies; its dressing; eating it, how many bites taken)
const saladNew = () => ({ items: [], dressing: 0, eat: false, taken: 0, n: 0, shake: 0, say: null });
// a deterministic chance, from a number and a slot
const saladR = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };
// a piece of an ingredient at (x, y), turned a degrees, in the counter's units u (as the table's)
function saladPiece(kind, x, y, a, u, k = 1) {
  const T = inner => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(a)}) scale(${k})">${inner}</g>`, U = v => f1(v * u);
  switch (kind) {
    case "lettuce": return T(`<path d="M${U(-5)} 0 Q${U(-4)} ${U(-4)} 0 ${U(-3.4)} Q${U(4)} ${U(-4.4)} ${U(5)} 0 Q${U(4)} ${U(3.8)} 0 ${U(3.2)} Q${U(-4)} ${U(4)} ${U(-5)} 0 Z" fill="#9ccc65" stroke="#7cb342" stroke-width="${U(0.4)}"/><path d="M${U(-4)} 0 H${U(4)}" stroke="#dcedc8" stroke-width="${U(0.5)}"/>`);
    case "spinach": return T(`<path d="M${U(-4)} 0 Q0 ${U(-3.2)} ${U(4)} 0 Q0 ${U(3.2)} ${U(-4)} 0 Z" fill="#2e7d32"/><path d="M${U(-3.6)} 0 H${U(3.4)}" stroke="#66bb6a" stroke-width="${U(0.4)}"/>`);
    case "tomato": return T(`<circle r="${U(2.4)}" fill="#e53935"/><circle cx="${U(-0.8)}" cy="${U(-0.8)}" r="${U(0.7)}" fill="#ffffff" opacity="0.55"/>`);
    case "cucumber": return T(`<circle r="${U(2.5)}" fill="#43a047"/><circle r="${U(2)}" fill="#dcedc8"/>${[0, 1, 2, 3].map(i => `<circle cx="${U(Math.cos(i * 1.57) * 0.9)}" cy="${U(Math.sin(i * 1.57) * 0.9)}" r="${U(0.3)}" fill="#c5e1a5"/>`).join("")}`);
    case "carrot": return T(`<rect x="${U(-2.4)}" y="${U(-0.45)}" width="${U(4.8)}" height="${U(0.9)}" rx="${U(0.45)}" fill="#f57c00"/>`);
    case "pepper": return T(`<path d="M${U(-2.6)} ${U(0.6)} Q0 ${U(-1.6)} ${U(2.6)} ${U(0.6)}" fill="none" stroke="${saladR(x, y) < 0.5 ? "#e53935" : "#fbc02d"}" stroke-width="${U(1)}" stroke-linecap="round"/>`);
    case "avocado": return T(`<path d="M${U(-2.8)} 0 Q0 ${U(-2.6)} ${U(2.8)} 0 Q0 ${U(-1)} ${U(-2.8)} 0 Z" fill="#aed581" stroke="#33691e" stroke-width="${U(0.4)}"/>`);
    case "chickpea": return T(`<circle r="${U(1.2)}" fill="#e6c38a" stroke="#c9a36a" stroke-width="${U(0.25)}"/>`);
    case "bean": return T(`<ellipse rx="${U(1.3)}" ry="${U(0.8)}" fill="#3e2a3a"/><ellipse cx="${U(-0.4)}" cy="${U(-0.2)}" rx="${U(0.4)}" ry="${U(0.2)}" fill="#ffffff" opacity="0.3"/>`);
    case "corn": return T(`<rect x="${U(-0.6)}" y="${U(-0.6)}" width="${U(1.2)}" height="${U(1.2)}" rx="${U(0.35)}" fill="#ffd54f"/>`);
    case "cheese": return T(`<rect x="${U(-1)}" y="${U(-1)}" width="${U(2)}" height="${U(2)}" rx="${U(0.3)}" fill="#ffe082" stroke="#f9c74f" stroke-width="${U(0.25)}"/>`);
    case "egg": return T(`<ellipse rx="${U(2.4)}" ry="${U(1.8)}" fill="#ffffff" stroke="#eeeeee" stroke-width="${U(0.25)}"/><circle r="${U(1)}" fill="#fbc02d"/>`);
    case "seed": return T(`<path d="M${U(-0.9)} 0 Q0 ${U(-0.6)} ${U(0.9)} 0 Q0 ${U(0.6)} ${U(-0.9)} 0 Z" fill="#9e9e9e"/><path d="M${U(-0.6)} 0 H${U(0.6)}" stroke="#eeeeee" stroke-width="${U(0.2)}"/>`);
    case "walnut": return T(`<path d="M${U(-1.6)} ${U(-0.6)} Q${U(-1.2)} ${U(-1.6)} 0 ${U(-1.2)} Q${U(1.4)} ${U(-1.8)} ${U(1.6)} ${U(-0.4)} Q${U(2)} ${U(1)} ${U(0.4)} ${U(1.4)} Q${U(-1.8)} ${U(1.6)} ${U(-1.6)} ${U(-0.6)} Z" fill="#8d6e63" stroke="#5d4037" stroke-width="${U(0.3)}"/>`);
  }
  return "";
}
const SALAD_BOWL = 30;   // (where pieces may lie: within this of the bowl's middle, in u)
// a handful of an ingredient into the bowl, each piece where chance puts it
function saladAdd(kind) {
  if (!salad || salad.eat) return;
  if (salad.items.length >= SALAD_MAX) { salad.say = { text: "the bowl is full! 🥗", at: performance.now() }; saladDraw(); return; }
  const many = SALAD_LEAFY.has(kind) ? 12 : kind === "avocado" || kind === "egg" ? 5 : 10;
  for (let i = 0; i < many; i++) {
    const n = salad.n++, a = saladR(n, 1) * Math.PI * 2, d = Math.sqrt(saladR(n, 2)) * SALAD_BOWL;
    salad.items.push({ kind, x: Math.cos(a) * d, y: Math.sin(a) * d, r: saladR(n, 3) * 360 });
  }
  salad.say = { text: ["plop!", "in it goes!", "yum!", "crunchy!"][salad.n % 4], at: performance.now() };
  saladDraw();
}
// tossed: every piece somewhere new, the leaves underneath, the rest over them, and the bowl given a shake
function saladToss() {
  if (!salad || salad.eat || !salad.items.length) return;
  for (const it of salad.items) { const n = salad.n++, a = saladR(n, 1) * Math.PI * 2, d = Math.sqrt(saladR(n, 2)) * SALAD_BOWL; Object.assign(it, { x: Math.cos(a) * d, y: Math.sin(a) * d, r: saladR(n, 3) * 360 }); }
  salad.items.sort((p, q) => (SALAD_LEAFY.has(q.kind) ? 1 : 0) - (SALAD_LEAFY.has(p.kind) ? 1 : 0));
  salad.shake = performance.now(); salad.say = { text: "toss, toss! 🥗", at: performance.now() };
  saladDraw();
}
function saladStart(door) {
  if (salad || entering) return;
  const B = state.background, k = (SCENE.bottom - SCENE.top) / 700;
  tripStart(door, "walk");
  walkTo(-170 * k, (SCENE_BACK[B.kind] ? SCENE_BACK[B.kind]() : SCENE.ground) + 4, () => { salad = saladKept || saladNew(); document.body.classList.add("eating"); if (itemsOpen) itemsShow(false); changed(); });
}
function saladEnd() {
  if (!salad) return;
  if (saladFrom === "table") { saladToTable(); return; }   // (ticket 750: back to the table it was made from)
  saladKept = salad; salad = null;
  document.body.classList.remove("eating");
  const root = document.getElementById("pic").querySelector(":scope > #salad");
  if (root) root.remove();
  changed();
}
// (Matthew, 2026-11-15: "during 'eat it' --- can we animate the fork moving towards/around the edge of the eating edge? for
// salad") Eating, the fork is at the eaten edge: its tines at the edge's middle, just into what is left, sweeping slowly
// along the edge (turning about where the eating began, so it keeps to the edge), and at each bite poking in from where
// the edge was to where it is now. Eaten up, it rests at the bowl's side. (Its poke starts when it is drawn: saladDraw
// begins each [data-begin-now] animation, as SMIL put in later would otherwise count from the page's start.)
const SALAD_EAT_FROM = [-37, -4], SALAD_EAT_ACROSS = 74, SALAD_EAT_BODY = [0, -4, 34];   // (and the salad's own circle: each bite the same share of it)   // (where the eating begins, the bowl's left edge, and how far it goes, in u)
function saladForkSvg(u, eaten) {
  const fork = `<g stroke-linecap="round"><line x1="${f1(-2 * u)}" y1="0" x2="${f1(-24 * u)}" y2="0" stroke="#9aa3ab" stroke-width="${f1(1.8 * u)}"/>` +
    `<path d="M${mealXY(-3 * u, -2 * u)} H${f1(-1 * u)} V${f1(2 * u)} H${f1(-3 * u)}" fill="none" stroke="#9aa3ab" stroke-width="${f1(1 * u)}"/>` +
    [-1.5, -0.5, 0.5, 1.5].map(d => `<line x1="${f1(-1 * u)}" y1="${f1(d * u)}" x2="${f1(5 * u)}" y2="${f1(d * u)}" stroke="#9aa3ab" stroke-width="${f1(0.7 * u)}"/>`).join("") + `</g>`;
  if (eaten) return `<g transform="translate(${f1(44 * u)} ${f1(30 * u)}) rotate(-130)">${fork}</g>`;
  const S = SALAD_EAT_FROM.map(v => v * u), [sx, sy] = S, D = SALAD_EAT_ACROSS * u, body = SALAD_EAT_BODY.map(v => v * u);
  const R = mealReach(salad.taken / SALAD_BITES, S, D, body), Rp = mealReach(Math.max(0, salad.taken - 1) / SALAD_BITES, S, D, body);
  // (the sweep, about where the eating began; in it, the fork at the edge, a little turned, as held from the bowl's near side)
  return `<g pointer-events="none"><animateTransform attributeName="transform" type="rotate" values="-26 ${f1(sx)} ${f1(sy)};26 ${f1(sx)} ${f1(sy)};-26 ${f1(sx)} ${f1(sy)}" dur="3.4s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>` +
    `<g transform="translate(${f1(sx + R + 2 * u)} ${f1(sy)}) rotate(-24)"><g><animateTransform data-begin-now="1" attributeName="transform" type="translate" values="${f1(Rp - R)} 0;${f1(4 * u)} 0;0 0" keyTimes="0;0.55;1" dur="0.5s" begin="indefinite" fill="freeze"/>${fork}</g></g></g>`;
}
function saladSvg(vb) {
  const u = Math.min(vb.width / 150, vb.height / 112), cx = vb.x + vb.width / 2, cy = vb.y + vb.height * 0.5, now = performance.now();
  // the counter: pale stone, flecked
  let t = `<defs><pattern id="salad-stone" patternUnits="userSpaceOnUse" width="${f1(14 * u)}" height="${f1(14 * u)}"><rect width="${f1(14 * u)}" height="${f1(14 * u)}" fill="#e7e3dc"/>` +
    [[2, 3], [9, 5], [5, 11], [12, 12], [7, 7]].map(([x, y], i) => `<circle cx="${f1(x * u)}" cy="${f1(y * u)}" r="${f1((0.4 + 0.2 * (i % 2)) * u)}" fill="${i % 2 ? "#c9c3b8" : "#d6d0c6"}"/>`).join("") + `</pattern>` +
    `<style>@keyframes salad-shake { 0% { transform: rotate(0) } 25% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } 75% { transform: rotate(-2deg) } 100% { transform: rotate(0) } } .salad-shake { animation: salad-shake 0.5s ease-in-out; transform-box: fill-box; transform-origin: center; }` +
    `@keyframes meal-say { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(-${f1(12 * u)}px) } } .meal-say { animation: meal-say 0.9s ease-out forwards; }</style></defs>` +
    `<rect x="${f1(vb.x - 10)}" y="${f1(vb.y - 10)}" width="${f1(vb.width + 20)}" height="${f1(vb.height + 20)}" fill="url(#salad-stone)"/>` +
    `<rect x="${f1(vb.x - 10)}" y="${f1(vb.y + vb.height - 5 * u)}" width="${f1(vb.width + 20)}" height="${f1(5 * u + 10)}" fill="#7f8c8d"/>`;
  t += `<g transform="translate(${f1(cx)} ${f1(cy)})">`;
  // the dishes down either side, each with a little heap of its ingredient and its name under it
  const dish = ([kind, name], x, y) => { let heap = "";
    for (let i = 0; i < (SALAD_LEAFY.has(kind) ? 7 : 14); i++) { const a = saladR(i, kind.length) * 6.283, d = Math.sqrt(saladR(i, kind.length + 3)) * 4.4 * u;
      heap += saladPiece(kind, x + Math.cos(a) * d, y + Math.sin(a) * d, saladR(i, 9) * 360, u, SALAD_LEAFY.has(kind) ? 1.05 : kind === "avocado" || kind === "egg" ? 1.05 : 1.3); }
    return `<g data-salad-add="${kind}" style="cursor:pointer"><title>${name}</title><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(6.4 * u)}" fill="#ffffff" stroke="#b9c3c9" stroke-width="${f1(0.8 * u)}"/>${heap}` +
      `<text x="${f1(x)}" y="${f1(y + 9.4 * u)}" text-anchor="middle" font-size="${f1(2.8 * u)}" font-weight="bold" fill="#4a3a28" stroke="#e7e3dc" stroke-width="${f1(0.6 * u)}" paint-order="stroke" font-family="sans-serif">${name.replace(/^[^a-z]+ /, "")}</text></g>`; };   // (the name without its emoji: the dish shows what it holds)
  // (each side two columns of four, the outer column first, so every dish and its name have room)
  const at = (i, sd) => [sd * (i < 4 ? 65 : 50) * u, (-34 + (i % 4) * 18) * u];
  SALAD_LEFT.forEach((d, i) => { t += dish(d, ...at(i, -1)); });
  SALAD_RIGHT.forEach((d, i) => { t += dish(d, ...at(i, 1)); });
  // the big wooden bowl, and what is in it; dressing over it; eaten from its left edge across (the bowl left)
  const shake = now - salad.shake < 520 ? ` class="salad-shake"` : "";
  const leaves = salad.items.filter(it => SALAD_LEAFY.has(it.kind)).length, bedR = Math.min(SALAD_BOWL + 3, 12 + leaves * 0.9);
  let inside = leaves ? `<circle cx="0" cy="${f1(-4 * u)}" r="${f1(bedR * u)}" fill="#7cb342"/>` +
    [...Array(18)].map((_, i) => { const a = i * Math.PI / 9; return `<circle cx="${f1(Math.cos(a) * bedR * 0.88 * u)}" cy="${f1(Math.sin(a) * bedR * 0.88 * u - 4 * u)}" r="${f1(bedR * 0.2 * u)}" fill="${i % 2 ? "#8bc34a" : "#689f38"}"/>`; }).join("") : "";
  inside += salad.items.map(it => saladPiece(it.kind, it.x * u, it.y * u - 4 * u, it.r, u, saladSize(it.kind))).join("");
  for (let i = 0; i < salad.dressing; i++) inside += `<path d="M${mealXY(-22 * u, (-14 + i * 9) * u)} q${f1(6 * u)} ${f1(-6 * u)} ${f1(12 * u)} 0 t${f1(11 * u)} 0 t${f1(11 * u)} 0 t${f1(11 * u)} 0" fill="none" stroke="#f3e5c0" stroke-width="${f1(1.3 * u)}" stroke-linecap="round" opacity="0.9"/>`;
  const eaten = salad.taken >= SALAD_BITES;
  t += `<g${shake}><circle cx="0" cy="${f1(-4 * u)}" r="${f1(39 * u)}" fill="#c8915a" stroke="#8a5d30" stroke-width="${f1(1.4 * u)}"/><circle cx="0" cy="${f1(-4 * u)}" r="${f1(35 * u)}" fill="#a8743f"/>` +
    `<circle cx="0" cy="${f1(-4 * u)}" r="${f1(37 * u)}" fill="none" stroke="#e0b07a" stroke-width="${f1(1 * u)}" opacity="0.7"/>` +
    `<g data-salad-bowl="1" style="cursor:pointer"><circle cx="0" cy="${f1(-4 * u)}" r="${f1(35 * u)}" fill="#000000" opacity="0"/>` +
    (eaten ? "" : mealBitten("salad", SALAD_EAT_FROM.map(v => v * u), -60, 60, SALAD_EAT_ACROSS * u, salad.taken, SALAD_BITES, inside, 0, SALAD_EAT_BODY.map(v => v * u))) + `</g>` +
    (salad.eat ? saladForkSvg(u, eaten) : "") + `</g>`;
  const S = salad.say;
  if (S && now - S.at < 900) t += `<text class="meal-say" x="0" y="${f1(-20 * u)}" text-anchor="middle" font-size="${f1(6 * u)}" font-weight="bold" fill="#2e7d32" stroke="#ffffff" stroke-width="${f1(0.8 * u)}" paint-order="stroke" font-family="sans-serif">${S.text}</text>`;
  t += `</g>`;
  // the words at the top, and the buttons
  const empty = !salad.items.length;
  const title = eaten ? "😋 All eaten up!" : salad.eat ? "🍴 Tap the salad to take a bite" : empty ? "🥗 Tap a dish to put it in the bowl" : "🥗 Add more, or toss it, or eat it!";
  // (ticket 750) made from the table: the table's dishes in a row at the top, the main dishes and this salad at the left, the
  // desserts at the right; each goes back to the table with that dish
  const atTable = saladFrom === "table";
  t += `<text x="${f1(cx)}" y="${f1(vb.y + 6.5 * u)}" text-anchor="middle" font-size="${f1(5 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${atTable && !eaten && !salad.eat ? "🥗 Your salad" : title}</text>`;
  if (atTable) {
    const cw = 9.5 * u, gap = 1 * u, cy0 = vb.y + 1.6 * u, chip = (x, m, pick, on) => `<g ${pick ? `data-salad-meal="${pick}"` : ""} style="cursor:pointer"><title>${m.name}</title>` +
      `<rect x="${f1(x)}" y="${f1(cy0)}" width="${f1(cw)}" height="${f1(9 * u)}" rx="${f1(3 * u)}" fill="${on ? "#fff3c4" : "#ffffff"}" stroke="${on ? "#c0392b" : "#8a7a60"}" stroke-width="${f1((on ? 1.4 : 0.8) * u)}"/>` + mealChipIcon(m, x, cy0 - 0.6 * u, cw, u) + `</g>`;
    t += [...MEAL_MAINS.map(m => [m, "main:" + m.id, false]), [MEAL_SALAD_CHIP, "", true]].map(([m, pick, on], i) => chip(vb.x + 4 * u + i * (cw + gap), m, pick, on)).join("") +
      MEAL_DESSERTS.map((m, i) => chip(vb.x + vb.width - 4 * u - (MEAL_DESSERTS.length - i) * (cw + gap) + gap, m, "dessert:" + m.id, false)).join("");
  }
  const by = vb.y + vb.height - 16 * u;
  const btn = (x, w, label, attr, dim = false) => `<g ${attr} style="cursor:pointer"${dim ? ` opacity="0.45"` : ""}><rect x="${f1(x)}" y="${f1(by)}" width="${f1(w)}" height="${f1(10 * u)}" rx="${f1(5 * u)}" fill="#ffffff" stroke="#8a7a60" stroke-width="${f1(0.8 * u)}"/>` +
    `<text x="${f1(x + w / 2)}" y="${f1(by + 6.6 * u)}" text-anchor="middle" font-size="${f1(3.9 * u)}" font-weight="bold" fill="#4a3a28" font-family="sans-serif">${label}</text></g>`;
  t += btn(vb.x + 4 * u, 26 * u, "⬅️ back", `data-salad-leave="1"`);
  if (eaten) t += btn(cx - 22 * u, 44 * u, "🥗 make another", `data-salad-empty="1"`);
  else if (salad.eat) t += btn(cx - 22 * u, 44 * u, "🥗 back to making it", `data-salad-make="1"`);
  else t += btn(cx - 42 * u, 26 * u, "🫗 dressing", `data-salad-dress="1"`, empty || salad.dressing >= 3) + btn(cx - 13 * u, 26 * u, "🥗 toss", `data-salad-toss="1"`, empty) + btn(cx + 16 * u, 26 * u, "🍴 eat it", `data-salad-eat="1"`, empty);
  t += btn(vb.x + vb.width - 30 * u, 26 * u, "🗑️ empty", `data-salad-empty="1"`, empty);
  return t;
}
function saladDraw() {
  const pic = document.getElementById("pic");
  for (const c of [...pic.childNodes]) if (c.nodeName !== "defs" && c.id !== "salad") c.remove();
  let root = pic.querySelector(":scope > #salad");
  if (!root) { root = document.createElementNS("http://www.w3.org/2000/svg", "g"); root.id = "salad"; pic.append(root); }
  fitPic();
  root.innerHTML = saladSvg(pic.viewBox.baseVal);
  for (const a of root.querySelectorAll("[data-begin-now]")) try { a.beginElement(); } catch (e) { /* (no SMIL here: the fork simply stands at the edge) */ }
}
// a tap at the counter: a dish, into the bowl; the buttons; the bowl, while eating it, a bite (before the picture's own walking)
for (const ev of ["pointerdown", "click"]) document.addEventListener(ev, e => {
  if (!salad || !e.target.closest || !e.target.closest("#pic")) return;
  e.stopPropagation(); e.preventDefault();
  if (ev !== "pointerdown") return;
  const on = sel => e.target.closest(sel);
  if (on("[data-salad-leave]")) { saladEnd(); return; }
  const dish = on("[data-salad-meal]");
  if (dish) { saladToTable(dish.dataset.saladMeal); return; }   // (ticket 750: back to the table, with that dish)
  if (on("[data-salad-empty]")) { salad = saladNew(); saladDraw(); return; }
  if (on("[data-salad-make]")) { salad.eat = false; saladDraw(); return; }
  if (!salad.items.length) { const add = on("[data-salad-add]"); if (add) saladAdd(add.dataset.saladAdd); return; }
  if (on("[data-salad-dress]")) { if (!salad.eat && salad.dressing < 3) { salad.dressing++; salad.say = { text: "drizzle! 🫗", at: performance.now() }; saladDraw(); } return; }
  if (on("[data-salad-toss]")) { saladToss(); return; }
  if (on("[data-salad-eat]")) { salad.eat = true; saladDraw(); return; }
  const add = on("[data-salad-add]");
  if (add) { saladAdd(add.dataset.saladAdd); return; }
  if (salad.eat && on("[data-salad-bowl]") && salad.taken < SALAD_BITES) {
    salad.taken++; salad.say = { text: salad.taken < SALAD_BITES ? ["crunch!", "nom!", "yum!", "munch!"][salad.taken % 4] : "all eaten! 😋", at: performance.now() };
    saladDraw();
  }
}, true);
document.addEventListener("keydown", e => {
  if (!salad || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === "Escape") saladEnd();
}, true);
