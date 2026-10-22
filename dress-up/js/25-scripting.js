"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 482, Matthew: "an editor panel in MUDU, under a new control panel called 'Scripting' --- with a list of editors, one per
// room that needs logic, starting only with the dungeon in the castle. The editors are showing sub-programs of a large, global
// program with global vars, using the $GameUpdate [monad] ... The programs can use sub-routines defined in a common editor that
// they all have in scope in their subprograms. In terms of a full Hazel AST, each sub-editor (for each room/square in the world)
// could be a module named by that square's name. Names should be unique, and we should enforce that.") 🧩 Scripting: the game's
// logic in Hazel, run by the game. The panel's editors are the bodies of the modules of one program: 📚 Common, then one module
// per room that has logic, named by the room (TrapRoom, for the castle's trap room over its dungeons). Before them, the program
// declares what a rule may say and what it is told:
//   Cmd     what to do, as data, each command with the rest after it: Flip("lever_L", then), Say("text", then), Done.
//           This is the $GameUpdate monad as data, for now: the game interprets it (scriptRun), and a Flip of a lever is the
//           game's own pull, its animation and its pits.
//   Event   what happened: Pull("L") or Pull("R"), a red lever pulled.
//   Globals the room's variables, as the game holds them: (lever_L = Bool, lever_R = Bool, wiring = String), a lever's true is up.
// A room's module gives on_event : (Globals, Event) -> Cmd. Hazel itself comes from a branch build's library (window.Hazel), loaded
// when the tab opens or a script first runs; until then, and whenever the program has errors or is not finished, the levers work as
// they always have. Off to start (state.scripts.on).
// (ticket 520, Matthew: "we aren't using tiles yet, right? Wasn't that the point of the Hazel-MUDU integration?") Hazel builds the
// program from the editors' texts itself (Hazel.runProgram, scriptSpec), and under the editors Hazel's own app, in a frame, shows the
// whole program as read-only tiles with Hazel's own error marks (scriptFrameMount).

// (tickets 482, 520) The Hazel build the game uses: its library (hazel-lib.js, window.Hazel) and its app in a frame (index.html#embed).
// For now the embed branch's build, hazelgrove/hazel#2719 (stacked on #2711), which has Hazel.runProgram and the frame; when #2719
// merges into #2711, this goes back to "https://hazel.org/build/js-library/", until the library ships with the game.
const SCRIPT_BUILD = "https://hazel.org/build/js-library-embed/";
const SCRIPT_LIB_URL = SCRIPT_BUILD + "hazel-lib.js";
// (the frame's messages are taken from this origin only, and posted to it only: SCRIPT_BUILD's)
const SCRIPT_HAZEL_ORIGIN = SCRIPT_BUILD.split("/").slice(0, 3).join("/");
const SCRIPT_FRAME_URL = SCRIPT_BUILD + "index.html#embed";

// the rooms that have logic so far, each a module of the program; module names must be unique (scriptNames checks it)
const SCRIPT_ROOMS = [
  { name: "TrapRoom", label: "🏰 the trap room, over the castle's dungeons", kind: "trap" },
  { name: "TreeRoom", label: "🌳 the tree houses' trap doors, and the round room's at the top", kind: "tree" },
  { name: "Square", label: "🎚️ placed levers and trap doors, in any square or room", kind: "square" },
  { name: "World", label: "🗺️ the world's ways: which square a way out leads to", kind: "world" },
  { name: "Castle", label: "🏰 the castle's ways: where a pit drops you, and a dungeon's ladder leads", kind: "castle" },
];

// (ticket 531) the whole game's vocabulary, for every room that has logic: what a rule may say (Cmd), what happened (Event), a placed
// thing as a rule sees it (Thing), and what it is told (Globals, built by each room's globals in SCRIPT_ACTS: add a field in both).
// No randomness and no clock in Hazel: the game's draws (draws, from a random wiring's seed) come in through Globals.
const SCRIPT_PREAMBLE = `type Cmd = + Done + Flip(String, Cmd) + Say(String, Cmd) + SetPit(Int, Bool, Cmd) + DropBoulder(Int, Cmd) + LiftBoulder(Int, Cmd) + SetHatch(Int, Bool, Cmd) + OpenDoor(Int, Bool, Cmd) + DropRock(Int, Bool, Cmd) + Wait(Int, Cmd) + GoRoom(Int, Cmd) + GoSquare(Int, Int, String, Cmd) in
type Event = + Pull(String) + PullBoulder(String) + PullHatch(Int) + PullThing(Int) + FallPit(Int) + WayOut(Int) + Way(String) in
type Thing = (at = Int, uid = String, kind = String, on = Bool, works = [String], does = String, open = Bool, boulder = Bool) in
type Cell = (col = Int, row = Int, kind = String, ways = [String]) in
type Globals = (lever_L = Bool, lever_R = Bool, wiring = String, draws = [Float], pits_on = [Bool], covered = [Bool], hatch = Bool, things = [Thing], rooms = [String], exits = [String], out = String, out_room = Int, at_col = Int, at_row = Int, cols = Int, rows = Int, cells = [Cell]) in`;

const SCRIPT_COMMON = `# Sub-routines every room can use, as Common.wire and so on. #
let flip2 = fun (a, b) : (String, String) -> Flip(a, Flip(b, Done));
# the i-th of a list of Bools, false past its end #
let nth = fun (xs, i) : ([Bool], Int) -> case xs | [] => false | x :: rest => if i == 0 then x else nth(rest, i - 1) end;
# which lever works each pit, the left and the right: normal, reversed, or at random by the game's two draws #
let wire = fun (mode, draws) : (String, [Float]) -> (if mode == "reversed" then ("R", "L") else if mode == "random" then (case draws | a :: b :: _ => (if a <. 0.5 then "L" else "R", if b <. 0.5 then "L" else "R") | _ => ("L", "R") end) else ("L", "R"));
# a red lever up? (true is up) #
let up = fun (l, r, side) : (Bool, Bool, String) -> if side == "L" then l else r;
# each pit open: open when the lever working it is up #
let pits_open = fun (l, r, w) : (Bool, Bool, (String, String)) -> let (w0, w1) = w in (up(l, r, w0), up(l, r, w1));
# a pit that changed from was to now: SetPit, else nothing #
let pit_moves = fun (i, was, now, k) : (Int, Bool, Bool, Cmd) -> if was == now then k else SetPit(i, now, k);
let member = fun (s, xs) : (String, [String]) -> case xs | [] => false | x :: rest => x == s || member(s, rest) end;
# where s is in a list of Strings, counting from 1; 0 when it is not there #
let index_of = fun (xs, s) : ([String], String) -> case xs | [] => 0 | x :: rest => if x == s then 1 else (let i = index_of(rest, s) in if i == 0 then 0 else i + 1) end;
# the i-th of a list of Strings, counting from 1; "" past its end #
let nth_s = fun (xs, i) : ([String], Int) -> case xs | [] => "" | x :: rest => if i == 1 then x else nth_s(rest, i - 1) end;
let length = fun xs : [String] -> case xs | [] => 0 | _ :: rest => 1 + length(rest) end;
# the world's eight directions: each one's step across and down the map, and the way back #
let dir = fun d : String -> if d == "N" then (0, 0 - 1) else if d == "NE" then (1, 0 - 1) else if d == "E" then (1, 0) else if d == "SE" then (1, 1) else if d == "S" then (0, 1) else if d == "SW" then (0 - 1, 1) else if d == "W" then (0 - 1, 0) else if d == "NW" then (0 - 1, 0 - 1) else (0, 0);
let opp = fun d : String -> if d == "N" then "S" else if d == "NE" then "SW" else if d == "E" then "W" else if d == "SE" then "NW" else if d == "S" then "N" else if d == "SW" then "NE" else if d == "W" then "E" else if d == "NW" then "SE" else ""`;

