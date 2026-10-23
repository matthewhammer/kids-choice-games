// (ticket 542) 🧩 the room rules in Fumola against the game's own JS, without a browser: js/25-fumola.js run in node (its rules'
// source, its literal writer and answer reader, its handlers: what the page runs under ?logic=fumola and ?logic=fumola-list) with
// Fumola's wasm build, every room's handler given the cases tools/hazelrules531.mjs gives the Hazel rules, from the same makers, its
// commands compared with what the plain JS does in that case (the same expectations that check holds Hazel's answers to, so the
// Fumola rules give Hazel's answers), in both modes: the World rule's map held in Fumola (fumola) and passed in (fumola-list). Then
// the edges named one by one, with their commands written out, and Common's helpers called alone. Prints each failure, a count per
// room, and per event the time of a call (globals in as text, JSON out) in each mode: p50, p95, in ms, node's, for the order of
// things only. Exits 1 on a failure.
//   node tools/fumola_rules_check.mjs [fumola wasm bindings dir]   (default: the game's pinned copy, dress-up/vendor/fumola/877b155851/,
//   fumola_wasm.js and fumola_wasm_bg.wasm, the build the page loads)
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import os from "node:os";
const here = path.dirname(new URL(import.meta.url).pathname);
const dir = path.resolve(process.argv[2] || path.join(here, "..", "dress-up", "vendor", "fumola", "877b155851"));
if (!fs.existsSync(path.join(dir, "fumola_wasm.js"))) { console.log(`usage: node tools/fumola_rules_check.mjs <dir with fumola_wasm.js and fumola_wasm_bg.wasm> (none in ${dir})`); process.exit(2); }
let bad = 0, n = 0;
const ok = (what, cond, got) => { n++; if (!cond) { if (bad < 40) console.log(`FAIL ${what}: ${JSON.stringify(got).slice(0, 600)}`); bad++; } };
const src = f => fs.readFileSync(path.join(here, "../dress-up/js", f), "utf8");
const fnText = (text, name) => { const a = text.indexOf(`function ${name}(`); if (a < 0) throw new Error("no " + name); const rest = text.slice(a); const m = rest.slice(1).search(/\n(function |const |let |\/\/ \(ticket)/); return rest.slice(0, m < 0 ? undefined : m + 1); };

// ---- Fumola's build, and the page's own Fumola part ----
const F = await import(path.join(dir, "fumola_wasm.js"));
F.initSync({ module: fs.readFileSync(path.join(dir, "fumola_wasm_bg.wasm")) });
const page = { console, Math, JSON, Object, Array, String, Number, Boolean, Error, Promise, performance, Map, Set, RegExp, Symbol,
  location: { search: "" }, setTimeout: () => 0, clearTimeout() {}, document: { head: { append() {} }, getElementById: () => null, body: { classList: { contains: () => false } } },
  addEventListener() {}, state: { scripts: { on: false, common: null, rooms: {} }, background: {} } };
page.window = page;
vm.createContext(page);
// (ticket 566: the page's own boundary, scriptTyped, which turns the game's text into the rules' variants and back, as the page does)
vm.runInContext(src("25-scripting.js"), page, { filename: "25-scripting.js" });
const X = vm.runInContext(src("25-fumola.js") + "\n;({ FUMOLA_SOURCE, FUMOLA_ROOMS, fumolaRules, fumolaLit, fumolaValue })", page, { filename: "25-fumola.js" });
ok("the Fumola source is ASCII (a non-ASCII character once hid what came after it from Fumola's reader)", /^[\x00-\x7f]*$/.test(X.FUMOLA_SOURCE), [...X.FUMOLA_SOURCE].filter(c => c.charCodeAt(0) > 127).slice(0, 5));
const MODES = ["fumola", "fumola-list"], RULES = {};
for (const m of MODES) { RULES[m] = X.fumolaRules(F, m); console.log(`${m}: the rules defined in ${RULES[m].ms.toFixed(1)} ms; calls in scratch: ${RULES[m].scratch}`); }
const flat = c => { const out = []; while (c && c.tag !== "Done") { const v = Array.isArray(c.value) ? c.value : [c.value]; out.push([c.tag, ...v.slice(0, -1)]); c = v[v.length - 1]; } return out; };
const none = { lever_L: false, lever_R: false, wiring: "normal", draws: [], pits_on: [], covered: [], hatch: false, things: [], rooms: [], exits: [], out: "auto", out_room: -1, at_col: 0, at_row: 0, cols: 0, rows: 0, cells: [] };
const times = {};
// (each room's handler in each mode: its commands, flattened, and its time kept under the event's tag)
const ask = (m, room, g, ev) => { const t0 = performance.now(); let c; try { c = RULES[m].handlers[room](g, ev); } catch (e) { return [["THREW", String(e.message || e).slice(0, 200)]]; }
  (times[`${ev.tag} ${m}`] = times[`${ev.tag} ${m}`] || []).push(performance.now() - t0); return flat(c); };
const each = (room, g, ev, want, what) => { for (const m of MODES) { const got = ask(m, room, g, ev); ok(`${m}: ${what}`, JSON.stringify(got) === JSON.stringify(want), { want, got }); } };
const count = {};

// ---- the game's own code, where it runs in node (as hazelrules531.mjs has it) ----
const game = { console, Math, JSON, Array, Object, String, Number, Boolean, Set, Map };
vm.createContext(game);
const nature = src("10-nature.js"), st = src("01-state.js"), drags = src("26-drags-and-start.js");
vm.runInContext(nature.match(/const seeded = [^\n]*\n/)[0].replace("const seeded", "var seeded"), game);
vm.runInContext(st.match(/const leverWireKey = [^\n]*\n/)[0].replace("const ", "var "), game);
vm.runInContext(fnText(st, "trapWiring"), game);
let applied = null;
Object.assign(game, { state: { background: {} }, scriptEvent: () => false, hzJs: (t, f) => f(), changed() {}, turnArm() {}, lidSwing() {}, boulderFall() {}, sparkleFrom() {},
  ROCK_TONES: ["#888"], BOULDER_FALL: 1, LEVER_TILT: 1, boulderHits() {}, boulderFalling() {} });
vm.runInContext(fnText(drags, "leverPull") + "\n" + fnText(drags, "leverPullApply").replace("function leverPullApply(i, doors) {", "function leverPullApply(i, doors) { applied = doors;"), game);
Object.defineProperty(game, "applied", { get: () => applied, set: v => { applied = v; } });

// ---- red levers and blue: every wiring (random by several seeds), every lever, pit and rock ----
const B = [false, true], wirings = [["normal", 1], ["reversed", 1], ...[1, 2, 3, 7, 11, 42, 999].map(s => ["random", s])];
count.trap = 0;
for (const [mode, seed] of wirings) for (const lL of B) for (const lR of B) for (const on0 of B) for (const on1 of B) for (const c0 of B) for (const c1 of B) {
  const wire = game.trapWiring({ castleLeverWire1N: mode, castleLeverSeed1N: seed }, 1, "N"), r = game.seeded(seed);
  const g = { ...none, lever_L: lL, lever_R: lR, wiring: mode, draws: [r(0), r(1)], pits_on: [on0, on1], covered: [c0, c1] };
  const up = { L: lL, R: lR };
  for (const side of ["L", "R"]) {
    const was = wire.map(w => up[w]), up2 = { ...up, [side]: !up[side] }, now = wire.map(w => up2[w]);
    each("TrapRoom", g, { tag: "Pull", value: side }, [["Flip", "lever_" + side], ...[0, 1].filter(j => now[j] !== was[j]).map(j => ["SetPit", j, now[j]])], `Pull ${side}, ${mode} ${seed}, ${JSON.stringify(g).slice(0, 80)}`);
    const mine = [0, 1].filter(j => wire[j] === side && [on0, on1][j]), lift = mine.some(j => [c0, c1][j]);
    each("TrapRoom", g, { tag: "PullBoulder", value: side }, mine.map(j => [lift ? "LiftBoulder" : "DropBoulder", j]), `PullBoulder ${side}, ${mode} ${seed}`);
    count.trap += 2;
  }
}
// ---- hatches ----
count.tree = 0;
for (const h of [0, 1, 2, 3, 4, 5, 6]) for (const shut of B) { each("TreeRoom", { ...none, hatch: shut }, { tag: "PullHatch", value: h }, [["SetHatch", h, !shut]], `PullHatch ${h} ${shut}`); count.tree++; }
// ---- placed levers: squares of 1 to 40 levers and doors, the real leverPull's doors against the rule's ----
const squareOf = (k, seed) => { const r = game.seeded(seed), things = [];
  for (let j = 0; j < k; j++) things.push({ kind: "trapdoor", uid: "d" + j, open: r(j) < 0.5, boulder: r(j + 50) < 0.3 });
  for (let j = 0; j < Math.max(1, k >> 1); j++) things.push({ kind: "lever", on: r(j + 100) < 0.5, does: r(j + 150) < 0.4 ? "boulder" : "", works: things.filter((_, q) => q < k && r(q * 7 + j) < 0.4).map(t => t.uid) });
  things.push({ kind: "rock" }); return things; };
const thingsOf = T => T.flatMap((t, at) => t.kind === "lever" || t.kind === "trapdoor" ? [{ at, uid: String(t.uid || ""), kind: t.kind, on: !!t.on, works: (t.works || []).map(String), does: String(t.does || ""), open: !!t.open, boulder: !!t.boulder }] : []);
count.square = 0;
for (const k of [1, 2, 4, 8, 16, 40]) for (const seed of [1, 5, 9]) {
  const T = squareOf(k, seed);
  T.forEach((t, i) => { if (t.kind !== "lever") return;
    game.state.background = { things: structuredClone(T) }; game.applied = null; game.leverPull(i);
    const want = game.applied.map(([j, w, v]) => [w === "open" ? "OpenDoor" : "DropRock", j, v]);
    each("Square", { ...none, things: thingsOf(T) }, { tag: "PullThing", value: i }, want, `PullThing ${i} of ${k} doors (seed ${seed})`); count.square++; });
}
// ---- castle pits: every castle of 1 to 4 rooms from these kinds, each pit, against castleroomScene's own pits line ----
const castle = src("13-castle-rooms-and-map.js");
const pitsLine = castle.match(/  const d1 = K\.rooms\.indexOf\("dungeon1"\) \+ 1, d2 = [^\n]*\n  const pits = [^\n]*\n/)[0];
const pitsOf = new Function("K", pitsLine + "return pits;");
const KINDS = ["king", "trap", "dungeon1", "dungeon2", "hallway"];
const castles = [[]]; for (let len = 1; len <= 4; len++) for (const c of castles.filter(c => c.length === len - 1)) for (const k of KINDS) castles.push([...c, k]);
count.pits = 0;
for (const rooms of castles) if (rooms.length) for (const i of [0, 1]) {
  const to = pitsOf({ rooms })[i];
  each("Castle", { ...none, rooms }, { tag: "FallPit", value: i }, to ? [["GoRoom", to]] : [], `FallPit ${i} in ${rooms.join(",")}`); count.pits++; }
// ---- a room's way out: every castle above of 1 to 3 rooms and two long ones, every room, every out setting, against wayOutOf ----
// (hazelrules531 takes castles of 4 rooms too: 25,000 calls here, a minute; the rule reads the castle only through index_of and
// nth_s, which these cover)
vm.runInContext(st.match(/const ROOM_S_OUT = [^\n]*\n/)[0].replace("const ", "var "), game);
game.ROOM_KINDS = Object.fromEntries([...st.matchAll(/^  (\w+): \{ label: [^\n]*exits: "(\w+)"/gm)].map(m => [m[1], { exits: m[2] }]));
vm.runInContext(fnText(castle, "wayOutOf"), game);
count.wayout = 0;
for (const rooms of [...castles.filter(c => c.length && c.length <= 3), ["king", "greenhouse", "trap", "dungeon1", "dungeon2", "hallway", "dining", "spiral"], ["dining", "dungeon2", "spiral", "trap"]])
  rooms.forEach((_, j) => { const nn = j + 1;
    for (const out of ["auto", "out", "none", "1", "2", "3", "5", "9", "0"]) {
      const hall = rooms.map(() => ({ out: "auto" })); hall[nn - 1] = { out };
      const w = game.wayOutOf({ rooms, hall }, nn), r = Number(out);
      const g = { ...none, rooms, exits: rooms.map(s => game.ROOM_KINDS[s].exits), out, out_room: Number.isInteger(r) ? r : -1 };
      each("Castle", g, { tag: "WayOut", value: nn }, [["GoRoom", w === null ? -1 : w]], `WayOut ${nn} (${out}) in ${rooms.join(",")}`); count.wayout++; } });
// ---- world ways: maps at random (seeded), every square, every direction, against the game's own worldMeets ----
const world = src("25-world.js"), outdoors = src("14-outdoors.js");
for (const re of [/const WORLD_DIRS = [^\n]*\n/, /const WORLD_OPP = [^\n]*\n/, /const WORLD_NO_WAY = [^\n]*\n/, /const worldNoWay = [^\n]*\n/, /const worldWays = [^\n]*\n/])
  vm.runInContext(world.match(re)[0].replace(/^const /, "var "), game);
vm.runInContext(outdoors.match(/const CROSS_DIRS = [\s\S]*?\];\n/)[0].replace(/^const /, "var "), game);
vm.runInContext(fnText(world, "worldNeighbour") + "\n" + fnText(world, "worldMeets"), game);
const DIRS = Object.keys(game.WORLD_DIRS), PLACE_KINDS = ["meadow", "waterfall", "crossing", "beach", "castle", "sea"];
const cellsOf = W => Object.entries(W.cells).map(([k, cell]) => { const [col, row] = k.split(",").map(Number);
  return { col, row, kind: cell.kind, ways: cell.kind === "crossing" ? game.CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : cell.ways || [] }; });
const mapOf = (cols, rows, seed, fill = 0.75) => { const r = game.seeded(seed), cells = {}; let j = 0;
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) { j++; if (r(j) > fill) continue;
    const kind = PLACE_KINDS[Math.floor(r(j + 500) * PLACE_KINDS.length)], on = DIRS.filter((_, q) => r(j * 9 + q + 1000) < 0.55);
    cells[c + "," + rr] = kind === "crossing" ? { kind, ...Object.fromEntries(on.map(d => ["cross" + d, true])) } : { kind, ways: on }; }
  return { cols, rows, cells }; };
