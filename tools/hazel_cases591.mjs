// (ticket 591, Matthew: "use our actual game scripts that we want to be equiv to seed more unit tests here, please" -- hazelgrove/hazel
// #2711, Hazel as a JS library) The game's shipped Hazel program, and a set of cases that covers each room's rule, written out as a
// Reason module for Hazel's test suite (test/Test_HazelLibGame.re): the program as the page builds it (scriptProgram, ?logic=hazel),
// and per case the room, its globals and event as the page's boundary hands them to Hazel (scriptTypedGlobals, scriptTypedEvent: text
// as constructors), and the commands the game's own JS gives in that case, as Hazel writes them back (nested constructors, JSON). The
// JS's answers come from the same code and restatements as tools/hazelrules531.mjs, which holds every case on each push; this is a
// subset chosen to reach each rule's branches, small enough for a unit test. No Hazel is needed to write it.
//   node tools/hazel_cases591.mjs > ../hazel-591/test/Test_HazelLibGame.re
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import { execSync } from "node:child_process";
const here = path.dirname(new URL(import.meta.url).pathname);
const src = f => fs.readFileSync(path.join(here, "../dress-up/js", f), "utf8");
const fnText = (text, name) => { const a = text.indexOf(`function ${name}(`); if (a < 0) throw new Error("no " + name); const rest = text.slice(a); const m = rest.slice(1).search(/\n(function |const |let |\/\/ \(ticket)/); return rest.slice(0, m < 0 ? undefined : m + 1); };

// ---- the page: the program, and its boundary ----
const page = { console, Math, JSON, Array, Object, String, Number, Boolean, Map, Set, Promise, RegExp, Error, Symbol, location: { search: "?logic=hazel" },
  setTimeout: () => 0, clearTimeout() {}, performance, document: { head: { append() {} }, getElementById: () => null, body: { classList: { contains: () => false } } }, addEventListener() {},
  state: { scripts: { on: false, common: null, rooms: {} }, background: {} } };
page.window = page;
vm.createContext(page);
vm.runInContext(src("25-scripting.js"), page, { filename: "25-scripting.js" });
const program = vm.runInContext("scriptProgram()", page);
const none = vm.runInContext("scriptNoGlobals()", page);
const typedG = g => vm.runInContext("scriptTypedGlobals", page)(g), typedE = e => vm.runInContext("scriptTypedEvent", page)(e);

// ---- the game's own code, where it runs in node (as tools/hazelrules531.mjs) ----
const game = { console, Math, JSON, Array, Object, String, Number, Boolean, Set, Map };
vm.createContext(game);
const nature = src("10-nature.js"), st = src("01-state.js"), drags = src("26-drags-and-start.js"), castle = src("13-castle-rooms-and-map.js");
vm.runInContext(nature.match(/const seeded = [^\n]*\n/)[0].replace("const seeded", "var seeded"), game);
vm.runInContext(st.match(/const leverWireKey = [^\n]*\n/)[0].replace("const ", "var "), game);
vm.runInContext(fnText(st, "trapWiring"), game);
let applied = null;
Object.assign(game, { state: { background: {} }, scriptEvent: () => false, hzJs: (t, f) => f(), changed() {}, turnArm() {}, lidSwing() {}, boulderFall() {}, sparkleFrom() {},
  ROCK_TONES: ["#888"], BOULDER_FALL: 1, LEVER_TILT: 1, boulderHits() {}, boulderFalling() {} });
vm.runInContext(fnText(drags, "leverPull") + "\n" + fnText(drags, "leverPullApply").replace("function leverPullApply(i, doors) {", "function leverPullApply(i, doors) { applied = doors;"), game);
Object.defineProperty(game, "applied", { get: () => applied, set: v => { applied = v; } });
vm.runInContext(st.match(/const ROOM_S_OUT = [^\n]*\n/)[0].replace("const ", "var "), game);
game.ROOM_KINDS = Object.fromEntries([...st.matchAll(/^  (\w+): \{ label: [^\n]*exits: "(\w+)"/gm)].map(m => [m[1], { exits: m[2] }]));
vm.runInContext(fnText(castle, "wayOutOf"), game);
const pitsOf = new Function("K", castle.match(/  const d1 = K\.rooms\.indexOf\("dungeon1"\) \+ 1, d2 = [^\n]*\n  const pits = [^\n]*\n/)[0] + "return pits;");
const world = src("25-world.js"), outdoors = src("14-outdoors.js");
for (const re of [/const WORLD_DIRS = [^\n]*\n/, /const WORLD_OPP = [^\n]*\n/, /const WORLD_NO_WAY = [^\n]*\n/, /const worldNoWay = [^\n]*\n/, /const worldWays = [^\n]*\n/])
  vm.runInContext(world.match(re)[0].replace(/^const /, "var "), game);
vm.runInContext(outdoors.match(/const CROSS_DIRS = [\s\S]*?\];\n/)[0].replace(/^const /, "var "), game);
// (ticket 637: worldWays asks isCross since the dungeon room (0.0.442); as in hazelrules531.mjs, the game's own)
vm.runInContext(st.match(/const CROSS_KINDS = [^\n]*\n/)[0].replace(/^const /, "var ").replace(", isCross =", "; var isCross ="), game);
vm.runInContext(fnText(world, "worldNeighbour") + "\n" + fnText(world, "worldMeets"), game);

// ---- a flat list of commands, as the check compares them, back to Hazel's nested constructors (the boundary's inverse) ----
const tag = t => ({ tag: t });
const nested = flat => flat.reduceRight((k, [t, ...args]) => {
  const a = args.map((v, i) => t === "Flip" && i === 0 ? tag(String(v).replace(/^lever_/, "")) : t === "GoSquare" && i === 2 ? tag(v) : v);
  return { tag: t, value: [...a, k] };
}, tag("Done"));

const cases = [];
const add = (room, what, g, ev, want) => cases.push({ room, what, g: JSON.stringify(typedG(g)), ev: JSON.stringify(typedE(ev)), want: JSON.stringify(nested(want)) });

// the trap room: three wirings, both levers' positions, a pull of each, a boulder pull with and without rocks
const B = [false, true];
for (const [mode, seed] of [["normal", 1], ["reversed", 1], ["random", 7]]) for (const lL of B) for (const lR of B) {
  const wire = game.trapWiring({ castleLeverWire1N: mode, castleLeverSeed1N: seed }, 1, "N"), r = game.seeded(seed);
  for (const side of ["L", "R"]) {
    const g = { ...none, lever_L: lL, lever_R: lR, wiring: mode, draws: [r(0), r(1)], pits_on: [true, true], covered: [false, false] };
    const up = { L: lL, R: lR }, was = wire.map(w => up[w]), up2 = { ...up, [side]: !up[side] }, now = wire.map(w => up2[w]);
    add("TrapRoom", `Pull ${side}, ${mode}, levers ${lL}/${lR}`, g, { tag: "Pull", value: side },
      [["Flip", "lever_" + side], ...[0, 1].filter(j => now[j] !== was[j]).map(j => ["SetPit", j, now[j]])]);
    for (const [on, cov] of [[[true, true], [false, false]], [[true, false], [true, false]], [[false, true], [false, true]]]) {
      if (lL || lR) continue;   // (a boulder pull does not read the levers: once per wiring is enough)
      const gb = { ...g, pits_on: on, covered: cov };
      const mine = [0, 1].filter(j => wire[j] === side && on[j]), lift = mine.some(j => cov[j]);
      add("TrapRoom", `PullBoulder ${side}, ${mode}, pits ${on}, rocks ${cov}`, gb, { tag: "PullBoulder", value: side }, mine.map(j => [lift ? "LiftBoulder" : "DropBoulder", j]));
    }
  }
}
// the tree houses' and round room's hatches
for (const h of [0, 3]) for (const shut of B) add("TreeRoom", `PullHatch ${h}, ${shut ? "shut" : "open"}`, { ...none, hatch: shut }, { tag: "PullHatch", value: h }, [["SetHatch", h, !shut]]);
// placed levers: the real leverPull's doors and rocks
const squareOf = (k, seed) => { const r = game.seeded(seed), things = [];
  for (let j = 0; j < k; j++) things.push({ kind: "trapdoor", uid: "d" + j, open: r(j) < 0.5, boulder: r(j + 50) < 0.3 });
  for (let j = 0; j < Math.max(1, k >> 1); j++) things.push({ kind: "lever", on: r(j + 100) < 0.5, does: r(j + 150) < 0.4 ? "boulder" : "", works: things.filter((_, q) => q < k && r(q * 7 + j) < 0.4).map(t => t.uid) });
  things.push({ kind: "rock" }); return things; };
const thingsOf = T => T.flatMap((t, at) => t.kind === "lever" || t.kind === "trapdoor" ? [{ at, uid: String(t.uid || ""), kind: t.kind, on: !!t.on, works: (t.works || []).map(String), does: String(t.does || ""), open: !!t.open, boulder: !!t.boulder }] : []);
for (const [k, seed] of [[1, 1], [4, 5], [8, 9]]) { const T = squareOf(k, seed);
  T.forEach((t, i) => { if (t.kind !== "lever") return;
    game.state.background = { things: structuredClone(T) }; game.applied = null; game.leverPull(i);
    add("Square", `PullThing ${i} of ${k} doors (seed ${seed})`, { ...none, things: thingsOf(T) }, { tag: "PullThing", value: i },
      game.applied.map(([j, w, v]) => [w === "open" ? "OpenDoor" : "DropRock", j, v])); }); }
// the castle: where each pit drops you, and each room's way out
for (const rooms of [["trap"], ["king", "trap", "dungeon1"], ["trap", "dungeon1", "dungeon2"], ["dungeon2", "hallway", "trap", "dungeon1"]]) for (const i of [0, 1]) {
  const to = pitsOf({ rooms })[i];
  add("Castle", `FallPit ${i} in ${rooms.join(",")}`, { ...none, rooms }, { tag: "FallPit", value: i }, to ? [["GoRoom", to]] : []);
}
for (const rooms of [["king", "trap", "dungeon1"], ["dining", "dungeon2", "spiral", "trap"]]) rooms.forEach((_, j) => { const n = j + 1;
  for (const out of ["auto", "out", "none", "2", "9"]) {
    const hall = rooms.map(() => ({ out: "auto" })); hall[n - 1] = { out };
    const w = game.wayOutOf({ rooms, hall }, n), r = Number(out);
    add("Castle", `WayOut ${n} (${out}) in ${rooms.join(",")}`, { ...none, rooms, exits: rooms.map(s => game.ROOM_KINDS[s].exits), out, out_room: Number.isInteger(r) ? r : -1 },
      { tag: "WayOut", value: n }, [["GoRoom", w === null ? -1 : w]]); } });
// the world's ways: a 3x3 map, every square, every direction
const DIRS = Object.keys(game.WORLD_DIRS), PLACE_KINDS = ["meadow", "waterfall", "crossing", "beach", "castle", "sea"];
const cellsOf = W => Object.entries(W.cells).map(([k, cell]) => { const [col, row] = k.split(",").map(Number);
  return { col, row, kind: cell.kind, ways: game.isCross(cell.kind) ? game.CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : cell.ways || [] }; });
const mapOf = (cols, rows, seed, fill = 0.75) => { const r = game.seeded(seed), cells = {}; let j = 0;
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) { j++; if (r(j) > fill) continue;
    const kind = PLACE_KINDS[Math.floor(r(j + 500) * PLACE_KINDS.length)], on = DIRS.filter((_, q) => r(j * 9 + q + 1000) < 0.55);
    cells[c + "," + rr] = kind === "crossing" ? { kind, ...Object.fromEntries(on.map(d => ["cross" + d, true])) } : { kind, ways: on }; }
  return { cols, rows, cells }; };
{ const [cols, rows, seed] = [3, 3, 2], W = mapOf(cols, rows, seed), cells = cellsOf(W);
  for (const at of Object.keys(W.cells)) { const [ac, ar] = at.split(",").map(Number);
    for (const d of DIRS) { const m = game.worldMeets(W, at, d);
      add("World", `Way ${d} from ${at}, 3x3 seed ${seed}`, { ...none, at_col: ac, at_row: ar, cols, rows, cells }, { tag: "Way", value: d },
        m ? [["GoSquare", ...m.split(",").map(Number), game.WORLD_OPP[d]]] : []); } } }

