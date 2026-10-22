// (ticket 564) The friend drawn the same on two copies of the page, without a browser: a refactor's proof that nothing
// changed. Each page's 26 parts run in a node vm of their own, the page a stub, as tools/check_load.mjs runs them; the
// text drawNow writes into the picture it makes (js/18-drawing.js: `fresh.innerHTML = svg`) is caught by a document whose
// createElementNS("svg") keeps it. The same cases are drawn on both, in the same order, and compared byte for byte:
// every costume (set as the 🐯 Costume tab sets it, through set()) facing toward us, to our left and right, away, turned
// partway, in every pose and animation; every choice, toggle and colour of the 🐯 Costume tab shown for that costume,
// one at a time, in three views; each thing a hand holds, in each hand; the horse led and ridden; and, as the ninja's gem
// is drawn by shared code, every gem kind by every shape by every mix of its three lights, in six views, on three heads.
// Math.random is seeded the same before each case on both sides (a dance picks its moves by chance), and the picture's
// clock is 0 (performance.now), so a page drawn twice gives the same text: run it with one page twice to see the noise
// floor (it is 0).
//   node tools/same_friend.mjs <old>/dress-up/index.html <new>/dress-up/index.html [--only <word>] [--save <dir>] [--json <file>]
// --only keeps the cases whose name has the word; --save writes each differing case's two drawings (and, with --all, every
// case's new drawing) into dir; --json writes the summary. Exit 1 when any case differs or throws on one side only.
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import crypto from "node:crypto";
const args = process.argv.slice(2), flag = k => { const i = args.indexOf(k); return i < 0 ? null : args.splice(i, 2)[1]; };
const only = flag("--only"), save = flag("--save"), jsonOut = flag("--json"), all = args.includes("--all") ? (args.splice(args.indexOf("--all"), 1), true) : false;
const [pageA, pageB] = args;
if (!pageA || !pageB) { console.log("usage: node tools/same_friend.mjs <old index.html> <new index.html> [--only word] [--save dir] [--json file]"); process.exit(2); }

function load(page) {
  const base = path.dirname(page), html = fs.readFileSync(page, "utf8");
  const parts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]).filter(p => !/^https?:/.test(p));
  const stub = () => { const f = function () { return P; }; const P = new Proxy(f, {
    get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : P,
    set: () => true, apply: () => P, construct: () => P, has: () => true }); return P; };
  const S = stub(), box = { caught: null };
  const doc = new Proxy(S, { get: (t, k) => k === "createElementNS" ? ((ns, tag) => tag === "svg" ? new Proxy(S, {
    set: (o, kk, v) => { if (kk === "innerHTML") box.caught = v; return true; },
    get: (o, kk) => kk === "childNodes" ? [] : kk === "firstChild" ? null : S[kk] }) : S) : S[k] });
  // (a seeded Math.random, reseeded before each case: the same chances on both sides)
  let seed = 1; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const ctx = { console: Object.fromEntries(Object.keys(console).map(k => [k, () => {}])), Math: M, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, WeakSet, Promise, RegExp, Error, TypeError, Symbol, Proxy, Reflect, Intl,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone, setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0, clearInterval: () => 0,
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, requestIdleCallback: () => 0, performance: { now: () => 0 }, document: doc, navigator: S, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: S, history: S, matchMedia: () => ({ matches: false, addEventListener() {} }), getComputedStyle: () => S, fetch: () => new Promise(() => {}), Image: function () { return S; },
    DOMPoint: function () { return S; }, AudioContext: function () { return S; }, ResizeObserver: function () { return S; }, MutationObserver: function () { return S; }, CSS: S, screen: S, devicePixelRatio: 1 };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.addEventListener = () => {}; ctx.removeEventListener = () => {}; ctx.dispatchEvent = () => true; ctx.innerWidth = 1600; ctx.innerHeight = 1000;
  vm.createContext(ctx);
  vm.runInContext(parts.map(p => fs.readFileSync(path.join(base, p), "utf8")).join("\n;\n"), ctx, { filename: page });
  // a case: the defaults, then each [part, key, value] through set() as the tabs set it, then one drawing, caught
  vm.runInContext(`globalThis.__case = steps => { state = clone(DEFAULTS); state.music.mute = true; climb = null;
    for (const [p, k, v] of steps) set(p, k, v); __mark(); drawNow(); }`, ctx);
  ctx.__mark = () => { box.caught = null; };
  return { ctx, draw(steps) { seed = 1; box.caught = null; vm.runInContext(`__case(${JSON.stringify(steps)})`, ctx); return box.caught; } };
}