count.world = 0;
const builds0 = RULES.fumola.held.builds; let maps = 0, last = null;
for (const [cols, rows] of [[1, 1], [3, 3], [5, 4], [8, 8]]) for (const seed of [1, 2, 3, 17]) { const W = mapOf(cols, rows, seed), cells = cellsOf(W);
  if (cells.length && JSON.stringify(cells) !== last) { maps++; last = JSON.stringify(cells); }
  for (const at of Object.keys(W.cells)) { const [ac, ar] = at.split(",").map(Number);
    for (const d of DIRS) { const m = game.worldMeets(W, at, d);
      each("World", { ...none, at_col: ac, at_row: ar, cols, rows, cells }, { tag: "Way", value: d }, m ? [["GoSquare", ...m.split(",").map(Number), game.WORLD_OPP[d]]] : [], `Way ${d} from ${at}, ${cols}x${rows} seed ${seed}`); count.world++; } } }
// (the held map made again once per map with a square in it, not per way)
ok(`fumola: the held map made again only when the cells changed (once for each of ${maps} maps)`, RULES.fumola.held.builds - builds0 === maps, [RULES.fumola.held.builds - builds0, maps]);
ok("fumola-list: no map held", RULES["fumola-list"].held.builds === 0, RULES["fumola-list"].held.builds);

