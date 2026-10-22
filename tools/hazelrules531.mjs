// (ticket 531) 🧩 the shipped Hazel rules against the plain JS, without a browser: js/25-scripting.js run in node with the real
// hazel-lib.js, every room's on_event given every case the game can give it, its commands compared with what the plain JS does
// in that case, and both timed. What the JS does comes from the game's own code where it can run in node: trapWiring and seeded
// (01-state.js, 10-nature.js) for the wiring, leverPull and leverPullApply (26-drags-and-start.js) for the placed levers, run
// against a stand-in square; the red, blue and hatch levers' outcomes are their JS's few lines, restated here (the browser's half,
// the real game state after the same pulls in both modes, is tools/checks/hazellogic531.mjs, on GitHub).
//   node tools/hazelrules531.mjs <hazel-lib.js> [reps]
// Prints each comparison, then per event the time of a Hazel call (globals in, commands out) against the JS's: p50, p95, in ms.
// Node's times, not a browser's: for the order of things only; the speed runs are tools/hazellogic531.mjs on GitHub.
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import { createRequire } from "node:module";
const here = path.dirname(new URL(import.meta.url).pathname), [libPath, repsArg] = process.argv.slice(2), REPS = +(repsArg || 300);
if (!libPath) { console.log("usage: node tools/hazelrules531.mjs <hazel-lib.js> [reps]"); process.exit(2); }
let bad = 0, n = 0;
const ok = (what, cond, got) => { n++; if (!cond) { console.log(`FAIL ${what}: ${JSON.stringify(got).slice(0, 600)}`); bad++; } };
const src = f => fs.readFileSync(path.join(here, "../dress-up/js", f), "utf8");
// (a top-level function of a part, by its name: its text up to the next top-level line that starts another)
const fnText = (text, name) => { const a = text.indexOf(`function ${name}(`); if (a < 0) throw new Error("no " + name); const rest = text.slice(a); const m = rest.slice(1).search(/\n(function |const |let |\/\/ \(ticket)/); return rest.slice(0, m < 0 ? undefined : m + 1); };

globalThis.require = createRequire(import.meta.url);
vm.runInThisContext(fs.readFileSync(libPath, "utf8"), { filename: "hazel-lib.js" });
const H = globalThis.Hazel;
console.log(`Hazel ${H.version}, build ${H.build}`);

// ---- the game's own code, where it runs in node ----
const game = { console, Math, JSON, Array, Object, String, Number, Boolean, Set, Map };
vm.createContext(game);
const nature = src("10-nature.js"), st = src("01-state.js"), drags = src("26-drags-and-start.js");
vm.runInContext(nature.match(/const seeded = [^\n]*\n/)[0].replace("const seeded", "var seeded"), game);
vm.runInContext(st.match(/const leverWireKey = [^\n]*\n/)[0].replace("const ", "var "), game);
vm.runInContext(fnText(st, "trapWiring"), game);
// (placed levers: leverPull's JS and leverPullApply, the square stood in; what they did is the things after, and the doors named)
let applied = null;
Object.assign(game, { state: { background: {} }, scriptEvent: () => false, hzJs: (t, f) => f(), changed() {}, turnArm() {}, lidSwing() {}, boulderFall() {}, sparkleFrom() {},
  ROCK_TONES: ["#888"], BOULDER_FALL: 1, LEVER_TILT: 1, boulderHits() {}, boulderFalling() {} });
vm.runInContext(fnText(drags, "leverPull") + "\n" + fnText(drags, "leverPullApply").replace("function leverPullApply(i, doors) {", "function leverPullApply(i, doors) { applied = doors;"), game);
Object.defineProperty(game, "applied", { get: () => applied, set: v => { applied = v; } });

// ---- the program, as the game builds it ----
const page = { console, Math, JSON, Array, Object, String, Number, Boolean, Map, Set, Promise, RegExp, Error, Symbol, location: { search: "?logic=hazel" },
  setTimeout: () => 0, clearTimeout() {}, performance, document: { head: { append() {} }, getElementById: () => null, body: { classList: { contains: () => false } } }, addEventListener() {},
  state: { scripts: { on: false, common: null, rooms: {} }, background: {} } };
page.window = page; page.Hazel = H;
vm.createContext(page);
vm.runInContext(src("25-scripting.js"), page, { filename: "25-scripting.js" });
const C = vm.runInContext("scriptCompile()", page);
ok("the shipped program (under ?logic=hazel) is ready", C.ready, [C.errors, C.unfinished]);
console.log(`compiled in ${C.ms.toFixed(1)} ms; rooms: ${Object.keys(C.handlers).join(", ")}`);
if (!C.ready) { console.log(C.errors, C.unfinished); process.exit(1); }
const flat = c => { const out = []; while (c && c.tag !== "Done") { const v = Array.isArray(c.value) ? c.value : [c.value]; out.push([c.tag, ...v.slice(0, -1)]); c = v[v.length - 1]; } return out; };
const none = vm.runInContext("scriptNoGlobals()", page);
const times = {};
const time = (key, f) => { const t = []; for (let i = 0; i < REPS; i++) { const t0 = performance.now(); f(); t.push(performance.now() - t0); } t.sort((a, b) => a - b); (times[key] = times[key] || []).push(...t); };

// ---- red levers and blue: every wiring (random by several seeds), every lever, pit and rock ----
const B = [false, true], wirings = [["normal", 1], ["reversed", 1], ...[1, 2, 3, 7, 11, 42, 999].map(s => ["random", s])];
let cases = 0;
for (const [mode, seed] of wirings) for (const lL of B) for (const lR of B) for (const on0 of B) for (const on1 of B) for (const c0 of B) for (const c1 of B) {
  const wire = game.trapWiring({ castleLeverWire1N: mode, castleLeverSeed1N: seed }, 1, "N"), r = game.seeded(seed);
  const g = { ...none, lever_L: lL, lever_R: lR, wiring: mode, draws: [r(0), r(1)], pits_on: [on0, on1], covered: [c0, c1] };
  const up = { L: lL, R: lR };
  for (const side of ["L", "R"]) {
    // (roomLeverFlip: the lever flips; each pit's open is its lever's up; a lid swings where open changed)
    const was = wire.map(w => up[w]), up2 = { ...up, [side]: !up[side] }, now = wire.map(w => up2[w]);
    const want = [["Flip", "lever_" + side], ...[0, 1].filter(j => now[j] !== was[j]).map(j => ["SetPit", j, now[j]])];
    const got = flat(C.handlers.TrapRoom(g, { tag: "Pull", value: side }));
    ok(`Pull ${side}, ${mode} ${seed}, ${JSON.stringify(g).slice(0, 80)}`, JSON.stringify(got) === JSON.stringify(want), { want, got });
    // (roomBoulderPull: its pits by the wiring and there; a rock on any, lifted, else dropped)
    const mine = [0, 1].filter(j => wire[j] === side && [on0, on1][j]), lift = mine.some(j => [c0, c1][j]);
    const wantB = mine.map(j => [lift ? "LiftBoulder" : "DropBoulder", j]);
    const gotB = flat(C.handlers.TrapRoom(g, { tag: "PullBoulder", value: side }));
    ok(`PullBoulder ${side}, ${mode} ${seed}`, JSON.stringify(gotB) === JSON.stringify(wantB), { wantB, gotB, g });
    cases += 2;
  }
}
console.log(`ok   red and blue levers: ${cases} cases, Hazel's commands as the JS does`);
// ---- hatches ----
for (const h of [0, 1, 2, 3, 4, 5, 6]) for (const shut of B) {
  const got = flat(C.handlers.TreeRoom({ ...none, hatch: shut }, { tag: "PullHatch", value: h }));
  ok(`PullHatch ${h} ${shut}`, JSON.stringify(got) === JSON.stringify([["SetHatch", h, !shut]]), got);
}
console.log("ok   hatches: 14 cases");
// ---- placed levers: squares of 1 to 40 levers and doors, the real leverPull's doors against the rule's ----
const squareOf = (k, seed) => { const r = game.seeded(seed), things = [];
  for (let j = 0; j < k; j++) things.push({ kind: "trapdoor", uid: "d" + j, open: r(j) < 0.5, boulder: r(j + 50) < 0.3 });
  for (let j = 0; j < Math.max(1, k >> 1); j++) things.push({ kind: "lever", on: r(j + 100) < 0.5, does: r(j + 150) < 0.4 ? "boulder" : "", works: things.filter((_, q) => q < k && r(q * 7 + j) < 0.4).map(t => t.uid) });
  things.push({ kind: "rock" }); return things; };
const thingsOf = T => T.flatMap((t, at) => t.kind === "lever" || t.kind === "trapdoor" ? [{ at, uid: String(t.uid || ""), kind: t.kind, on: !!t.on, works: (t.works || []).map(String), does: String(t.does || ""), open: !!t.open, boulder: !!t.boulder }] : []);
let sq = 0;
for (const k of [1, 2, 4, 8, 16, 40]) for (const seed of [1, 5, 9]) {
  const T = squareOf(k, seed);
  T.forEach((t, i) => { if (t.kind !== "lever") return;
    game.state.background = { things: structuredClone(T) }; game.applied = null; game.leverPull(i);
    const want = game.applied.map(([j, w, v]) => [w === "open" ? "OpenDoor" : "DropRock", j, v]);
    const got = flat(C.handlers.Square({ ...none, things: thingsOf(T) }, { tag: "PullThing", value: i }));
    ok(`PullThing ${i} of ${k} doors (seed ${seed})`, JSON.stringify(got) === JSON.stringify(want), { want, got }); sq++; });
}
console.log(`ok   placed levers: ${sq} cases, the real leverPull's doors`);

// ---- (phase 2) castle pits: every castle of 1 to 5 rooms from these kinds, each pit, against castleroomScene's own pits line ----
const castle = src("13-castle-rooms-and-map.js");
const pitsLine = castle.match(/  const d1 = K\.rooms\.indexOf\("dungeon1"\) \+ 1, d2 = [^\n]*\n  const pits = [^\n]*\n/)[0];
const pitsOf = new Function("K", pitsLine + "return pits;");
const KINDS = ["king", "trap", "dungeon1", "dungeon2", "hallway"];
const castles = [[]]; for (let len = 1; len <= 4; len++) for (const c of castles.filter(c => c.length === len - 1)) for (const k of KINDS) castles.push([...c, k]);
let cp = 0;
for (const rooms of castles) if (rooms.length) for (const i of [0, 1]) {
  const to = pitsOf({ rooms })[i], want = to ? [["GoRoom", to]] : [];
  const got = flat(C.handlers.Castle({ ...none, rooms }, { tag: "FallPit", value: i }));
  ok(`FallPit ${i} in ${rooms.join(",")}`, JSON.stringify(got) === JSON.stringify(want), { want, got }); cp++; }
console.log(`ok   castle pits: ${cp} cases, castleroomScene's own pits`);

// ---- times: a Hazel call (with the globals built as the game does) against the JS deciding the same ----
const g0 = { ...none, lever_L: true, wiring: "random", draws: [0.3, 0.7], pits_on: [true, true], covered: [false, true] };
time("Pull: hazel", () => C.handlers.TrapRoom(g0, { tag: "Pull", value: "L" }));
time("Pull: js", () => { const w = game.trapWiring({ castleLeverWire1N: "random", castleLeverSeed1N: 3 }, 1, "N"); return w.map(x => x === "L"); });
time("PullBoulder: hazel", () => C.handlers.TrapRoom(g0, { tag: "PullBoulder", value: "L" }));
time("PullHatch: hazel", () => C.handlers.TreeRoom({ ...none, hatch: true }, { tag: "PullHatch", value: 2 }));
for (const k of [2, 8, 40]) { const T = squareOf(k, 5), i = T.findIndex(t => t.kind === "lever");
  time(`PullThing, ${k} doors: hazel (globals copied in)`, () => C.handlers.Square({ ...none, things: thingsOf(T) }, { tag: "PullThing", value: i }));
  time(`PullThing, ${k} doors: js (leverPull)`, () => { game.state.background = { things: T.map(t => ({ ...t })) }; game.leverPull(i); }); }
{ const rooms = ["king", "hallway", "trap", "dungeon1", "dungeon2"];
  time("FallPit: hazel", () => C.handlers.Castle({ ...none, rooms: rooms.slice() }, { tag: "FallPit", value: 1 }));
  time("FallPit: js (the pits line, as castleroomScene draws)", () => pitsOf({ rooms })[1]); }
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
console.log(`\ntimes, ${REPS} reps each, node ${process.version} (ms)`);
for (const [k, a] of Object.entries(times)) console.log(`  ${k.padEnd(44)} p50 ${q(a, 0.5).toFixed(4)}  p95 ${q(a, 0.95).toFixed(4)}  max ${a[a.length - 1].toFixed(3)}`);
console.log(bad ? `${bad} of ${n} failed` : `all ok (${n} comparisons)`);
process.exit(bad ? 1 : 0);
