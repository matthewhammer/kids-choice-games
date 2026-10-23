// Walk TABS (and SHOWN_WHEN at the defaults) of a copy of the game, loaded as tools/check_load.mjs loads it: in node, the page a stub.
//   node count_tabs.mjs <dir with index.html and js/>
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
const base = process.argv[2], html = fs.readFileSync(path.join(base, "index.html"), "utf8");
const parts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]).filter(p => !/^https?:/.test(p));
const stub = () => { const f = function () { return P; }; const P = new Proxy(f, {
  get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : P,
  set: () => true, apply: () => P, construct: () => P, has: () => true }); return P; };
const S = stub();
const ctx = { console: { log() {}, warn() {}, error() {}, assert() {}, info() {}, debug() {} }, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, Promise, RegExp, Error, Symbol, Proxy, Reflect, Intl,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone, setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, performance: { now: () => 0 }, document: S, navigator: S, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: S, history: S, matchMedia: () => ({ matches: false, addEventListener() {} }), getComputedStyle: () => S, fetch: () => new Promise(() => {}), Image: function () { return S; },
  DOMPoint: function () { return S; }, AudioContext: function () { return S; }, ResizeObserver: function () { return S; }, MutationObserver: function () { return S; }, CSS: S, screen: S, devicePixelRatio: 1,
  queueMicrotask: () => {} };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.addEventListener = () => {}; ctx.removeEventListener = () => {}; ctx.dispatchEvent = () => true; ctx.innerWidth = 1600; ctx.innerHeight = 1000;
vm.createContext(ctx);
const src = parts.map(p => fs.readFileSync(path.join(base, p), "utf8")).join("\n;\n");
vm.runInContext(src, ctx, { filename: "joined.js" });
const out = vm.runInContext(`(() => {
  const fresh = () => JSON.parse(JSON.stringify(DEFAULTS));
  const ok = (f, b) => { try { return !!f(b); } catch (e) { return true; } };
  // a row's leaves: groups expanded, "of" unwrapped (its own part), its show-when and its group's
  function walk(part, row, acc, visible, depth) {
    if (!Array.isArray(row)) return;
    const [kind, key] = row;
    if (kind === "of") { const inner = row[2], when = row[3]; const vis = visible && (!when || ok(when, state[part]));
      // (control(): an "of" row's own when replaces SHOWN_WHEN; with none, no show-when at all, except a group's own)
      if (inner[0] === "group") return walk(key, inner, acc, vis, depth);
      acc.rows.push({ part: key, kind: inner[0], key: inner[1], shown: vis && (when ? true : true), of: true, opts: optCount(inner), label: typeof inner[2] === "string" ? inner[2] : "" }); acc.kinds[inner[0]] = (acc.kinds[inner[0]] || 0) + 1; return; }
    if (kind === "group") { acc.groups++; acc.maxDepth = Math.max(acc.maxDepth, depth + 1);
      const w = SHOWN_WHEN[part + "." + key], vis = visible && (!w || ok(w, state[part]));
      if (vis) acc.groupsShown++;
      for (const r of row[3]) walk(part, r, acc, vis, depth + 1); return; }
    const w = SHOWN_WHEN[part + "." + key];
    const vis = visible && (!w || ok(w, state[part]));
    acc.rows.push({ part, kind, key, shown: vis, opts: optCount(row), label: typeof row[2] === "string" ? row[2] : "" });
    acc.kinds[kind] = (acc.kinds[kind] || 0) + 1;
  }
  function optCount(row) { const [kind] = row; if (kind === "choice" || kind === "color" || kind === "places") { const o = row[3]; return Array.isArray(o) ? o.length : 0; }
    if (kind === "flip" || kind === "toggle" || kind === "action") return 1; if (kind === "every") return Array.isArray(row[3]) ? row[3].length : 0; return 0; }
  function tabCount(t) { const [name, part, rows] = t, acc = { name, part, rows: [], kinds: {}, groups: 0, groupsShown: 0, maxDepth: 0, top: rows.length };
    for (const r of rows) walk(part, r, acc, true, 0);
    return { name, part, top: acc.top, declared: acc.rows.length, groups: acc.groups, groupsShown: acc.groupsShown, depth: acc.maxDepth, shown: acc.rows.filter(r => r.shown).length,
      kinds: acc.kinds, chipsDeclared: acc.rows.reduce((s, r) => s + r.opts, 0), chipsShown: acc.rows.filter(r => r.shown).reduce((s, r) => s + r.opts, 0),
      bigChoices: acc.rows.filter(r => (r.kind === "choice" || r.kind === "places") && r.opts >= 8).map(r => [r.key, r.label, r.opts, r.shown]),
      keys: acc.rows.map(r => r.key) }; }
  state = fresh(); if (state.world) state.world.at = null;
  const tabs = TABS.map(tabCount);
  // the Background tab in each place, everything else at its defaults
  const bgTab = TABS.find(t => t[1] === "background"), places = PLACES.map(p => p[0]).filter(v => v !== "none");
  const perPlace = places.map(v => { state = fresh(); state.background.kind = v; const c = tabCount(bgTab); return [v, (PLACES.find(p => p[0] === v) || [])[1], c.shown, c.groupsShown, c.chipsShown]; });
  state = fresh();
  return JSON.stringify({ tabs, perPlace, places: PLACES.length - 1, placeGroups: PLACE_GROUPS.length,
    tabBoxes: typeof TAB_BOXES === "object" ? Object.fromEntries(Object.entries(TAB_BOXES).map(([k, v]) => [k, v.map(b => [b[0], b[1].length])])) : null,
    designers: typeof DESIGNERS === "object" ? Object.keys(DESIGNERS) : null });
})()`, ctx);
process.stdout.write(out);
