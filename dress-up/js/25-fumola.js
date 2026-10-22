"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 542, Matthew: "open a PR against dress-up that does the Fumola versions") The room rules of 25-scripting.js (ticket 531),
// written again in Fumola and run by Fumola's wasm build, beside the Hazel and the plain JS: ?logic=fumola (the World rule's map held
// in Fumola) and ?logic=fumola-list (the map passed in with each way, as Hazel's rule has it). Run after 25-scripting.js, whose
// scriptEvent asks fumolaCompile for the handlers under those two; the handlers have Hazel's signature, (globals, ev) -> cmd, with
// the same {tag, value} commands, so scriptRun and the rooms' acts are the same in every mode.
//   The boundary is text in, JSON out. Fumola's build takes only source text: the rules are defined once in an instance (its
// top-level modules persist), then each event is a call written as text, its globals and event as Fumola literals (fumolaLit:
// records { a = 1; b = "x" }, arrays [...], variants #Pull("L"), a tuple payload twice parenthesised); the answer comes back as
// JSON ({tag, value}: variants as {tag: "Variant", value: {name, value}}, numbers as strings), read by fumolaValue.
//   tools/fumola_rules_check.mjs runs this file in node against Fumola's wasm build: every case the rules can get, the same answers
// as the Hazel rules'. tools/checks/fumola542.mjs plays the same in a browser, against ?logic=js.

// Fumola's wasm build, as fumola.org serves it (Adapton/fumola's pages): its ES module and its wasm
const FUMOLA_BUILD = "https://fumola.org/";
const FUMOLA_JS_URL = FUMOLA_BUILD + "fumola_wasm.js", FUMOLA_WASM_URL = FUMOLA_BUILD + "fumola_wasm_bg.wasm";

// The rules, module by module, as 25-scripting.js has them in Hazel (SCRIPT_COMMON, SCRIPT_TRAP, ...), the same answers. Fumola's
// traps, met here: text's != is inverted, so not (a == b); no text patterns, so if and ==; Nat and Int do not mix (a Nat minus a
// bigger Nat is an Int, and only < compares the two), so coordinates stay Nat and an edge is checked before stepping off it (step),
// and a test like x >= 1 is written not (x < 1); no < on Floats, so a random wiring's draws come in as Nats, in millionths
// (fumolaGlobals); a tuple payload is #GoSquare((c, r, back, #Done)); #X does not match #X(payload). ASCII only (a non-ASCII
// character once hid everything after it from Fumola's reader).
const FUMOLA_COMMON = `module Common {
  // two levers flipped, one after the other
  public func flip2(a, b) { #Flip((a, #Flip((b, #Done)))) };
  // the i-th of a list of Bools, false past its end
  public func nth(xs, i) { if (i < xs.size()) { xs[i] } else { false } };
  // which lever works each pit, the left and the right: normal, reversed, or at random by the game's two draws (in millionths)
  public func wire(mode, draws) {
    if (mode == "reversed") { ("R", "L") }
    else if (mode == "random") {
      if (draws.size() < 2) { ("L", "R") }
      else { (if (draws[0] < 500000) { "L" } else { "R" }, if (draws[1] < 500000) { "L" } else { "R" }) }
    }
    else { ("L", "R") }
  };
  // a red lever up? (true is up)
  public func up(l, r, side) { if (side == "L") { l } else { r } };
  // each pit open: open when the lever working it is up
  public func pits_open(l, r, w) { let (w0, w1) = w; (up(l, r, w0), up(l, r, w1)) };
  // a pit that changed from was to now: SetPit, else nothing
  public func pit_moves(i, was, now, k) { if (was == now) { k } else { #SetPit((i, now, k)) } };
  public func member(s, xs) { var found = false; for (x in xs.vals()) { if (x == s) { found := true } }; found };
  // where s is in a list of texts, counting from 1; 0 when it is not there
  public func index_of(xs, s) { var i = 0; var at = 0; for (x in xs.vals()) { i := i + 1; if (at == 0 and x == s) { at := i } }; at };
  // the i-th of a list of texts, counting from 1; "" past its end
  public func nth_s(xs, i) { if (i == 0) { "" } else if (i < xs.size() + 1) { xs[i - 1] } else { "" } };
  public func length(xs) { xs.size() };
  // the world's eight directions: each one's step across and down the map (its minus ones are Ints: see step)
  public func dir(d) {
    if (d == "N") { (0, -1) } else if (d == "NE") { (1, -1) } else if (d == "E") { (1, 0) } else if (d == "SE") { (1, 1) }
    else if (d == "S") { (0, 1) } else if (d == "SW") { (-1, 1) } else if (d == "W") { (-1, 0) } else if (d == "NW") { (-1, -1) } else { (0, 0) }
  };
  // dir's step taken from (c, r), the edges checked first: the square there, or null off the map (Nats throughout)
  public func step(c, r, d, cols, rows) {
    let up = d == "N" or d == "NE" or d == "NW";
    let down = d == "S" or d == "SE" or d == "SW";
    let left = d == "W" or d == "NW" or d == "SW";
    let right = d == "E" or d == "NE" or d == "SE";
    if ((up and r == 0) or (left and c == 0)) { null }
    else {
      let c2 = if (left) { c - 1 } else if (right) { c + 1 } else { c };
      let r2 = if (up) { r - 1 } else if (down) { r + 1 } else { r };
      if (c2 < cols and r2 < rows) { ?(c2, r2) } else { null }
    }
  };
  // the way back
  public func opp(d) {
    if (d == "N") { "S" } else if (d == "NE") { "SW" } else if (d == "E") { "W" } else if (d == "SE") { "NW" }
    else if (d == "S") { "N" } else if (d == "SW") { "NE" } else if (d == "W") { "E" } else if (d == "NW") { "SE" } else { "" }
  }
}`;

