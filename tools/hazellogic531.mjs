// (ticket 531) The speed probe: the plain JS against the 🧩 Hazel rules, one mode per fresh Chrome (the workflow alternates js, hazel,
// js, hazel, and a "main" folder at 0.0.407 as a baseline before any change). For each moved event, N pulls (200), each a call of
// the game's own pull (roomLeverPull, leverPull; the friend's walk to the lever left out, the same in both modes) a frame after the
// last, recording:
//   input to frame: from the pull to the next animation frame's start (the pull's own work, and the drawing it asks for);
//   per event (window.__hz): the whole event's ms, and under hazel each handler call's and each command walk's;
//   a burst: 20 pulls, one per frame, with the frames' intervals counted (a dropped frame: an interval over 1.5 frames, 25 ms);
// and, before any pull, the cold start: the page's load, Hazel's library (its resource timing), the first compile (__hz.compileMs),
// and the heap after a forced GC (HeapProfiler.collectGarbage, Runtime.getHeapUsage: jsoo's GC counters read zero).
//   node hazellogic531.mjs <devtools port> <url> <js|hazel|main> [out.json]    env: N=200
const [dport, url0, mode, out] = process.argv.slice(2);
import { writeFileSync } from "node:fs";
const N = +(process.env.N || 200);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withLogic = (u, m) => { const [base, hash] = u.split("#"); return base.split("?")[0] + (m === "main" ? "" : "?logic=" + m) + (hash ? "#" + hash : ""); };
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const heap = async () => { await send("HeapProfiler.enable"); await send("HeapProfiler.collectGarbage"); const r = await send("Runtime.getHeapUsage"); return r.result ? { used: r.result.usedSize, total: r.result.totalSize } : null; };
const result = { mode, url: withLogic(url0, mode), n: N, when: new Date().toISOString(), events: {} };
try {
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  const t0 = Date.now(); await send("Page.navigate", { url: result.url });
  for (let i = 0; i < 120 && !(await ev(`typeof roomLeverPull === "function" && document.readyState === "complete"`).catch(() => false)); i++) await sleep(250);
  result.loadMs = Date.now() - t0;
  // (the cold start: under hazel, the library's fetch and the first compile)
  result.cold = JSON.parse(await ev(`(async () => { const o = {};
    if (typeof SCRIPT_LOGIC !== "undefined" && SCRIPT_LOGIC === "hazel") { const a = performance.now(); await hazelLoad(); o.libReadyAt = performance.now(); o.libWaitMs = o.libReadyAt - a;
      const e = performance.getEntriesByName(SCRIPT_LIB_URL)[0]; if (e) o.libFetch = { start: e.startTime, end: e.responseEnd, bytes: e.transferSize || e.encodedBodySize };
      const c = scriptCompile(); o.compileMs = c.ms; o.ready = c.ready; }
    return JSON.stringify(o); })()`));
  result.heapCold = await heap();
  // the events: each sets up its room, then N pulls a frame apart, then a burst
  const EVENTS = {
    Pull: { setup: `Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "random", castleLeverSeed3N: 42 })`, pull: `roomLeverPull(i % 2 ? "L" : "R")` },
    PullBoulder: { setup: `Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "normal" })`, pull: `roomLeverPull(i % 2 ? "BL" : "BR")` },
    PullHatch: { setup: `Object.assign(B, { kind: "treeroom", houses: 4, inside: 2, figX: -600, figY: 0, things: [] })`, pull: `roomLeverPull("H")` },
    PullThing: { setup: `Object.assign(B, { kind: "emptyroom", figX: -700, figY: 0, things: [
        ...[0, 1, 2, 3].map(j => ({ ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: -300 + 150 * j, z: SCENE.ground + 90, size: 100, uid: "d" + j, open: j % 2 === 0 })),
        { ...(THING_DEFAULTS.lever || {}), kind: "lever", x: 350, z: SCENE.ground + 40, size: 100, works: ["d0", "d1", "d2", "d3"], on: false }] })`, pull: `leverPull(4)` },
  };
  for (const [tag, E] of Object.entries(EVENTS)) {
    result.events[tag] = JSON.parse(await ev(`(async () => { const B = state.background, w = ms => new Promise(r => setTimeout(r, ms)), raf = () => new Promise(r => requestAnimationFrame(r));
      state.music.mute = true; state.world.at = null; climb = null; ${E.setup}; changed(); await w(600);
      const Z = window.__hz || (typeof hzCounters === "function" ? hzCounters() : null), mark = Z ? { js: (Z.js[${JSON.stringify(tag)}] || []).length, hz: (Z.hazel[${JSON.stringify(tag)}] || []).length, ms: Z.ms.length, run: Z.runMs.length } : null;
      const toFrame = [];
      for (let i = 0; i < ${N}; i++) { await raf(); await w(i % 10 === 9 ? 120 : 30);
        if (B.kind !== ${JSON.stringify("")} && !/${tag === "PullHatch" ? "treeroom" : tag === "PullThing" ? "emptyroom" : "castleroom"}/.test(B.kind)) { ${E.setup}; changed(); await w(300); }
        const a = performance.now(); ${E.pull}; await raf(); toFrame.push(performance.now() - a); }
      await w(1500);
      // (a burst: one pull a frame, the frames' intervals)
      const gaps = []; let last = performance.now();
      for (let i = 0; i < 20; i++) { ${E.pull}; await raf(); const t = performance.now(); gaps.push(t - last); last = t; }
      await w(1500);
      const Z2 = window.__hz || null;
      return JSON.stringify({ toFrame, gaps, dropped: gaps.filter(g => g > 25).length,
        js: Z2 && mark ? (Z2.js[${JSON.stringify(tag)}] || []).slice(mark.js) : [], hazel: Z2 && mark ? (Z2.hazel[${JSON.stringify(tag)}] || []).slice(mark.hz) : [],
        handler: Z2 && mark ? Z2.ms.slice(mark.ms) : [], run: Z2 && mark ? Z2.runMs.slice(mark.run) : [] }); })()`));
  }
  result.heapAfter = await heap();
  result.hz = JSON.parse(await ev(`JSON.stringify(window.__hz ? { calls: __hz.calls, unknown: __hz.unknown, mismatch: __hz.mismatch, compileMs: __hz.compileMs } : null)`));
} catch (e) { result.stopped = String(e).slice(0, 300); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
result.errs = errs;
const q = (a, p) => { const s = [...(a || [])].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(3) : null; };
const sum = { mode, loadMs: result.loadMs, cold: result.cold, heapCold: result.heapCold, heapAfter: result.heapAfter, hz: result.hz, stopped: result.stopped, errs: errs.length, events: {} };
for (const [tag, E] of Object.entries(result.events)) sum.events[tag] = {
  toFrame: { p50: q(E.toFrame, 0.5), p95: q(E.toFrame, 0.95), max: q(E.toFrame, 1) }, event: { p50: q(mode === "hazel" ? E.hazel : E.js, 0.5), p95: q(mode === "hazel" ? E.hazel : E.js, 0.95) },
  handler: { p50: q(E.handler, 0.5), p95: q(E.handler, 0.95) }, run: { p50: q(E.run, 0.5), p95: q(E.run, 0.95) }, dropped: E.dropped, burstMax: q(E.gaps, 1),
  // (pulls made, and how many went through Hazel: under hazel, fewer means the plain JS ran for the rest)
  pulls: (E.toFrame || []).length + (E.gaps || []).length, hazelCalls: (E.hazel || []).length };
result.summary = sum;
console.log(JSON.stringify(sum, null, 1));
if (out) writeFileSync(out, JSON.stringify(result));
process.exit(result.stopped ? 1 : 0);
