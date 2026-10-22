// (ticket 520) 🧩 Scripting without a browser: js/25-scripting.js run in node, the page stood in by a small fake (its elements, the
// window's messages, the clock), for what a browser is not needed for:
//   the program Hazel.runProgram takes, built from the editors (typing in a box, the change timer), each module's last ";" dropped;
//   the levers through runProgram where the library has it, and the fallback (the page's joined text, through Hazel.run) where not;
//   ready only with no errors, holes or unfinished brackets, and each error said with its module ("TrapRoom: ...");
//   the frame's messages: only from Hazel's origin with the frame as source; the program posted on "ready" and on the change timer,
//   no more often; "size" bounded; "status" shown per module; "crash" and a frame that never says "ready" (taken away, the text boxes
//   kept, a button to start it again); one that never answers a program, said; a frame given the focus giving it back; none
//   made while the game is full screen.
// With a hazel-lib.js (a build of hazelgrove/hazel#2719's branch, js-library-embed: dune build there makes
// _build/default/src/web/www/hazel-lib.js), the real library too: the shipped rule and scripting482's rules give the same commands
// through runProgram as through the fallback, and Flip(1, Done), a hole, a bracket left open, a blank room and a rule of the wrong
// type are each not ready, with their module named. The browser's half (the frame's tiles and error marks, its ready time, the
// game's frames meanwhile, the keys after a click) is tools/checks/scripting482.mjs, on GitHub.
//   node tools/scripting520.mjs [hazel-lib.js]
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import { createRequire } from "node:module";
const here = path.dirname(new URL(import.meta.url).pathname), libPath = process.argv[2];
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got, (k, v) => typeof v === "function" ? "<fn>" : v).slice(0, 600)}`); if (!cond) bad++; };

// ---- the page, faked: elements enough for the panel, a clock, the window's listeners ----
let clock = 0; const timers = [];
const setTimeout_ = (f, ms = 0) => { const t = { f, at: clock + ms, id: timers.length + 1 }; timers.push(t); return t.id; };
const clearTimeout_ = id => { const t = timers.find(x => x.id === id); if (t) t.f = null; };
const advance = ms => { const end = clock + ms; for (;;) { const due = timers.filter(t => t.f && t.at <= end).sort((a, b) => a.at - b.at)[0]; if (!due) break; clock = Math.max(clock, due.at); const f = due.f; due.f = null; f(); } clock = end; };
let ROOT = null;
class FakeEl {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.kids = []; this.parentNode = null; this.attrs = {}; this.on = {}; this.style = {}; this.own = ""; this.value = ""; this.hidden = false; this.dataset = {}; this.title = ""; }
  get className() { return this.attrs.class || ""; }
  get classList() { const me = this; return { contains: c => me.className.split(/\s+/).includes(c), add: c => { if (!me.className.split(/\s+/).includes(c)) me.attrs.class = (me.className + " " + c).trim(); } }; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k.startsWith("data-")) this.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); }
  fire(t, e = {}) { for (const f of this.on[t] || []) f({ type: t, target: this, stopPropagation() {}, preventDefault() {}, ...e }); }
  append(...ks) { for (const k of ks) { if (typeof k === "string") this.kids.push(k); else { k.remove(); k.parentNode = this; this.kids.push(k); } } }
  replaceChildren(...ks) { for (const c of this.kids) if (typeof c !== "string") c.parentNode = null; this.kids = []; this.append(...ks); }
  remove() { const p = this.parentNode; if (p) { p.kids = p.kids.filter(c => c !== this); this.parentNode = null; } }
  get isConnected() { let n = this; while (n.parentNode) n = n.parentNode; return n === ROOT; }
  get textContent() { return this.own + this.kids.map(c => typeof c === "string" ? c : c.textContent).join(""); }
  set textContent(t) { this.replaceChildren(); this.own = String(t); }
  all() { return this.kids.filter(c => typeof c !== "string").flatMap(c => [c, ...c.all()]); }
  // (selectors as the panel uses them: tag, .class, tag.class, .a.b)
  matches(sel) { const [tag, ...cls] = sel.split("."); return (!tag || this.tagName === tag.toUpperCase()) && cls.every(c => this.classList.contains(c)); }
  querySelectorAll(sel) { return this.all().filter(e => e.matches(sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
const posts = [];
class FakeFrame extends FakeEl {
  constructor() { super("iframe"); this.win = { postMessage: (data, origin) => posts.push({ data, origin }) }; this.blurred = 0; }
  get contentWindow() { return this.isConnected ? this.win : null; }
  blur() { this.blurred++; if (doc.activeElement === this) doc.activeElement = doc.body; }
}
ROOT = new FakeEl("html");
const body = new FakeEl("body"); ROOT.append(body);
const doc = { hidden: false, body, activeElement: body, head: { append() {} }, getElementById: () => null, createElement: t => t === "iframe" ? new FakeFrame() : new FakeEl(t) };
const winOn = {};
const ctx = { console, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, Promise, RegExp, Error, Symbol,
  location: { origin: "file://" }, setTimeout: setTimeout_, clearTimeout: clearTimeout_, requestAnimationFrame: f => setTimeout_(f, 16), performance: { now: () => clock }, document: doc,
  addEventListener: (t, f) => { (winOn[t] = winOn[t] || []).push(f); }, focus() {} };
ctx.window = ctx;
// (what the part takes from the rest of the game)
const flips = [];
Object.assign(ctx, {
  state: { scripts: { on: false, common: null, rooms: {} }, background: { kind: "castleroom", castleRoom: 3 } },
  el(tag, attrs = {}, kids = []) { const e = doc.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } for (const k of [].concat(kids)) e.append(k); return e; },
  setPressed: (e, on) => e.setAttribute("aria-pressed", String(!!on)), changed() {}, syncs: [],
  castleOf: () => ({ id: "N", rooms: ["king", "hall", "trap"] }), leverDown: () => false, leverWireKey: () => "wire", roomLeverFlip: side => flips.push(side),
  leverSeedKey: () => "seed", seeded: () => i => 0.25 + i / 2, trapState: () => ({ on: [true, true], covered: [false, false], open: [true, true] }), roomPitSwing: (i, open) => { flips.push("pit" + i + (open ? "+" : "-")); return true; },
});
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(here, "../dress-up/js/25-scripting.js"), "utf8"), ctx, { filename: "25-scripting.js" });
const run = x => vm.runInContext(x, ctx);
const msg = (data, { origin = "https://hazel.org", source } = {}) => { for (const f of winOn.message || []) f({ data, origin, source: source === undefined ? run("scriptFrame").iframe.win : source }); };

// ---- the program, from the editors ----
const panel = new FakeEl("div"); body.append(panel);
run("scriptingPanel")(panel);
const boxes = panel.querySelectorAll("textarea.script-editor");
ok("an editor per module: Common, then each room's", JSON.stringify(boxes.map(t => t.dataset.module)) === JSON.stringify(["Common", ...run("SCRIPT_ROOMS").map(r => r.name)]), boxes.map(t => t.dataset.module));
let spec = run("scriptSpec()");
const ROOMS = run("SCRIPT_ROOMS").map(r => ({ ...r })), TEXTS = run("SCRIPT_TEXTS");
ok("the shipped program: the preamble, Common and each room's text as shipped, the tail asking each room's on_event at a rule's type",
  spec.preamble === run("SCRIPT_PREAMBLE") && spec.modules.map(m => m.name).join() === ["Common", ...ROOMS.map(r => r.name)].join() && spec.modules[0].text === run("SCRIPT_COMMON")
  && ROOMS.every((r, i) => spec.modules[i + 1].text === TEXTS[r.kind]) && spec.modules[1].text === run("SCRIPT_TRAP")
  && spec.tail === "(" + [...ROOMS.map(r => `${r.name.toLowerCase()} = (${r.name}.on_event : (Globals, Event) -> Cmd)`), `rooms = ${ROOMS.length}`].join(", ") + ")", spec);
ok("the frame is made once the tab is laid out, not before", !panel.querySelector("iframe") && (advance(20), !!panel.querySelector("iframe.script-frame")), panel.querySelectorAll("iframe").length);
const frame = run("scriptFrame").iframe;
ok("the frame is Hazel's embed mode on the embed branch's build, out of the keyboard's Tab order",
  frame.getAttribute("src") === "https://hazel.org/build/js-library-embed/index.html#embed" && frame.getAttribute("tabindex") === "-1", frame.attrs);
ok("nothing is posted before the frame says ready", posts.length === 0, posts);
msg({ type: "ready", protocol: 1, build: "abc" }, { origin: "https://evil.example" });
msg({ type: "ready", protocol: 1, build: "abc" }, { source: {} });
ok("a ready from another origin, or from another window, is ignored", posts.length === 0 && run("scriptFrame.phase") === "loading", posts);
advance(1500);
msg({ type: "ready", protocol: 1, build: "abc" });
ok("ready: the program posted once, to Hazel's origin, as {type: set, preamble, modules, tail}", posts.length === 1 && posts[0].origin === "https://hazel.org"
  && posts[0].data.type === "set" && JSON.stringify({ ...posts[0].data, type: undefined }) === JSON.stringify({ ...run("scriptSpec()"), type: undefined }), posts);
ok("its ready time is kept", run("scriptFrame.readyMs") >= 1500, run("scriptFrame.readyMs"));
const trap = boxes[1];
trap.value = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Flip(1, Done) end;\n'; trap.fire("input");
advance(300); trap.value += " "; trap.fire("input"); advance(300);
ok("typing: nothing posted while the change timer waits", posts.length === 1, posts.length);
advance(400);
ok("the timer: the new program posted once, its last \";\" dropped", posts.length === 2 && posts[1].data.modules[1].text === 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Flip(1, Done) end', posts.map(p => p.data.modules[1].text));
ok("the editors write the state", run("state.scripts.rooms.TrapRoom").startsWith("let on_event") && run("scriptSpec().modules[1].text").endsWith("end"), run("state.scripts.rooms.TrapRoom"));
// (a 📂 load or a ↺ start over: state replaced, then changed(), whose round of syncs fills the tab again)
const onBtn = panel.querySelector("button.script-on");
run('state = { ...state, scripts: { on: true, common: "let loaded = 1", rooms: { TrapRoom: "let on_event = fun (g, e) : (Globals, Event) -> Done" } } }; for (const f of syncs) f();');
ok("after a load or a start over, both boxes and the switch show the new state", boxes[0].value === "let loaded = 1" && boxes[1].value === "let on_event = fun (g, e) : (Globals, Event) -> Done"
  && onBtn.getAttribute("aria-pressed") === "true", [boxes.map(b => b.value), onBtn.getAttribute("aria-pressed")]);
ok("... and the new program goes to the tiles", posts.length === 3 && posts[2].data.modules[0].text === "let loaded = 1", posts.map(p => p.data.modules[0].text));
boxes[0].value = "let flip2 = fun (a, b) : (String, String) -> Done"; boxes[0].fire("input"); advance(700);
ok("after a load or a start over (a new state), typing writes the state as it is now, and the other box's loaded text is kept",
  run("state.scripts.common") === "let flip2 = fun (a, b) : (String, String) -> Done" && run("state.scripts.rooms.TrapRoom") === "let on_event = fun (g, e) : (Globals, Event) -> Done", run("state.scripts"));
run("for (const f of syncs) f()");
ok("a round of syncs with the same state leaves the boxes be", boxes[0].value === "let flip2 = fun (a, b) : (String, String) -> Done", boxes[0].value);
advance(5000);
ok("no post without a change", posts.length === 4, posts.length);
msg({ type: "size", height: 431.2 });
ok("size: the frame as tall as it says", frame.style.height === "432px", frame.style.height);
msg({ type: "size", height: 1e7 });
ok("size: at most SCRIPT_FRAME_MAX", frame.style.height === "4000px", frame.style.height);
msg({ type: "status", ok: false, errors: [{ module: "TrapRoom", message: "Expecting type String but got inconsistent type Int", id: "x" }, { module: null, message: "Label not found", id: "y" }],
  holes: { Common: 0, TrapRoom: 2 }, programHoles: 0, incomplete: { Common: 1, TrapRoom: 0 }, programIncomplete: 0 });
const lines = panel.querySelector("ul.script-frame-errors").kids.map(li => li.textContent), said = panel.querySelector(".script-frame-status").textContent;
ok("status: by the frame, each error with its module, then what is not finished", /2 errors/.test(said) && JSON.stringify(lines) === JSON.stringify(["TrapRoom: Expecting type String but got inconsistent type Int",
  "the program: Label not found", "Common: 1 bracket or keyword without its partner", "TrapRoom: 2 holes to fill"]), [said, lines]);
msg({ type: "status", ok: true, errors: [], holes: { Common: 0, TrapRoom: 0 }, programHoles: 0, incomplete: { Common: 0, TrapRoom: 0 }, programIncomplete: 0 });
ok("status: fine", /is fine/.test(panel.querySelector(".script-frame-status").textContent) && !panel.querySelector("ul.script-frame-errors").kids.length, panel.querySelector(".script-frame-status").textContent);

// ---- the keys ----
doc.activeElement = frame; for (const f of winOn.blur || []) f({}); advance(300);
ok("a frame given the focus gives it back to the page", frame.blurred === 1 && doc.activeElement === body && run("scriptFrame.blurs") === 1, [frame.blurred, run("scriptFrame.blurs")]);
for (const f of winOn.blur || []) f({}); advance(300);
ok("the page's window losing the focus elsewhere leaves it be", frame.blurred === 1, frame.blurred);

// ---- crash, a frame that never says ready, full screen ----
msg({ type: "crash", message: "Failure(ninja-keys)" });
const n1 = posts.length; boxes[0].value += "\nlet more = 2"; boxes[0].fire("input"); advance(700);
ok("a crash after ready: said, the tiles kept, and the next program still posted", frame.isConnected && run("scriptFrame.phase") === "ready" && posts.length === n1 + 1
  && /had an error, Failure\(ninja-keys\)/.test(panel.querySelector(".script-frame-status").textContent), panel.querySelector(".script-frame-status").textContent);
msg({ type: "crash", message: "Invalid_argument" });
msg({ type: "crash", message: "Not_found" });
ok("three crashes in a minute: the frame taken away, its words and a button to start it again; the boxes kept",
  !frame.isConnected && /stopped \(Not_found\)/.test(panel.querySelector(".script-frame-status").textContent) && !!panel.querySelector("button.script-frame-again") && panel.querySelectorAll("textarea").length === ROOMS.length + 1,
  panel.querySelector(".script-frame-status").textContent);
const n0 = posts.length;
msg({ type: "ready", protocol: 1, build: "abc" }, { source: frame.win });
ok("a gone frame's messages are ignored", posts.length === n0, posts.length);
panel.querySelector("button.script-frame-again").fire("click");
const frame2 = run("scriptFrame").iframe;
ok("↻ makes a new frame", frame2 !== frame && frame2.isConnected && run("scriptFrame.phase") === "loading", run("scriptFrame.phase"));
advance(30100);
ok("a frame with no ready in 30 s: taken away, the boxes kept, a button to start it again", !frame2.isConnected && run("scriptFrame.phase") === "late"
  && /did not start/.test(panel.querySelector(".script-frame-status").textContent) && !!panel.querySelector("button.script-frame-again"), run("scriptFrame.phase"));
body.setAttribute("class", "big");
const panel2 = new FakeEl("div"); body.append(panel2); run("scriptingPanel")(panel2); advance(3000);
ok("none made while the game is full screen", !panel2.querySelector("iframe"), panel2.querySelectorAll("iframe").length);
body.setAttribute("class", ""); advance(1100);
ok("made once it is not", !!panel2.querySelector("iframe.script-frame"), panel2.querySelectorAll("iframe").length);
const frame3 = run("scriptFrame").iframe;
body.setAttribute("class", "big"); advance(31000);
ok("full screen before ready: the wait stops (the frame cannot draw), the frame kept", frame3.isConnected && run("scriptFrame.phase") === "loading", run("scriptFrame.phase"));
body.setAttribute("class", ""); advance(5000);
ok("... and counts again once shown", frame3.isConnected && run("scriptFrame.phase") === "loading" && run("scriptFrame.waited") >= 5000 && run("scriptFrame.waited") < 30000, run("scriptFrame.waited"));
msg({ type: "ready", protocol: 1, build: "abc" });
body.setAttribute("class", "big"); advance(15000);
ok("full screen after ready: no \"no program\" while the frame cannot draw", !/had no program/.test(panel2.querySelector(".script-frame-status").textContent), panel2.querySelector(".script-frame-status").textContent);
body.setAttribute("class", ""); advance(10100);
ok("a frame that says ready but never answers a program (a page it does not take programs from): said, after ten seconds",
  /had no program/.test(panel2.querySelector(".script-frame-status").textContent) && run("scriptFrame.phase") === "ready", panel2.querySelector(".script-frame-status").textContent);
msg({ type: "status", ...{ ok: true, errors: [], holes: {}, programHoles: 0, incomplete: {}, programIncomplete: 0 } });
ok("... and a status after it shown as ever", /is fine/.test(panel2.querySelector(".script-frame-status").textContent), panel2.querySelector(".script-frame-status").textContent);
panel2.remove();
const panel4 = new FakeEl("div"); body.append(panel4); run("scriptingPanel")(panel4); advance(20);
const frame4 = run("scriptFrame").iframe, n4 = posts.length; msg({ type: "ready", protocol: 2, build: "def" });
ok("a frame that speaks another protocol: taken away, said, nothing posted to it", !frame4.isConnected && run("scriptFrame.phase") === "crashed"
  && /protocol 2, and this game knows protocol 1/.test(panel4.querySelector(".script-frame-status").textContent) && posts.length === n4, panel4.querySelector(".script-frame-status").textContent);
panel4.remove(); panel.remove();

// ---- the levers: through runProgram, or the fallback; ready or not ----
const shipped = run("SCRIPT_TRAP"), RULES = {
  shipped, both: 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Common.flip2("lever_L", "lever_R") | _ => Done end',
  say: 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Say("hello from Hazel", Done) | _ => Done end',
  err: 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Flip(1, Done) end' };
const setRule = t => run(`state.scripts = { on: true, common: null, rooms: { TrapRoom: ${JSON.stringify(t)} } }; scriptCompiled.key = null;`);
const pull = () => { flips.length = 0; const used = run('scriptEvent("TrapRoom", { tag: "Pull", value: "L" })'); return { used, flips: flips.join("") }; };
// (a stand-in library: runProgram answers as told; run, the joined text's, fine)
const calls = { run: 0, runProgram: 0 }, Flip = (a, k) => ({ tag: "Flip", value: [a, k] }), Done = { tag: "Done" };
const others = () => Object.fromEntries(ROOMS.slice(1).map(r => [r.name.toLowerCase(), () => Done]));
const fake = (answer, withProgram = true) => { ctx.Hazel = { version: "fake", build: "local", run: text => { calls.run++; return { errors: [], value: { ...others(), traproom: () => Flip("lever_L", Done), rooms: ROOMS.length }, text }; } };
  if (withProgram) ctx.Hazel.runProgram = s => { calls.runProgram++; return { value: { ...others(), traproom: () => Flip("lever_R", Done), rooms: ROOMS.length }, ...answer(s) }; }; };
const fine = { ok: true, errors: [], holes: { Common: 0, TrapRoom: 0 }, programHoles: 0, incomplete: { Common: 0, TrapRoom: 0 }, programIncomplete: 0 };
setRule(shipped);
fake(() => fine);
let p = pull();
ok("with runProgram: the levers run through it", p.used && p.flips === "R" && run("scriptCompiled.via") === "runProgram" && calls.runProgram === 1 && calls.run === 0, [p, calls]);
fake(() => ({ ...fine, ok: false, holes: { Common: 0, TrapRoom: 1 } })); run("scriptCompiled.key = null");
p = pull();
ok("a hole: not ready, the lever as always (the script not used)", !p.used && !run("scriptCompiled.ready") && JSON.stringify(run("scriptCompiled.unfinished")) === '["TrapRoom: 1 hole to fill"]', [p, run("scriptCompiled")]);
fake(() => ({ ...fine, ok: false, incomplete: { Common: 0, TrapRoom: 1 } })); run("scriptCompiled.key = null");
p = pull();
ok("a bracket left open: not ready", !p.used && !run("scriptCompiled.ready"), p);
fake(() => ({ ...fine, ok: false, errors: [{ module: "TrapRoom", message: "Expecting type String", id: "1" }] })); run("scriptCompiled.key = null");
p = pull();
ok("an error: not ready, said with its module", !p.used && JSON.stringify(run("scriptCompiled.errors")) === '["TrapRoom: Expecting type String"]', run("scriptCompiled.errors"));
fake(() => fine, false); run("scriptCompiled.key = null"); calls.run = 0;
p = pull();
ok("without runProgram: the fallback, the joined text through Hazel.run", p.used && p.flips === "L" && run("scriptCompiled.via") === "run" && calls.run === 1, [p, calls]);
ok("the fallback's text is today's join", run("scriptCompiled.key") === "text:" + run("scriptProgram()"), run("scriptCompiled.key").slice(0, 80));
let seen = null; fake(s => { seen = s; return fine; }); setRule("let on_event = fun (g, e) : (Globals, Event) -> Done;  \n"); pull();
ok("runProgram is given each module's text without its last \";\"", seen && seen.modules[1].text === "let on_event = fun (g, e) : (Globals, Event) -> Done", seen && seen.modules);
fake(() => ({ ...fine, value: { ...others(), traproom: { hazel: "?" }, rooms: ROOMS.length } })); run("scriptCompiled.key = null");
p = pull();
ok("fine by Hazel but no function for a room: not ready, and said", !p.used && /TrapRoom: its on_event did not come back/.test(run("scriptCompiled.errors").join()), run("scriptCompiled.errors"));
fake(() => ({ ...fine, ok: false, holes: { Common: 0, TrapRoom: 1 } })); run("scriptCompiled.key = null");
const panel3 = new FakeEl("div"); body.append(panel3); run("scriptingPanel")(panel3);
for (let i = 0; i < 5; i++) await Promise.resolve();
const said3 = panel3.querySelector(".script-status").textContent, list3 = panel3.querySelector("ul.script-errors").kids.map(li => li.textContent);
ok("the panel: a hole says the program is not finished, the levers as before, and whose hole", /is not finished, so the levers work as before/.test(said3) && JSON.stringify(list3) === '["TrapRoom: 1 hole to fill"]', [said3, list3]);
panel3.remove();

// ---- the real library ----
if (libPath) {
  globalThis.require = createRequire(import.meta.url);
  const t0 = Date.now();
  vm.runInThisContext(fs.readFileSync(libPath, "utf8"), { filename: "hazel-lib.js" });
  const H = globalThis.Hazel;
  console.log(`  ${libPath}: Hazel ${H.version}, build ${H.build}, loaded in ${Date.now() - t0} ms`);
  const viaBoth = t => {
    setRule(t); ctx.Hazel = H; p = pull(); const a = { ...p, via: run("scriptCompiled.via"), ready: run("scriptCompiled.ready"), errors: run("scriptCompiled.errors"), unfinished: run("scriptCompiled.unfinished") };
    ctx.Hazel = { version: H.version, build: H.build, run: H.run }; run("scriptCompiled.key = null"); p = pull(); const b = { ...p, via: run("scriptCompiled.via"), ready: run("scriptCompiled.ready") };
    return [a, b];
  };
  for (const [name, t] of Object.entries(RULES)) {
    const [a, b] = viaBoth(t);
    ok(`${name}: the same lever through runProgram (${a.used ? a.flips || "none" : "as always"}) as through the fallback`, a.via === "runProgram" && b.via === "run" && a.used === b.used && a.flips === b.flips && a.ready === b.ready, [a, b]);
  }
  // (ticket 531: Event has more than Pull now, so a rule matching Pull alone is not exhaustive, an error, and the lever falls back;
  // scripting482's rules end in "| _ => Done", and here they must be ready and used)
  { const [b] = viaBoth(RULES.both), [s] = viaBoth(RULES.say);
    ok("scripting482's rules are ready: flip2 flips both, Say flips none", b.ready && b.used && b.flips === "LR" && s.ready && s.used && s.flips === "", [b, s]); }
  const [err] = viaBoth(RULES.err);
  ok("Flip(1, Done): an error, TrapRoom's", !err.ready && err.errors.length > 0 && err.errors.every(e => e.startsWith("TrapRoom: ")), err.errors);
  const notReady = (what, t, test) => { const [a] = viaBoth(t); ok(what, !a.ready && !a.used && test(a), a); };
  notReady("a hole (a member half written): not ready, TrapRoom's hole", "let on_event = fun (g, e) : (Globals, Event) -> Done;\nlet extra =", a => a.unfinished.join() === "TrapRoom: 1 hole to fill" && !a.errors.length);
  notReady("a case left open: not ready, TrapRoom's", 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Done', a => /^TrapRoom: 1 bracket or keyword/.test(a.unfinished.join()));
  notReady("a blank room: no on_event, an error, TrapRoom's", "", a => a.errors.length > 0 && a.errors.every(e => e.startsWith("TrapRoom: ")));
  notReady("a rule of the wrong type: an error, TrapRoom's (the tail's ascription)", 'let on_event = fun (g, e) : (Globals, Event) -> "hi"', a => a.errors.some(e => e.startsWith("TrapRoom: ")));
  const [un] = viaBoth('let on_event = fun (g, e) -> case e | Pull(side) => Flip("lever_" ++ side, Done) end');
  ok("a rule with no type written runs too", un.ready && un.used && un.flips === "L", un);
}
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
