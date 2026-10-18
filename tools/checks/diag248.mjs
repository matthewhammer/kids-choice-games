// (ticket 248, diagnostic, never merged) Traces, frame by frame, (1) the woodpath high jump onto "mushroom, right inner"
// and the walk after it, (2) the controller's walk left into tree room 1's trunk: where the friend is, their anim, what
// solidAt finds at their feet and a step ahead, their soles and torso box, the solid's box and bands.
//   node diag248.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(() => {
    window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true });
    const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e);
    window.__trace = []; window.__tr = name => { const B = state.background, x = B.figX, z = SCENE.ground + B.figY, f = o => o ? (o.wall ? "wall" : o.name) : null;
      const S = youBoxes(x, z).map(s => s.slice(0, 4).map(v => +v.toFixed(1)).concat([+s[4].toFixed(0), +(Number.isFinite(s[5]) ? s[5] : 999).toFixed(0)]));
      window.__trace.push({ t: Math.round(performance.now() - window.__t0), x: +x.toFixed(1), anim: state.body.anim, facing: state.body.facing, here: f(solidAt(x, z)), ahead: f(solidAt(x + (state.body.facing === "left" ? -2 : 2), z)), S }); };
    return 1; })()`);
  const run = async (setup, btns, jumpAt, ms) => {
    await ev(`(async () => { state = Object.assign(clone(DEFAULTS), { controls: state.controls }); state.music.mute = true; ${setup}; state.body.anim = "none"; changed(); await new Promise(r => setTimeout(r, 600)); return 1; })()`);
    const info = JSON.parse(await ev(`(() => { const o = solidsHere().find(o => o.name === window.__want); return JSON.stringify(o ? { name: o.name, x0: +o.x0.toFixed(1), x1: +o.x1.toFixed(1), back: +o.back.toFixed(1), front: +o.front.toFixed(1), h: +o.h.toFixed(1), bands: solidBands(o).map(b => [b.x0, b.x1, b.lo, b.hi].map(v => Number.isFinite(v) ? +v.toFixed(1) : 999)) } : solidsHere().map(o => o.name)); })()`));
    console.log("solid:", JSON.stringify(info));
    await ev(`window.__trace = []; window.__t0 = performance.now(); window.__iv = setInterval(() => window.__tr(), 30); ${btns.map(b => `__pad.buttons[${b}].pressed = true;`).join(" ")} 1`);
    if (jumpAt !== null) { await sleep(jumpAt); await ev(`__pad.buttons[state.controls.jumpHigh].pressed = true; 1`); await sleep(120); await ev(`__pad.buttons[state.controls.jumpHigh].pressed = false; 1`); await sleep(ms - jumpAt - 120); }
    else await sleep(ms);
    await ev(`__pad.buttons.forEach(b => b.pressed = false); 1`); await sleep(1300);
    const tr = JSON.parse(await ev(`(() => { clearInterval(window.__iv); return JSON.stringify(window.__trace); })()`));
    let last = null;
    for (const s of tr) { const key = JSON.stringify([s.x, s.anim, s.here, s.ahead]); if (key !== last) { console.log(JSON.stringify(s)); last = key; } }
  };
  console.log("== (1) woodpath: from x 146, ▶ with a high jump at 120 ms, 2.2 s");
  await ev(`window.__want = "mushroom, right inner"; 1`);
  const o = JSON.parse(await ev(`(async () => { state = Object.assign(clone(DEFAULTS), { controls: state.controls }); Object.assign(state.background, { kind: "woodpath" }); changed(); await new Promise(r => setTimeout(r, 500)); const o = solidsHere().find(o => o.name === "mushroom, right inner"); return JSON.stringify(o ? { z: (o.back + o.front) / 2 - SCENE.ground, x0: o.x0 } : null); })()`));
  if (o) await run(`Object.assign(state.background, { kind: "woodpath", figX: ${Math.round(o.x0 - 60)}, figY: ${Math.round(o.z)} })`, [15], 120, 2200);
  console.log("== (2) tree room 1: from right of the trunk, ◀ for 3 s");
  await ev(`window.__want = "tree trunk"; 1`);
  const t = JSON.parse(await ev(`(async () => { state = Object.assign(clone(DEFAULTS), { controls: state.controls }); Object.assign(state.background, { kind: "treeroom", inside: 1 }); changed(); await new Promise(r => setTimeout(r, 500)); const o = solidsHere().find(o => o.name === "tree trunk"); return JSON.stringify(o ? { z: (o.back + o.front) / 2 - SCENE.ground, x1: o.x1 } : null); })()`));
  if (t) await run(`Object.assign(state.background, { kind: "treeroom", inside: 1, figX: ${Math.round(t.x1 + 50)}, figY: ${Math.round(t.z)} })`, [14], null, 3000);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log("all ok");
process.exit(0);