const SCRIPT_TRAP = `# A red lever pulled: flip it, and each pit wired to it opens or shuts. #
# A blue lever pulled: each of its pits gets a boulder, or loses one. #
let on_event = fun (g, e) : (Globals, Event) ->
  let w = Common.wire(g.wiring, g.draws) in
  let (w0, w1) = w in
  case e
  | Pull(side) =>
    let (was0, was1) = Common.pits_open(g.lever_L, g.lever_R, w) in
    let l = if side == "L" then !g.lever_L else g.lever_L in
    let r = if side == "R" then !g.lever_R else g.lever_R in
    let (now0, now1) = Common.pits_open(l, r, w) in
    Flip("lever_" ++ side, Common.pit_moves(0, was0, now0, Common.pit_moves(1, was1, now1, Done)))
  | PullBoulder(side) =>
    let mine0 = w0 == side && Common.nth(g.pits_on, 0) in
    let mine1 = w1 == side && Common.nth(g.pits_on, 1) in
    let lift = (mine0 && Common.nth(g.covered, 0)) || (mine1 && Common.nth(g.covered, 1)) in
    let one = fun (i, mine, k) : (Int, Bool, Cmd) -> if !mine then k else if lift then LiftBoulder(i, k) else DropBoulder(i, k) in
    one(0, mine0, one(1, mine1, Done))
  | _ => Done
  end`;

// (ticket 531, Matthew: "let's do an experimental PR to dress-up where we try to export as much game logic as possible into the Hazel
// panels for each square (or common logic) --- and do the speedruns again to compare against plain JS") one build, both ways:
// ?logic=hazel runs every room's logic through the shipped texts (🧩 on, whatever the friend saved), ?logic=js the plain JS (🧩 off,
// whatever was saved); no switch, the panel's (state.scripts.on). Read once, at start.
const SCRIPT_TREE = `# A tree room's trap-door lever, or the round room's at the top (house 0): #
# the trap door shuts if open, opens if shut. #
let on_event = fun (g, e) : (Globals, Event) ->
  case e
  | PullHatch(n) => SetHatch(n, !g.hatch, Done)
  | _ => Done
  end`;

const SCRIPT_SQUARE = `# A placed lever pulled: each trap door wired to it swings, #
# or, a boulder lever, gets its rock or loses it. #
let on_event = fun (g, e) : (Globals, Event) ->
  case e
  | PullThing(i) =>
    let find = fun ts : [Thing] -> case ts | [] => None | t :: rest => if t.at == i then Some(t) else find(rest) end in
    let doors = fun (lever, ts) : (Thing, [Thing]) ->
      case ts
      | [] => Done
      | d :: rest =>
        let k = doors(lever, rest) in
        if !(d.kind == "trapdoor" && Common.member(d.uid, lever.works)) then k
        else if lever.does == "boulder" then (if d.boulder == !lever.on then k else DropRock(d.at, !lever.on, k))
        else OpenDoor(d.at, !d.open, k)
      end in
    (case find(g.things) | Some(t) => doors(t, g.things) | None => Done end)
  | _ => Done
  end`;

// (ticket 531, phase 2) the world's ways, decided when one is walked through: the square beside this one that way, if it is on the
// map, there, and has a way back (worldMeets and worldWays' rule, 25-world.js). A way linked to another world stays the JS's.
const SCRIPT_WORLD = `# Places with no way out on a side, whatever their ways say: the waterfall's N, its cliff. #
let no_way = fun (kind, d) : (String, String) -> kind == "waterfall" && d == "N";
let find = fun (cs, c, r) : ([Cell], Int, Int) -> case cs | [] => None | x :: rest => if x.col == c && x.row == r then Some(x) else find(rest, c, r) end;
# A way out walked through: into the square beside it, coming in from the side facing back, #
# if that square is on the map and has a way back; else nowhere. #
let on_event = fun (g, e) : (Globals, Event) ->
  case e
  | Way(d) =>
    let (dx, dy) = Common.dir(d) in
    let c = g.at_col + dx in
    let r = g.at_row + dy in
    let back = Common.opp(d) in
    if c < 0 || r < 0 || c >= g.cols || r >= g.rows then Done
    else (case find(g.cells, c, r)
      | Some(x) => if Common.member(back, x.ways) && !no_way(x.kind, back) then GoSquare(c, r, back, Done) else Done
      | None => Done
      end)
  | _ => Done
  end`;