const A = load(pageA), B = pageA === pageB ? load(pageB) : load(pageB);
// THE CASES, made from the first page's own tables (its tabs, show-when rules and held things), so both draw the same list
const plan = JSON.parse(vm.runInContext(`(() => {
  const tab = part => TABS.find(t => t[1] === part)[2];
  const rows = (list, here = null) => list.flatMap(r => r[0] === "group" ? rows(r[3], r[4] || here) : [[r, here]]);
  const kinds = tab("costume").find(r => r[1] === "kind")[3].map(o => o[0]);
  const VIEWS = [["front", ""], ["left", ""], ["right", ""], ["back", ""], ["front", "left"], ["front", "right"]];
  const view = ([f, t]) => [["body", "facing", f], ...(t ? [["body", "turn", t]] : [])];
  const out = [], add = (name, steps) => out.push([name, steps]);
  const poses = tab("body").find(r => r[1] === "pose")[3].map(o => o[0]), anims = ANIMS.map(a => a[0]);
  for (const k of kinds) {
    const on = [["costume", "kind", k]];
    for (const v of VIEWS) for (const p of poses) add(k + " · " + p + " · " + v.join(""), [...on, ["body", "pose", p], ...view(v)]);
    for (const a of anims) for (const f of ["front", "left", "back"]) add(k + " · anim " + a + " · " + f, [...on, ["body", "facing", f], ["body", "anim", a]]);
    // the costume tab's rows shown for this costume, each value in turn
    const C = { ...DEFAULTS.costume, kind: k };
    for (const [r, here] of rows(tab("costume"))) {
      const [what, key] = r; if (key === "kind" || !["choice", "toggle", "color", "range"].includes(what)) continue;
      const rule = SHOWN_WHEN["costume." + key]; if ((rule && !rule(C)) || (here && !here(C))) continue;
      const vals = what === "toggle" ? [!DEFAULTS.costume[key]] : what === "range" ? [r[3], r[4]] : what === "color" ? r[3] : r[3].map(o => o[0]);
      for (const val of vals) for (const f of ["front", "left", "back"]) add(k + " · " + key + "=" + val + " · " + f, [...on, ["costume", key, val], ["body", "facing", f]]);
    }
    // each thing a hand holds, in each hand, toward us and in profile
    for (const id of Object.keys(HOLDABLES)) for (const hk of ["holdR", "holdL"]) for (const f of ["front", "right"]) add(k + " · " + hk + "=" + id + " · " + f, [...on, ["body", hk, id], ["body", "facing", f]]);
    for (const h of ["lead", "ride"]) for (const f of ["front", "left", "back"]) add(k + " · horse " + h + " · " + f, [...on, ["body", "horse", h], ["body", "facing", f]]);
  }
  // the ninja's gem: every kind by every shape by every mix of its lights, in six views, on three heads
  const opts = key => tab("costume").find(r => r[1] === key)[3].map(o => o[0]);
  const heads = [[], [["face", "faceH", 130]], [["face", "alien", 100]]].filter(h => !h.length || DEFAULTS.face[h[0][1]] !== undefined);
  for (const g of opts("ninjaGem")) for (const s of opts("ninjaGemShape")) for (let fx = 0; fx < 8; fx++) for (const v of VIEWS) for (const [hi, h] of heads.entries())
    add("ninja gem " + g + " " + s + " fx" + fx + " · " + v.join("") + " · head" + hi, [["costume", "kind", "ninja"], ["costume", "ninjaGem", g], ["costume", "ninjaGemShape", s],
      ["costume", "ninjaGlimmer", !!(fx & 1)], ["costume", "ninjaGemStars", !!(fx & 2)], ["costume", "ninjaGemShine", !!(fx & 4)], ...h, ...view(v)]);
  return JSON.stringify(out);
})()`, A.ctx)).filter(([name]) => !only || name.includes(only));

// THE STRUCTURE: the defaults, the costume tab's data (functions left out) and the show-when rules' names, on both
const structure = ctx => vm.runInContext(`JSON.stringify({ defaults: DEFAULTS, tabs: TABS.map(t => [t[0], t[1], JSON.stringify(t[2])]), shown: Object.keys(SHOWN_WHEN).sort() })`, ctx);
const sameStructure = structure(A.ctx) === structure(B.ctx);

const sha = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
let same = 0, differ = [], threw = [], threwBoth = [], empty = 0, chars = 0; const t0 = Date.now();
if (save) fs.mkdirSync(save, { recursive: true });
if (args.includes("--count")) { console.log(plan.length + " cases"); process.exit(0); }
const file = name => name.replace(/[^a-z0-9=.-]+/gi, "_");
for (const [name, steps] of plan) {
  let a, b, ea = null, eb = null;
  try { a = A.draw(steps); } catch (e) { ea = e.message; }
  try { b = B.draw(steps); } catch (e) { eb = e.message; }
  if (ea || eb) { if (ea !== eb) threw.push([name, ea, eb]); else threwBoth.push([name, ea]); continue; }
  if (a == null) empty++;
  if (a === b) { same++; chars += (a || "").length; if (save && all && b) fs.writeFileSync(path.join(save, file(name) + ".svg"), b); continue; }
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  differ.push([name, i, a.slice(Math.max(0, i - 60), i + 80), (b || "").slice(Math.max(0, i - 60), i + 80)]);
  if (save) { fs.writeFileSync(path.join(save, file(name) + ".old.svg"), a || ""); fs.writeFileSync(path.join(save, file(name) + ".new.svg"), b || ""); }
}
const summary = { old: pageA, new: pageB, cases: plan.length, identical: same, differ: differ.length, threwOnOneSide: threw.length, threwOnBoth: threwBoth.length, threwOnBothFirst: threwBoth.slice(0, 20), nothingDrawn: empty,
  sameStructure, charsCompared: chars, seconds: Math.round((Date.now() - t0) / 1000), firstDifferences: differ.slice(0, 20), threw: threw.slice(0, 20),
  ninjaGemCases: plan.filter(([n]) => n.startsWith("ninja gem")).length };
console.log(`${plan.length} cases: ${same} identical, ${differ.length} differ, ${threw.length} threw on one side only, ${threwBoth.length} threw the same on both, ${empty} drew nothing; ` +
  `structure (defaults, tabs, show-when rules) ${sameStructure ? "identical" : "DIFFERS"}; ${(chars / 1e6).toFixed(1)} MB of drawings compared in ${summary.seconds} s`);
for (const [n, i, x, y] of differ.slice(0, 10)) console.log(`DIFFERS ${n} at ${i}:\n  old …${x}…\n  new …${y}…`);
for (const [n, x, y] of threw.slice(0, 10)) console.log(`THREW ${n}: old ${x}; new ${y}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 1));
process.exit(differ.length || threw.length || !sameStructure ? 1 : 0);
