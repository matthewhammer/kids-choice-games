// (ticket 152) Dress Up's frame-rate gate, run before every release
// (Matthew, 2026-10-16: "we fail if we go below a certain amount, like 55
// fps, and we fix it before we commit new versions"). For each of the
// scenes that have had trouble, in headless Chrome:
//   walk: a fake standard game controller holds ▶ for 1.5 s, then ◀ for 1.5 s
//         (swimming, in the duck pond);
//   drag: real mouse events take hold of the friend's body and move them
//         right and back over 3 s, a move every 8 ms (a 125 Hz mouse).
// Each case runs RUNS times (3) on one page load, after a warm-up; its fps is
// the frames the page drew while moving over the time, and the case passes
// when the median run is at least MIN (55). Exit status 1 if any case fails.
//   node fpsgate.mjs <devtools port> <url> [scene,...]
//   env: MIN=55 RUNS=3 W=1280 H=800 DPR=1 OUT=<results.json> TWEAK=<js run after the scene is set up>
//        MUSIC=1 (the music playing, in a muted browser; else muted in the game)
//        CPU=<n> (ticket 154: the page's main thread n times slower, Emulation.setCPUThrottlingRate)
// The slow machine (ticket 154, the black laptop: N's old one): CPU=4 in a
// Chrome started with --num-raster-threads=1 (throttling slows only the main
// thread; drawing the picture's pixels is the raster threads' work), on the
// scenes "slow" names: SLOW=1 runs the 🔲 empty room and 💭 our imagination.
// Start the browser muted (see agent-instructions.md, Testing), and run
// nothing else heavy alongside it: the numbers are only as steady as the laptop.
import { writeFileSync } from "node:fs";
const [dport, url, only] = process.argv.slice(2);
const MIN = +(process.env.MIN || 55), RUNS = +(process.env.RUNS || 3);
const SCENES = [
  { id: "castle", label: "🏰 outside the castle", setup: `state.background.kind = "castle";` },
  { id: "witch", label: "🧙 outside the witch's house", setup: `state.background.kind = "witch";` },
  { id: "witchroom", label: "🧙 inside the witch's hut", setup: `state.background.kind = "witchroom";` },
  { id: "healerroom", label: "🌿 inside the healer's house", setup: `state.background.kind = "healerroom";` },
  // (in the deep water, where the walk swims: the middle of the water's run straight up from the middle)
  { id: "lake", label: "🦆 swimming in the duck pond", setup: `state.background.kind = "lake";
      { const B = state.background, ys = []; for (let y = -200; y <= 86; y += 2) if (inWater(B, 0, SCENE.ground + y) && inWater(B, -150, SCENE.ground + y) && inWater(B, 150, SCENE.ground + y)) ys.push(y);
        if (!ys.length) throw new Error("no water found in the duck pond"); B.figY = ys[Math.floor(ys.length / 2)]; }`, water: true },
  // (ticket 154: the slow machine's cases)
  { id: "emptyroom", label: "🔲 the empty room", setup: `state.background.kind = "emptyroom";`, slow: true },
  { id: "imagination", label: "💭 our imagination", setup: `state.background.kind = "imagination";`, slow: true },
].filter(s => only ? only.split(",").includes(s.id) : process.env.SLOW ? s.slow : !s.slow);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
for (const sc of SCENES) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
  await send("Page.enable"); await send("Runtime.enable");
  if (process.env.CPU) await send("Emulation.setCPUThrottlingRate", { rate: +process.env.CPU });
  await send("Emulation.setDeviceMetricsOverride", { width: +(process.env.W || 1280), height: +(process.env.H || 800), deviceScaleFactor: +(process.env.DPR || 1), mobile: false });
  await send("Page.navigate", { url }); await sleep(3500);
  await ev(`(() => {
    localStorage.removeItem("dress-up-pads"); localStorage.removeItem("dress-up-touchpad");
    state = clone(DEFAULTS); state.music.mute = ${process.env.MUSIC ? "false" : "true"}; state.background.figX = -100; ${sc.setup} changed();
    window.__pad = { id: "Gate Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pads = [];
    Object.defineProperty(navigator, "getGamepads", { value: () => window.__pads, configurable: true });
    window.__f = { on: false, gaps: [], last: 0, draws: 0, ms: 0 };
    { const f = t => { if (__f.on) { if (__f.last) __f.gaps.push(t - __f.last); __f.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); }
    { const d0 = draw; draw = function () { const t = performance.now(); d0.apply(this, arguments); if (__f.on) { __f.draws++; __f.ms += performance.now() - t; } }; }
    window.__start = () => { __f.on = true; __f.gaps = []; __f.last = 0; __f.draws = 0; __f.ms = 0; };
    window.__stop = () => { __f.on = false; const g = __f.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b);
      return { fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), p95: +(q[Math.floor(0.95 * (q.length - 1))] || 0).toFixed(1), dropped: g.filter(x => x > 25).length, frames: g.length,
               drawMs: +(__f.ms / Math.max(1, __f.draws)).toFixed(2), x: Math.round(state.background.figX ?? 0), anim: state.body.anim }; };
    ${process.env.TWEAK || ""};
    return "ok"; })()`);
  await sleep(600);
  // the walk: the fake pad connected only for it
  const walk = async () => {
    await ev(`window.__pads = [window.__pad]; { const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); } "ok"`);
    await ev(`state.background.figX = -100; changed(); __start(); __pad.buttons[15].pressed = true; "go"`); await sleep(1500);
    await ev(`__pad.buttons[15].pressed = false; __pad.buttons[14].pressed = true; "back"`); await sleep(1500);
    const r = await ev(`(() => { const r = __stop(); __pad.buttons.forEach(b => b.pressed = false); return r; })()`);
    await sleep(250);
    await ev(`window.__pads = []; window.dispatchEvent(new Event("gamepaddisconnected")); state.body.anim = "none"; changed(); "ok"`); await sleep(250);
    return r;
  };
  // the drag: hold the friend by the middle of their body (shoulders to hips), in screen pixels
  const drag = async () => {
    // (facing us: in profile, after the walk, the near arm crosses the body, and a press there takes the arm)
    await ev(`state.background.figX = -100; state.body.facing = "front"; changed(); "ok"`); await sleep(200);
    const [x0, y0, ppu] = await ev(`(() => { const J = poseJoints, T = figureT, at = (x, y) => [T.dx + T.k * x, T.dy + T.sg + T.k * (y - T.g)];
      const xs = [...J.arms.map(a => a.A), ...J.legs.map(l => l.H)], m = xs.reduce((s, p) => [s[0] + p[0] / xs.length, s[1] + p[1] / xs.length], [0, 0]);
      const [sx, sy] = at(m[0], m[1]), M = pic.getScreenCTM(), p = new DOMPoint(sx, sy).matrixTransform(M);
      return [p.x, p.y, M.a]; })()`);
    const span = 200 * ppu, mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x0, y: y0 });
    await mouse("mousePressed", x0, y0);
    const held = await ev(`!!(drag && drag.figure)`);
    if (!held && process.env.DEBUG) console.log("  missed:", await ev(`(() => { const e = document.elementFromPoint(${x0}, ${y0}); return JSON.stringify({ at: [${Math.round(x0)}, ${Math.round(y0)}], el: e && (e.tagName + " " + (e.id || e.getAttribute("class") || "")), inFig: !!(e && e.closest("#figure")), drag: drag && Object.keys(drag), anim: state.body.anim, x: state.background.figX, y: state.background.figY, entering, kind: state.background.kind }); })()`));
    await ev(`__start(); "go"`);
    const t0 = Date.now();
    for (;;) {
      const t = (Date.now() - t0) / 3000;
      if (t >= 1) break;
      const u = t < 0.5 ? t * 2 : 2 - t * 2;
      await mouse("mouseMoved", x0 + span * u, y0);
      await sleep(8);
    }
    const r = await ev(`__stop()`);
    await mouse("mouseReleased", x0, y0);
    await sleep(400);
    return { ...r, held };
  };
  const median = rs => rs.map(r => r.fps).sort((a, b) => a - b)[Math.floor(rs.length / 2)];
  await walk();   // (a warm-up of each, not counted)
  await drag();
  for (const [kind, fn] of [["walk", walk], ["drag", drag]]) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await fn());
    const fps = median(runs), took = kind === "drag" ? runs.every(r => r.held) : runs.every(r => r.anim !== undefined);
    const pass = fps >= MIN && took;
    results.push({ scene: sc.id, label: sc.label, kind, fps, pass, runs });
    console.log(`${pass ? "pass" : "FAIL"}  ${(sc.label + ", " + kind).padEnd(40)} ${String(fps).padStart(5)} fps (runs ${runs.map(r => r.fps).join(", ")}; p95 gap ${runs.map(r => r.p95).join("/")} ms; draw ${runs.map(r => r.drawMs).join("/")} ms)` +
      (kind === "drag" && !took ? "  (the drag never took hold of the friend)" : ""));
  }
  if (errs.length) console.log("  page errors:", errs.slice(0, 3));
  await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
}
const failed = results.filter(r => !r.pass);
console.log(failed.length ? `${failed.length} of ${results.length} below ${MIN} fps: fix before releasing.` : `all ${results.length} at ${MIN} fps or more.`);
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ url, min: MIN, runs: RUNS, cpu: +(process.env.CPU || 1), size: [+(process.env.W || 1280), +(process.env.H || 800), +(process.env.DPR || 1)], when: new Date().toISOString(), results }, null, 1));
process.exit(failed.length ? 1 : 0);
