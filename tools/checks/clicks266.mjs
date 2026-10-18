// (ticket 266, Matthew: "queue of clicks ... permit unlimited plans, that consist of multiple clicks"; "two colors ---
// main color and alt color, and we alternate along the multi-click plan when its shown") In the empty room, 👆 and 👣 on:
// a click, and two more while the friend walks to it: the glow still shown while walking, all three walks queued
// (walkPath marked 0, 1, 2), 👣 drawing the second in the alt colour, and the friend ends where the third click was.
// Exits 1 on a failure.
//   node clicks266.mjs <devtools port> <url>
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
const mouse = (type, x, y, buttons = 0) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
const click = async ([x, y]) => { await mouse("mouseMoved", x, y); await mouse("mousePressed", x, y, 1); await mouse("mouseReleased", x, y, 0); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const at = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; Object.assign(state.access, { clickWalk: true, showPath: true });
    Object.assign(B, { kind: "emptyroom", figX: -300, figY: 40, things: [] }); changed(); await w(500);
    const M = pic.getScreenCTM(), g = SCENE.ground, scr = (x, y) => { const q = new DOMPoint(x, g + y).matrixTransform(M); return [q.x, q.y]; };
    return JSON.stringify({ a: scr(0, 60), b: scr(250, 20), c: scr(100, 45), end: [100, 45] }); })()`));
  await click(at.a); await sleep(250);
  await mouse("mouseMoved", at.b[0], at.b[1]); await sleep(120);
  const glowing = JSON.parse(await ev(`JSON.stringify({ spot: !!document.querySelector("#access-layer svg.walk-spot"), entering })`));
  await click(at.b); await sleep(150); await click(at.c); await sleep(200);
  const mid = JSON.parse(await ev(`JSON.stringify({ segs: walkPath && walkPath.segs ? [...new Set(walkPath.segs)] : null, alt: document.querySelectorAll("#access-layer svg.walk-path polyline.alt").length, lines: document.querySelectorAll("#access-layer svg.walk-path polyline").length })`));
  await sleep(9000);
  const end = JSON.parse(await ev(`JSON.stringify({ x: Math.round(state.background.figX), y: Math.round(state.background.figY), entering, run: !!clickRun })`));
  console.log(`  while walking: ${JSON.stringify(glowing)}; queued: ${JSON.stringify(mid)}; ended ${JSON.stringify(end)}`);
  ok("while walking to a click, the glow still shows on the ground", glowing.spot && glowing.entering, glowing);
  ok("two more clicks queued after it: three walks (0, 1, 2)", JSON.stringify(mid.segs) === "[0,1,2]", mid);
  ok("👣 draws them by turns, the second in the alt colour", mid.alt > 0 && mid.lines > mid.alt, mid);
  ok("the friend ends where the third click was", Math.abs(end.x - at.end[0]) <= 2 && Math.abs(end.y - at.end[1]) <= 2 && !end.entering && !end.run, end);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
