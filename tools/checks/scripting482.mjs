// (ticket 482, Matthew: "an editor panel in MUDU, under a new control panel called 'Scripting' --- with a list of editors, one per
// room that needs logic, starting only with the dungeon in the castle ... each sub-editor ... could be a module named by that
// square's name. Names should be unique, and we should enforce that.") 🧩 Scripting: an editor per module (📚 Common, the trap
// room's TrapRoom), names unique; Hazel (#2711's window.Hazel, from its branch build) loads and the shipped program is fine; with
// the scripts on, a red lever pulled in the trap room runs TrapRoom.on_event: the shipped rule flips that lever only, a rule using
// Common.flip2 flips both, Say puts its words over the picture and flips none; a program with an error leaves the lever working
// as before. Exits 1 on a failure.
//   node scripting482.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true;
    const B = state.background;
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -200, figY: 80, things: [], castleLeverL_3N: true, castleLeverR_3N: true });
    changed(); await w(400);
    const K = castleOf(B), lev = () => [leverDown(B, "L", 3, K.id), leverDown(B, "R", 3, K.id)];
    tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(300);
    out.editors = [...document.querySelectorAll("#panel textarea.script-editor")].map(t => t.dataset.module);
    out.names = scriptNames(); out.dedupe = scriptModuleName("Trap Room", new Set(["TrapRoom"]));
    for (let i = 0; i < 120 && !window.Hazel; i++) await w(250);
    out.hazel = !!window.Hazel; await w(300);
    out.status = (document.querySelector("#panel .script-status") || {}).textContent || "";
    state.scripts.on = true; changed();
    const pullL = async () => { roomLeverPull("L"); await w(1600); return lev(); };
    out.before = lev(); out.shipped = await pullL();
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Common.flip2("lever_L", "lever_R") end';
    out.both0 = lev(); out.both = await pullL();
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Say("hello from Hazel", Done) end';
    out.say0 = lev(); out.say = await pullL(); out.sayText = (document.getElementById("script-say") || {}).textContent || "";
    state.scripts.rooms.TrapRoom = 'let on_event = fun (g, e) : (Globals, Event) -> case e | Pull(side) => Flip(1, Done) end';
    out.err0 = lev(); out.err = await pullL(); const C = scriptCompile(); out.errors = C ? C.errors.length : -1;
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("🧩 Scripting has an editor per module: Common, then TrapRoom", JSON.stringify(r.editors) === '["Common","TrapRoom"]', r.editors);
  ok("module names are unique, and a second of a name gets a number", r.names && r.dedupe === "TrapRoom2", r);
  ok("Hazel loads, and the shipped program is fine", r.hazel && /is fine/.test(r.status), r.status);
  ok("the shipped rule: pulling L flips L only", r.shipped[0] !== r.before[0] && r.shipped[1] === r.before[1], [r.before, r.shipped]);
  ok("a rule using Common.flip2 flips both", r.both[0] !== r.both0[0] && r.both[1] !== r.both0[1], [r.both0, r.both]);
  ok("Say puts its words over the picture and flips none", JSON.stringify(r.say) === JSON.stringify(r.say0) && /hello from Hazel/.test(r.sayText), r);
  ok("a program with an error: the lever works as before (L flips)", r.errors > 0 && r.err[0] !== r.err0[0] && r.err[1] === r.err0[1], r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