// (ticket 531, phase 2) the castle's ways, decided when they are taken (never per frame, never per drawing): which room a trap
// room's pit drops you into, and where a dungeon's ladder up leads (wayOutOf's rule, 13-castle-rooms-and-map.js). The rooms come in as
// their kinds, room 1 first, with each one's exits (ROOM_KINDS' exits), and this room's way out setting
const SCRIPT_CASTLE = `# Where room n's way out leads: 0 out of the castle, a room, or -1 nowhere. #
# out is its setting (auto, out, none, or a room, then out_room); auto: #
# a dungeon's ladder up to the trap room, room 1 out, any other to room 1. #
let way_out = fun (rooms, exits, n, out, out_room) : ([String], [String], Int, String, Int) ->
  let ex = Common.nth_s(exits, n) in
  let s_out = ex == "side" || ex == "long" || ex == "spiral" in
  let v = if out == "none" && !s_out then "auto" else out in
  if v == "auto" then (let t = Common.index_of(rooms, "trap") in if ex == "ladder" && t > 0 && !(t == n) then t else if n == 1 then 0 else 1)
  else if v == "out" then 0
  else if v == "none" then 0 - 1
  else if out_room >= 1 && out_room <= Common.length(rooms) then out_room else 0 - 1;
# A trap room's pit fallen into (0 the left, 1 the right): #
# the first pit drops into the dungeon, the second into the deep dungeon; #
# a castle with only one of them, both into that one. #
let on_event = fun (g, e) : (Globals, Event) ->
  let d1 = Common.index_of(g.rooms, "dungeon1") in
  let d2 = Common.index_of(g.rooms, "dungeon2") in
  case e
  | FallPit(i) =>
    let to = if i == 0 then (if d1 > 0 then d1 else d2) else (if d2 > 0 then d2 else d1) in
    if to == 0 then Done else GoRoom(to, Done)
  | WayOut(n) => GoRoom(way_out(g.rooms, g.exits, n, g.out, g.out_room), Done)
  | _ => Done
  end`;

// each room kind's shipped text: rules that do just what the plain JS does, so 🧩 on plays the same game (the fair comparison)
const SCRIPT_TEXTS = { trap: SCRIPT_TRAP, tree: SCRIPT_TREE, square: SCRIPT_SQUARE, world: SCRIPT_WORLD, castle: SCRIPT_CASTLE };
const SCRIPT_LOGIC = (() => { try { const v = new URLSearchParams(location.search || "").get("logic"); return v === "hazel" || v === "js" ? v : ""; } catch (e) { return ""; } })();
const scriptsOn = () => SCRIPT_LOGIC === "hazel" || (SCRIPT_LOGIC !== "js" && !!(state.scripts && state.scripts.on));
const SCRIPT_DEFAULTS = () => ({ common: SCRIPT_COMMON, rooms: Object.fromEntries(SCRIPT_ROOMS.map(r => [r.name, SCRIPT_TEXTS[r.kind] || ""])) });

function scriptsState() {
  const S = state.scripts || (state.scripts = { on: false, common: null, rooms: {} });
  if (S.common == null) S.common = SCRIPT_COMMON;
  S.rooms = S.rooms || {};
  for (const r of SCRIPT_ROOMS) if (S.rooms[r.name] == null) S.rooms[r.name] = SCRIPT_TEXTS[r.kind] || "";
  return S;
}

// (Matthew: "Names should be unique, and we should enforce that") a module name from a room's or square's name: a capital, then
// letters and digits; a second of the same name gets a number
function scriptModuleName(label, taken) {
  let base = String(label).replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join("") || "Room";
  if (!/^[A-Z]/.test(base)) base = "R" + base;
  let n = base, i = 2;
  while (taken.has(n) || n === "Common") n = base + i++;
  taken.add(n);
  return n;
}
const scriptNames = () => { const seen = new Set(); for (const r of SCRIPT_ROOMS) { if (seen.has(r.name) || r.name === "Common") return false; seen.add(r.name); } return true; };

// a module's body as written, without a last ";" (the program puts each in its braces; Hazel reads a member after a last ";" as a hole)
const scriptBody = t => String(t || "").replace(/;\s*$/, "").trim();

// (ticket 520) the program as Hazel.runProgram takes it, and as the frame shows it: the preamble, a module per editor (📚 Common, then
// each room's) with its text as written, and what the program gives: each room's on_event, held to the type a rule has (so a rule of
// another type is an error, and its room's), and the number of rooms (always two fields or more: a labeled tuple of one may not
// come back as an object). A blank room has no on_event: an error, its room's, so its levers work as before.
const scriptTail = () => "(" + [...SCRIPT_ROOMS.map(r => `${r.name.toLowerCase()} = (${r.name}.on_event : (Globals, Event) -> Cmd)`), `rooms = ${SCRIPT_ROOMS.length}`].join(", ") + ")";
function scriptSpec() {
  const S = SCRIPT_LOGIC === "hazel" ? SCRIPT_DEFAULTS() : scriptsState();
  return { preamble: SCRIPT_PREAMBLE,
    modules: [{ name: "Common", text: scriptBody(S.common) }, ...SCRIPT_ROOMS.map(r => ({ name: r.name, text: scriptBody(S.rooms[r.name]) }))],
    tail: scriptTail() };
}

// The program as one text, joined by the page: for a library without runProgram (an older build, or one cached from before)
function scriptProgram() {
  const S = SCRIPT_LOGIC === "hazel" ? SCRIPT_DEFAULTS() : scriptsState();
  return [SCRIPT_PREAMBLE,
    `module Common = {\n${scriptBody(S.common) || "let nothing = ()"}\n} in`,
    ...SCRIPT_ROOMS.map(r => `module ${r.name} = {\n${scriptBody(S.rooms[r.name]) || "let on_event = fun (g, e) : (Globals, Event) -> Done"}\n} in`),
    // (always two fields or more: a labeled tuple of one may not come back as an object)
    "(" + [...SCRIPT_ROOMS.map(r => `${r.name.toLowerCase()} = ${r.name}.on_event`), `rooms = ${SCRIPT_ROOMS.length}`].join(", ") + ")"].join("\n");
}

// (ticket 520) what Hazel says of a program of modules (runProgram's result, or the frame's status), in lines for the panel: each
// error with its module's name ("TrapRoom: ..."; the preamble's and the tail's, "the program: ..."), then what is not finished,
// each module's holes and its brackets or keywords without their partner; and whether it is ready to run (Hazel's ok, and nothing
// in those lines)
const scriptPlural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function scriptReport(r) {
  const errors = Array.from((r && r.errors) || []).map(e => e && typeof e === "object" ? `${e.module || "the program"}: ${e.message}` : String(e));
  const unfinished = [], put = (who, holes, open) => {
    const bits = [];
    if (holes > 0) bits.push(scriptPlural(holes, "hole to fill", "holes to fill"));
    if (open > 0) bits.push(scriptPlural(open, "bracket or keyword without its partner", "brackets or keywords without their partners"));
    if (bits.length) unfinished.push(`${who}: ${bits.join(", ")}`);
  };
  const H = (r && r.holes) || {}, I = (r && r.incomplete) || {};
  for (const m of new Set([...Object.keys(H), ...Object.keys(I)])) put(m, +H[m] || 0, +I[m] || 0);
  put("the program", +(r && r.programHoles) || 0, +(r && r.programIncomplete) || 0);
  return { errors, unfinished, ok: !!(r && r.ok === true) && !errors.length && !unfinished.length };
}

