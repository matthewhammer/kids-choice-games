// (ticket 188, Matthew 2026-10-17) "slider to control max running speed,
// and an acceleration/deceleration speed slider -- the current behavior,
// which can be the default, is immediate": with a fake controller, as the
// frame-rate gate's, in the empty room. At the defaults the friend starts
// and stops at once, as before; the top running speed slider at 200 runs
// about twice as far; with speeding up and slowing down at 100 they take
// time to reach full speed, and coast to a stop, legs still going, after
// the arrow is let go. Exits 1 on a failure.
//   node moving188.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // (a run: hold the right arrow, run held or not, for ms; then let go and watch for 900 ms; figX sampled every 50 ms)
  const go = (runSpeed, accel, run, ms) => ev(`(async () => {
    if (!window.__pad) { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      window.__pads = []; Object.defineProperty(navigator, "getGamepads", { value: () => window.__pads, configurable: true }); }
    const w = t => new Promise(r => setTimeout(r, t)), B = state.background, body = state.body, P = window.__pad;
    state.music.mute = true; B.kind = "emptyroom"; B.figX = -300; B.figY = 0; body.runSpeed = ${runSpeed}; body.accel = ${accel}; changed();
    window.__pads = [P]; { const e = new Event("gamepadconnected"); e.gamepad = P; window.dispatchEvent(e); }
    await w(400);
    const xs = [], anims = [], push = () => { xs.push(B.figX ?? 0); anims.push(body.anim); };
    const runBtn = state.controls.run ?? 3;
    P.buttons[15].pressed = true; P.buttons[15].value = 1; if (${run}) { P.buttons[runBtn].pressed = true; P.buttons[runBtn].value = 1; }
    for (let t = 0; t < ${ms}; t += 50) { await w(50); push(); }
    const facing = body.facing;
    P.buttons[15].pressed = false; P.buttons[15].value = 0; P.buttons[runBtn].pressed = false; P.buttons[runBtn].value = 0;
    const held = xs.length;
    for (let t = 0; t < 900; t += 50) { await w(50); push(); }
    return JSON.stringify({ xs, anims, held, facing, after: body.facing }); })()`).then(JSON.parse);
  const moved = r => r.xs[r.held - 1] - r.xs[0], coast = r => r.xs[r.xs.length - 1] - r.xs[r.held - 1];
  const step = (r, i) => r.xs[i + 1] - r.xs[i];
  const def = await go(100, 0, true, 700);
  ok("at the defaults, running: they move, and stop at once when let go (as before)", moved(def) > 50 && Math.abs(coast(def)) <= 2, def);
  const fast = await go(200, 0, true, 700);
  ok("top running speed 200: about twice as far as at 100", moved(fast) > 1.6 * moved(def) && moved(fast) < 2.4 * moved(def), { at100: moved(def), at200: moved(fast) });
  const ramp = await go(100, 100, true, 1500);
  ok("speeding up and slowing down at 100: slower at first than at full speed", step(ramp, 0) < 0.6 * step(ramp, ramp.held - 3), ramp.xs.slice(0, ramp.held));
  ok("and let go, they coast on, legs still going, then stop", coast(ramp) > 20 && ramp.anims[ramp.held + 1] === "run" && ramp.xs[ramp.xs.length - 1] === ramp.xs[ramp.xs.length - 2] && ramp.after === ramp.facing, { coast: coast(ramp), anims: ramp.anims.slice(ramp.held - 1), facing: [ramp.facing, ramp.after] });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
function r2(v) { return Math.round(v * 100) / 100; }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
