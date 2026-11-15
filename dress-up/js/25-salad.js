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
// the bowl; 🫗 pours dressing; 🥗 tosses it; 🍴 eats it, a bite at a time, along a Z-order curve from its top left (saladZ), the bowl left;
// 🗑️ empties it. The salad is kept while the game is open (saladKept), not saved.
const SALAD_LEFT = [["lettuce", "🥬 lettuce"], ["spinach", "🍃 spinach"], ["tomato", "🍅 tomatoes"], ["cucumber", "🥒 cucumber"], ["carrot", "🥕 carrots"], ["pepper", "🫑 peppers"], ["avocado", "🥑 avocado"]];
const SALAD_RIGHT = [["chickpea", "chickpeas"], ["bean", "black beans"], ["corn", "🌽 corn"], ["cheese", "🧀 cheese"], ["egg", "🥚 egg"], ["seed", "🌻 seeds"], ["walnut", "walnuts"]];
// (Matthew, 2026-11-15: "the salad bowels look really empty") a handful is a good many pieces, drawn big in the bowl, the greens
// a bed of leaves across its bottom; the dishes heaped full
const SALAD_LEAFY = new Set(["lettuce", "spinach"]), SALAD_MAX = 520, SALAD_BITES = 32;
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
// (ticket 753, Matthew 2026-11-15: "I was thinking for the salad, we'd do some kind of
// https://en.wikipedia.org/wiki/Z-order_curve") The salad is eaten along a Z-order curve. The square around it is cut into
// a grid of little patches, put in Z-order (Morton order: a patch's number is its column's and its row's binary digits
// interleaved, so the curve runs a Z in each quarter, and the quarters themselves in a Z: top left, top right, bottom
// left, bottom right). (Ticket 755, Matthew: "Let's make the Z order at least 2 levels deeper, so it takes dozens of
// bites to finish a salad. More realisitic." So 64 by 64 patches, six levels, and 32 bites, each about a forkful.) Each
// patch weighs as much salad as its disc takes (of the salad's circle, SALAD_EAT_BODY); the bites cut the curve into runs
// of equal weight, so each bite takes the same amount (ticket 752). What is eaten is always the curve's beginning, and a
// patch comes after the patches left of it and above it, so the eaten part grows from the top left with no holes.
// Drawn, each eaten patch is a disc a little bigger than it, each a little different, so the eaten edge is ragged.
// (Worked out the first time it is wanted, not as the page loads.)
const SALAD_EAT_BODY = [0, -4, 34], SALAD_Z_LEVELS = 6;
let saladZMemo = null;
function saladZ() {
  if (saladZMemo) return saladZMemo;
  const L = SALAD_Z_LEVELS, N = 1 << L, H = 38, cs = 2 * H / N, [bx, by, br] = SALAD_EAT_BODY, cells = [], at = new Int32Array(N * N);
  for (let i = 0; i < N * N; i++) {
    let x = 0, y = 0;
    for (let b = 0; b < L; b++) { x |= ((i >> (2 * b)) & 1) << b; y |= ((i >> (2 * b + 1)) & 1) << b; }
    // (its disc 0.85 to 1.25 times the patch: past its corners, and never past its neighbours')
    cells.push({ gx: x, gy: y, x: bx - H + (x + 0.5) * cs, y: by - H + (y + 0.5) * cs, r: cs * (0.85 + 0.4 * (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296), w: 0 });
    at[y * N + x] = i;
  }
  // (a patch's weight: the salad its disc takes that no earlier patch's took, from points 0.3 of a unit apart over the
  // salad's circle, each counted for the first patch along the curve whose disc covers it: so it is even as drawn)
  for (let px = bx - br; px <= bx + br; px += 0.3) for (let py = by - br; py <= by + br; py += 0.3) {
    if ((px - bx) ** 2 + (py - by) ** 2 > br * br) continue;
    const gx = Math.floor((px - bx + H) / cs), gy = Math.floor((py - by + H) / cs);
    let first = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const x = gx + dx, y = gy + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = at[y * N + x], c = cells[i]; if (i < first && (c.x - px) ** 2 + (c.y - py) ** 2 <= c.r * c.r) first = i; }
    if (first < Infinity) cells[first].w++;
  }
  // (ends[k]: the last patch eaten after k bites)
  const total = cells.reduce((s, c) => s + c.w, 0), ends = [-1];
  let acc = 0, k = 1;
  cells.forEach((c, i) => { acc += c.w; while (k <= SALAD_BITES && acc >= total * k / SALAD_BITES - 1e-9) { ends.push(i); k++; } });
  return saladZMemo = { cells, at, ends, N, cs, H, total };
}
// what is in the bowl, with the bites taken out of it: the curve's first patches, to the end of the last bite. (Drawn as
// the biggest aligned squares the curve's beginning is made of, at most three of each size, and the discs of only the
// eaten patches at its edge, beside one not eaten: the others' discs are inside the squares already. So a few hundred
// shapes at most, not thousands. The squares overlap a hair, so no seam shows between them.)
function saladEatenSvg(u, inner) {
  if (!salad.taken) return inner;
  const { cells, at, ends, N, cs, H } = saladZ(), e = ends[salad.taken], [bx, by] = SALAD_EAT_BODY, M = (H + cs) * u, pad = 0.15;
  let holes = "";
  for (let i = 0; i <= e; ) {
    let n = 1; while (i % (n * 4) === 0 && i + n * 4 <= e + 1) n *= 4;
    const c = cells[i], side = Math.sqrt(n) * cs;
    holes += `<rect x="${f1((c.x - cs / 2 - pad) * u)}" y="${f1((c.y - cs / 2 - pad) * u)}" width="${f1((side + 2 * pad) * u)}" height="${f1((side + 2 * pad) * u)}" fill="#000000"/>`;
    i += n;
  }
  for (let i = 0; i <= e; i++) {
    const c = cells[i]; let edge = false;
    for (let dx = -1; dx <= 1 && !edge; dx++) for (let dy = -1; dy <= 1; dy++) { const x = c.gx + dx, y = c.gy + dy;
      if (x >= 0 && y >= 0 && x < N && y < N && at[y * N + x] > e) { edge = true; break; } }
    if (edge && Math.hypot(c.x - bx, c.y - by) < H + cs) holes += `<circle cx="${f1(c.x * u)}" cy="${f1(c.y * u)}" r="${f1(c.r * u)}" fill="#000000"/>`;
  }
  return `<mask id="meal-bites-salad" maskUnits="userSpaceOnUse" x="${f1(bx * u - M)}" y="${f1(by * u - M)}" width="${f1(2 * M)}" height="${f1(2 * M)}">` +
    `<rect x="${f1(bx * u - M)}" y="${f1(by * u - M)}" width="${f1(2 * M)}" height="${f1(2 * M)}" fill="#ffffff"/>${holes}</mask><g mask="url(#meal-bites-salad)">${inner}</g>`;
}
// (ticket 751, Matthew 2026-11-15: "during 'eat it' --- can we animate the fork moving towards/around the edge of the
// eating edge? for salad") Eating, the fork's tines trace the next bite along the curve, to and fro: a point for each
// group of sixteen of its patches (the curve two sizes up, so it shows as Z's), in the curve's order; at each bite it
// pokes in.
// Eaten up, it rests at the bowl's side. (Its tracing and its poke start when it is drawn: saladDraw begins each
// [data-begin-now] animation, as SMIL put in later would otherwise count from the page's start.)
function saladForkSvg(u, eaten) {
  const fork = `<g stroke-linecap="round"><line x1="${f1(-2 * u)}" y1="0" x2="${f1(-24 * u)}" y2="0" stroke="#9aa3ab" stroke-width="${f1(1.8 * u)}"/>` +
    `<path d="M${mealXY(-3 * u, -2 * u)} H${f1(-1 * u)} V${f1(2 * u)} H${f1(-3 * u)}" fill="none" stroke="#9aa3ab" stroke-width="${f1(1 * u)}"/>` +
    [-1.5, -0.5, 0.5, 1.5].map(d => `<line x1="${f1(-1 * u)}" y1="${f1(d * u)}" x2="${f1(5 * u)}" y2="${f1(d * u)}" stroke="#9aa3ab" stroke-width="${f1(0.7 * u)}"/>`).join("") + `</g>`;
  if (eaten) return `<g transform="translate(${f1(44 * u)} ${f1(30 * u)}) rotate(-130)">${fork}</g>`;
  const { cells, ends } = saladZ(), pts = [];
  for (let i = ends[salad.taken] + 1; i <= ends[salad.taken + 1]; i++) { const c = cells[i], p = pts[pts.length - 1];
    if (!c.w) continue;
    if (p && p.g === i >> 4) { p.x += c.x * c.w; p.y += c.y * c.w; p.w += c.w; } else pts.push({ g: i >> 4, x: c.x * c.w, y: c.y * c.w, w: c.w }); }
  const P = pts.map(p => mealXY(p.x / p.w * u, p.y / p.w * u)), path = "M" + P.join(" L") + (P.length < 2 ? ` l${f1(0.5 * u)} 0` : "");
  // (the fork's tips on the curve, a little turned, as held from the bowl's near side; its poke along its own length)
  return `<g pointer-events="none"><g><animateMotion data-begin-now="1" path="${path}" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" dur="${Math.max(2.4, 0.55 * P.length).toFixed(2)}s" begin="indefinite" repeatCount="indefinite"/>` +
    `<g transform="rotate(-24)"><g><animateTransform data-begin-now="1" attributeName="transform" type="translate" values="${f1(-6 * u)} 0;${f1(2 * u)} 0;0 0" keyTimes="0;0.55;1" dur="0.45s" begin="indefinite" fill="freeze"/>` +
    `<g transform="translate(${f1(-5 * u)} 0)">${fork}</g></g></g></g></g>`;
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
  // the big wooden bowl, and what is in it; dressing over it; eaten along the Z-order curve (the bowl left)
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
    (eaten ? "" : saladEatenSvg(u, inside)) + `</g>` +
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
  if (!saladZMemo && typeof requestIdleCallback === "function") requestIdleCallback(() => saladZ());   // (ticket 755: the curve worked out while the bowl is filled, not at the first bite)
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
    salad.taken++; mealCrunch("salad");
    salad.say = { text: salad.taken < SALAD_BITES ? ["crunch!", "nom!", "yum!", "munch!"][salad.taken % 4] : "all eaten! 😋", at: performance.now() };
    saladDraw();
  }
}, true);
document.addEventListener("keydown", e => {
  if (!salad || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
  e.preventDefault(); e.stopPropagation();
  if (e.key === "Escape") saladEnd();
}, true);