const FUMOLA_TRAP = `module TrapRoom {
  // a blue lever's pit i: nothing if not its own, else its rock lifted or a rock dropped
  func one(i, mine, lift, k) { if (not mine) { k } else if (lift) { #LiftBoulder((i, k)) } else { #DropBoulder((i, k)) } };
  // A red lever pulled: flip it, and each pit wired to it opens or shuts.
  // A blue lever pulled: each of its pits gets a boulder, or loses one.
  public func on_event(g, e) {
    let w = Common.wire(g.wiring, g.draws);
    let (w0, w1) = w;
    switch (e) {
      case (#Pull(side)) {
        let (was0, was1) = Common.pits_open(g.lever_L, g.lever_R, w);
        let l = if (side == "L") { not g.lever_L } else { g.lever_L };
        let r = if (side == "R") { not g.lever_R } else { g.lever_R };
        let (now0, now1) = Common.pits_open(l, r, w);
        #Flip(("lever_" # side, Common.pit_moves(0, was0, now0, Common.pit_moves(1, was1, now1, #Done))))
      };
      case (#PullBoulder(side)) {
        let mine0 = (w0 == side) and Common.nth(g.pits_on, 0);
        let mine1 = (w1 == side) and Common.nth(g.pits_on, 1);
        let lift = (mine0 and Common.nth(g.covered, 0)) or (mine1 and Common.nth(g.covered, 1));
        one(0, mine0, lift, one(1, mine1, lift, #Done))
      };
      case _ { #Done }
    }
  }
}`;

const FUMOLA_TREE = `module TreeRoom {
  // A tree room's trap-door lever, or the round room's at the top (house 0):
  // the trap door shuts if open, opens if shut.
  public func on_event(g, e) {
    switch (e) {
      case (#PullHatch(n)) { #SetHatch((n, not g.hatch, #Done)) };
      case _ { #Done }
    }
  }
}`;