// ---- the edges, one by one, their commands written out ----
const edge = (room, g, ev, want, what) => { each(room, { ...none, ...g }, ev, want, "edge: " + what); count.edges = (count.edges || 0) + 1; };
const C3 = [{ col: 0, row: 0, kind: "meadow", ways: ["E", "S", "SE"] }, { col: 1, row: 0, kind: "meadow", ways: ["W", "S"] }, { col: 0, row: 1, kind: "waterfall", ways: ["N", "E"] },
  { col: 1, row: 1, kind: "meadow", ways: ["N", "W"] }, { col: 2, row: 1, kind: "beach", ways: [] }];
const at = (c, r) => ({ at_col: c, at_row: r, cols: 3, rows: 2, cells: C3 });
edge("World", at(0, 0), { tag: "Way", value: "E" }, [["GoSquare", 1, 0, "W"]], "a way with a way back");
edge("World", at(0, 0), { tag: "Way", value: "N" }, [], "off the map, north of the top row");
edge("World", at(0, 0), { tag: "Way", value: "W" }, [], "off the map, west of the first column");
edge("World", at(0, 0), { tag: "Way", value: "NW" }, [], "off the map, a corner");
edge("World", at(2, 1), { tag: "Way", value: "E" }, [], "off the map, east of the last column");
edge("World", at(1, 1), { tag: "Way", value: "S" }, [], "off the map, south of the last row");
edge("World", at(0, 0), { tag: "Way", value: "S" }, [], "into a waterfall from its north: its cliff, whatever its ways say");
edge("World", at(0, 0), { tag: "Way", value: "SE" }, [], "no way back (the square there has no NW)");
edge("World", at(1, 1), { tag: "Way", value: "E" }, [], "no way back (the beach there has no ways)");
edge("World", { ...at(1, 0), cells: C3.filter(x => !(x.col === 2)) }, { tag: "Way", value: "SE" }, [], "no square there");
edge("World", at(1, 1), { tag: "Way", value: "W" }, [["GoSquare", 0, 1, "E"]], "into a waterfall from its east: its E is a way");
edge("World", at(0, 1), { tag: "Way", value: "N" }, [["GoSquare", 0, 0, "S"]], "north out of a waterfall: decided on the square there alone, as worldMeets (the game draws no way up its cliff)");
const things = [{ at: 0, uid: "da", kind: "trapdoor", on: false, works: [], does: "", open: false, boulder: false }, { at: 1, uid: "db", kind: "trapdoor", on: false, works: [], does: "", open: true, boulder: false },
  { at: 2, uid: "dc", kind: "trapdoor", on: false, works: [], does: "", open: true, boulder: true }, { at: 3, uid: "", kind: "lever", on: false, works: ["da", "db", "zz"], does: "", open: false, boulder: false },
  { at: 4, uid: "", kind: "lever", on: false, works: ["dc", "db"], does: "boulder", open: false, boulder: false }, { at: 6, uid: "", kind: "lever", on: true, works: ["dc", "db"], does: "boulder", open: false, boulder: false },
  { at: 7, uid: "", kind: "lever", on: false, works: [], does: "", open: false, boulder: false }];
