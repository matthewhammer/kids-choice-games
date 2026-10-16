// (ticket 151) Where a drag's time goes: a Chrome trace of one drag of the
// friend in a place (real mouse events, 3 s, a move every 8 ms), summed by
// event name per thread. Kind "walk" uses a fake pad instead.
//   node dragtrace.mjs <devtools port> <url> <place> [drag|walk]   env: W H DPR FIGY TWEAK
const [dport, url, place, kind = "drag"] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), events = [];
let done = null;
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Tracing.dataCollected") events.push(...m.params.value);
  if (m.method === "Tracing.tracingComplete" && done) done(); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +(process.env.W || 1920), height: +(process.env.H || 1080), deviceScaleFactor: +(process.env.DPR || 1), mobile: false });
await send("Page.navigate", { url }); await sleep(3500);
await ev(`state = clone(DEFAULTS); state.music.mute = true; state.background.kind = ${JSON.stringify(place)}; state.background.figX = -100; state.background.figY = ${+(process.env.FIGY || 0)}; changed();
  window.__pad = { id: "Trace Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  window.__pads = []; Object.defineProperty(navigator, "getGamepads", { value: () => window.__pads, configurable: true }); ${process.env.TWEAK || ""}; "ok"`);
await sleep(600);
const [x0, y0, ppu] = await ev(`(() => { const J = poseJoints, T = figureT, at = (x, y) => [T.dx + T.k * x, T.dy + T.sg + T.k * (y - T.g)];
  const xs = [...J.arms.map(a => a.A), ...J.legs.map(l => l.H)], m = xs.reduce((s, p) => [s[0] + p[0] / xs.length, s[1] + p[1] / xs.length], [0, 0]);
  const [sx, sy] = at(m[0], m[1]), M = pic.getScreenCTM(), p = new DOMPoint(sx, sy).matrixTransform(M); return [p.x, p.y, M.a]; })()`);
await send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,blink,cc,gpu,toplevel,v8", transferMode: "ReportEvents" });
await sleep(200);
if (kind === "walk") {
  await ev(`window.__pads = [window.__pad]; { const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); } __pad.buttons[15].pressed = true; "go"`); await sleep(1500);
  await ev(`__pad.buttons[15].pressed = false; __pad.buttons[14].pressed = true; "back"`); await sleep(1500);
  await ev(`__pad.buttons[14].pressed = false; "stop"`);
} else {
  const mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0, y: y0 });
  await mouse("mousePressed", x0, y0);
  const t0 = Date.now();
  for (;;) { const t = (Date.now() - t0) / 3000; if (t >= 1) break; const u = t < 0.5 ? t * 2 : 2 - t * 2; await mouse("mouseMoved", x0 + 200 * ppu * u, y0); await sleep(8); }
  await mouse("mouseReleased", x0, y0);
}
await sleep(200);
await new Promise(r => { done = r; send("Tracing.end"); });
// the renderer's main thread: the one with the most FunctionCall time
const byThread = new Map(), names = new Map();
for (const e of events) if (e.ph === "M" && e.name === "thread_name") names.set(e.pid + ":" + e.tid, e.args.name);
for (const e of events) {
  if (e.ph !== "X" || !e.dur) continue;
  const k = e.pid + ":" + e.tid; if (!byThread.has(k)) byThread.set(k, new Map());
  const m = byThread.get(k); m.set(e.name, (m.get(e.name) || 0) + e.dur);
}
const frames = events.filter(e => e.name === "DrawFrame" || e.name === "BeginFrame").length;
for (const [k, m] of byThread) {
  const name = names.get(k) || k, top = [...m].sort((a, b) => b[1] - a[1]).slice(0, 9);
  if (top[0][1] < 50000) continue;
  console.log(name.padEnd(26), top.map(([a, us]) => `${a} ${(us / 1000).toFixed(0)}ms`).join(" | "));
}
// (raster time by layer, and the layers' sizes and elements, from the LayerTree domain)
const byLayer = new Map();
for (const e of events) if (e.name === "RasterTask" && e.dur) {
  const td = e.args && (e.args.tileData || (e.args.data && e.args.data.tileData)); const id = td ? (td.layerId ?? td.layer_id) : "?";
  byLayer.set(id, (byLayer.get(id) || 0) + e.dur);
}
const lt = await send("LayerTree.enable").then(() => new Promise(r => { const h = e => { const m = JSON.parse(e.data); if (m.method === "LayerTree.layerTreeDidChange" && m.params.layers) { ws.removeEventListener("message", h); r(m.params.layers); } }; ws.addEventListener("message", h); setTimeout(() => r([]), 3000); }));
const desc = new Map();
for (const L of lt) {
  let who = "";
  if (L.backendNodeId) { const d = await send("DOM.describeNode", { backendNodeId: L.backendNodeId }); const nd = d.result && d.result.node; if (nd) who = nd.nodeName + (nd.attributes ? " " + (nd.attributes.join(" ").match(/(id|class) [^ ]+/g) || []).join(" ") : ""); }
  desc.set(String(L.layerId), `${Math.round(L.width)}x${Math.round(L.height)} ${who}`);
}
console.log("raster by layer:", [...byLayer].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, us]) => `layer ${id} (${desc.get(String(id)) || "?"}) ${(us / 1000).toFixed(0)}ms`).join(" | "));
// (what was invalidated, and why: Chrome's invalidation tracking)
const inv = new Map();
for (const e of events) if (/Invalidation/.test(e.name) && e.args && e.args.data) {
  const d = e.args.data, k = e.name + " | " + (d.reason || d.invalidationList?.[0]?.classes || "") + " | " + (d.nodeName || d.nodeId || "");
  inv.set(k, (inv.get(k) || 0) + 1);
}
console.log("invalidations:", [...inv].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, c]) => `${c}x ${k}`).join("\n  "));
await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
process.exit(0);
