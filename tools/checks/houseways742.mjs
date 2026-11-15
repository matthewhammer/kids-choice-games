// (ticket 742, Matthew 2026-11-15: "let's also ensure that the rooms of the house each have: a way to reach them; a way to
// leave them that reverses that passageway") Every room of the house, outside included: its ways out (its arrows,
// insideWays; its doors, doorways and stairs, the portals its scene draws), each room reached from outside, and each way
// with its way back. No browser: the game's parts run in node, as tools/same_friend.mjs runs them (its loader, copied).
// Given the usual arguments (a browser's port, the page's address), it reads the page from this checkout instead.
//   node tools/checks/houseways742.mjs        (exit 1 when a room is unreached or a way has no way back)
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
let seed = 1;
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


const page = new URL("../../dress-up/index.html", import.meta.url).pathname;
const G = load(page);
vm.runInContext(`globalThis.DOMParser = class { parseFromString() { return { documentElement: document.createElementNS("x", "g") }; } };`, G.ctx);
const R = JSON.parse(vm.runInContext(`JSON.stringify((() => {
  const rooms = ["house", ...INSIDES.house], ways = {};
  for (const kind of rooms) {
    const B = { ...clone(DEFAULTS.background), kind };
    const arrows = INSIDE_KINDS.has(kind) ? insideWays(B).map(w => ({ to: w.to, how: "arrow " + w.d })) : [];
    const svg = backgroundSvg(kind, SCENE.left, SCENE.top, -SCENE.left, SCENE.bottom, SCENE.ground, B, true);
    const doors = [...svg.matchAll(/<g class="portal"([^>]*)>/g)].map(m => { const a = m[1], to = (a.match(/data-to="([a-z]+)"/) || [])[1];
      return { to, how: /data-climb/.test(a) ? "stairs up" : /data-descend/.test(a) ? "stairs down" : /data-way="([A-Z]+)"/.test(a) ? "doorway " + a.match(/data-way="([A-Z]+)"/)[1] : "door" }; })
      .filter(d => rooms.includes(d.to) && d.to !== kind);
    ways[kind] = [...arrows, ...doors];
  }
  const seen = new Set(["house"]), q = ["house"];
  while (q.length) { const a = q.shift(); for (const w of ways[a]) if (!seen.has(w.to)) { seen.add(w.to); q.push(w.to); } }
  const missing = [];
  for (const a of rooms) for (const w of ways[a]) if (!ways[w.to].some(v => v.to === a)) missing.push(a + " -> " + w.to + " (" + w.how + ")");
  return { ways, unreached: rooms.filter(r => !seen.has(r)), missing };
})())`, G.ctx));
for (const [kind, ws] of Object.entries(R.ways)) console.log(kind.padEnd(11) + " -> " + ws.map(w => w.to + " (" + w.how + ")").join(", "));
console.log("not reached from outside: " + (R.unreached.join(", ") || "none"));
console.log("ways with no way back: " + (R.missing.join(", ") || "none"));
const ok = !R.unreached.length && !R.missing.length;
console.log(ok ? "houseways742: ok" : "houseways742: FAILED");
process.exit(ok ? 0 : 1);
