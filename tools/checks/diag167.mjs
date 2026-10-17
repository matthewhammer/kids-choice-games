// (ticket 167) What a session of changes leaves running: every
// requestAnimationFrame, setInterval, setTimeout and addEventListener call
// is counted by the line of the game that made it (from a stack trace),
// over two seconds of the pond before any change, and over two seconds
// after a round of changes (leak167.mjs's churn), each time with nothing
// happening. A line that schedules more after the changes than before is
// something they left behind. A diagnostic: it never fails.
//   node diag167.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
// (installed before the game's own script runs: each call counted under the
// first stack frame that is the game's own, "line:col" of its script)
const PRE = `(() => {
  const D = window.__D = { on: false, calls: {}, live: new Map(), listeners: {} };
  // (the first frame in the game's own page, its function and line: frames of this script have no page address)
  const where = () => { const s = (new Error().stack || "").split("\\n").slice(1);
    for (const l of s) { if (!/dress-up\\/|index\\.html/.test(l) || /at (where|count|window\\.(requestAnimationFrame|setTimeout|setInterval|clearInterval)|EventTarget\\.(add|remove)EventListener) /.test(l)) continue; const m = l.match(/at (?:(\\S+) \\()?.*?:(\\d+):\\d+\\)?$/); if (m) return (m[1] || "(top)") + "@" + m[2]; }
    return "?"; };
  const count = (kind) => { if (!D.on) return; const k = kind + " " + where(); D.calls[k] = (D.calls[k] || 0) + 1; };
  const raf = window.requestAnimationFrame, si = window.setInterval, ci = window.clearInterval, st = window.setTimeout, ael = EventTarget.prototype.addEventListener, rel = EventTarget.prototype.removeEventListener;
  window.requestAnimationFrame = function (cb) { count("rAF"); return raf.call(this, cb); };
  window.setTimeout = function (cb, ms) { count("timeout"); return st.apply(this, arguments); };
  window.setInterval = function () { const id = si.apply(this, arguments); D.live.set(id, where()); return id; };
  window.clearInterval = function (id) { D.live.delete(id); return ci.apply(this, arguments); };
  EventTarget.prototype.addEventListener = function (type) { const k = (this && this.nodeName || (this === window ? "window" : this && this.constructor && this.constructor.name) || "?") + " " + type + " " + where(); D.listeners[k] = (D.listeners[k] || 0) + 1; return ael.apply(this, arguments); };
  EventTarget.prototype.removeEventListener = function (type) { const k = (this && this.nodeName || (this === window ? "window" : this && this.constructor && this.constructor.name) || "?") + " " + type + " " + where(); D.listeners[k] = (D.listeners[k] || 0) - 1; return rel.apply(this, arguments); };
})();`;
// (two seconds of nothing happening at the pond, the calls counted)
async function idle(label) {
  await ev(`Object.assign(state.background, { kind: "lake" }); changed(); 1`); await sleep(1500);
  await ev(`__D.calls = {}; __D.on = true; 1`); await sleep(2000);
  const R = JSON.parse(await ev(`(() => { __D.on = false; const L = {}; for (const w of __D.live.values()) L["interval " + w] = (L["interval " + w] || 0) + 1;
    return JSON.stringify({ calls: __D.calls, intervals: L, listeners: Object.fromEntries(Object.entries(__D.listeners).filter(([, v]) => v > 0)) }); })()`));
  console.log(`${label}: ${Object.values(R.calls).reduce((a, b) => a + b, 0)} calls in 2 s, ${Object.keys(R.intervals).length} live intervals, ${Object.values(R.listeners).reduce((a, b) => a + b, 0)} live listeners`);
  return R;
}
async function churn() {
  const kinds = await ev(`PLACES.filter(([k]) => k !== "none").map(([k]) => k)`);
  for (const k of kinds) {
    await ev(`Object.assign(state.background, { kind: ${JSON.stringify(k)} }); changed(); __pad.buttons[15].pressed = true; 1`); await sleep(500); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); await sleep(150);
  }
  await ev(`Object.assign(state.background, { kind: "castle", castle: "N" }); changed(); 1`); await sleep(400);
  await ev(`enterScene([...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.dataset.to === "castleroom")); 1`); await sleep(5000);
  await ev(`Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3 }); changed(); 1`); await sleep(400);
  await ev(`enterScene(bgShown.node.querySelector(".portal[data-pit]")); 1`); await sleep(6500);
  await ev(`climbLadder(bgShown.node.querySelector("[data-ladder]")); 1`); await sleep(9000);
  for (let i = 0; i < 60; i++) await ev(`state.background.kind = "lake"; state.background.ducks = ${1 + (i % 13)}; state.body.arms = ${30 + i}; state.face.smile = ${i % 50}; changed(); 1`);
  await ev(`(async () => { for (const b of document.querySelectorAll("#tabs button")) { b.click(); await new Promise(r => setTimeout(r, 120)); } return 1; })()`);
}
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PRE });
  await send("Emulation.setDeviceMetricsOverride", { width: 1203, height: 802, deviceScaleFactor: 1.875, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  console.log("version", await ev("VERSION.number"));
  await ev(`window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); 1`);
  const A = await idle("before any change");
  await churn();
  const B = await idle("after a round of changes");
  await churn();
  const C = await idle("after two rounds");
  // what grew: by the game's line that made it
  const grew = (a, b) => Object.entries(b).map(([k, v]) => [k, (a[k] || 0), v]).filter(([, x, y]) => y > x).sort((p, q) => (q[2] - q[1]) - (p[2] - p[1]));
  for (const [label, a, b] of [["calls in 2 s idle (rAF, timeouts)", A.calls, C.calls], ["live intervals", A.intervals, C.intervals], ["live listeners", A.listeners, C.listeners]]) {
    const g = grew(a, b);
    console.log(`\n${label}, before -> after two rounds, what grew (${g.length}):`);
    for (const [k, x, y] of g.slice(0, 25)) console.log(`  ${String(x).padStart(6)} -> ${String(y).padEnd(6)} ${k}`);
  }
  console.log("\nafter one round, what grew in idle calls:");
  for (const [k, x, y] of grew(A.calls, B.calls).slice(0, 15)) console.log(`  ${String(x).padStart(6)} -> ${String(y).padEnd(6)} ${k}`);
  console.log("errors:", errs.length ? errs.slice(0, 4) : "none");
} catch (e) { console.log("diagnostic stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(0); }