let hazelLoading = null;
// window.Hazel, loaded once
function hazelLoad() {
  if (window.Hazel) return Promise.resolve(window.Hazel);
  if (!hazelLoading) hazelLoading = new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = SCRIPT_LIB_URL; s.async = true;
    s.onload = () => window.Hazel ? ok(window.Hazel) : no(new Error("no window.Hazel"));
    s.onerror = () => { hazelLoading = null; no(new Error("Hazel did not load")); };
    document.head.append(s);
  });
  return hazelLoading;
}

// the program, analyzed and run once per text: its errors, what is not finished, whether it is ready, and its rooms' handlers. Through
// Hazel.runProgram (ticket 520: Hazel builds the program from the module texts) where the library has it; otherwise the text the page
// joins, through Hazel.run, ready when it has no errors (via says which)
let scriptCompiled = { key: null, via: "", errors: [], unfinished: [], ready: false, handlers: {}, ms: 0 };
function scriptCompile() {
  const H = window.Hazel;
  if (!H) return null;
  const viaProgram = typeof H.runProgram === "function", spec = viaProgram ? scriptSpec() : null;
  const key = viaProgram ? "program:" + JSON.stringify(spec) : "text:" + scriptProgram();
  if (scriptCompiled.key === key) return scriptCompiled;
  const t0 = performance.now();
  let errors = [], unfinished = [], ready = false, handlers = {};
  try {
    const r = viaProgram ? H.runProgram(spec) : H.run(key.slice(5));
    if (viaProgram) ({ errors, unfinished, ok: ready } = scriptReport(r));
    else { errors = Array.from(r.errors || []).map(String); ready = !errors.length; }
    const v = r.value || {};
    for (const room of SCRIPT_ROOMS) { const f = v[room.name.toLowerCase()]; if (typeof f === "function") handlers[room.name] = f; }
    // (fine by Hazel, yet a room's rule not a function here: said, and not ready)
    if (ready) for (const room of SCRIPT_ROOMS) if (!handlers[room.name]) { errors.push(`${room.name}: its on_event did not come back as a function`); ready = false; }
  } catch (e) { errors = [String(e && e.message || e)]; ready = false; }
  scriptCompiled = { key, via: viaProgram ? "runProgram" : "run", errors, unfinished, ready, handlers, ms: performance.now() - t0 };
  hzPush(hzCounters().compileMs, scriptCompiled.ms);   // (ticket 531)
  return scriptCompiled;
}

// a few words over the picture, for a script's Say
function scriptSay(text) {
  let b = document.getElementById("script-say");
  if (!b) { b = el("div", { id: "script-say", class: "script-say" }); document.body.append(b); }
  b.textContent = "🧩 " + text; b.hidden = false;
  clearTimeout(scriptSay.t); scriptSay.t = setTimeout(() => { b.hidden = true; }, 3000);
}

// (ticket 531) the time Hazel and the plain JS each take per event, for the speed runs to read (tools/hazellogic531.mjs): calls, each
// handler call's ms (ms), each command walk's (runMs), each compile's (compileMs), the commands not understood (unknown), and per event
// tag the whole event's ms in each mode (hazel, js: from the guard to the last command acted on, the drawing after it not counted)
const HZ_KEEP = 5000;
const hzCounters = () => window.__hz || (window.__hz = { calls: 0, ms: [], runMs: [], compileMs: [], unknown: 0, unknownTags: [], mismatch: 0, hazel: {}, js: {} });
const hzPush = (a, v) => { if (a.length < HZ_KEEP) a.push(Math.round(v * 1000) / 1000); };
// (the plain JS's own handler, timed the same way: the whole event)
function hzJs(tag, f) { const t0 = performance.now(); try { return f(); } finally { const Z = hzCounters(); hzPush(Z.js[tag] || (Z.js[tag] = []), performance.now() - t0); } }

// the commands a rule gave, run in order, each by the room's act (its tag's method, with the command's fields before the rest);
// Wait(ms, rest) runs the rest later. A tag the room does not know ends the walk, counted (__hz.unknown) and said once.
// end() runs once, when the walk ends, however it ends (after a Wait too, so what the walk gathered stays with its own event)
function scriptRun(cmd, act, depth = 0, end = () => {}) {
  if (!cmd || depth > 200 || cmd.tag === "Done") return end();
  const v = Array.isArray(cmd.value) ? cmd.value : [cmd.value], k = v.length > 1 ? v[v.length - 1] : null, args = v.length > 1 ? v.slice(0, -1) : v;
  if (cmd.tag === "Say") { scriptSay(String(args[0])); return scriptRun(k, act, depth + 1, end); }
  if (cmd.tag === "Wait") { setTimeout(() => scriptRun(k, act, depth + 1, end), Math.max(0, +args[0] || 0)); return; }
  if (typeof act[cmd.tag] === "function" && act[cmd.tag](...args) !== false) return scriptRun(k, act, depth + 1, end);
  const Z = hzCounters(); Z.unknown++; if (Z.unknownTags.length < 20) Z.unknownTags.push(String(cmd.tag));
  if (Z.unknown === 1) scriptSay(`a command this room does not know: ${cmd.tag}`);
  end();
}