const FUMOLA_SQUARE = `module Square {
  // the first thing at place i, from the j-th on
  func find(ts, j, i) { if (j == ts.size()) { null } else if (ts[j].at == i) { ?(ts[j]) } else { find(ts, j + 1, i) } };
  // each trap door the lever works, from the j-th thing on, in order: it swings, or, a boulder lever, gets its rock or loses it
  func doors(lever, ts, j) {
    if (j == ts.size()) { #Done }
    else {
      let d = ts[j];
      let k = doors(lever, ts, j + 1);
      if (not (d.kind == "trapdoor" and Common.member(d.uid, lever.works))) { k }
      else if (lever.does == "boulder") { if (d.boulder == (not lever.on)) { k } else { #DropRock((d.at, not lever.on, k)) } }
      else { #OpenDoor((d.at, not d.open, k)) }
    }
  };
  // A placed lever pulled: each trap door wired to it swings,
  // or, a boulder lever, gets its rock or loses it.
  public func on_event(g, e) {
    switch (e) {
      case (#PullThing(i)) { switch (find(g.things, 0, i)) { case (?t) { doors(t, g.things, 0) }; case null { #Done } } };
      case _ { #Done }
    }
  }
}`;

// (two ways to have the map: on_event takes it in each call, as Hazel's rule does, ?logic=fumola-list; way takes only where the
// friend is, the map's size and the way, and finds the square in the map held here, a HashMap keyed by (col, row), made again by
// hold whenever the game's cells change, ?logic=fumola)
const FUMOLA_WORLD = `var world_held = HashMap.new();
module World {
  // Places with no way out on a side, whatever their ways say: the waterfall's N, its cliff.
  func no_way(kind, d) { kind == "waterfall" and d == "N" };
  // into square (c, r), come in from back, if it has a way back; else nowhere
  func decide(x, back, c, r) { if (Common.member(back, x.ways) and not (no_way(x.kind, back))) { #GoSquare((c, r, back, #Done)) } else { #Done } };
  func find_at(cs, i, c, r) { if (i == cs.size()) { null } else { let x = cs[i]; if (x.col == c and x.row == r) { ?x } else { find_at(cs, i + 1, c, r) } } };
  // A way out walked through: into the square beside it, coming in from the side facing back,
  // if that square is on the map and has a way back; else nowhere.
  public func on_event(g, e) {
    switch (e) {
      case (#Way(d)) {
        switch (Common.step(g.at_col, g.at_row, d, g.cols, g.rows)) {
          case (?(c, r)) { switch (find_at(g.cells, 0, c, r)) { case (?x) { decide(x, Common.opp(d), c, r) }; case null { #Done } } };
          case null { #Done }
        }
      };
      case _ { #Done }
    }
  };
  // the same, the square found in the map held here
  public func way(ac, ar, cols, rows, d) {
    switch (Common.step(ac, ar, d, cols, rows)) {
      case (?(c, r)) { switch (HashMap.get(world_held, (c, r))) { case (?x) { decide(x, Common.opp(d), c, r) }; case null { #Done } } };
      case null { #Done }
    }
  };
  // the map held here made again from the game's cells
  public func hold(cells) {
    var m = HashMap.new();
    for (x in cells.vals()) { let (m2, _) = HashMap.put(m, (x.col, x.row), x); m := m2 };
    world_held := m;
    cells.size()
  }
}`;

const FUMOLA_CASTLE = `module Castle {
  // Where room n's way out leads: 0 out of the castle, a room, or -1 nowhere.
  // out is its setting (auto, out, none, or a room, then out_room); auto:
  // a dungeon's ladder up to the trap room, room 1 out, any other to room 1.
  public func way_out(rooms, exits, n, out, out_room) {
    let ex = Common.nth_s(exits, n);
    let s_out = ex == "side" or ex == "long" or ex == "spiral";
    let v = if (out == "none" and not s_out) { "auto" } else { out };
    if (v == "auto") { let t = Common.index_of(rooms, "trap"); if (ex == "ladder" and t > 0 and not (t == n)) { t } else if (n == 1) { 0 } else { 1 } }
    else if (v == "out") { 0 }
    else if (v == "none") { -1 }
    else if (not (out_room < 1) and out_room < Common.length(rooms) + 1) { out_room }
    else { -1 }
  };
  // A trap room's pit fallen into (0 the left, 1 the right):
  // the first pit drops into the dungeon, the second into the deep dungeon;
  // a castle with only one of them, both into that one.
  public func on_event(g, e) {
    let d1 = Common.index_of(g.rooms, "dungeon1");
    let d2 = Common.index_of(g.rooms, "dungeon2");
    switch (e) {
      case (#FallPit(i)) {
        let to = if (i == 0) { if (d1 > 0) { d1 } else { d2 } } else { if (d2 > 0) { d2 } else { d1 } };
        if (to == 0) { #Done } else { #GoRoom((to, #Done)) }
      };
      case (#WayOut(n)) { #GoRoom((way_out(g.rooms, g.exits, n, g.out, g.out_room), #Done)) };
      case _ { #Done }
    }
  }
}`;

