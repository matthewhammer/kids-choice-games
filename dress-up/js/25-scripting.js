"use strict";
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
// A room's module gives on_event : (Globals, Event) -> Cmd. Hazel itself comes from #2711's library (window.Hazel), loaded when
// the tab opens or a script first runs; until then, and whenever the program has errors, the levers work as they always have.
// Off to start (state.scripts.on).

// (ticket 482: #2711's branch build, until the library ships with the game)
const SCRIPT_LIB_URL = "https://hazel.org/build/js-library/hazel-lib.js";

// the rooms that have logic so far, each a module of the program; module names must be unique (scriptNames checks it)
const SCRIPT_ROOMS = [
  { name: "TrapRoom", label: "🏰 the trap room, over the castle's dungeons", kind: "trap" },
];

const SCRIPT_PREAMBLE = `type Cmd = + Done + Flip(String, Cmd) + Say(String, Cmd) in
type Event = + Pull(String) in
type Globals = (lever_L = Bool, lever_R = Bool, wiring = String) in`;

const SCRIPT_COMMON = `# Sub-routines every room can use, as Common.flip2 and so on. #
let flip2 = fun (a, b) : (String, String) -> Flip(a, Flip(b, Done))`;

const SCRIPT_TRAP = `# A red lever pulled: flip it, and the pits wired to it follow, #
# as they always have. Try: Pull("L") => Common.flip2("lever_L", "lever_R") #
let on_event = fun (g, e) : (Globals, Event) ->
  case e
  | Pull(side) => Flip("lever_" ++ side, Done)
  end`;

function scriptsState() {
  const S = state.scripts || (state.scripts = { on: false, common: null, rooms: {} });
  if (S.common == null) S.common = SCRIPT_COMMON;
  S.rooms = S.rooms || {};
  for (const r of SCRIPT_ROOMS) if (S.rooms[r.name] == null) S.rooms[r.name] = r.kind === "trap" ? SCRIPT_TRAP : "";
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

// a module's body as written, without a last ";" (the program puts each in its braces)
const scriptBody = t => String(t || "").replace(/;\s*$/, "").trim();

function scriptProgram() {
  const S = scriptsState();
  return [SCRIPT_PREAMBLE,
    `module Common = {\n${scriptBody(S.common) || "let nothing = ()"}\n} in`,
    ...SCRIPT_ROOMS.map(r => `module ${r.name} = {\n${scriptBody(S.rooms[r.name]) || "let on_event = fun (g, e) : (Globals, Event) -> Done"}\n} in`),
    // (always two fields or more: a labeled tuple of one may not come back as an object)
    "(" + [...SCRIPT_ROOMS.map(r => `${r.name.toLowerCase()} = ${r.name}.on_event`), `rooms = ${SCRIPT_ROOMS.length}`].join(", ") + ")"].join("\n");
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

// the program, analyzed and run once per text: its errors and its rooms' handlers
let scriptCompiled = { text: null, errors: [], handlers: {}, ms: 0 };
function scriptCompile() {
  const text = scriptProgram();
  if (!window.Hazel) return null;
  if (scriptCompiled.text === text) return scriptCompiled;
  const t0 = performance.now();
  let errors = [], handlers = {};
  try {
    const r = window.Hazel.run(text);
    errors = Array.from(r.errors || []);
    const v = r.value || {};
    for (const room of SCRIPT_ROOMS) { const f = v[room.name.toLowerCase()]; if (typeof f === "function") handlers[room.name] = f; }
  } catch (e) { errors = [String(e && e.message || e)]; }
  scriptCompiled = { text, errors, handlers, ms: performance.now() - t0 };
  return scriptCompiled;
}

// a few words over the picture, for a script's Say
function scriptSay(text) {
  let b = document.getElementById("script-say");
  if (!b) { b = el("div", { id: "script-say", class: "script-say" }); document.body.append(b); }
  b.textContent = "🧩 " + text; b.hidden = false;
  clearTimeout(scriptSay.t); scriptSay.t = setTimeout(() => { b.hidden = true; }, 3000);
}

// the commands a rule gave, run in order: a lever's Flip as the game's own pull; anything not understood ends it
function scriptRun(cmd, act, depth = 0) {
  if (!cmd || depth > 200) return;
  const [a, k] = Array.isArray(cmd.value) ? cmd.value : [cmd.value, null];
  if (cmd.tag === "Flip") { act.flip(String(a)); scriptRun(k, act, depth + 1); }
  else if (cmd.tag === "Say") { scriptSay(String(a)); scriptRun(k, act, depth + 1); }
}

// (from roomLeverPull) a red lever pulled in a trap room, with 🧩 on and the program fine: its rule says what happens, and true;
// otherwise false, and the lever works as it always has
function scriptPull(side) {
  const S = state.scripts, B = state.background;
  if (!S || !S.on || B.kind !== "castleroom" || (side !== "L" && side !== "R")) return false;
  const K = castleOf(B), n = Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1)));
  if (K.rooms[n - 1] !== "trap") return false;
  if (!window.Hazel) { hazelLoad().catch(() => {}); return false; }
  const C = scriptCompile(), f = C && !C.errors.length && C.handlers.TrapRoom;
  if (!f) return false;
  const g = { lever_L: !leverDown(B, "L", n, K.id), lever_R: !leverDown(B, "R", n, K.id), wiring: B[leverWireKey(n, K.id)] || "normal" };
  let cmd;
  try { cmd = f(g, { tag: "Pull", value: side }); } catch (e) { scriptSay("the rule stopped: " + (e && e.message || e)); return true; }
  scriptRun(cmd, { flip: name => { if (name === "lever_L") roomLeverFlip("L"); else if (name === "lever_R") roomLeverFlip("R"); } });
  return true;
}