// (the empty fields of a room's globals that are not its own)
const scriptNoGlobals = () => ({ lever_L: false, lever_R: false, wiring: "normal", draws: [], pits_on: [], covered: [], hatch: false, things: [], rooms: [], exits: [], out: "auto", out_room: -1, at_col: 0, at_row: 0, cols: 0, rows: 0, cells: [] });
// (ticket 531) the event's room, its globals and how its commands act: per room kind (SCRIPT_ROOMS' kind), filled in as rules move
const SCRIPT_ACTS = {
  trap: {
    here: () => { const B = state.background; if (B.kind !== "castleroom") return false; const K = castleOf(B), n = Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1))); return K.rooms[n - 1] === "trap"; },
    globals: () => { const B = state.background, K = castleOf(B), n = Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1)));
      const T = trapState(B, n, K.id), r = seeded(B[leverSeedKey(n, K.id)] ?? 1);
      return { lever_L: !leverDown(B, "L", n, K.id), lever_R: !leverDown(B, "R", n, K.id), wiring: B[leverWireKey(n, K.id)] || "normal", draws: [r(0), r(1)],
        pits_on: T.on, covered: T.covered, hatch: false, things: [], rooms: [], exits: [], out: "auto", out_room: -1, at_col: 0, at_row: 0, cols: 0, rows: 0, cells: [] }; },
    // (a Flip moves the lever only; each SetPit swings its pit's lid, the rule having said which: ticket 531. A pit the rule says
    // otherwise than the drawing, which follows the levers, is counted in __hz.mismatch)
    // (each event its own gathered boulders, handed to done when its walk ends)
    act: () => { const got = { drop: [], lift: [] }; return { got, Flip: name => { if (name === "lever_L") roomLeverFlip("L", false); else if (name === "lever_R") roomLeverFlip("R", false); else return false; },
                  SetPit: (i, open) => { if (i !== 0 && i !== 1) return false; if (!roomPitSwing(i, !!open)) hzCounters().mismatch++; },
                  // (a blue lever: the boulders the rule names, gathered, then dropped or lifted together when the walk ends, as the
                  // JS's roomBoulderAct; none named, the lever still turns, down)
                  DropBoulder: i => { if (i !== 0 && i !== 1) return false; got.drop.push(i); },
                  LiftBoulder: i => { if (i !== 0 && i !== 1) return false; got.lift.push(i); } }; },
    done: (ev, a) => { if (ev.tag !== "PullBoulder") return; const { drop, lift } = a.got;
      roomBoulderAct(String(ev.value), lift.length ? lift : drop, lift.length > 0); },
  },
  // (a tree room's trap door, PullHatch(n), n its house, 0 the round room at the top; hatch: that door shut)
  tree: {
    here: ev => { const k = state.background.kind; return (k === "treeroom" || k === "treetop") && ev.value === hatchHouse(); },
    globals: () => ({ ...scriptNoGlobals(), hatch: !!state.background[hatchKey()] }),
    act: () => ({ SetHatch: (n, shut) => { if (n !== hatchHouse()) return false; hatchSet(!!shut); } }),
  },
  // (a placed lever, PullThing(i), i its place in the square's things; things: its levers and trap doors, each with its place (at).
  // Copied whole for each pull, so its cost grows with the square's levers and doors: the speed runs measure it)
  square: {
    here: ev => { const T = (state.background.things || [])[ev.value]; return !!T && T.kind === "lever"; },
    globals: () => ({ ...scriptNoGlobals(), things: (state.background.things || []).flatMap((t, at) => t.kind === "lever" || t.kind === "trapdoor"
      ? [{ at, uid: String(t.uid || ""), kind: t.kind, on: !!t.on, works: (t.works || []).map(String), does: String(t.does || ""), open: !!t.open, boulder: !!t.boulder }] : []) }),
    act: () => { const doors = []; return { doors, OpenDoor: (at, open) => { doors.push([at, "open", !!open]); }, DropRock: (at, down) => { doors.push([at, "boulder", !!down]); } }; },
    done: (ev, a) => { leverPullApply(ev.value, a.doors); },
  },
  // (ticket 531, phase 2: a world's way out walked through; scriptWay) Way(d), d one of WORLD_DIRS; cells: every square with its
  // place and its ways as set (a crossing's, its paths switched on), unfiltered: the rule knows the waterfall's cliff. Copied
  // whole for each way, so its cost grows with the map: the speed runs measure it. GoSquare(col, row, side): there, in from side
  world: {
    here: ev => { const W = state.world, cell = W && W.at && W.cells[W.at]; return !!cell && !!WORLD_DIRS[ev.value] && !(cell.links && cell.links[ev.value]); },
    globals: () => { const W = state.world, [ac, ar] = W.at.split(",").map(Number);
      return { ...scriptNoGlobals(), at_col: ac, at_row: ar, cols: W.cols, rows: W.rows, cells: Object.entries(W.cells).map(([k, cell]) => { const [col, row] = k.split(",").map(Number);
        return { col, row, kind: String(cell.kind), ways: (cell.kind === "crossing" ? CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : cell.ways || []).map(String) }; }) }; },
    act: () => { const got = { go: null }; return { got, GoSquare: (c, r, side) => { got.go = { key: Math.round(+c) + "," + Math.round(+r), side: String(side) }; } }; },
  },
  // (ticket 531, phase 2: a castle's ways, as they are taken; scriptGo) FallPit(i): a trap room's pit i fallen into; WayOut(n): a
  // dungeon's (a ladder room's) one way, its ladder up, taken from room n. GoRoom(r) says
  // where to: r a room, 0 out of the castle, below 0 nowhere; the walk is the JS's (enterScene), to that room
  castle: {
    here: ev => { const B = state.background; if (B.kind !== "castleroom") return false; const K = castleOf(B), n = castleRoomNow(B, K);
      return ev.tag === "FallPit" ? K.rooms[n - 1] === "trap" : ev.tag === "WayOut" && ev.value === n && ROOM_KINDS[K.rooms[n - 1]].exits === "ladder"; },
    globals: () => { const B = state.background, K = castleOf(B), n = castleRoomNow(B, K), out = K.hall[n - 1].out, r = Number(out);
      return { ...scriptNoGlobals(), rooms: K.rooms.slice(), exits: K.rooms.map(st => ROOM_KINDS[st].exits), out, out_room: Number.isInteger(r) ? r : -1 }; },
    act: () => { const got = { go: null }; return { got, GoRoom: r => { got.go = Math.round(+r); } }; },
  },
};
// (the castle room the friend is in, as the game reads it)
const castleRoomNow = (B, K = castleOf(B)) => Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1)));

// (ticket 531, phase 2) a world's way out walked through (worldWalk): with 🧩 on and ready, the World rule says which square it leads
// to (worldTarget's answer, or null: nowhere); what worldTarget says is checked against it, a difference counted in __hz.mismatch.
// Otherwise, and for a way linked to another world, worldTarget, as always
function scriptWay(W, d) {
  if (!scriptEvent("World", { tag: "Way", value: d })) return hzJs("Way", () => worldTarget(W, W.at, d));
  if (!scriptEvent.act) return worldTarget(W, W.at, d);   // (the rule stopped: the JS's answer, not counted as a mismatch)
  const go = scriptEvent.act.got.go, t = go && W.cells[go.key] ? { W, key: go.key, cell: W.cells[go.key], link: false } : null;
  const js = worldTarget(W, W.at, d);
  if ((js ? js.key : null) !== (t ? t.key : null) || (go && go.side !== WORLD_OPP[d])) hzCounters().mismatch++;
  return t;
}

