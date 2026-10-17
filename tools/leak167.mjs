// (ticket 167, Matthew 2026-10-16 on 0.0.94: a setting at the duck pond is
// slow on his laptop until the page is reloaded, then the same scene is
// fast) Fresh, after a session of changes, and after a reload: his saved
// friend loaded through the game's own 📂 Load (the file input), then the
// friend swum right and left with a fake controller, its frames and
// drawings measured; and what might grow, counted: the page's elements,
// event listeners, JS heap (Chrome's Performance metrics), live timers and
// requestAnimationFrame callbacks a frame (wrapped before the page runs),
// Web Animations, SMIL elements in the document, Web Audio nodes made.
// A friend file of "-" uses the default friend in the duck pond instead (as CI does:
// a saved friend stays off the public repository).
//   node leak167.mjs <devtools port> <url> <friend.json | -> [rounds]   env: W H DPR (his laptop's by default)
import { readFileSync } from "node:fs";
const [dport, url, file, rounds = "1"] = process.argv.slice(2);
const W = +(process.env.W || 1203), H = +(process.env.H || 802), DPR = +(process.env.DPR || 1.875);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
// counters, installed before the game's own script runs
const PRE = `(() => {
  const C = window.__C = { intervals: new Set(), timeouts: 0, rafNow: 0, rafLast: 0, audioNodes: 0 };
  const si = window.setInterval, ci = window.clearInterval, raf = window.requestAnimationFrame;
  window.setInterval = function () { const id = si.apply(this, arguments); C.intervals.add(id); return id; };
  window.clearInterval = function (id) { C.intervals.delete(id); return ci.apply(this, arguments); };
  // (callbacks asked for in one frame, counted when they run)
  window.requestAnimationFrame = function (cb) { C.rafNow++; return raf.call(this, t => cb(t)); };
  const tick = () => { C.rafLast = C.rafNow; C.rafNow = 0; raf(tick); }; raf(tick);
  for (const k of ["createOscillator", "createGain", "createBiquadFilter", "createDelay", "createConvolver", "createBufferSource", "createStereoPanner", "createWaveShaper", "createDynamicsCompressor"]) {
    const f = (window.AudioContext || window.webkitAudioContext || function () {}).prototype[k];
    if (f) (window.AudioContext || window.webkitAudioContext).prototype[k] = function () { C.audioNodes++; return f.apply(this, arguments); };
  }
})();`;
const WHO = file === "-" ? "the default friend" : "his friend";
async function loadFriend() {
  if (file === "-") { await ev(`state = clone(DEFAULTS); state.background.kind = "lake"; changed(); 1`); await sleep(1500); return; }
  const doc = (await send("DOM.getDocument", { depth: 1 })).result.root;
  const q = (await send("DOM.querySelector", { nodeId: doc.nodeId, selector: "#load-file" })).result.nodeId;
  await send("DOM.setFileInputFiles", { files: [file], nodeId: q });
  await sleep(1500);
}
async function measure(label) {
  await ev(`(() => { if (!window.__pad) { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); } return 1; })()`);
  await sleep(500);
  await ev(`(() => { window.__F = { gaps: [], last: 0, on: true, d: movedDraws, ms: movedMs };
    const f = t => { if (!__F.on) return; if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
  for (const b of [15, 14]) { await ev(`__pad.buttons[${b}].pressed = true; 1`); await sleep(2000); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); }
  const F = JSON.parse(await ev(`(() => { __F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b), dn = movedDraws - __F.d;
    return JSON.stringify({ fps: +(1000 * g.length / s).toFixed(1), p95: Math.round(q[Math.floor(0.95 * (q.length - 1))]), worst: Math.round(q[q.length - 1]), late: Math.round(100 * g.filter(x => x > 25).length / g.length),
      drawMs: dn ? +((movedMs - __F.ms) / dn).toFixed(2) : null }); })()`));
  const M = Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map(m => [m.name, m.value]));
  const P = JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, ducks: state.background.ducks, elements: document.getElementsByTagName("*").length, inPic: pic.getElementsByTagName("*").length,
    smil: document.querySelectorAll("animate, animateTransform, animateMotion, set").length, anims: document.getAnimations().length, intervals: __C.intervals.size, rafPerFrame: __C.rafLast, audioNodes: __C.audioNodes,
    choppy, slow: slowFlag, still: sceneryStill(), stillParts: stillPic.parts.size })`));
  console.log(`${label.padEnd(26)} ${String(F.fps).padStart(5)} fps (p95 ${F.p95} ms, worst ${F.worst}, ${F.late}% late), draw ${F.drawMs} ms · nodes ${M.Nodes} (page ${P.elements}, picture ${P.inPic}) · listeners ${M.JSEventListeners} · heap ${(M.JSHeapUsedSize / 1e6).toFixed(1)} MB · intervals ${P.intervals} · rAF/frame ${P.rafPerFrame} · anims ${P.anims} · smil ${P.smil} · audio nodes made ${P.audioNodes} · ${P.kind}${P.choppy ? " CHOPPY" : ""}${P.slow ? " SLOW" : ""}${P.still ? " still" : ""}`);
  return { F, M, P };
}
// a session of changes: every place visited and walked a moment, trips through doors and pits, a climb, sliders moved, tabs opened
async function churn() {
  const kinds = await ev(`PLACES.filter(([k]) => k !== "none").map(([k]) => k)`);
  for (const k of kinds) {
    await ev(`Object.assign(state.background, { kind: ${JSON.stringify(k)} }); changed(); __pad.buttons[15].pressed = true; 1`); await sleep(500); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); await sleep(150);
  }
  // trips: through the castle's gate, into a pit, up a ladder
  await ev(`Object.assign(state.background, { kind: "castle", castle: "N" }); changed(); 1`); await sleep(400);
  await ev(`enterScene([...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.dataset.to === "castleroom")); 1`); await sleep(5000);
  await ev(`Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3 }); changed(); 1`); await sleep(400);
  await ev(`enterScene(bgShown.node.querySelector(".portal[data-pit]")); 1`); await sleep(6500);
  await ev(`climbLadder(bgShown.node.querySelector("[data-ladder]")); 1`); await sleep(9000);
  // sliders and chips: many changes, as dragging a slider makes
  for (let i = 0; i < 60; i++) await ev(`state.background.kind = "lake"; state.background.ducks = ${1 + (i % 13)}; state.body.arms = ${30 + i}; state.face.smile = ${i % 50}; changed(); 1`);
  // tabs opened, each
  await ev(`(async () => { for (const b of document.querySelectorAll("#tabs button")) { b.click(); await new Promise(r => setTimeout(r, 120)); } return 1; })()`);
}
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("DOM.enable"); await send("Performance.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PRE });
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`localStorage.removeItem("dress-up-choppy"); choppy = false; slowFlag = false; 1`);
  await loadFriend(); await measure(`fresh, ${WHO} loaded`);
  for (let r = 1; r <= +rounds; r++) {
    await churn(); await loadFriend(); await measure(`after changes, round ${r}`);
  }
  await send("Page.reload"); await sleep(4000); await loadFriend(); await measure("after a reload");
  console.log("errors:", errs.length ? errs.slice(0, 4) : "none");
} finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(0); }
