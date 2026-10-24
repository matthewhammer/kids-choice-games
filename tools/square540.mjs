// MEASURING ONLY (ticket 540): the Square rule with the square's things held in two maps (Square.held: by place, and the trap
// doors by uid), against the rule as shipped (Square.on_event, the things passed with every pull), in Hazel's JS library, per
// number of things T: median ms a pull, answers checked.
//   node --stack-size=8000 tools/square540.mjs <hazel-lib.js> <25-scripting.js> <sizes> <out.json>
// First a check, before any timing: on squares of random levers and trap doors (random uids, some shared, levers working
// random uids, some missing, some repeated, plain and boulder levers, on and off), the held rule and the shipped rule give the
// same answer for every thing pulled.
import fs from "node:fs"; import vm from "node:vm"; import { createRequire } from "node:module";
const [LIB, SCRIPTING, SIZES, OUT] = process.argv.slice(2);
globalThis.require = createRequire(import.meta.url);
vm.runInThisContext(fs.readFileSync(LIB, "utf8"), { filename: "hazel-lib.js" });
const H = globalThis.Hazel;
const stub = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => "" : stub(), apply: () => stub() });
const page = { console, Math, JSON, Array, Object, String, Number, Boolean, Map, Set, WeakMap, WeakSet, Promise, RegExp, Error, Symbol,
  URLSearchParams, location: { search: "", href: "http://localhost/" }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  clearInterval() {}, performance, requestAnimationFrame: () => 0, localStorage: { getItem: () => null, setItem() {} },
  document: { head: { append() {} }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: () => stub(), body: { classList: { contains: () => false, toggle() {} }, append() {} }, addEventListener() {} },
  addEventListener() {}, state: { scripts: { on: false, common: null, rooms: {} }, background: {} } };
page.window = page; page.Hazel = H; vm.createContext(page);
vm.runInContext(fs.readFileSync(SCRIPTING, "utf8") + `;globalThis.__S={SCRIPT_PREAMBLE,SCRIPT_COMMON,SCRIPT_SQUARE,none:scriptNoGlobals(),
  tg:scriptTypedGlobals,te:scriptTypedEvent,uc:scriptUntypedCmd};`, page);
const S = page.__S, body = t => t.replace(/;\s*$/, "").trim();
const prog = [S.SCRIPT_PREAMBLE, `module Common = {\n${body(S.SCRIPT_COMMON)}\n} in`, `module Square = {\n${body(S.SCRIPT_SQUARE)}\n} in`,
  `(on_event = Square.on_event, held = Square.held)`].join("\n");
let t0 = performance.now();
const r = H.run(prog);
if (r.errors && r.errors.length) { console.error(JSON.stringify(r.errors).slice(0, 3000)); process.exit(1); }
const run_ms = +(performance.now() - t0).toFixed(1);
const V = r.value;
const ev = i => S.te({ tag: "PullThing", value: i });
const globals = things => S.tg({ ...S.none, things });
const shipped = (things, i) => JSON.stringify(S.uc(V.on_event(globals(things), ev(i))));
const call = (f, things, i) => JSON.stringify(S.uc(f(globals(things), ev(i))));

let seed = 540; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
// a square of T things, levers and trap doors mixed, as the game gives them (at: its place in the list, in order)
function square(T, uids) {
  const things = [];
  for (let at = 0; at < T; at++) {
    if (rnd() < 0.4) things.push({ at, uid: "L" + at, kind: "lever", on: rnd() < 0.5, works: Array.from({ length: Math.floor(rnd() * 4) }, () => pick(uids)),
      does: rnd() < 0.3 ? "boulder" : "", open: false, boulder: false });
    else things.push({ at, uid: pick(uids), kind: "trapdoor", on: false, works: [], does: "", open: rnd() < 0.5, boulder: rnd() < 0.5 });
  }
  return things;
}
{
  let cases = 0, moving = 0;
  for (let k = 0; k < 12; k++) {
    const T = 3 + Math.floor(rnd() * 30), uids = Array.from({ length: 2 + Math.floor(rnd() * 10) }, (_, j) => "d" + j + (rnd() < 0.3 ? "Z" : "a"));
    uids.push("missing");
    const things = square(T, uids), held = V.held(things);
    for (const t of things) {
      const a = shipped(things, t.at), b = call(held, [], t.at);
      if (a !== b) { console.error(`check: square ${k}, pull at ${t.at}: shipped ${a}, held ${b}`); process.exit(1); }
      cases++; if (a !== '{"tag":"Done"}') moving++;
    }
    const a = shipped(things, T + 5), b = call(held, [], T + 5); if (a !== b) { console.error("check: a missing place", a, b); process.exit(1); }
  }
  console.log(JSON.stringify({ check: "held rule = shipped rule", cases, of_them_moving: moving, run_ms }));
}

const q = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
const time = (f, R) => { for (let i = 0; i < 3; i++) f(); const t = []; const t00 = performance.now();
  for (let i = 0; i < R; i++) { const a = performance.now(); f(); t.push(performance.now() - a); if (performance.now() - t00 > 2500 && i >= 8) break; }
  return +q(t).toFixed(4); };
const rows = [];
for (const T of SIZES.split(",").map(Number)) {
  // T things: one lever at place 0 working W = 3 uids, the rest trap doors with uids d0..d(T-2), every one distinct, so the
  // lever's three doors sit at the end of the list (the shipped rule walks all T for each)
  const things = [{ at: 0, uid: "lever", kind: "lever", on: false, works: ["d" + (T - 2), "d" + (T - 3), "d" + (T - 4)], does: "", open: false, boulder: false }];
  for (let at = 1; at < T; at++) things.push({ at, uid: "d" + (at - 1), kind: "trapdoor", on: false, works: [], does: "", open: false, boulder: false });
  const setups = []; let held;
  for (let i = 0; i < 3; i++) { const a = performance.now(); held = V.held(things); setups.push(performance.now() - a); }
  const want = shipped(things, 0);
  if (call(held, [], 0) !== want) { console.error("timing check", T, call(held, [], 0), want); process.exit(1); }
  const g = globals(things), small = globals([]), e = ev(0);
  const R = T >= 256 ? 20 : 60;
  const row = { T, held_setup: +q(setups).toFixed(2), passed: time(() => V.on_event(g, e), R), held: time(() => held(small, e), R) };
  console.log(JSON.stringify(row)); rows.push(row);
}
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
