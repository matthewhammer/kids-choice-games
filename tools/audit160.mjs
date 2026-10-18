// (ticket 160) Every place walked with the ON-SCREEN controller: for each of the
// places (PLACES), the castle's room styles (ROOM_KINDS, in castle N's first room)
// and the tree house's rooms (treeroom, houses 1-6), in headless Chrome: a fresh
// page, the friend where the place puts them on arrival (ARRIVE), the on-screen
// controller shown, and the mouse held on its ▶ (1.2 s), ◀ (1.2 s), ▲ (0.6 s),
// ▼ (0.6 s). A warm-up, then RUNS runs; a case's fps is the median run's frames a
// second while held, as fpsgate.mjs counts them. Under MIN (55) is a FAIL, under
// 58 "near".
//   node audit160.mjs <devtools port> <url> [case,...]   env: RUNS=3 MIN=55 W=1920 H=1080 DPR=1 CPU=<n> OUT=<json>
// Start the browser muted, and run nothing else heavy alongside it.
import { writeFileSync } from "node:fs";
const [dport, url, only] = process.argv.slice(2);
const MIN = +(process.env.MIN || 55), RUNS = +(process.env.RUNS || 3);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// the cases: read from the page itself, so a new place or room joins by itself
async function openPage() {
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
  await send("Emulation.setDeviceMetricsOverride", { width: +(process.env.W || 1920), height: +(process.env.H || 1080), deviceScaleFactor: +(process.env.DPR || 1), mobile: false });
  await send("Page.navigate", { url }); await sleep(3500);
  return { page, send, ev, errs, close: () => fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`) };
}
let CASES;
{
  const P = await openPage();
  CASES = JSON.parse(await P.ev(`JSON.stringify([
    ...PLACES.filter(([k]) => k !== "none").map(([k, label]) => ({ id: k, label, setup: { kind: k } })),
    ...Object.entries(ROOM_KINDS).map(([st, R]) => ({ id: "castleroom:" + st, label: "🚪 " + R.label, setup: { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: st } })),
    ...HOUSE_ROOMS.map((r, i) => ({ id: "treeroom:" + (i + 1), label: "🪜 tree house " + (i + 1) + " (" + r + ")", setup: { kind: "treeroom", houses: 6, inside: i + 1 } })),
  ])`));
  await P.close();
}
if (only) CASES = CASES.filter(c => only.split(",").includes(c.id));
console.log(`${CASES.length} cases, ${RUNS} runs each, CPU x${process.env.CPU || 1}, ${process.env.W || 1920}x${process.env.H || 1080}`);
const results = [];
for (const c of CASES) {
  const P = await openPage(), { send, ev } = P;
  let out;
  try {
    await ev(`(() => {
      localStorage.removeItem("dress-up-pads");
      localStorage.removeItem("dress-up-slow"); if (typeof slowFlag !== "undefined") { slowFlag = false; slowN = 0; slowAvg = 0; }
      localStorage.removeItem("dress-up-choppy"); if (typeof choppy !== "undefined") { choppy = false; moveFrames = 0; moveLate = 0; }
      state = clone(DEFAULTS); state.music.mute = true;
      Object.assign(state.background, ${JSON.stringify(c.setup)});
      [state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0];
      changed(); touchWant(true);
      window.__f = { on: false, gaps: [], last: 0, draws: 0, ms: 0 };
      { const f = t => { if (__f.on) { if (__f.last) __f.gaps.push(t - __f.last); __f.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); }
      { const d0 = draw; draw = function () { const t = performance.now(); d0.apply(this, arguments); if (__f.on) { __f.draws++; __f.ms += performance.now() - t; } }; }
      window.__start = () => { __f.on = true; __f.gaps = []; __f.last = 0; __f.draws = 0; __f.ms = 0; };
      window.__stop = () => { __f.on = false; const g = __f.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b);
        return { fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), dps: +(1000 * __f.draws / Math.max(1, s)).toFixed(1), worst: Math.round(q[q.length - 1] || 0),
                 p95: +(q[Math.floor(0.95 * (q.length - 1))] || 0).toFixed(1), late: g.filter(x => x > 25).length, frames: g.length, drawMs: +(__f.ms / Math.max(1, __f.draws)).toFixed(2) }; };
      return "ok"; })()`);
    await sleep(800);
    const dp = await ev(`(() => { const e = document.querySelector("#touchpad .dpad"); if (!e || document.getElementById("touchpad").hidden) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; })()`);
    if (!dp) throw new Error("the on-screen controller is not showing");
    const at = { right: [dp[0] + dp[2] * 0.4, dp[1]], left: [dp[0] - dp[2] * 0.4, dp[1]], up: [dp[0], dp[1] - dp[3] * 0.4], down: [dp[0], dp[1] + dp[3] * 0.4] };
    const hold = async (dir, ms) => {
      const [x, y] = at[dir];
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
      await sleep(ms);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
    };
    const walk = async () => {
      // (as the game puts them there, settled out of what they arrive in, ticket 184)
      await ev(`[state.background.figX, state.background.figY] = ARRIVE[state.background.kind] || [0, 0]; if (typeof arriveSettle !== "undefined") arriveSettle = true; changed(); "ok"`); await sleep(250);
      const x0 = await ev(`Math.round(state.background.figX ?? 0)`);
      await ev(`__start(); "go"`);
      await hold("right", 1200); const x1 = await ev(`Math.round(state.background.figX ?? 0)`);
      await hold("left", 1200); const x2 = await ev(`Math.round(state.background.figX ?? 0)`); await hold("up", 600); await hold("down", 600);
      const r = await ev(`__stop()`);
      await sleep(300);
      // (moved either way: arrived beside something, a step toward it is rightly blocked, ticket 184)
      // (a reading that came back empty, once, in 0.0.201's run: the stable, which walks both ways when probed, then counted
      // by the way it did move)
      return { ...r, moved: Math.max(Math.abs(x1 - x0), Number.isFinite(x2) ? Math.abs(x2 - x1) : 0) };
    };
    await walk();   // (a warm-up, not counted)
    const runs = []; for (let i = 0; i < RUNS; i++) runs.push(await walk());
    const med = k => runs.map(r => r[k]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    const fps = med("fps"), moved = runs.every(r => r.moved > 0);
    const still = await ev(`typeof sceneryStill === "function" && sceneryStill() ? "held still (" + (slowFlag ? "slow" : "") + (choppy ? "choppy" : "") + ")" : "moving"`);
    const verdict = !moved ? "STUCK" : fps < MIN ? "FAIL" : fps < 58 ? "near" : "pass";
    out = { id: c.id, label: c.label, verdict, fps, dps: med("dps"), worst: med("worst"), p95: med("p95"), drawMs: med("drawMs"), still, runs };
    console.log(`${verdict.padEnd(5)} ${c.label.padEnd(38)} ${String(fps).padStart(5)} fps (runs ${runs.map(r => r.fps).join(", ")}; drawn ${out.dps}/s; worst ${runs.map(r => r.worst).join("/")} ms; p95 ${out.p95} ms; draw ${out.drawMs} ms; moved ${runs.map(r => r.moved).join("/")})${still !== "moving" ? "  scenery " + still : ""}`);
  } catch (e) {
    out = { id: c.id, label: c.label, verdict: "ERROR", error: String(e).slice(0, 300) };
    console.log(`ERROR ${c.label}: ${out.error}`);
  }
  if (P.errs.length) { out.pageErrors = P.errs.slice(0, 3); console.log("  page errors:", P.errs.slice(0, 2)); }
  results.push(out);
  await P.close();
}
const bad = results.filter(r => r.verdict !== "pass");
console.log(bad.length ? `${bad.length} of ${results.length} not a pass: ${bad.map(r => r.id + " " + r.verdict + (r.fps ? " " + r.fps : "")).join(", ")}` : `all ${results.length} at 58 fps or more.`);
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ url, min: MIN, runs: RUNS, cpu: +(process.env.CPU || 1), size: [+(process.env.W || 1920), +(process.env.H || 1080), +(process.env.DPR || 1)], when: new Date().toISOString(), results }, null, 1));
process.exit(0);