edge("Square", { things }, { tag: "PullThing", value: 3 }, [["OpenDoor", 0, true], ["OpenDoor", 1, false]], "a lever with several doors (and a name no door has)");
edge("Square", { things }, { tag: "PullThing", value: 4 }, [["DropRock", 1, true]], "a boulder lever going over: a rock into each door without one");
edge("Square", { things }, { tag: "PullThing", value: 6 }, [["DropRock", 2, false]], "a boulder lever coming back: each door's rock lifted");
edge("Square", { things }, { tag: "PullThing", value: 7 }, [], "a lever wired to nothing");
edge("Square", { things }, { tag: "PullThing", value: 5 }, [], "no thing at that place");
edge("TrapRoom", { lever_L: true, lever_R: true, wiring: "normal", pits_on: [true, true] }, { tag: "Pull", value: "L" }, [["Flip", "lever_L"], ["SetPit", 0, false]], "a red lever, normal: its own pit");
edge("TrapRoom", { lever_L: true, lever_R: false, wiring: "reversed", pits_on: [true, true] }, { tag: "Pull", value: "L" }, [["Flip", "lever_L"], ["SetPit", 1, false]], "a red lever, reversed: the other pit");
edge("TrapRoom", { wiring: "random", draws: [0.1, 0.2], pits_on: [true, true] }, { tag: "Pull", value: "L" }, [["Flip", "lever_L"], ["SetPit", 0, true], ["SetPit", 1, true]], "random, both pits on the left lever");
edge("TrapRoom", { wiring: "random", draws: [0.4999999, 0.5] }, { tag: "Pull", value: "R" }, [["Flip", "lever_R"], ["SetPit", 1, true]], "random, the draws either side of a half");
edge("TrapRoom", { wiring: "random", draws: [] }, { tag: "Pull", value: "R" }, [["Flip", "lever_R"], ["SetPit", 1, true]], "random with no draws: normal");
edge("TrapRoom", { wiring: "normal", pits_on: [true, true], covered: [false, false] }, { tag: "PullBoulder", value: "L" }, [["DropBoulder", 0]], "a blue lever: a rock dropped");
edge("TrapRoom", { wiring: "random", draws: [0.2, 0.3], pits_on: [true, true], covered: [false, true] }, { tag: "PullBoulder", value: "L" }, [["LiftBoulder", 0], ["LiftBoulder", 1]], "a blue lever working both pits, a rock on one: both lifted");
edge("TrapRoom", { wiring: "normal", pits_on: [false, true] }, { tag: "PullBoulder", value: "L" }, [], "a blue lever whose pit is off: nothing");
edge("TrapRoom", {}, { tag: "PullHatch", value: 1 }, [], "an event not the room's");
edge("TreeRoom", { hatch: false }, { tag: "PullHatch", value: 0 }, [["SetHatch", 0, true]], "the round room's trap door, shut");
const ex = rs => rs.map(s => ({ king: "side", trap: "trap", dungeon1: "ladder", dungeon2: "ladder", hallway: "hall", dining: "long", spiral: "spiral" })[s]);
edge("Castle", { rooms: ["king", "trap", "dungeon1", "dungeon2"] }, { tag: "FallPit", value: 0 }, [["GoRoom", 3]], "the left pit, both dungeons: the dungeon");
edge("Castle", { rooms: ["king", "trap", "dungeon1", "dungeon2"] }, { tag: "FallPit", value: 1 }, [["GoRoom", 4]], "the right pit, both dungeons: the deep dungeon");
edge("Castle", { rooms: ["trap", "dungeon2"] }, { tag: "FallPit", value: 0 }, [["GoRoom", 2]], "only the deep dungeon: both pits there");
edge("Castle", { rooms: ["dungeon1", "trap"] }, { tag: "FallPit", value: 1 }, [["GoRoom", 1]], "only the dungeon: both pits there");
edge("Castle", { rooms: ["king", "trap"] }, { tag: "FallPit", value: 0 }, [], "no dungeons: nowhere");
const rs = ["king", "trap", "dungeon1", "dungeon2"];
edge("Castle", { rooms: rs, exits: ex(rs), out: "auto" }, { tag: "WayOut", value: 3 }, [["GoRoom", 2]], "a dungeon's ladder up: to the trap room");
edge("Castle", { rooms: ["king", "dungeon1"], exits: ex(["king", "dungeon1"]), out: "auto" }, { tag: "WayOut", value: 2 }, [["GoRoom", 1]], "a ladder, no trap room: room 1");
edge("Castle", { rooms: ["dungeon1", "trap"], exits: ex(["dungeon1", "trap"]), out: "auto" }, { tag: "WayOut", value: 1 }, [["GoRoom", 2]], "room 1 a dungeon: up to the trap room");
edge("Castle", { rooms: rs, exits: ex(rs), out: "out" }, { tag: "WayOut", value: 4 }, [["GoRoom", 0]], "out: out of the castle");
edge("Castle", { rooms: rs, exits: ex(rs), out: "none" }, { tag: "WayOut", value: 4 }, [["GoRoom", 2]], "none on a ladder: as auto");
edge("Castle", { rooms: ["king", "spiral"], exits: ex(["king", "spiral"]), out: "none" }, { tag: "WayOut", value: 2 }, [["GoRoom", -1]], "none in a room with its own way out: nowhere");
edge("Castle", { rooms: rs, exits: ex(rs), out: "2", out_room: 2 }, { tag: "WayOut", value: 4 }, [["GoRoom", 2]], "a room named");
edge("Castle", { rooms: rs, exits: ex(rs), out: "5", out_room: 5 }, { tag: "WayOut", value: 4 }, [["GoRoom", -1]], "a room past the last: nowhere");
edge("Castle", { rooms: rs, exits: ex(rs), out: "0", out_room: 0 }, { tag: "WayOut", value: 4 }, [["GoRoom", -1]], "room 0: nowhere");

