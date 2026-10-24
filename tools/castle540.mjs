// MEASURING ONLY (ticket 540): the Castle rule with what it reads of the castle held (Castle.held: its dungeons, its trap room, its
// count, the exits by room number), against the rule as shipped (Castle.on_event, the rooms and exits passed with every event),
// in Hazel's JS library, per number of rooms R: median ms an event, answers checked.
//   node --stack-size=8000 tools/castle540.mjs <hazel-lib.js> <25-scripting.js> <sizes> <out.json>
// First a check, before any timing: on random castles (any rooms, with or without dungeons and a trap room, any exits, every
// way-out setting), the held rule and the shipped rule give the same answer for both pits and every room's way out.
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
vm.runInContext(fs.readFileSync(SCRIPTING, "utf8") + `;globalThis.__S={SCRIPT_PREAMBLE,SCRIPT_COMMON,SCRIPT_CASTLE,none:scriptNoGlobals(),
  tg:scriptTypedGlobals,te:scriptTypedEvent,uc:scriptUntypedCmd};`, page);
const S = page.__S, body = t => t.replace(/;\s*$/, "").trim();
const prog = [S.SCRIPT_PREAMBLE, `module Common = {\n${body(S.SCRIPT_COMMON)}\n} in`, `module Castle = {\n${body(S.SCRIPT_CASTLE)}\n} in`,
  `(on_event = Castle.on_event, held = Castle.held)`].join("\n");
let t0 = performance.now();
const r = H.run(prog);
if (r.errors && r.errors.length) { console.error(JSON.stringify(r.errors).slice(0, 3000)); process.exit(1); }
const run_ms = +(performance.now() - t0).toFixed(1);
const V = r.value;
const globals = (rooms, exits, out, out_room) => S.tg({ ...S.none, rooms, exits, out, out_room });
const answer = (f, g, e) => JSON.stringify(S.uc(f(g, e)));

let seed = 540; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const KINDS = ["king", "greenhouse", "trap", "dungeon1", "dungeon2", "hallway", "catroom", "stable", "dining", "kitchen", "smithy", "spiral"];
const EXITS = ["side", "long", "spiral", "trap", "ladder", "all", "hall"];
const OUTS = [["auto", -1], ["out", -1], ["none", -1]];
{
  let cases = 0;
  for (let k = 0; k < 40; k++) {
    const R = 1 + Math.floor(rnd() * 12), rooms = Array.from({ length: R }, () => pick(KINDS)), exits = Array.from({ length: R }, () => pick(EXITS));
    const typed = S.tg({ ...S.none, rooms, exits }), held = V.held(typed.rooms, typed.exits);
    const outs = [...OUTS, ["3", 3], ["1", 1], [String(R + 2), R + 2], ["0", 0]];
    for (const [out, out_room] of outs) {
      const g = globals(rooms, exits, out, out_room), small = globals([], [], out, out_room);
      const evs = [{ tag: "FallPit", value: 0 }, { tag: "FallPit", value: 1 }, ...Array.from({ length: R + 1 }, (_, n) => ({ tag: "WayOut", value: n + 1 }))];
      for (const e of evs) {
        const a = answer(V.on_event, g, e), b = answer(held, small, e);
        if (a !== b) { console.error(`check: castle ${k} ${JSON.stringify(rooms)} ${JSON.stringify(exits)} out ${out}, ${JSON.stringify(e)}: shipped ${a}, held ${b}`); process.exit(1); }
        cases++;
      }
    }
  }
  console.log(JSON.stringify({ check: "held rule = shipped rule", cases, run_ms }));
}

const q = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
const time = (f, R) => { for (let i = 0; i < 3; i++) f(); const t = []; const t00 = performance.now();
  for (let i = 0; i < R; i++) { const a = performance.now(); f(); t.push(performance.now() - a); if (performance.now() - t00 > 2500 && i >= 8) break; }
  return +q(t).toFixed(4); };
const rows = [];
for (const R of SIZES.split(",").map(Number)) {
  // R rooms, the dungeons and the trap room last (the shipped rule's room_at walks them all), each room's exit a ladder; the
  // way out from the last room, Auto
  const rooms = [...Array.from({ length: R - 3 }, (_, i) => i % 2 ? "hallway" : "kitchen"), "trap", "dungeon1", "dungeon2"];
  const exits = rooms.map(() => "ladder");
  const typed = S.tg({ ...S.none, rooms, exits });
  const setups = []; let held;
  for (let i = 0; i < 3; i++) { const a = performance.now(); held = V.held(typed.rooms, typed.exits); setups.push(performance.now() - a); }
  const g = S.tg({ ...S.none, rooms, exits, out: "auto", out_room: -1 }), small = S.tg({ ...S.none, out: "auto", out_room: -1 });
  const pit = { tag: "FallPit", value: 0 }, way = { tag: "WayOut", value: R };
  for (const e of [pit, way]) if (answer(V.on_event, g, e) !== answer(held, small, e)) { console.error("timing check", R, JSON.stringify(e)); process.exit(1); }
  const N = R >= 128 ? 20 : 60;
  const row = { R, held_setup: +q(setups).toFixed(2), pit_passed: time(() => V.on_event(g, pit), N), pit_held: time(() => held(small, pit), N),
    way_passed: time(() => V.on_event(g, way), N), way_held: time(() => held(small, way), N) };
  console.log(JSON.stringify(row)); rows.push(row);
}
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