// ---- the Reason module ----
const commit = (() => { try { return execSync("git rev-parse --short HEAD", { cwd: here }).toString().trim(); } catch (e) { return "?"; } })();
const q = s => { if (s.includes("|game}")) throw new Error("the program holds the quote's end"); return `{game|${s}|game}`; };
const str = s => JSON.stringify(s);
const rooms = [...new Set(cases.map(c => c.room))];
process.stdout.write(`/* GENERATED by kids-choice-games tools/hazel_cases591.mjs (at ${commit}): do not edit by hand; run it again.
   Messed Up Dress Up's Hazel rules as the library's tests (^ticket(591)): the program the game ships (its preamble's types, Common,
   and the five rooms' modules), run through the library as the game runs it, and each room's on_event called from JS as the game
   calls it (its globals and event as JS values, text as constructors), its answer compared with the commands the game's own JS gives
   in that case. ${cases.length} cases, a subset of the ~32,000 the game's CI holds the same rules to (tools/hazelrules531.mjs). */
open Alcotest;
open Js_of_ocaml;

let program = ${q(program)};

/* (room, what the case is, globals, event, the commands expected), each a JSON text */
let cases = [
${cases.map(c => `  (${str(c.room)}, ${str(c.what)}, ${str(c.g)}, ${str(c.ev)}, ${str(c.want)}),`).join("\n")}
];

let json = (v: Js.Unsafe.any): string =>
  Js.to_string(Js.Unsafe.meth_call(Js._JSON, "stringify", [|v|]));
let as_js = (j: string): Js.Unsafe.any =>
  Js.Unsafe.meth_call(Js._JSON, "parse", [|Js.Unsafe.inject(Js.string(j))|]);

/* run once: the program's value, the rooms' rules by their lower-case names */
let run = lazy(HazelLibCore.run(program));
let errors = (): int => Js.Unsafe.get(Js.Unsafe.get(Lazy.force(run), "errors"), "length");
let rule = (room: string): Js.Unsafe.any =>
  Js.Unsafe.get(Js.Unsafe.get(Lazy.force(run), "value"), String.lowercase_ascii(room));

let tests = (
  "HazelLib: Messed Up Dress Up's rules",
  [
    test_case("the game's program has no errors", \`Quick, () =>
      check(int, "errors", 0, errors())
    ),
    ...List.map(
         room =>
           test_case(room ++ "'s on_event is a function", \`Quick, () =>
             check(string, "typeof", "function", Js.to_string(Js.typeof(rule(room))))
           ),
         [${rooms.map(str).join(", ")}],
       ),
  ]
  @ List.map(
      ((room, what, g, ev, want)) =>
        test_case(room ++ ": " ++ what, \`Quick, () =>
          check(
            string,
            "the commands the game's JS gives",
            want,
            json(Js.Unsafe.fun_call(rule(room), [|as_js(g), as_js(ev)|])),
          )
        ),
      cases,
    ),
);
`);
console.error(`${cases.length} cases: ` + rooms.map(r => `${r} ${cases.filter(c => c.room === r).length}`).join(", "));
