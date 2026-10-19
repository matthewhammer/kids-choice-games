// (ticket 299) Point to sit, point to lie down: the grass hut's bed, the bottom bunk in tree room 1 and the beach's two
// blankets are places to lie (seats with lie), the blankets flat (in nobody's way); lying is a pose (🛌, the body level,
// the head the way the bed's pillow is; on the back, face up, the usual, or on the side, facing us); pointing at a seat or a bed, with 👆 on, glows it and says what a click does;
// clicking it walks the friend there, to sit or lie down; 🔬's collision boxes have a chip for seats and beds. Exits 1 on a failure.
//   node sitlie299.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, body = state.body;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; state.access.clickWalk = true; state.access.showSolids = false; body.anim = "none";
    const at = async (kind, more = {}) => { if (B.seat) standUp(); Object.assign(B, { kind, figX: 250, figY: 60 }, more); changed(); await w(500); return seatsHere(B); };
    const hut = await at("hutbed"), bunks = await at("treeroom", { inside: 1 }), beach = await at("beach");
    const lieSeats = { hut: hut.filter(t => t.lie).map(t => t.name), bunks: bunks.filter(t => t.lie).map(t => t.name), beach: beach.filter(t => t.lie).map(t => t.name) };
    const flatSolid = solidsHere().some(o => /blanket/.test(o.name));
    // lying on the hut's bed: the pose, the body level (wider than tall), the head at its pillow's side
    const bed = (await at("hutbed"))[0]; sitOn(bed); await w(300); draw();
    const f = document.getElementById("figure").getBoundingClientRect(), lying = { pose: body.pose, head: body.lieHead, how: body.lieHow, facing: body.facing, seat: B.seat, level: f.width > f.height };
    // (on the side, facing us, as asked for)
    standUp(); body.lieHow = "side"; sitOn(bed); await w(200); draw(); const side = { facing: body.facing, level: document.getElementById("figure").getBoundingClientRect().width > document.getElementById("figure").getBoundingClientRect().height };
    body.lieHow = "back";
    standUp(); body.facing = "front"; draw(); await w(200);
    // pointing at the bed: its glow and its words
    const M = pic.getScreenCTM(), p = new DOMPoint((bed.x0 + bed.x1) / 2, (bed.y + bed.z) / 2).matrixTransform(M), el = document.elementFromPoint(p.x, p.y);
    el.dispatchEvent(new PointerEvent("pointermove", { clientX: p.x, clientY: p.y, bubbles: true })); await w(150);
    const say = document.querySelector("#access-layer svg.walk-spot .seat-say")?.textContent || null;
    // clicking it: walked there, lain on
    document.elementFromPoint(p.x, p.y).dispatchEvent(new MouseEvent("click", { clientX: p.x, clientY: p.y, bubbles: true }));
    for (let i = 0; i < 120 && (clickRun || entering || B.seat !== "bed"); i++) await w(100);
    const clicked = { pose: body.pose, seat: B.seat };
    standUp(); await at("beach"); state.access.showSolids = true; draw(); await w(150);
    const marks = [...document.querySelectorAll("svg.solid-boxes g.seat")].length, chip = SOLID_CATS.some(c => c[0] === "seats");
    state.access.showSolids = false; draw();
    return JSON.stringify({ lieSeats, flatSolid, lying, side, say, clicked, marks, chip }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("places to lie: the grass hut's bed, tree room 1's bottom bunk, the beach's two blankets", r.lieSeats.hut.includes("bed") && r.lieSeats.bunks.includes("bunk beds") && r.lieSeats.beach.length === 2, r.lieSeats);
  ok("a blanket is in nobody's way (not a solid)", !r.flatSolid, r);
  ok("lying on the bed: the 🛌 pose, level, its head toward the pillow (our left)", r.lying.pose === "lie" && r.lying.level && r.lying.head === "left" && r.lying.seat === "bed", r.lying);
  ok("on the back, face up, by default (from the side, facing away from where the head goes)", r.lying.how === "back" && r.lying.facing === "right", r.lying);
  ok("or on the side, facing us, level too", r.side.facing === "front" && r.side.level, r.side);
  ok("pointing at the bed says what a click does", r.say === "🛏️ lie down on the bed", r);
  ok("clicking it walks the friend there, and they lie down on it", r.clicked.pose === "lie" && r.clicked.seat === "bed", r.clicked);
  ok("🔬's collision boxes: a chip for seats and beds, each seat and blanket marked", r.chip && r.marks === 4, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
