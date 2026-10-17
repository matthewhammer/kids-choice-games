// (ticket 172, 0.0.92) The choppy mark measured afresh each visit: a mark
// kept from before is cleared on load; walking in the duck pond with a
// fake pad for 12 s marks a computer only when its frames come late (BUSY:
// the page kept busy that many ms in every frame, as painting would, the
// drawing itself still fast), never at full speed.
//   node choppy172.mjs <devtools port> <url>      (start Chrome pinned)
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(rate) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
  try {
    await send("Runtime.enable"); await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1203, height: 802, deviceScaleFactor: 1.875, mobile: false });
    await send("Page.navigate", { url }); await sleep(3000);
    await ev(`localStorage.setItem("dress-up-choppy", "1"); 1`);
    await send("Page.reload"); await sleep(4000);
    const kept = await ev(`JSON.stringify({ choppy, stored: localStorage.getItem("dress-up-choppy") })`);
    await ev(`(() => { window.__pad = { id: "T (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e);
      state.music.mute = true; Object.assign(state.background, { kind: "lake", figX: -150 });
      { const B = state.background, ys = []; for (let y = -200; y <= 86; y += 2) if (inWater(B, 0, SCENE.ground + y) && inWater(B, -150, SCENE.ground + y) && inWater(B, 150, SCENE.ground + y)) ys.push(y); B.figY = ys[ys.length >> 1] ?? 0; }
      changed(); return 1; })()`);
    await sleep(1000);
    if (rate > 0) await ev(`(() => { const f = () => { const t = performance.now(); while (performance.now() - t < ${rate}); if (!window.__unbusy) requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
    const log = [];
    for (let i = 0; i < 6; i++) {
      await ev(`__pad.buttons[${i % 2 ? 14 : 15}].pressed = true; 1`); await sleep(2000); await ev(`__pad.buttons.forEach(b => b.pressed = false); 1`);
      log.push(await ev(`JSON.stringify({ choppy, slow: slowFlag, run: choppyRun, x: Math.round(state.background.figX) })`));
    }
    await ev(`window.__unbusy = true; 1`);
    console.log(`busy ${rate} ms a frame: on load ${kept}; walking 2 s at a time: ${log.join(" ")}${errs.length ? " · ERRORS " + errs.join(" | ") : ""}`);
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
for (const r of [0, 12, 30]) await run(r);
process.exit(0);
