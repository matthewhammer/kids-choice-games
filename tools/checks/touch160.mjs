// (ticket 160) The audit found the forest and our imagination under 55 with
// the on-screen controller (51.3, 52.5), yet a fake game controller walks
// both at 60. Which part of the on-screen controller costs? Each place
// walked right and left, 1.2 s each, four ways, a fresh page each: (pad)
// the fake game controller; (touch) the on-screen arrows held by the mouse;
// (shown) the on-screen controller showing, walked by the game controller;
// (touch, plain) held, with the pressed arrow's filter and scale off. Never fails.
//   node touch160.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(kind, way) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 200) : r.result.result.value; };
  try {
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url }); await sleep(4000);
    const touch = way !== "pad";
    const usePad = way === "pad" || way === "shown";
    await ev(`(() => { localStorage.removeItem("dress-up-slow"); localStorage.removeItem("dress-up-choppy"); slowFlag = false; choppy = false;
      state = clone(DEFAULTS); state.music.mute = true; Object.assign(state.background, { kind: ${JSON.stringify(kind)} });
      [state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; changed(); ${touch ? "touchWant(true);" : ""}
      ${way === "touch, plain" ? `{ const st = document.createElement("style"); st.textContent = ".touchpad button.down, .touchpad .dpad .arm.down { filter: none !important; transform: none !important; }"; document.head.append(st); }` : ""}
      window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      ${usePad ? `Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); { const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); }` : ""}
      window.__F = { gaps: [], last: 0, on: false }; const f = t => { if (__F.on) { if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
    await sleep(800);
    let dp = null;
    if (!usePad) {
      const s = await ev(`(() => { const e = document.querySelector("#touchpad .dpad"); if (!e || document.getElementById("touchpad").hidden) return "null"; const r = e.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]); })()`);
      dp = JSON.parse(s);
      if (!dp) return { fps: "no controller" };
    }
    const go = async (dir, ms) => {
      if (usePad) { await ev(`__pad.buttons[${dir === "right" ? 15 : 14}].pressed = true; 1`); await sleep(ms); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); return; }
      const x = dp[0] + (dir === "right" ? 0.4 : -0.4) * dp[2], y = dp[1];
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
      await sleep(ms);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
    };
    await go("right", 600); await go("left", 600);   // (a warm-up)
    await ev(`[state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; changed(); __F.gaps = []; __F.last = 0; __F.on = true; 1`);
    await go("right", 1200); await go("left", 1200);
    return JSON.parse(await ev(`(() => { __F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0); return JSON.stringify({ fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), late: Math.round(100 * g.filter(x => x > 25).length / Math.max(1, g.length)) }); })()`));
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
console.log("Chrome, 1920x1080, walked right and left (frames a second, % late), a fresh page each:");
for (const kind of ["forest", "imagination", "castle"]) {
  const row = [];
  for (const way of ["pad", "touch", "shown", "touch, plain"]) {
    try { const r = await run(kind, way); row.push(`${way}: ${r.fps}${r.late !== undefined ? ` (${r.late}%)` : ""}`); }
    catch (e) { row.push(`${way}: stopped`); }
  }
  console.log(`  ${kind.padEnd(12)} ${row.join(" · ")}`);
}
process.exit(0);