// (ticket 531, phase 2) a castle door or pit taken: with 🧩 on and ready, the Castle rule says where it leads, and enterScene goes
// there ({to, room}; false: nowhere, so not at all); what the drawing put on the door (decided when it was drawn) is checked
// against it, a difference counted in __hz.mismatch. null: the JS's own way, the door's data-to and data-room, as always
function scriptGo(door) {
  const B = state.background, pit = door.dataset.pit;
  if (B.kind !== "castleroom" || (!pit && door.dataset.to !== "castle" && door.dataset.to !== "castleroom")) return null;
  if (!pit) { const K = castleOf(B); if (ROOM_KINDS[K.rooms[castleRoomNow(B, K) - 1]].exits !== "ladder") return null; }
  // (a pit, by its side: the left's middle is left of the room's; else a door, which in a dungeon is its ladder up)
  const ev = pit ? { tag: "FallPit", value: +pit.split(" ")[0] < 0 ? 0 : 1 } : { tag: "WayOut", value: castleRoomNow(B) };
  if (!scriptEvent("Castle", ev)) { hzJs(ev.tag, () => door.dataset.room); return null; }
  if (!scriptEvent.act) return null;   // (the rule stopped: the door's own way, not counted as a mismatch)
  const got = scriptEvent.act.got, r = got && got.go, go = r == null || r < 0 ? false : r === 0 ? { to: "castle", room: undefined } : { to: "castleroom", room: String(r) };
  if ((go ? go.to : null) !== door.dataset.to || (go ? go.room : undefined) !== door.dataset.room) hzCounters().mismatch++;
  return go;
}

// (ticket 531; ticket 482's scriptPull) an event in a room, with 🧩 on and the program ready: the room's rule says what happens, its
// commands are acted on, and true. Otherwise false, and the caller's own JS runs as it always has: 🧩 off, Hazel not loaded yet,
// not ready (errors, a hole to fill, a bracket left open), no handler for the room, or not in that room
function scriptEvent(room, ev) {
  scriptEvent.act = null;
  if (!scriptsOn()) return false;
  const R = SCRIPT_ROOMS.find(r => r.name === room), A = R && SCRIPT_ACTS[R.kind];
  if (!A || !A.here(ev)) return false;
  if (!window.Hazel) { hazelLoad().catch(() => {}); return false; }
  const t0 = performance.now(), Z = hzCounters();
  const C = scriptCompile(), f = C && C.ready && C.handlers[room];
  if (!f) return false;
  let cmd;
  const t1 = performance.now();
  try { cmd = f(A.globals(ev), ev); } catch (e) { scriptSay("the rule stopped: " + (e && e.message || e)); Z.stopped = (Z.stopped || 0) + 1; return true; }
  const t2 = performance.now();
  const act = scriptEvent.act = A.act(ev);   // (kept, for a caller that reads what the walk gathered: scriptGo)
  scriptRun(cmd, act, 0, () => { if (A.done) A.done(ev, act); });
  const t3 = performance.now();
  Z.calls++; hzPush(Z.ms, t2 - t1); hzPush(Z.runMs, t3 - t2); hzPush(Z.hazel[ev.tag] || (Z.hazel[ev.tag] = []), t3 - t0);
  return true;
}

