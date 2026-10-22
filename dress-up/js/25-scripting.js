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

// a module's body as written, without a last ";" (the program puts each in its braces; Hazel reads a member after a last ";" as a hole)
const scriptBody = t => String(t || "").replace(/;\s*$/, "").trim();

// (ticket 520) the program as Hazel.runProgram takes it, and as the frame shows it: the preamble, a module per editor (📚 Common, then
// each room's) with its text as written, and what the program gives: each room's on_event, held to the type a rule has (so a rule of
// another type is an error, and its room's), and the number of rooms (always two fields or more: a labeled tuple of one may not
// come back as an object). A blank room has no on_event: an error, its room's, so its levers work as before.
const scriptTail = () => "(" + [...SCRIPT_ROOMS.map(r => `${r.name.toLowerCase()} = (${r.name}.on_event : (Globals, Event) -> Cmd)`), `rooms = ${SCRIPT_ROOMS.length}`].join(", ") + ")";
function scriptSpec() {
  const S = scriptsState();
  return { preamble: SCRIPT_PREAMBLE,
    modules: [{ name: "Common", text: scriptBody(S.common) }, ...SCRIPT_ROOMS.map(r => ({ name: r.name, text: scriptBody(S.rooms[r.name]) }))],
    tail: scriptTail() };
}

// The program as one text, joined by the page: for a library without runProgram (an older build, or one cached from before)
function scriptProgram() {
  const S = scriptsState();
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

// (from roomLeverPull) a red lever pulled in a trap room, with 🧩 on and the program ready: its rule says what happens, and true;
// otherwise (errors, or not finished: a hole to fill, a bracket left open) false, and the lever works as it always has
function scriptPull(side) {
  const S = state.scripts, B = state.background;
  if (!S || !S.on || B.kind !== "castleroom" || (side !== "L" && side !== "R")) return false;
  const K = castleOf(B), n = Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1)));
  if (K.rooms[n - 1] !== "trap") return false;
  if (!window.Hazel) { hazelLoad().catch(() => {}); return false; }
  const C = scriptCompile(), f = C && C.ready && C.handlers.TrapRoom;
  if (!f) return false;
  const g = { lever_L: !leverDown(B, "L", n, K.id), lever_R: !leverDown(B, "R", n, K.id), wiring: B[leverWireKey(n, K.id)] || "normal" };
  let cmd;
  try { cmd = f(g, { tag: "Pull", value: side }); } catch (e) { scriptSay("the rule stopped: " + (e && e.message || e)); return true; }
  scriptRun(cmd, { flip: name => { if (name === "lever_L") roomLeverFlip("L"); else if (name === "lever_R") roomLeverFlip("R"); } });
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
    "🧩 the trap room's red levers run by these scripts");
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
    el("div", { class: "hint" }, "The game's logic in Hazel: each editor is a module of one program; 📚 Common's are in scope in every room's, as Common.name. A room's on_event(globals, event) gives what to do, as Cmd: Flip(\"lever_L\", then), Say(\"words\", then), Done."),
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
