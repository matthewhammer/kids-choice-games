// (ticket 588, Matthew 2026-10-23: "a report about loading the game with fumola as default, scrolling to check each script as a speed
// run; hazel, same speed run"; "Oh, and JS as default too") The 📜 Scripting tab's cost, for each engine as every room's default (JS,
// Fumola, Hazel): from a fresh load, the tab opened; the time to the engine ready (Hazel's library and the program compiled; Fumola's
// wasm and its rules defined), and, with Hazel, to each box's tiles ready (each a frame of Hazel's own app, made one at a time);
// then each script box scrolled into view in turn, 600 ms each; then each box visited at max size from the outline, 600 ms each. The
// game's frame times through each phase (requestAnimationFrame gaps) and the long tasks. Three rounds, the modes in turn (js, fumola,
// hazel, then again), each from a fresh page. Recorded, not gated: a RESULT line per round, as JSON, for ^report(32).
//   node scriptspeed588.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result.result.value; };

// one round, in the page: every number in ms from the tab opened
const round = mode => `(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms)), out = { mode: ${JSON.stringify(mode)} };
  state = clone(DEFAULTS); state.music.mute = true; changed(); await w(300);
  window.__G = { gaps: [], last: 0, on: true };
  const g = t => { if (!__G.on) return; if (__G.last) __G.gaps.push(t - __G.last); __G.last = t; requestAnimationFrame(g); };
  requestAnimationFrame(g);
  let longN = 0, longMs = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { longN++; longMs += e.duration; } }).observe({ type: "longtask" }); } catch (e) {}
  const stats = () => {
    const a = __G.gaps.splice(0).sort((x, y) => x - y), q = p => a.length ? +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(1) : null;
    const mean = a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
    return { frames: a.length, median: q(0.5), p95: q(0.95), max: a.length ? +a[a.length - 1].toFixed(1) : null, over50: a.filter(x => x > 50).length, fps: mean ? +(1000 / mean).toFixed(1) : null };
  };
  state.scripts = { on: ${JSON.stringify(mode)} === "hazel", all: ${JSON.stringify(mode)}, common: null, rooms: {}, editor: { hazel: "tiles" } };
  const t0 = performance.now();
  const until = async (f, ms = 60000) => { const s = performance.now(); while (performance.now() - s < ms) { try { if (f()) return Math.round(performance.now() - t0); } catch (e) {} await w(50); } return null; };
  tab = TABS.findIndex(t => t[1] === "scripting"); showTab();
  out.tab = await until(() => document.querySelector('.script-box[data-room="Common"]'));
  if (${JSON.stringify(mode)} === "hazel") out.engine = await until(() => window.Hazel && scriptCompile().ready);
  if (${JSON.stringify(mode)} === "fumola") out.engine = await until(() => typeof fumolaReady === "function" && fumolaReady() && fumolaCompile().ready);
  if (${JSON.stringify(mode)} === "hazel") {
    out.tiles = {};
    for (const m of ["Common", "TrapRoom", "TreeRoom", "Square", "World", "Castle"]) out.tiles[m] = await until(() => [...scriptTileFrames].some(T => T.mod === m && T.ready), 120000);
  }
  out.loadFrames = stats();
  // each script box scrolled into view, in the panel
  const boxes = [...document.querySelectorAll("#panel .script-box")];
  let s = performance.now();
  for (const b of boxes) { b.scrollIntoView({ block: "start" }); await w(600); }
  out.scroll = { boxes: boxes.length, ms: Math.round(performance.now() - s), ...stats() };
  // each box at max size, from the outline
  const mx = document.querySelector('.script-box[data-room="Common"] .script-max-btn');
  if (mx) {
    mx.click(); await w(400); stats();
    const items = [...document.querySelectorAll(".script-max-item")];
    s = performance.now();
    for (const it of items) { it.click(); await w(600); }
    out.visit = { boxes: items.length, ms: Math.round(performance.now() - s), ...stats() };
    scriptMaxClose();
  }
  // (Matthew: "let's include timing for event 'event handler', or Game Engine ---calls-into-script---> Script Function") the trap room,
  // its red levers pulled 20 times, left and right in turn, each through the game's own entry point (roomLeverPull: the room's rule
  // when one runs it, the game's JS when not); the game's own timers read back (25-scripting.js's hzCounters: the script function
  // alone, ms; the commands it gave, run by the game, runMs; the whole call, by engine and event; the JS, by event), and each pull's
  // whole time measured around the entry point
  {
    const B = state.background;
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -200, figY: 80, things: [] });
    changed(); await w(800);
    window.__hz = undefined;
    const pulls = [];
    for (let i = 0; i < 20; i++) { const a = performance.now(); roomLeverPull(i % 2 ? "R" : "L"); pulls.push(performance.now() - a); await w(150); }
    const Z = window.__hz || {}, q = (a, p) => { a = (a || []).slice().sort((x, y) => x - y); return a.length ? +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(3) : null; };
    const eng = ${JSON.stringify(mode)}, side = eng === "js" ? (Z.js || {}).Pull : (Z[eng] || {}).Pull;
    out.events = { pulls: pulls.length, entry: { median: q(pulls, 0.5), p95: q(pulls, 0.95), max: q(pulls, 1) },
      script: { calls: Z.calls || 0, median: q(Z.ms, 0.5), p95: q(Z.ms, 0.95), max: q(Z.ms, 1) },
      commands: { median: q(Z.runMs, 0.5), max: q(Z.runMs, 1) },
      whole: { n: (side || []).length, median: q(side, 0.5), p95: q(side, 0.95), max: q(side, 1) },
      unknown: Z.unknown || 0, mismatch: Z.mismatch || 0 };
  }
  out.long = { n: longN, ms: Math.round(longMs) };
  out.total = Math.round(performance.now() - t0);
  __G.on = false;
  return JSON.stringify(out);
})()`;

let bad = 0;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  for (let r = 1; r <= 3; r++) for (const mode of ["js", "fumola", "hazel"]) {
    await send("Page.navigate", { url }); await sleep(5000);
    try {
      const res = JSON.parse(await ev(round(mode)));
      console.log("RESULT " + JSON.stringify({ round: r, ...res }));
    } catch (e) { bad++; console.log(`FAIL round ${r} ${mode}: ${String(e.message || e).slice(0, 400)}`); }
  }
  console.log(`page errors: ${errs.length}${errs.length ? " " + errs.slice(0, 3).join(" | ") : ""}`);
} catch (e) { bad++; console.log("FAIL " + (e.stack || e)); }
console.log(bad ? `${bad} failed` : "all ok");
ws.close();
process.exit(bad ? 1 : 0);