// (ticket 520) 🧩 Hazel's tiles: under the editors, Hazel's own app in a frame (SCRIPT_FRAME_URL, its embed mode; the messages are
// protocol 1 of docs/hazel-as-a-js-library.md on hazelgrove/hazel#2719's branch) showing the whole program as one read-only cell of
// tiles, with Hazel's own error marks. The page posts the program ({type: "set", ...scriptSpec()}) when the frame says "ready" and
// then on the panel's change timer, no more often (scriptFramePost); the frame posts back its height ("size") and what Hazel says
// of the program ("status"), each only when it changes, and "crash". Taken only from SCRIPT_HAZEL_ORIGIN, with the frame as source.
//   Lazy: made only with the 🧩 tab open, after showTab's layout (boxLayout and tabDesigner move the panel's rows, and a frame moved
// in the page loads again), and gone with the tab (showTab empties the panel: the frame's page goes with it), so the next visit
// loads it again. While the game is full screen the panel is visibility: hidden, which keeps a frame laid out and, in some
// browsers, drawing every animation frame; so there the frame is display: none (style.css), which browsers throttle (the 60
// frames a second rule). A frame first laid out undisplayed measures Hazel's font as nothing (the hidden-pane lesson), so one is
// never made while the panel is hidden; Hazel measures its font again when it is shown.
//   A frame that has not said "ready" in SCRIPT_FRAME_WAIT, that says "crash" before it, or that speaks another protocol, is taken
// away, its words in its place and a button to start it again: the text boxes work all along. The wait counts only the time the
// frame can draw (scriptFrameCanDraw: the page shown, the game not full screen, the frame on screen), as Hazel says "ready" only
// after its first display, which needs the frame's animation frames, and browsers stop those in a frame out of view, undisplayed
// or in a hidden tab; so does the ten seconds before "no program" is said. A "crash" after "ready" is said by the tiles and they
// are kept (Hazel keeps its last model and goes on), unless SCRIPT_FRAME_CRASHES come within a minute. Its height is the one
// posted, at most SCRIPT_FRAME_MAX; its box scrolls past a screenful (style.css).
//   The keys: a click in the frame gives it the keyboard, as any frame takes it; the tiles are only for looking, and the game's keys
// (B, F, Enter, Escape) are wanted back, so a frame given the focus gives it back (scriptFrameBlur).
const SCRIPT_FRAME_WAIT = 30000, SCRIPT_FRAME_QUIET = 10000, SCRIPT_FRAME_TICK = 1000;
const SCRIPT_FRAME_MAX = 4000, SCRIPT_FRAME_CRASHES = 3;
// the frame now: { iframe, holder, phase ("loading", "ready", "late", "crashed"), made, readyMs, build, sent, status, height, why (the
// words it was taken away with, or "quiet": ready, yet no status SCRIPT_FRAME_QUIET on), crashes (the times of its crashes after ready)
// and oops (the last one's words), blurs, inView (false while off screen), waited and quiet (the ms it could draw while loading, and
// since ready), tick (the timer counting them) and seen (its IntersectionObserver) }
let scriptFrame = null, scriptFrameListening = false;
const scriptFrameHidden = () => document.hidden || document.body.classList.contains("big");
const scriptFrameCanDraw = F => !scriptFrameHidden() && F.inView !== false;
// (once a second while loading, or ready with no status yet: the time the frame could draw, counted; nothing after that)
function scriptFrameTick(F) {
  clearTimeout(F.tick);
  F.tick = setTimeout(() => {
    if (scriptFrame !== F || !F.iframe.isConnected) { scriptFrameEnd(F); return; }
    const can = scriptFrameCanDraw(F);
    if (F.phase === "loading") {
      if (can && (F.waited += SCRIPT_FRAME_TICK) >= SCRIPT_FRAME_WAIT) { scriptFrameStop(F, "late"); return; }
    } else if (F.phase === "ready" && !F.status) {
      if (can && (F.quiet += SCRIPT_FRAME_TICK) >= SCRIPT_FRAME_QUIET) { F.why = "quiet"; scriptFrameShow(F); return; }
    } else return;
    scriptFrameTick(F);
  }, SCRIPT_FRAME_TICK);
}
function scriptFrameEnd(F) { clearTimeout(F.tick); if (F.seen) { F.seen.disconnect(); F.seen = null; } }
function scriptFrameMount(holder) {
  if (!holder || !holder.isConnected || (scriptFrame && scriptFrame.holder === holder && scriptFrame.iframe.isConnected)) return;
  // (not while the panel is hidden: later, if the tab is still open then)
  if (scriptFrameHidden()) { setTimeout(() => scriptFrameMount(holder), 1000); return; }
  if (scriptFrame) scriptFrameEnd(scriptFrame);
  if (!scriptFrameListening) {
    scriptFrameListening = true;
    window.addEventListener("message", scriptFrameMessage);
    window.addEventListener("blur", scriptFrameBlur);
  }
  const wrap = holder.querySelector(".script-frame-wrap");
  const iframe = el("iframe", { class: "script-frame", src: SCRIPT_FRAME_URL, tabindex: "-1",
    title: "Hazel's tiles: the whole program, read only, with Hazel's own marks where something is wrong" });
  const F = scriptFrame = { iframe, holder, phase: "loading", made: performance.now(), readyMs: null, build: null, sent: null, status: null, height: 0, why: "",
    crashes: [], oops: "", blurs: 0, inView: undefined, waited: 0, quiet: 0, tick: 0, seen: null };
  wrap.replaceChildren(iframe);
  if (typeof IntersectionObserver === "function") { F.seen = new IntersectionObserver(es => { for (const e of es) F.inView = e.isIntersecting; }); F.seen.observe(iframe); }
  scriptFrameTick(F);
  scriptFrameShow(F);
}
function scriptFrameStop(F, phase, why = "") {
  scriptFrameEnd(F);
  F.phase = phase; F.why = why;
  F.iframe.remove();
  scriptFrameShow(F);
}
function scriptFrameMessage(e) {
  const F = scriptFrame;
  if (!F || e.origin !== SCRIPT_HAZEL_ORIGIN || !F.iframe.contentWindow || e.source !== F.iframe.contentWindow) return;
  const m = e.data || {};
  if (m.type === "ready") {
    // (a build that speaks other messages, as a branch build may after a push: its fields would be misread, so it is put away)
    if (m.protocol !== 1) { scriptFrameStop(F, "crashed", `they speak protocol ${m.protocol}, and this game knows protocol 1`); return; }
    if (F.phase === "loading") { F.phase = "ready"; F.readyMs = performance.now() - F.made; }
    F.build = m.build || null; F.sent = null;
    scriptFramePost();
    // (a frame that takes no program says nothing back: it takes programs only from the pages it knows, EmbedProtocol.re's
    // site_origins and dev_hosts, so a copy of the game served from elsewhere, or from disk, has no tiles; said, after a while)
    F.quiet = 0; if (!F.status) scriptFrameTick(F);
  } else if (m.type === "size") {
    const h = Math.max(24, Math.min(SCRIPT_FRAME_MAX, Math.ceil(+m.height || 0)));
    if (h !== F.height) { F.height = h; F.iframe.style.height = h + "px"; }
    return;
  } else if (m.type === "status") F.status = m;
  else if (m.type === "crash") {
    const why = String(m.message || ""), t = performance.now();
    // (before ready, or again and again: taken away; otherwise said, and the tiles kept, as Hazel keeps its last program and goes on)
    F.crashes = F.crashes.filter(x => t - x < 60000); F.crashes.push(t);
    if (F.phase !== "ready" || F.crashes.length >= SCRIPT_FRAME_CRASHES) { scriptFrameStop(F, "crashed", why); return; }
    F.oops = why || "an error";
  }
  else return;
  scriptFrameShow(F);
}
// the program to the frame, when it is ready and the program is not the one it has
function scriptFramePost() {
  const F = scriptFrame;
  if (!F || F.phase !== "ready" || !F.iframe.isConnected || !F.iframe.contentWindow) return;
  const spec = scriptSpec(), key = JSON.stringify(spec);
  if (key === F.sent) return;
  F.sent = key;
  F.iframe.contentWindow.postMessage({ type: "set", ...spec }, SCRIPT_HAZEL_ORIGIN);
}
// (the page's window losing the focus: to the frame, after a click in it; the click done, the focus back to the page)
function scriptFrameBlur() {
  setTimeout(() => {
    const F = scriptFrame;
    if (!F || document.activeElement !== F.iframe) return;
    F.blurs++; F.iframe.blur(); window.focus();
  }, 200);
}
// the frame's state, in words, by it: starting, what Hazel says of the program (fine, or each module's errors and holes), or why it
// is gone, with a button to start it again
function scriptFrameShow(F) {
  const line = F.holder.querySelector(".script-frame-status"), list = F.holder.querySelector(".script-frame-errors");
  if (!line || !list) return;
  let words = "", items = [], again = false;
  if (F.phase === "loading") words = "⏳ Hazel's tiles are starting (the text boxes above work meanwhile)…";
  else if (F.phase === "late") { words = `Hazel's tiles did not start in ${SCRIPT_FRAME_WAIT / 1000} s, so they are put away: the text boxes above keep working.`; again = true; }
  else if (F.phase === "crashed") { words = "Hazel's tiles stopped" + (F.why ? ` (${F.why})` : "") + ": the text boxes above keep working."; again = true; }
  else if (!F.status) words = F.why === "quiet"
    ? `Hazel's tiles have had no program: they take one only from matthewhammer.org and localhost, not from this page's address (${location.origin}).`
    : "Hazel's tiles: reading the program…";
  else {
    const R = scriptReport(F.status);
    words = R.ok ? "✅ As Hazel reads it, the program is fine." : R.errors.length
      ? `❗ As Hazel reads it, the program has ${scriptPlural(R.errors.length, "error", "errors")}, marked in the tiles:`
      : "✏️ As Hazel reads it, the program is not finished:";
    items = [...R.errors, ...R.unfinished];
    // (the frame's build and the library's can differ for up to ten minutes after a deploy: a branch build is cached)
    const lib = window.Hazel && window.Hazel.build;
    if (lib && F.build && lib !== F.build && lib !== "local" && F.build !== "local") words += ` (the tiles are from Hazel ${F.build.slice(0, 10)}, the levers' Hazel from ${lib.slice(0, 10)}: a reload in ten minutes makes them one)`;
  }
  if (F.phase === "ready" && F.oops) words += ` (Hazel's tiles had an error, ${F.oops}, and carry on)`;
  line.replaceChildren(words, ...(again ? [" ", el("button", { class: "script-frame-again", onclick: () => { scriptFrame = null; scriptFrameMount(F.holder); } }, "↻ start the tiles again")] : []));
  list.replaceChildren(...items.slice(0, 8).map(t => el("li", {}, t)));
}

