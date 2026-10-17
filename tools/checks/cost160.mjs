// (ticket 160) What costs the frames in the places the audit found slow on
// GitHub's computer (🌲 forest, 💭 our imagination): the friend walked right
// and left with a fake controller, first as the place is, then with one of
// its objects hidden at a time (the game's own objectsOff, as its object
// list does), then with all of them hidden; each walk's frames a second
// and the share of late frames. What gains the most is the cost. Never fails.
//   node cost160.mjs <devtools port> <url>      env: PLACES=forest,imagination
const [dport, url] = process.argv.slice(2);
const places = (process.env.PLACES || "forest,imagination").split(",");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  console.log("version", await ev("VERSION.number"));
  await ev(`(() => {
    window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true });
    const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e);
    window.__f = { on: false, gaps: [], last: 0 };
    { const f = t => { if (__f.on) { if (__f.last) __f.gaps.push(t - __f.last); __f.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); }
    return 1; })()`);
  // one walk: right then left, 1.2 s each, as the place is now
  const walk = async () => {
    await ev(`[state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; changed(); 1`); await sleep(300);
    await ev(`__f.on = true; __f.gaps = []; __f.last = 0; 1`);
    for (const b of [15, 14]) { await ev(`__pad.buttons[${b}].pressed = true; 1`); await sleep(1200); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); }
    return JSON.parse(await ev(`(() => { __f.on = false; const g = __f.gaps, s = g.reduce((a, b) => a + b, 0);
      return JSON.stringify({ fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), late: Math.round(100 * g.filter(x => x > 25).length / Math.max(1, g.length)) }); })()`));
  };
  for (const kind of places) {
    await ev(`localStorage.removeItem("dress-up-slow"); localStorage.removeItem("dress-up-choppy"); slowFlag = false; choppy = false;
      state = Object.assign(clone(DEFAULTS), { controls: state.controls }); state.music.mute = true; state.background.kind = ${JSON.stringify(kind)};
      state.background.objectsOff = {}; changed(); 1`);
    await sleep(1500);
    await walk();   // (a warm-up)
    const base = await walk();
    const names = await ev(`bgShown.objs.map(o => o.name)`);
    const place = await ev(`objPlace(state.background)`);
    const rows = [];
    for (const name of names) {
      await ev(`state.background.objectsOff = { [${JSON.stringify(place)}]: [${JSON.stringify(name)}] }; changed(); 1`); await sleep(400);
      rows.push({ name, ...(await walk()) });
    }
    await ev(`state.background.objectsOff = { [${JSON.stringify(place)}]: bgShown.objs.map(o => o.name) }; changed(); 1`); await sleep(400);
    const none = await walk();
    await ev(`state.background.objectsOff = {}; changed(); 1`);
    console.log(`\n${kind}: as it is ${base.fps} fps (${base.late}% late); every object hidden ${none.fps} fps (${none.late}% late); ${names.length} objects`);
    for (const r of rows.sort((a, b) => b.fps - a.fps).slice(0, 15)) console.log(`  ${String(r.fps).padStart(5)} fps (${String(r.late).padStart(3)}% late) without "${r.name}"`);
  }
  console.log("\nerrors:", errs.length ? errs.slice(0, 4) : "none");
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(0); }