// the 🧩 Scripting tab: a switch, Hazel's state, then an editor per module, each with the module's name; the program's errors
// under them, at each change, a moment after typing stops
function scriptingPanel(box) {
  const S = scriptsState();
  const status = el("div", { class: "hint script-status" }, "Hazel: loading…");
  const errs = el("ul", { class: "script-errors" });
  const sync = () => {
    if (!window.Hazel) return;
    const C = scriptCompile();
    status.textContent = `Hazel ${window.Hazel.version}: the program ${C.errors.length ? `has ${C.errors.length} error${C.errors.length === 1 ? "" : "s"}, so the levers work as before` : "is fine"} (analyzed and run in ${Math.round(C.ms)} ms)`;
    errs.replaceChildren(...C.errors.slice(0, 8).map(e => el("li", {}, e)));
  };
  hazelLoad().then(sync, () => { status.textContent = "Hazel did not load (it comes from " + SCRIPT_LIB_URL + "): the levers work as before"; });
  const on = el("button", { class: "script-on", "aria-pressed": String(!!S.on), onclick: () => { S.on = !S.on; setPressed(on, S.on); changed(); } },
    "🧩 the trap room's red levers run by these scripts");
  let timer = null;
  const editor = (title, modName, get, put) => {
    const ta = el("textarea", { class: "script-editor", spellcheck: "false", rows: "9", "data-module": modName });
    ta.value = get();
    ta.addEventListener("input", () => { put(ta.value); clearTimeout(timer); timer = setTimeout(() => { changed(); sync(); }, 600); });
    // (the game's keys move the friend: in an editor they are the editor's)
    ta.addEventListener("keydown", e => e.stopPropagation());
    return el("section", { class: "box script-box" }, [el("div", { class: "box-name" }, title), el("div", { class: "hint" }, `module ${modName}`), ta]);
  };
  box.append(
    el("div", { class: "hint" }, "The game's logic in Hazel: each editor is a module of one program; 📚 Common's are in scope in every room's, as Common.name. A room's on_event(globals, event) gives what to do, as Cmd: Flip(\"lever_L\", then), Say(\"words\", then), Done."),
    el("div", { class: "row" }, [on]), status, errs,
    editor("📚 Common", "Common", () => S.common, v => { S.common = v; }),
    ...SCRIPT_ROOMS.map(r => editor(r.label, r.name, () => S.rooms[r.name], v => { S.rooms[r.name] = v; })),
    el("details", { class: "script-preamble" }, [el("summary", {}, "what every module can name (the program's start)"), el("pre", {}, SCRIPT_PREAMBLE)]),
  );
}
