// Before a release, with check_script.py (2026-10-17, after 0.0.140 stopped while loading: a const read before its
// line, which node --check cannot see): run the page's script parts in order in node, the page stood in by a stub that
// answers anything, and report an error thrown while loading. Not a browser: only load-time errors mean anything.
//   node tools/check_load.mjs dress-up/index.html
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
const page = process.argv[2], base = path.dirname(page), html = fs.readFileSync(page, "utf8");
const parts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]).filter(p => !/^https?:/.test(p));   // (ticket 296: the nav bar's script is not a part)
const stub = () => { const f = function () { return P; }; const P = new Proxy(f, {
  get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : P,
  set: () => true, apply: () => P, construct: () => P, has: () => true }); return P; };
const S = stub();
const ctx = { console, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, Promise, RegExp, Error, Symbol, Proxy, Reflect, Intl,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone, setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, performance: { now: () => 0 }, document: S, navigator: S, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: S, history: S, matchMedia: () => ({ matches: false, addEventListener() {} }), getComputedStyle: () => S, fetch: () => new Promise(() => {}), Image: function () { return S; },
  DOMPoint: function () { return S; }, AudioContext: function () { return S; }, ResizeObserver: function () { return S; }, MutationObserver: function () { return S; }, CSS: S, screen: S, devicePixelRatio: 1 };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.addEventListener = () => {}; ctx.removeEventListener = () => {}; ctx.dispatchEvent = () => true; ctx.innerWidth = 1600; ctx.innerHeight = 1000;
vm.createContext(ctx);
const src = parts.map(p => fs.readFileSync(path.join(base, p), "utf8")).join("\n;\n");
try { vm.runInContext(src, ctx, { filename: "joined.js" }); console.log(`loaded ${parts.length} parts: no error while loading`); }
catch (e) { const ln = (e.stack || "").match(/joined\.js:(\d+)/); let where = "";
  if (ln) { let n = +ln[1]; for (const p of parts) { const c = fs.readFileSync(path.join(base, p), "utf8").split("\n").length + 2; if (n <= c) { where = `${p}:${n}`; break; } n -= c; } }
  console.log(`ERROR while loading: ${e.constructor.name}: ${e.message} at ${where}`); process.exit(1); }
