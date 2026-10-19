// (ticket 412) In the orange tent, the two sleeping bags are beds to lie along: lain on, the friend is drawn by a view of
// their own (lieAlongSvg: lying face up along a side wall, the feet toward us), not the standing friend turned: no transform
// on the figure, the head near the bag's pillow and the feet near its open end, the two bags mirror images; a click on a bag
// with 👆 on walks there and lies down on it; standing up puts them at its open end. Exits 1 on a failure.
//   node lie412.mjs <devtools port> <url>
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
  const setUp = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; state.body.sit = false; state.body.pose = "stand"; B.seat = null; B.things = [];
    state.access = { ...(state.access || DEFAULTS.access), clickWalk: true };
    B.kind = "tent"; B.tent = 1; B.campTime = "day"; B.figX = 0; B.figY = 40; changed(); await w(600); return "ok"; })()`;
  await ev(setUp);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = [];
    for (const t of placeSeats(B).filter(t => t.along)) { sitOn(t); await w(400);
      const f = document.getElementById("figure"), view = f.querySelector('[data-lie="along"]'), P = pic.getScreenCTM().inverse();
      const box = el => { const q = el.getBoundingClientRect(), a = new DOMPoint(q.left, q.top).matrixTransform(P), c = new DOMPoint(q.right, q.bottom).matrixTransform(P); return [a.x, a.y, c.x, c.y].map(Math.round); };
      const head = view && view.querySelector("circle.lie-head"), shoes = view ? [...view.querySelectorAll(":scope > path")].slice(-2) : [];
      out.push({ name: t.name, pose: state.body.pose, seat: B.seat, view: !!view, transform: f.getAttribute("transform"), head: head ? box(head) : null,
        shoes: shoes.map(box), far: t.along.far.map(Math.round), near: t.along.near.map(Math.round) });
      standUp(); await w(200); out[out.length - 1].stood = { pose: state.body.pose, feet: Math.round(SCENE.ground + B.figY), z: Math.round(t.z), view: !!document.querySelector('#figure [data-lie="along"]') }; }
    return JSON.stringify(out); })()`));
  console.log(`  lying along each bag: ${JSON.stringify(r)}`);
  const mid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  ok("the orange tent has two sleeping bags to lie along", r.length === 2, r);
  ok("lain on, the friend is drawn by the lying-along view, not the standing friend transformed", r.every(x => x.pose === "lie" && x.seat === x.name && x.view && !x.transform), r);
  ok("the head near the bag's pillow, the feet near its open end", r.every(x => x.head && dist(mid(x.head), x.far) < 45 && x.shoes.length === 2 && x.shoes.every(b => dist(mid(b), x.near) < 60)), r);
  ok("the two bags mirror images", r.length === 2 && r[0].head && r[1].head && Math.abs(mid(r[0].head)[0] + mid(r[1].head)[0]) < 3 && Math.abs(mid(r[0].head)[1] - mid(r[1].head)[1]) < 3, r);
  ok("standing up, the feet at its open end, drawn standing again", r.every(x => x.stood.pose === "stand" && Math.abs(x.stood.feet - x.stood.z) <= 2 && !x.stood.view), r);
  // a click on the red bag's middle: walked to, and lain on
  await ev(setUp);
  const at = JSON.parse(await ev(`(() => { const t = placeSeats(state.background)[0], p = new DOMPoint((t.x0 + t.x1) / 2, t.y).matrixTransform(pic.getScreenCTM()); return JSON.stringify({ x: p.x, y: p.y, name: t.name }); })()`));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x, y: at.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: at.x, y: at.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: at.x, y: at.y, button: "left", buttons: 0, clickCount: 1 });
  const c = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();
    while (performance.now() - t0 < 9000 && !(state.body.pose === "lie" && state.background.seat)) await w(100);
    return JSON.stringify({ pose: state.body.pose, seat: state.background.seat, ms: Math.round(performance.now() - t0) }); })()`));
  console.log(`  a click on the red bag: ${JSON.stringify(c)}`);
  ok("a click on a bag walks there and lies down on it", c.pose === "lie" && c.seat === at.name, c);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