// the whole program, defined once in an instance; and each room's module (SCRIPT_ROOMS' names)
const FUMOLA_SOURCE = [FUMOLA_COMMON, FUMOLA_TRAP, FUMOLA_TREE, FUMOLA_SQUARE, FUMOLA_WORLD, FUMOLA_CASTLE].join(";\n");
const FUMOLA_ROOMS = ["TrapRoom", "TreeRoom", "Square", "World", "Castle"];

// A JS value as a Fumola literal: true/false; a whole number (a Nat, or an Int below 0); a text, quoted, which may
// hold no quote, backslash or character outside printable ASCII (Fumola's text literals have no escapes; the game's kinds, uids,
// rooms and ways are plain); an array as [...]; {tag, value} as a variant, #Tag, #Tag(x), or #Tag((a, b)) for an array; any other
// object as a record { name = value; ... }. Anything else throws, and the rule stops (the caller's JS goes on, as for Hazel)
const FUMOLA_PLAIN = /^[ !#-[\]-~]*$/;
function fumolaLit(v) {
  if (v === true || v === false) return String(v);
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    throw new Error(`a number Fumola is not given here: ${v}`);
  }
  if (typeof v === "string") {
    if (!FUMOLA_PLAIN.test(v)) throw new Error(`a text Fumola cannot be given: ${JSON.stringify(v).slice(0, 40)}`);
    return `"${v}"`;
  }
  if (Array.isArray(v)) return "[" + v.map(fumolaLit).join(", ") + "]";
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (typeof v.tag === "string" && ks.every(k => k === "tag" || k === "value")) {
      if (!/^[A-Za-z]\w*$/.test(v.tag)) throw new Error(`a variant Fumola cannot be given: ${v.tag}`);
      return v.value === undefined ? `#${v.tag}` : Array.isArray(v.value) ? `#${v.tag}((${v.value.map(fumolaLit).join(", ")}))` : `#${v.tag}(${fumolaLit(v.value)})`;
    }
    return "{ " + ks.map(k => { if (!/^[A-Za-z_]\w*$/.test(k)) throw new Error(`a field Fumola cannot be given: ${k}`); return `${k} = ${fumolaLit(v[k])}`; }).join("; ") + " }";
  }
  throw new Error(`a value Fumola is not given: ${String(v).slice(0, 40)}`);
}

// Fumola's answer (its JSON, parsed) as a JS value: a variant as {tag} or {tag, value}, a tuple's payload as an array (so a command
// is the shape Hazel's are: {tag: "Flip", value: ["lever_L", {tag: "Done"}]}), numbers as numbers, a record as an object
function fumolaValue(v) {
  switch (v && v.tag) {
    case "Variant": { const p = v.value.value; return p == null ? { tag: v.value.name } : { tag: v.value.name, value: fumolaValue(p) }; }
    case "Tuple": case "List": return v.value.map(fumolaValue);
    case "Int": case "Float": return Number(v.value);
    case "Bool": case "String": return v.value;
    case "Record": return Object.fromEntries(Object.entries(v.value).map(([k, x]) => [k, fumolaValue(x)]));
    case "Option": return fumolaValue(v.value);
    case "Null": case "Unit": return null;
    default: throw new Error(`an answer from Fumola the game cannot read: ${JSON.stringify(v).slice(0, 80)}`);
  }
}