// the 🧩 Scripting tab: a switch, Hazel's state, then an editor per module, each with the module's name; the program's errors
// under them, at each change, a moment after typing stops; then (ticket 520) Hazel's tiles of the whole program
function scriptingPanel(box) {
  const S = scriptsState();
  const status = el("div", { class: "hint script-status" }, "Hazel: loading…");
  const errs = el("ul", { class: "script-errors" });
  const sync = () => {
    scriptFramePost();   // (ticket 520: the tiles, on the same timer)
    if (!window.Hazel) return;
    const C = scriptCompile();
    status.textContent = `Hazel ${window.Hazel.version}: the program ${C.errors.length ? `has ${scriptPlural(C.errors.length, "error", "errors")}, so the levers work as before`
      : !C.ready ? "is not finished, so the levers work as before" : "is fine"} (analyzed and run in ${Math.round(C.ms)} ms)`;
    status.title = C.via === "runProgram" ? "built by Hazel from the modules (Hazel.runProgram)" : "joined by the game, run by Hazel.run (this Hazel has no runProgram)";
    errs.replaceChildren(...[...C.errors.slice(0, 8), ...C.unfinished].map(e => el("li", {}, e)));
  };
  hazelLoad().then(sync, () => { status.textContent = "Hazel did not load (it comes from " + SCRIPT_LIB_URL + "): the levers work as before"; });
  // (each change written to the state as it is now, not as the tab found it: a load or a start over replaces it, and then the
  // boxes and the switch are filled again from the new one, below)
  const on = el("button", { class: "script-on", "aria-pressed": String(!!S.on), onclick: () => { const T = scriptsState(); T.on = !T.on; setPressed(on, T.on); changed(); } },
    "🧩 the levers run by these scripts (the trap room's, the tree houses' trap doors, placed levers)");
  let timer = null;
  const editor = (title, modName, get, put) => {
    const ta = el("textarea", { class: "script-editor", spellcheck: "false", rows: "9", "data-module": modName });
    ta.value = get(); ta.refill = () => { ta.value = get(); };
    ta.addEventListener("input", () => { put(ta.value); clearTimeout(timer); timer = setTimeout(() => { changed(); sync(); }, 600); });
    // (the game's keys move the friend: in an editor they are the editor's)
    ta.addEventListener("keydown", e => e.stopPropagation());
    return el("section", { class: "box script-box" }, [el("div", { class: "box-name" }, title), el("div", { class: "hint" }, `module ${modName}`), ta]);
  };
  // (ticket 520) Hazel's tiles: made once the tab is laid out (scriptFrameMount)
  const tiles = el("section", { class: "box script-box script-tiles" }, [
    el("div", { class: "box-name" }, "🧩 the whole program, in Hazel's tiles"),
    el("div", { class: "hint script-frame-status" }, "Hazel's tiles start once this tab is open."),
    el("ul", { class: "script-errors script-frame-errors" }),
    el("div", { class: "script-frame-wrap" }),
    el("div", { class: "hint" }, "For looking: the tiles show what the text boxes hold, with Hazel's own marks where something is wrong; you write in the boxes above. A click in the tiles leaves the keys with the game."),
  ]);
  box.append(
    el("div", { class: "hint" }, "The game's logic in Hazel: each editor is a module of one program; 📚 Common's are in scope in every room's, as Common.name. A room's on_event(globals, event) gives what to do, as Cmd, each command with the rest after it: Flip(\"lever_L\", then), SetPit(0, true, then), DropBoulder(0, then), SetHatch(2, false, then), OpenDoor(3, true, then), Say(\"words\", then), Wait(500, then), Done."),
    ...(SCRIPT_LOGIC ? [el("div", { class: "hint" }, SCRIPT_LOGIC === "hazel" ? "This page was opened with ?logic=hazel: the levers run the shipped scripts, whatever is in the boxes or the switch." : "This page was opened with ?logic=js: the levers run the game's own code, whatever the switch says.")] : []),
    el("div", { class: "row" }, [on]), status, errs,
    editor("📚 Common", "Common", () => scriptsState().common, v => { scriptsState().common = v; }),
    ...SCRIPT_ROOMS.map(r => editor(r.label, r.name, () => scriptsState().rooms[r.name], v => { scriptsState().rooms[r.name] = v; })),
    tiles,
    el("details", { class: "script-preamble" }, [el("summary", {}, "what every module can name (the program's start)"), el("pre", {}, SCRIPT_PREAMBLE)]),
  );
  // (a 📂 load or a ↺ start over replaces state, and so state.scripts, with the tab open: each box and the switch filled again from
  // the new one, before a keystroke can write the old box's text into it, and Hazel and the tiles told; per round, one compare)
  let filled = S;
  syncs.push(() => {
    if (state.scripts === filled) return;
    filled = scriptsState();
    for (const ta of box.querySelectorAll("textarea.script-editor")) ta.refill();
    setPressed(on, filled.on);
    clearTimeout(timer); sync();
  });
  // (after showTab: its layout moves the rows, and a frame moved in the page loads again; after the tab's first paint, too)
  requestAnimationFrame(() => setTimeout(() => scriptFrameMount(tiles), 0));
}

// (ticket 531) under ?logic=hazel, Hazel loaded from the start, so the first event is not the one that waits for it
if (SCRIPT_LOGIC === "hazel") hazelLoad().catch(() => {});
