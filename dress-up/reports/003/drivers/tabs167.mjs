// (ticket 167) The duck pond with each tab open: the default friend
// swimming (a fake controller, right and left, after a warm-up), on a fresh
// page for each of the game's tabs. With the 🏞️ Background tab open it
// swam at 2 to 15 frames a second (its room choices built the whole castle
// on every refresh); every other tab, 60. Fails if any tab is under 50.
//   node tabs167.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(tabIndex) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 200) : r.result.result.value; };
  try {
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1203, height: 802, deviceScaleFactor: 1.875, mobile: false });
    await send("Page.navigate", { url }); await sleep(4000);
    if (tabIndex >= await ev("TABS.length")) return null;   // (past the last tab)
    await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e);
      state.background.kind = "lake"; choppy = false; slowFlag = false; PERF.slowMoving = true; tab = ${tabIndex}; showTab();
      window.__F = { gaps: [], last: 0, on: false }; const f = t => { if (__F.on) { if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
    await sleep(800);
    const swim = async on => { for (const b of [15, 14]) { await ev(`__pad.buttons[${b}].pressed = true; __F.on = ${on}; 1`); await sleep(2000); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); } };
    await swim(false);
    await ev(`__F.gaps = []; __F.last = 0; 1`);
    await swim(true);
    const F = JSON.parse(await ev(`(() => { __F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0); return JSON.stringify({ fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), late: Math.round(100 * g.filter(x => x > 25).length / Math.max(1, g.length)) }); })()`));
    const name = await ev(`TABS[${tabIndex}][0]`);
    return { name, ...F };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
// (the number of tabs, read from a page)
let fails = 0;
console.log(`Chrome, the duck pond, the default friend swimming, by the tab open (fresh page each):`);
for (let i = 0; i < 18; i++) {
  try { const r = await run(i); if (!r) break;
    const ok = r.fps >= 50; if (!ok) fails++;
    console.log(`${ok ? "ok  " : "FAIL"} ${String(r.fps).padStart(5)} fps (${r.late}% late)  ${r.name}`); }
  catch (e) { fails++; console.log("FAIL", String(e).slice(0, 200)); break; }
}
process.exit(fails ? 1 : 0);