// a room's globals as Fumola is given them: the same fields as Hazel's, but a random wiring's draws in millionths, Nats (Fumola has
// no < on Floats; x < 0.5 exactly when floor(x * 1000000) < 500000)
const fumolaGlobals = g => g.draws && g.draws.length ? { ...g, draws: g.draws.map(x => Math.floor(x * 1000000)) } : g;

// The rules in a new instance of the wasm build F (its exports: fumola_create, fumola_eval_top, fumola_eval_scratch), and each room's
// handler, (globals, ev) -> cmd. A call runs in scratch (fumola_eval_scratch: its answer only, the instance left as it was), where
// the build has it; defining the rules and holding the map run at the top level (fumola_eval_top), and stay. mode: "fumola" (the
// World rule's map held in the instance, made again when the cells change: their text is the signature) or "fumola-list" (the
// map passed in each call). An answer that is not ok throws, with Fumola's words.
function fumolaRules(F, mode = "fumola") {
  const now = () => (typeof performance === "object" ? performance.now() : Date.now());
  const id = F.fumola_create(), scratch = typeof F.fumola_eval_scratch === "function";
  const run = (text, keep) => {
    const r = JSON.parse(keep || !scratch ? F.fumola_eval_top(id, text) : F.fumola_eval_scratch(id, text));
    if (!r || r.ok !== true) throw new Error(`Fumola: ${r && (r.error || r.kind) || "no answer"}`);
    return r;
  };
  const t0 = now();
  run(FUMOLA_SOURCE, true);
  const ms = now() - t0;
  const call = text => fumolaValue(run(text, false));
  const on = room => (g, ev) => call(`${room}.on_event(${fumolaLit(fumolaGlobals(g))}, ${fumolaLit(ev)})`);
  const handlers = Object.fromEntries(FUMOLA_ROOMS.map(r => [r, on(r)]));
  const held = { text: null, builds: 0 };
  if (mode !== "fumola-list") handlers.World = (g, ev) => {
    if (!ev || ev.tag !== "Way") return { tag: "Done" };
    const cells = fumolaLit(g.cells);
    if (cells !== held.text) { run(`World.hold(${cells})`, true); held.text = cells; held.builds++; }
    return call(`World.way(${fumolaLit(g.at_col)}, ${fumolaLit(g.at_row)}, ${fumolaLit(g.cols)}, ${fumolaLit(g.rows)}, ${fumolaLit(ev.value)})`);
  };
  return { id, mode, ms, scratch, handlers, held, call, run };
}

// ---- in the page: the build loaded once (under ?logic=fumola or fumola-list only), the rules compiled once ----
let fumolaLoading = null, fumolaBuild = null;
function fumolaLoad() {
  if (fumolaBuild) return Promise.resolve(fumolaBuild);
  if (!fumolaLoading) fumolaLoading = import(FUMOLA_JS_URL)
    .then(async m => { await m.default({ module_or_path: FUMOLA_WASM_URL }); fumolaBuild = m; return m; })
    .catch(e => { fumolaLoading = null; throw e; });
  return fumolaLoading;
}
const fumolaReady = () => !!fumolaBuild;
// (scriptCompile's shape: ready, handlers, errors, ms; once, as the rules are the shipped ones)
let fumolaCompiled = null;
function fumolaCompile() {
  if (!fumolaBuild) return null;
  if (fumolaCompiled) return fumolaCompiled;
  try {
    const R = fumolaRules(fumolaBuild, SCRIPT_LOGIC);
    fumolaCompiled = { via: "fumola", ready: true, errors: [], unfinished: [], handlers: R.handlers, ms: R.ms, rules: R };
  } catch (e) { fumolaCompiled = { via: "fumola", ready: false, errors: [String(e && e.message || e)], unfinished: [], handlers: {}, ms: 0 }; }
  hzPush(hzCounters().compileMs, fumolaCompiled.ms);
  return fumolaCompiled;
}

// (as Hazel's under ?logic=hazel: loaded from the start, and the rules defined as soon as it is, not in the first event)
if (typeof SCRIPT_FUMOLA !== "undefined" && SCRIPT_FUMOLA) fumolaLoad().then(() => setTimeout(() => { try { fumolaCompile(); } catch (e) {} }, 0)).catch(() => {});