// ---- Common's helpers alone ----
const val = t => { try { return X.fumolaValue(JSON.parse(F.fumola_eval_top(RULES.fumola.id, t))); } catch (e) { return "THREW " + e; } };
const helper = (t, want) => { ok(`Common: ${t}`, JSON.stringify(val(t)) === JSON.stringify(want), { want, got: val(t) }); count.common = (count.common || 0) + 1; };
// (ticket 566: Common's helpers in the rules' variants; a direction's step off the map is World's now, checked by the World cases)
helper(`Common.flip2(#L, #R)`, { tag: "Flip", value: [{ tag: "L" }, { tag: "Flip", value: [{ tag: "R" }, { tag: "Done" }] }] });
helper(`Common.nth([true, false], 0)`, true); helper(`Common.nth([true, false], 1)`, false); helper(`Common.nth([true], 5)`, false); helper(`Common.nth([], 0)`, false);
helper(`Common.wire(#Normal, [])`, [{ tag: "L" }, { tag: "R" }]); helper(`Common.wire(#Reversed, [])`, [{ tag: "R" }, { tag: "L" }]);
helper(`Common.wire(#Random, [0.4999999, 0.5])`, [{ tag: "L" }, { tag: "R" }]); helper(`Common.wire(#Random, [0.7])`, [{ tag: "L" }, { tag: "R" }]);
helper(`Common.up(true, false, #L)`, true); helper(`Common.up(true, false, #R)`, false);
helper(`Common.pits_open(true, false, (#R, #L))`, [false, true]);
helper(`Common.pit_moves(1, true, true, #Done)`, { tag: "Done" }); helper(`Common.pit_moves(1, true, false, #Done)`, { tag: "SetPit", value: [1, false, { tag: "Done" }] });
helper(`Common.member("b", ["a", "b"])`, true); helper(`Common.member("c", ["a", "b"])`, false); helper(`Common.member("a", [])`, false);
helper(`Common.has_way(#E, [#N, #E])`, true); helper(`Common.has_way(#W, [#N, #E])`, false);
helper(`Common.room_at([#King, #Trap, #Trap], #Trap)`, 2); helper(`Common.room_at([#King], #Trap)`, 0);
helper(`Common.exit_of([#ExitSide, #ExitLadder], 2)`, { tag: "ExitLadder" }); helper(`Common.exit_of([#ExitSide], 3)`, null); helper(`Common.exit_of([#ExitSide], 0)`, null);
helper(`Common.rooms([#King, #Trap, #Stable])`, 3); helper(`Common.rooms([])`, 0);
for (const [d, [dx, dy]] of Object.entries(game.WORLD_DIRS)) { helper(`Common.dir(#${d})`, [dx, dy]); helper(`Common.opp(#${d})`, { tag: game.WORLD_OPP[d] }); }
// (the boundary: a text with a quote cannot cross, and says so; numbers, variants and records as the page writes them)
let threw = ""; try { X.fumolaLit({ uid: 'a"b' }); } catch (e) { threw = String(e.message); }
ok("a text with a quote is refused, not written broken", /cannot be given/.test(threw), threw);
ok("literals: a record, a negative, a variant with a tuple", X.fumolaLit({ a: -1, b: [true, "x"], c: { tag: "GoRoom", value: [2, { tag: "Done" }] } }) === '{ a = -1; b = [true, "x"]; c = #GoRoom((2, #Done)) }', X.fumolaLit({ a: -1, b: [true, "x"], c: { tag: "GoRoom", value: [2, { tag: "Done" }] } }));

console.log(`cases per room (each in both modes): ${Object.entries(count).map(([k, v]) => `${k} ${v}`).join(", ")}`);
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
console.log(`times of a call, node ${process.version} (ms; globals written as text, the answer's JSON read)`);
for (const [k, a] of Object.entries(times).sort()) { a.sort((x, y) => x - y); console.log(`  ${k.padEnd(26)} n=${String(a.length).padEnd(5)} p50 ${q(a, 0.5).toFixed(3)}  p95 ${q(a, 0.95).toFixed(3)}  max ${a[a.length - 1].toFixed(2)}`); }
console.log(bad ? `${bad} of ${n} failed` : `all ok (${n} comparisons)`);
process.exit(bad ? 1 : 0);
