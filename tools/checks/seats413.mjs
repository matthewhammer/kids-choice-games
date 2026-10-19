// (ticket 413) Things with a top to sit on are seats wherever they stand, when the top is a seat's height for the friend:
// in the empty room a rock, a bench and a barrel at 25% are seats, a cauldron and a bush are not; the friend sat on each
// has their hips on it; a click on the rock (a press let go where it is, 👆 on) walks there and sits; a press moved on
// drags it instead; and the fairy forest's toadstools are seats beyond its own three. Exits 1 on a failure.
//   node seats413.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; state.body.sit = false; B.seat = null;
    state.access = { ...(state.access || DEFAULTS.access), clickWalk: true };
    B.kind = "emptyroom"; const g = SCENE.ground;
    const T = (kind, x, z, size) => ({ kind, x, z: g + z, seed: 901, size, mirror: false, ...structuredClone(THING_DEFAULTS[kind] || {}) });
    B.things = [T("rock", -220, 40, 100), T("bench", 0, 60, 100), T("barrel", 200, 40, 25), T("cauldron", -120, 90, 100), T("bush", 140, 100, 100)];
    B.figX = 0; B.figY = 140; changed(); await w(500); return "ok"; })()`;
  await ev(setUp);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    const seats = thingSeats(B), out = { seats: seats.map(t => objBase(t.name)).sort(), sat: [] };
    for (const t of seats) { sitOn(t); await w(200);
      const T2 = figureT, hips = T2.sg + T2.dy + T2.k * (poseJoints.legs[0].H[1] - T2.g), now = seatNow();
      out.sat.push({ seat: t.name, sit: state.body.sit, now: now && now.name, off: Math.round(hips - t.y) }); standUp(); await w(150); }
    return JSON.stringify(out); })()`));
  console.log(`  the empty room's things: ${JSON.stringify(r)}`);
  ok("a rock, a bench and a barrel at 25% are seats; a cauldron and a bush are not", JSON.stringify(r.seats) === JSON.stringify(["barrel", "bench", "rock"]), r.seats);
  ok("sat on each, the friend's hips are on it, and it is the seat they are on", r.sat.length === 3 && r.sat.every(s => s.sit && s.now === s.seat && Math.abs(s.off) <= 3), r.sat);
  // a real click on the rock: pressed and let go where it is
  await ev(setUp);
  const at = JSON.parse(await ev(`(() => { const el = bgShown.node.querySelector('[data-drag="thing:0"]'), r = el.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height * 0.4 }); })()`));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x, y: at.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: at.x, y: at.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: at.x, y: at.y, button: "left", buttons: 0, clickCount: 1 });
  const c = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();
    while (performance.now() - t0 < 9000 && !(state.body.sit && state.background.seat)) await w(100);
    return JSON.stringify({ sit: state.body.sit, seat: state.background.seat, ms: Math.round(performance.now() - t0), rockX: state.background.things[0].x }); })()`));
  console.log(`  a click on the rock: ${JSON.stringify(c)}`);
  ok("a click on the rock walks there and sits on it", c.sit && /^rock/.test(c.seat || ""), c);
  ok("and the rock stays where it was", c.rockX === -220, c);
  // a press moved on: a drag, as before
  await ev(setUp);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x, y: at.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: at.x, y: at.y, button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 8; i++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x + 8 * i, y: at.y, buttons: 1 }); await sleep(30); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: at.x + 64, y: at.y, button: "left", buttons: 0, clickCount: 1 });
  const d = JSON.parse(await ev(`(async () => { await new Promise(r => setTimeout(r, 1500)); return JSON.stringify({ sit: state.body.sit, rockX: state.background.things[0].x }); })()`));
  console.log(`  a press moved on: ${JSON.stringify(d)}`);
  ok("a press moved on drags the rock, and nobody sits", !d.sit && d.rockX > -220 + 20, d);
  const f = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; state.body.sit = false; B.seat = null;
    B.things = []; B.kind = "fairyforest"; changed(); await w(800);
    return JSON.stringify({ own: placeSeats(B).length, more: thingSeats(B).filter(t => objBase(t.name) === "toadstool").length }); })()`));
  console.log(`  the fairy forest: ${JSON.stringify(f)}`);
  ok("the fairy forest's other toadstools are seats too, beyond its own three", f.own === 3 && f.more >= 8, f);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
