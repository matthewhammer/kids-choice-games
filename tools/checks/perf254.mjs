// (ticket 254, a diagnostic, never merged) Dragging a placed thing stutters the music: the forest with 15 rocks (as in
// Matthew's save), more things round the world, steppers at 207%. A rock dragged with a real mouse, then the friend the
// same way: each part of a frame timed (the game's own functions wrapped), long tasks, the music feeder's longest gap.
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const ROCKS = [[-260, 330], [-68, 359], [125, 388], [-203, 347], [-10, 376], [182, 335], [-146, 364], [47, 393], [308, 371], [-88, 381], [104, 340], [-224, 369], [-31, 398], [327, 325], [-166, 386]];
const mouse = (type, x, y, buttons = 0) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
async function dragFrom([x, y], label) {
  await ev(`(() => { window.__T = {}; window.__gaps = { last: 0, max: 0, over: 0 }; window.__lt = []; return 1; })()`);
  await mouse("mouseMoved", x, y); await mouse("mousePressed", x, y, 1);
  for (let i = 1; i <= 150; i++) { const a = i / 150 * Math.PI * 2; await mouse("mouseMoved", x + 160 * Math.sin(a), y + 50 * (1 - Math.cos(a)) , 1); await sleep(16); }
  await mouse("mouseReleased", x, y + 0, 0); await sleep(600);
  console.log(label + " " + await ev(`JSON.stringify({ T: Object.fromEntries(Object.entries(window.__T).map(([k, v]) => [k, { n: v.n, total: Math.round(v.t), max: Math.round(v.m) }])),
    gaps: { maxMs: Math.round(window.__gaps.max), over300: window.__gaps.over }, longTasks: { n: window.__lt.length, maxMs: Math.round(Math.max(0, ...window.__lt)), totalMs: Math.round(window.__lt.reduce((a, b) => a + b, 0)) }, playing: !!playing })`));
}
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const at = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.world = clone(DEFAULTS.world); const key = Object.keys(state.world.cells).find(k => state.world.cells[k].kind === "forest"); worldEnter(key); await w(400);
    B.things = ${JSON.stringify(ROCKS)}.map(([x, z], i) => ({ kind: "rock", x, z, seed: 900 + i, size: 100, mirror: false, tone: ROCK_TONES[i % ROCK_TONES.length] }));
    // (more things round the world, as in his save: 68 in its squares)
    Object.entries(state.world.cells).filter(([k]) => k !== key).slice(0, 12).forEach(([, c], j) => { c.things = Array.from({ length: 5 }, (_, i) => ({ kind: "rock", x: -200 + 80 * i, z: 360, seed: 50 * j + i, size: 100, tone: ROCK_TONES[i % ROCK_TONES.length] })); });
    Object.assign(state.music, { track: "steppers", tempo: 207, transpose: -12, mute: false, volume: 99 }); changed(); await w(800);
    // (the game's own functions, timed)
    window.__T = {};
    for (const name of ["draw", "mountScene", "measureMarks", "settle", "persist", "worldKeep", "thingsLayer", "standingHere", "showEnterGlow", "showObjects"]) {
      const f = window[name]; if (typeof f !== "function") continue;
      window[name] = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { const d = performance.now() - t0, s = (window.__T[name] ||= { n: 0, t: 0, m: 0 }); s.n++; s.t += d; s.m = Math.max(s.m, d); } };
    }
    const sa = sendAhead; window.sendAhead = function (...a) { const t = performance.now(), g = window.__gaps; if (g && g.last) { const d = t - g.last; g.max = Math.max(g.max, d); if (d > 300) g.over++; } if (g) g.last = t; return sa.apply(this, a); };
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) (window.__lt ||= []).push(e.duration); }).observe({ type: "longtask" }); } catch (e) {}
    const rock = bgShown.node.querySelector('[data-drag="thing:6"]'), r = rock.getBoundingClientRect(), f = document.getElementById("figure").getBoundingClientRect();
    return JSON.stringify({ rock: [r.left + r.width / 2, r.top + r.height / 2], fig: [f.left + f.width / 2, f.top + f.height * 0.6], key, nodes: bgShown.node.querySelectorAll("*").length, text: bgShown.text.length }); })()`));
  console.log("SETUP " + JSON.stringify(at));
  // (a click on the sky first: the music starts on a gesture)
  await mouse("mouseMoved", 700, 120); await mouse("mousePressed", 700, 120, 1); await mouse("mouseReleased", 700, 120, 0); await sleep(1500);
  console.log("MUSIC " + await ev(`JSON.stringify({ playing: !!playing, ctx: audio && audio.state })`));
  await dragFrom(at.rock, "ROCK");
  const f2 = JSON.parse(await ev(`(() => { const f = document.getElementById("figure").getBoundingClientRect(); return JSON.stringify([f.left + f.width / 2, f.top + f.height * 0.6]); })()`));
  await dragFrom(f2, "FRIEND");
  console.log("errors " + JSON.stringify(errs));
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
process.exit(0);
