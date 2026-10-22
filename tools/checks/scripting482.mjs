// (ticket 482, Matthew: "an editor panel in MUDU, under a new control panel called 'Scripting' --- with a list of editors, one per
// room that needs logic, starting only with the dungeon in the castle ... each sub-editor ... could be a module named by that
// square's name. Names should be unique, and we should enforce that.") 🧩 Scripting: an editor per module (📚 Common, the trap
// room's TrapRoom), names unique; Hazel (window.Hazel, from SCRIPT_BUILD's library) loads and the shipped program is fine; with
// the scripts on, a red lever pulled in the trap room runs TrapRoom.on_event: the shipped rule flips that lever only, a rule using
// Common.flip2 flips both, Say puts its words over the picture and flips none; a program with an error, or with a hole to fill,
// leaves the lever working as before.
// (ticket 520) and Hazel's tiles: the levers run through Hazel.runProgram (Hazel builds the program from the module texts), and,
// with runProgram taken away (an older library), through the fallback, the text the page joins. Under the editors, Hazel's app in
// a frame (index.html#embed, from hazel.org: another origin, so its own target, attached to with Target.setAutoAttach; or, where
// Chrome keeps it in the page's process, its own context): it says ready, shows the shipped program as tiles with no error mark,
// and, once Flip(1, Done) is typed in TrapRoom's box, an error mark in the tiles and TrapRoom's error in its status; while the
// game is full screen it is display: none; a click in it leaves the keys with the game (B still blows bubbles). Recorded, not
// gated: the frame's ready time, the library's, and the game's frame times from the tab opening until a second after ready.
// Exits 1 on a failure.
//   node scripting482.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [], frameErrs = [], frameSessions = new Set();
let frameCtx = null;
const send = (method, params = {}, sessionId) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") (m.sessionId ? frameErrs : errs).push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  // (the frame, out of the page's process: its own target)
  if (m.method === "Target.attachedToTarget" && m.params.targetInfo.type === "iframe") { frameSessions.add(m.params.sessionId); send("Runtime.enable", {}, m.params.sessionId); }
  if (m.method === "Target.detachedFromTarget") frameSessions.delete(m.params.sessionId);
  // (or in it: the frame's own context)
  if (m.method === "Runtime.executionContextCreated" && !m.sessionId) { const c = m.params.context; if (c.origin === "https://hazel.org" && c.auxData && c.auxData.isDefault) frameCtx = c.id; } });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
// (an expression in Hazel's frame, wherever Chrome put it: the value from the one at https://hazel.org, or null)
const frameEv = async x => {
  const tries = [...[...frameSessions].reverse().map(s => ["", s]), ...(frameCtx ? [[frameCtx, undefined]] : [])];
  for (const [ctx, s] of tries) {
    const r = await send("Runtime.evaluate", { expression: `location.origin === "https://hazel.org" ? (${x}) : undefined`, returnByValue: true, ...(ctx ? { contextId: ctx } : {}) }, s);
    const v = r.result && !r.result.exceptionDetails && r.result.result ? r.result.result.value : undefined;
    if (v !== undefined) return v;
  }
  return null;
};
// (marks: the error pieces that draw something; Hazel makes a piece per error id even where it draws nothing. words: whether the
// tiles hold the program posted, not any text. scroll: the frame's content height, against the height the page gave it)
const inFrame = `(() => { const t = [...document.querySelectorAll(".code-container .token")].map(e => e.textContent.trim());
  return JSON.stringify({ tokens: t.length, words: ["module", "Common", "TrapRoom", "on_event"].every(w => t.includes(w)), marks: document.querySelectorAll(".errors > .errors-piece > *").length,
    row: getComputedStyle(document.documentElement).getPropertyValue("--row-height-px").trim(), scroll: document.documentElement.scrollHeight, focused: document.hasFocus() }); })()`;
