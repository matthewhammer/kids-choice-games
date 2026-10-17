// (ticket 197, from ticket 167's driver; the game's part and line now that it is in parts) What the 🏞️ Background tab costs while the friend swims in
// the duck pond: a CPU profile of 4 s of swimming with that tab open, its
// functions ranked by their own time (with the game's line), beside the
// same with the 🧍 Body tab open. A diagnostic: it never fails.
//   node bgprof167.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(tabName) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 200) : r.result.result.value; };
  try {
    await send("Runtime.enable"); await send("Profiler.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1203, height: 802, deviceScaleFactor: 1.875, mobile: false });
    await send("Page.navigate", { url }); await sleep(4000);
    const r = await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e);
      state.background.kind = "lake"; choppy = false; slowFlag = false; PERF.slowMoving = true;
      tab = TABS.findIndex(t => t[0].includes(${JSON.stringify(tabName)})); showTab();
      // (the time in draw, settle and changed while moving, and how often each runs)
      window.__T = {}; for (const name of ["draw", "settle", "changed", "moved"]) { const f = window[name] || eval(name); const w = function () { const t = performance.now(); const v = f.apply(this, arguments); const T = __T[name] || (__T[name] = { n: 0, ms: 0 }); T.n++; T.ms += performance.now() - t; return v; }; try { eval(name + " = w"); } catch (e) {} }
      return TABS[tab][0]; })()`);
    await sleep(800);
    const swim = async () => { for (const b of [15, 14]) { await ev(`__pad.buttons[${b}].pressed = true; 1`); await sleep(2000); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); } };
    await swim();   // (a warm-up)
    await ev(`for (const k in __T) __T[k] = { n: 0, ms: 0 }; 1`);
    await send("Profiler.setSamplingInterval", { interval: 200 });
    await send("Profiler.start");
    await swim();
    const prof = (await send("Profiler.stop")).result.profile;
    const T = JSON.parse(await ev(`JSON.stringify(__T)`));
    // self time per node (samples x interval), by function and line
    const dt = {}; const nodes = new Map(prof.nodes.map(n => [n.id, n]));
    for (let i = 0; i < prof.samples.length; i++) { const id = prof.samples[i]; dt[id] = (dt[id] || 0) + (prof.timeDeltas[i] || 0); }
    const by = {};
    for (const [id, us] of Object.entries(dt)) { const nd = nodes.get(+id); const c = nd.callFrame; const k = `${c.functionName || "(anonymous)"}${c.url && /dress-up/.test(c.url) ? "@" + c.url.split("/").pop().split("?")[0] + ":" + (c.lineNumber + 1) : ""}`; by[k] = (by[k] || 0) + us; }
    const total = Object.values(by).reduce((a, b) => a + b, 0);
    return { tab: r, T, top: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, us]) => [k, Math.round(us / 1000), Math.round(100 * us / total)]), totalMs: Math.round(total / 1000) };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
for (const t of ["Body", "Background"]) {
  try {
    const R = await run(t);
    console.log(`\nwith the ${R.tab} tab open, 4 s of swimming in the duck pond (Chrome's CPU profile, ${R.totalMs} ms sampled):`);
    console.log(`  the game's calls: ` + Object.entries(R.T).map(([k, v]) => `${k} ${v.n}× ${Math.round(v.ms)} ms`).join(" · "));
    for (const [k, ms, pc] of R.top) console.log(`  ${String(ms).padStart(6)} ms ${String(pc).padStart(3)}%  ${k}`);
  } catch (e) { console.log("stopped", String(e).slice(0, 200)); }
}
process.exit(0);
