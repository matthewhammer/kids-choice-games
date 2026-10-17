// (ticket 221, Matthew) 🫧 blowing bubbles: B held on the keyboard blows
// them from the mouth, rising and drifting; with theme B on too, the two take
// turns; from the left hand they start left of the right hand's; the
// controller has the action (button 6) and the on-screen controller its 🫧
// button. Exits 1 on a failure.
//   node blow221.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
const key = async (type) => send("Input.dispatchKeyEvent", { type, key: "b", code: "KeyB", text: type === "keyDown" ? "b" : undefined, windowsVirtualKeyCode: 66 });
const holdB = async ms => { await key("keyDown"); await sleep(ms); await key("keyUp"); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "forest", figX: 0, figY: 60 }); Object.assign(state.body, { blowFrom: "mouth", blowA: true, blowB: false, blowC: false }); changed(); await new Promise(r => setTimeout(r, 600)); document.body.focus(); return 1; })()`);
  await holdB(900);
  const a = JSON.parse(await ev(`(async () => { const n0 = blowSim.list.length, y0 = blowSim.list.map(b => b.y), shown = document.querySelectorAll("#access-layer svg.blown circle").length;
    await new Promise(r => setTimeout(r, 600)); const rose = blowSim.list.filter((b, i) => y0[i] != null && b.y < y0[i] - 2).length;
    return JSON.stringify({ n0, shown, rose, colors: [...new Set(blowSim.list.map(b => b.th.color))] }); })()`));
  ok("B held: bubbles blown, drawn over the picture", a.n0 >= 4 && a.shown >= 4, a);
  ok("they rise", a.rose >= 3, a);
  await ev(`(async () => { blowSim.list = []; state.body.blowB = true; changed(); return 1; })()`); await sleep(200);
  await holdB(900);
  const b = JSON.parse(await ev(`JSON.stringify({ colors: [...new Set(blowSim.list.map(b => b.th.color))] })`));
  ok("with theme B on too, the two take turns", b.colors.length === 2, b);
  const hands = JSON.parse(await ev(`(async () => { state.body.arms = 10; changed(); await new Promise(r => setTimeout(r, 300));
    state.body.blowFrom = "left"; const L = blowFrom(); state.body.blowFrom = "right"; const R = blowFrom(); state.body.blowFrom = "mouth"; const M = blowFrom();
    return JSON.stringify({ L, R, M }); })()`));
  ok("from the left hand they start left of the right hand's, the mouth above both", hands.L && hands.R && hands.M && hands.L[0] < hands.R[0] && hands.M[1] < Math.min(hands.L[1], hands.R[1]), hands);
  const pad = JSON.parse(await ev(`(async () => { touchWant(true); await new Promise(r => setTimeout(r, 300)); const btn = document.querySelector('#touchpad [data-b="6"]');
    const r = { action: PAD_ACTIONS.some(a => a[0] === "bubbles"), button: DEFAULTS.controls.bubbles, onScreen: !!btn };
    touchWant(false); return JSON.stringify(r); })()`));
  ok("the controller's action 🫧 (button 6), and its button on the on-screen controller", pad.action && pad.button === 6 && pad.onScreen, pad);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