const frameLook = async () => { const v = await frameEv(inFrame); return v ? JSON.parse(v) : null; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  // (as a page in front: a window's focus events, which the keys' check needs, come only to a focused page)
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  await send("Page.navigate", { url }); await sleep(4000);
  // ---- the tab opened: its editors, and the game's frames recorded from here ----
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true;
    const B = state.background;
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -200, figY: 80, things: [], castleLeverL_3N: true, castleLeverR_3N: true });
    changed(); await w(400);
    window.__G = { gaps: [], last: 0, on: true, t0: performance.now(), lib: null };
    const g = t => { if (!__G.on) return; if (__G.last) __G.gaps.push(+(t - __G.last).toFixed(1)); __G.last = t; if (__G.lib == null && window.Hazel) __G.lib = Math.round(performance.now() - __G.t0); requestAnimationFrame(g); };
    requestAnimationFrame(g);
    tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(300);
    out.editors = [...document.querySelectorAll("#panel textarea.script-editor")].map(t => t.dataset.module);
    out.names = scriptNames(); out.dedupe = scriptModuleName("Trap Room", new Set(["TrapRoom"]));
    out.frameSrc = (document.querySelector("#panel iframe.script-frame") || {}).src || null;
    return JSON.stringify(out); })()`));
  ok("🧩 Scripting has an editor per module: Common, then TrapRoom", JSON.stringify(r.editors) === '["Common","TrapRoom"]', r.editors);
  ok("module names are unique, and a second of a name gets a number", r.names && r.dedupe === "TrapRoom2", r);
  // ---- the frame: ready, then a second more of the game's frames ----
  let phase = "none";
  for (let i = 0; i < 240; i++) { phase = await ev(`scriptFrame ? scriptFrame.phase : "none"`); if (phase !== "loading" && phase !== "none") break; await sleep(250); }
  await sleep(1000);
  const T = JSON.parse(await ev(`(() => { __G.on = false; const g = __G.gaps.slice().sort((a, b) => a - b), q = p => g.length ? g[Math.min(g.length - 1, Math.floor(p * g.length))] : null, s = g.reduce((a, b) => a + b, 0);
    return JSON.stringify({ phase: scriptFrame && scriptFrame.phase, readyMs: scriptFrame && scriptFrame.readyMs != null ? Math.round(scriptFrame.readyMs) : null, build: scriptFrame && scriptFrame.build,
      libMs: __G.lib, libBuild: window.Hazel && Hazel.build, frames: g.length, fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), median: q(0.5), p95: q(0.95), max: g.length ? g[g.length - 1] : null,
      over25: g.filter(x => x > 25).length, over50: g.filter(x => x > 50).length, over100: g.filter(x => x > 100).length, longest: __G.gaps.map((x, i) => [i, x]).filter(([, x]) => x > 50).slice(0, 12) }); })()`));
  console.log(`  DATA ${JSON.stringify({ frameTarget: frameSessions.size ? "own process" : frameCtx ? "the page's process" : "none found", ...T })}`);
  console.log(`  (the game's frames from the 🧩 tab opening until a second after the frame's ready: ${T.frames} frames, ${T.fps} a second, median ${T.median} ms, 95% under ${T.p95} ms, longest ${T.max} ms, ${T.over50} over 50 ms; ` +
    `the frame ready in ${T.readyMs} ms, the library (window.Hazel, on the game's own thread) in ${T.libMs} ms; recorded, not gated)`);
  let look = null;
  for (let i = 0; i < 80 && !(look && look.tokens > 0); i++) { look = await frameLook(); if (!(look && look.tokens > 0)) await sleep(250); }
  const st0 = JSON.parse(await ev(`JSON.stringify((scriptFrame && scriptFrame.status) || null)`));
  ok("Hazel's frame (index.html#embed on the embed branch's build) says ready", r.frameSrc === "https://hazel.org/build/js-library-embed/index.html#embed" && T.phase === "ready", [r.frameSrc, T.phase]);
  ok("the frame shows the shipped program as tiles (its modules and on_event among them), with no error mark, and its status says fine", !!look && look.tokens > 20 && look.words && look.marks === 0 && !!st0 && st0.ok === true, [look, st0]);
  const Z = JSON.parse(await ev(`JSON.stringify({ height: scriptFrame && scriptFrame.height, style: scriptFrame && parseInt(scriptFrame.iframe.style.height) })`));
  const row = parseFloat(look && look.row) || 30;
  ok("size: the frame as tall as Hazel says its tiles are (taller than its first 120 px, within a row of its content)", Z.height > 120 && Z.style === Z.height && !!look && Math.abs(look.scroll - Z.height) <= row + 2, [Z, look]);
  // ---- the levers, through runProgram ----
  const L = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {}, B = state.background;
    for (let i = 0; i < 120 && !window.Hazel; i++) await w(250);
    out.hazel = !!window.Hazel; await w(300);
    out.status = (document.querySelector("#panel .script-status") || {}).textContent || "";
    const H = window.Hazel, rp = H.runProgram; let calls = 0;
    if (typeof rp === "function") H.runProgram = s => { calls++; return rp(s); };
    state.scripts.on = true; changed();
    const K = castleOf(B), lev = () => [leverDown(B, "L", 3, K.id), leverDown(B, "R", 3, K.id)];
    const pullL = async () => { roomLeverPull("L"); await w(1600); return lev(); };
    out.before = lev(); out.shipped = await pullL();
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Common.flip2("lever_L", "lever_R") end';
    out.both0 = lev(); out.both = await pullL();
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Say("hello from Hazel", Done) end';
    out.say0 = lev(); out.say = await pullL(); out.sayText = (document.getElementById("script-say") || {}).textContent || "";
    out.via = scriptCompiled.via; out.calls = calls;
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> Flip("lever_R", Done);\\nlet extra =';
    out.hole0 = lev(); out.hole = await pullL(); out.holeReady = scriptCompiled.ready; out.holeSaid = scriptCompiled.unfinished;
    if (typeof rp === "function") H.runProgram = rp;
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(L)}`);
  ok("Hazel loads, and the shipped program is fine", L.hazel && /is fine/.test(L.status), L.status);
  ok("the shipped rule: pulling L flips L only", L.shipped[0] !== L.before[0] && L.shipped[1] === L.before[1], [L.before, L.shipped]);
  ok("a rule using Common.flip2 flips both", L.both[0] !== L.both0[0] && L.both[1] !== L.both0[1], [L.both0, L.both]);
  ok("Say puts its words over the picture and flips none", JSON.stringify(L.say) === JSON.stringify(L.say0) && /hello from Hazel/.test(L.sayText), L);
  ok("the levers ran through Hazel.runProgram", L.via === "runProgram" && L.calls >= 2, [L.via, L.calls]);
  ok("a hole to fill: not ready, the lever works as before (L flips), and what is missing is TrapRoom's", L.holeReady === false && L.hole[0] !== L.hole0[0] && L.hole[1] === L.hole0[1]
    && JSON.stringify(L.holeSaid) === '["TrapRoom: 1 hole to fill"]', L);
  // ---- an error, typed in TrapRoom's box: the panel, the frame's marks and status, the lever ----
  const E = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {}, B = state.background;
    const ta = document.querySelector('#panel textarea[data-module="TrapRoom"]');
    ta.value = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Flip(1, Done) end'; ta.dispatchEvent(new Event("input"));
    await w(1200);
    out.status = (document.querySelector("#panel .script-status") || {}).textContent || "";
    out.listed = [...document.querySelectorAll("#panel ul.script-errors:not(.script-frame-errors) li")].map(li => li.textContent);
    const K = castleOf(B), lev = () => [leverDown(B, "L", 3, K.id), leverDown(B, "R", 3, K.id)];
    out.err0 = lev(); roomLeverPull("L"); await w(1600); out.err = lev(); out.errors = scriptCompiled.errors.length;
    return JSON.stringify(out); })()`));
  let st = null; look = null;
  for (let i = 0; i < 60; i++) {
    st = JSON.parse(await ev(`JSON.stringify((scriptFrame && scriptFrame.status) || null)`)); look = await frameLook();
    if (st && st.ok === false && look && look.marks > 0) break;
    await sleep(250);
  }
  const frameSaid = await ev(`[...document.querySelectorAll("#panel .script-frame-status, #panel ul.script-frame-errors li")].map(e => e.textContent).join(" | ")`);
  console.log(`  ${JSON.stringify({ ...E, frameSaid, look })}`);
  ok("Flip(1, Done) typed: the panel says the program has errors, each listed as TrapRoom's", /has \d+ errors?/.test(E.status) && E.listed.length > 0 && E.listed.every(t => t.startsWith("TrapRoom: ")), E);
  ok("... and the frame marks it in the tiles, its status TrapRoom's error", !!st && st.ok === false && (st.errors || []).length > 0 && st.errors.every(e => e.module === "TrapRoom") && !!look && look.marks > 0 && /TrapRoom: /.test(frameSaid), [st, look, frameSaid]);
  ok("a program with an error: the lever works as before (L flips)", E.errors > 0 && E.err[0] !== E.err0[0] && E.err[1] === E.err0[1], E);
  // ---- an older library, with no runProgram: the fallback ----
  const F = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {}, B = state.background, H = window.Hazel, rp = H.runProgram;
    H.runProgram = undefined;
    try {
      state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Common.flip2("lever_L", "lever_R") end';
      const K = castleOf(B), lev = () => [leverDown(B, "L", 3, K.id), leverDown(B, "R", 3, K.id)];
      out.b0 = lev(); roomLeverPull("L"); await w(1600); out.b = lev(); out.via = scriptCompiled.via;
    } finally { H.runProgram = rp; }
    return JSON.stringify(out); })()`));
  ok("with no runProgram (an older library): the fallback, the page's joined text, and Common.flip2 flips both", F.via === "run" && F.b[0] !== F.b0[0] && F.b[1] !== F.b0[1], F);
  // ---- full screen: the frame out of the layout ----
  const D = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), f = scriptFrame && scriptFrame.iframe, out = {};
    if (!f) return JSON.stringify({ none: true });
    document.body.classList.add("big"); await w(100); out.big = getComputedStyle(f).display;
    document.body.classList.remove("big"); await w(600); out.back = getComputedStyle(f).display; out.connected = f.isConnected;
    return JSON.stringify(out); })()`));
  ok("while the game is full screen the frame is display: none, and shown again after", D.big === "none" && D.back !== "none" && D.connected, D);
  // ---- the keys: a click in the tiles, then B ----
  const box = JSON.parse(await ev(`(async () => { const f = scriptFrame.iframe; f.scrollIntoView({ block: "center" }); await new Promise(r => setTimeout(r, 400));
    const b = f.getBoundingClientRect(); return JSON.stringify({ x: Math.round(b.left + Math.min(60, b.width / 2)), y: Math.round(b.top + Math.min(30, b.height / 2)), blurs: scriptFrame.blurs }); })()`));
  const mouse = (type, extra = {}) => send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1, ...extra });
  await mouse("mouseMoved", { button: "none", clickCount: 0 }); await mouse("mousePressed"); await mouse("mouseReleased");
  await sleep(800);
  const K1 = JSON.parse(await ev(`JSON.stringify({ active: document.activeElement === scriptFrame.iframe ? "the frame" : (document.activeElement || {}).tagName, blurs: scriptFrame.blurs, blowKey })`));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "b", code: "KeyB", text: "b", windowsVirtualKeyCode: 66, nativeVirtualKeyCode: 66 });
  await sleep(150);
  const blown = await ev("blowKey");
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "b", code: "KeyB", windowsVirtualKeyCode: 66, nativeVirtualKeyCode: 66 });
  console.log(`  ${JSON.stringify({ box, after: K1, blown })}`);
  ok("a click in the tiles takes the focus there, and it comes back to the game, whose B still blows bubbles", K1.blurs > box.blurs && K1.active !== "the frame" && blown === true, [box, K1, blown]);
  // (a crash after ready keeps the tiles, said in their status line: still a failure here)
  const last = await ev(`scriptFrame ? scriptFrame.phase + (scriptFrame.oops ? " (crashed: " + scriptFrame.oops + ")" : "") : "none"`);
  ok("the frame did not crash", last === "ready", [last, await ev(`scriptFrame && scriptFrame.why`), frameErrs.slice(0, 3)]);
  if (frameErrs.length) console.log(`  (the frame's own page errors, not the game's: ${frameErrs.length}, the first ${frameErrs[0]})`);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
