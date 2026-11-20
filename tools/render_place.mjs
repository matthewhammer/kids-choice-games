// (ticket 798) A place drawn without a browser, to look at: the page's parts run in a node vm as tools/same_friend.mjs runs
// them, the defaults set, then each "part.key=value" step through set() as the tabs set it, one drawNow(), and the picture's
// SVG written out (render it with ffmpeg -i out.svg out.png). The picture's clock is 0, so what moves stands still.
//   node tools/render_place.mjs dress-up/index.html out.svg background.kind=starfield [background.spacePlanet=ocean ...]
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
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

const [page, out, ...rest] = process.argv.slice(2);
if (!page || !out) { console.log("usage: node tools/render_place.mjs <index.html> <out.svg> part.key=value ..."); process.exit(2); }
const steps = rest.map(a => { const [pk, v] = a.split("="), [p, ...k] = pk.split("."); let val = v;
  if (/^-?[0-9.]+$/.test(v)) val = Number(v); else if (v === "true" || v === "false") val = v === "true"; return [p, k.join("."), val]; });
// (the scene as the stage draws it (18-drawing.js: backgroundSvg over the stage's box), its piece markers taken out, then
// the friend as drawNow drew it, over it)
const L = load(page), fig = L.draw(steps) || "";
const scene = vm.runInContext(`(() => { const B = state.background, top = SCENE.top, bottom = SCENE.bottom, left = -(bottom - top) * 0.8;
  return [left, top, -left, bottom, backgroundSvg(B.kind, left, top, -left, bottom, SCENE.ground, sceneOpts(B), true)]; })()`, L.ctx);
const [x0, y0, x1, y1, bg] = scene, body = String(bg).replace(/\u0001/g, "") + fig.replace(/^<svg[^>]*>|<\/svg>$/g, "");
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" width="1280" height="${Math.round(1280 * (y1 - y0) / (x1 - x0))}">${body}</svg>`);
console.log(`wrote ${out}: ${body.length} characters, the box ${x0},${y0} to ${x1},${y1}`);
