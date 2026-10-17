// (ticket 160) Does the on-screen controller cost frames over the forest,
// and which part of drawing it: its shadows, its see-through, sharing a
// layer with the picture? (touch160's "showing" never showed: a connected
// game controller hides the on-screen one, by design; and one run each sat
// inside the noise.) The forest (and our imagination, a control) walked
// right and left, 1.2 s each: by the fake game controller, the on-screen
// one hidden (the baseline), or by holding the on-screen arrows with the
// mouse, as is or with its CSS changed; three rounds in rotating order, a
// fresh page each, so the spread within a way is the noise. Never fails.
//   node layer160.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const WAYS = {
  "game controller, hidden": null,
  "held, as is": "",
  "no shadows": ".touchpad button { box-shadow: none !important; }",
  "own layer": ".touchpad { will-change: transform; }",
  "own layer, no shadows": ".touchpad { will-change: transform; } .touchpad button { box-shadow: none !important; }",
  "no see-through": ".touchpad button, .touchpad .dpad .arm, .touchpad .dpad .hub { background-color: rgb(40, 36, 56) !important; }",
};
async function run(kind, css) {
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
    await ev(`(() => { localStorage.removeItem("dress-up-slow"); localStorage.removeItem("dress-up-choppy"); slowFlag = false; choppy = false;
      state = clone(DEFAULTS); state.music.mute = true; Object.assign(state.background, { kind: ${JSON.stringify(kind)} });
      [state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; changed(); ${css !== null ? "touchWant(true);" : ""}
      ${css ? `{ const st = document.createElement("style"); st.textContent = ${JSON.stringify(css)}; document.head.append(st); }` : ""}
      window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      ${css === null ? `Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); { const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); }` : ""}
      window.__F = { gaps: [], last: 0, on: false }; const f = t => { if (__F.on) { if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
    await sleep(800);
    const shown = await ev(`(() => { const t = document.getElementById("touchpad"); return !!t && !t.hidden; })()`);
    let dp = null;
    if (css !== null) {
      dp = JSON.parse(await ev(`(() => { const e = document.querySelector("#touchpad .dpad"); if (!e) return "null"; const r = e.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2, r.width]); })()`));
      if (!dp) return { fps: "no controller", late: 0, shown };
    }
    const go = async (dir, ms) => {
      if (!dp) { await ev(`__pad.buttons[${dir === "right" ? 15 : 14}].pressed = true; 1`); await sleep(ms); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); return; }
      const x = dp[0] + (dir === "right" ? 0.4 : -0.4) * dp[2], y = dp[1];
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
      await sleep(ms);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
    };
    await go("right", 600); await go("left", 600);   // (a warm-up)
    await ev(`[state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; changed(); __F.gaps = []; __F.last = 0; __F.on = true; 1`);
    await go("right", 1200); await go("left", 1200);
    const r = JSON.parse(await ev(`(() => { __F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0); return JSON.stringify({ fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), late: Math.round(100 * g.filter(x => x > 25).length / Math.max(1, g.length)) }); })()`));
    return { ...r, shown };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
console.log("Chrome, 1920x1080, walked right and left (frames a second, % late), a fresh page each; three rounds, the order rotated each round:");
for (const kind of ["forest", "imagination"]) {
  const names = Object.keys(WAYS), got = Object.fromEntries(names.map(k => [k, []]));
  for (const order of [names, [...names].reverse(), [...names.slice(3), ...names.slice(0, 3)]])
    for (const way of order) {
      try { const r = await run(kind, WAYS[way]); got[way].push(r); }
      catch (e) { got[way].push({ fps: "stopped" }); }
    }
  console.log(`  ${kind}:`);
  for (const way of names) {
    const rs = got[way], f = rs.map(r => r.fps).filter(Number.isFinite), mean = f.length ? (f.reduce((a, b) => a + b, 0) / f.length).toFixed(1) : "-";
    const bad = rs.some(r => (WAYS[way] === null) === r.shown);
    console.log(`    ${way.padEnd(24)} ${rs.map(r => `${r.fps}${r.late !== undefined ? ` (${r.late}%)` : ""}`).join("  ·  ")}   mean ${mean}, spread ${f.length ? (Math.max(...f) - Math.min(...f)).toFixed(1) : "-"}${bad ? "  (NOT AS MEANT: the on-screen controller " + (WAYS[way] === null ? "showed" : "did not show") + ")" : ""}`);
  }
}
process.exit(0);
