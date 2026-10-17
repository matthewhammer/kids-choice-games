// (ticket 167) What a session of changes leaves alive: Chrome's counts of
// DOM nodes, event listeners and the JS heap, each taken after a forced
// garbage collection, fresh and after each of two rounds of changes
// (leak167.mjs's churn), staying on the 🧍 Body tab or clicking every tab.
// What survives a collection is kept by something. Never fails.
//   node leakgc167.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(clickTabs) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 200) : r.result.result.value; };
  const counts = async () => { await send("HeapProfiler.collectGarbage"); await sleep(300); await send("HeapProfiler.collectGarbage");
    const M = Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map(m => [m.name, m.value]));
    return { nodes: M.Nodes, listeners: M.JSEventListeners, heapMB: +(M.JSHeapUsedSize / 1e6).toFixed(1), docs: M.Documents, page: await ev(`document.getElementsByTagName("*").length`) }; };
  try {
    await send("Page.enable"); await send("Runtime.enable"); await send("Performance.enable"); await send("HeapProfiler.enable");
    await send("Page.navigate", { url }); await sleep(4000);
    await ev(`window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); state.music.mute = true; changed(); 1`);
    const out = [["fresh", await counts()]];
    for (let r = 1; r <= 2; r++) {
      const kinds = await ev(`PLACES.filter(([k]) => k !== "none").map(([k]) => k)`);
      for (const k of kinds) { await ev(`Object.assign(state.background, { kind: ${JSON.stringify(k)} }); changed(); __pad.buttons[15].pressed = true; 1`); await sleep(400); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); await sleep(100); }
      for (let i = 0; i < 60; i++) await ev(`state.background.kind = "lake"; state.background.ducks = ${1 + (i % 13)}; state.body.arms = ${30 + i}; state.face.smile = ${i % 50}; changed(); 1`);
      if (clickTabs) await ev(`(async () => { for (const b of document.querySelectorAll("#tabs button")) { b.click(); await new Promise(r => setTimeout(r, 120)); } tab = 0; showTab(); return 1; })()`);
      out.push([`after round ${r}`, await counts()]);
    }
    return out;
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
for (const clickTabs of [false, true]) {
  try {
    const R = await run(clickTabs);
    console.log(`\n${clickTabs ? "clicking every tab in each round (then back to 🧍 Body)" : "staying on the 🧍 Body tab"}: counts after a forced garbage collection`);
    for (const [label, c] of R) console.log(`  ${label.padEnd(14)} nodes ${String(c.nodes).padStart(7)} (page ${c.page}) · listeners ${String(c.listeners).padStart(6)} · heap ${c.heapMB} MB · documents ${c.docs}`);
  } catch (e) { console.log("stopped", String(e).slice(0, 200)); }
}
process.exit(0);
