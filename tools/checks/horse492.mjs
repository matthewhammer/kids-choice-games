// (ticket 492, Matthew: "the 'riding horse' needs some system work. The horse settings should be under 'body', not
// costume. When 'riding horse' or 'leading horse' -- we need the collision boxes to be more accurate. our actual body is
// above the horse. the horse has a body, and feet. Do the same we are doing for humanoid bodies, but extended for horses
// (four legs, not just two).") The horse's settings in 🧍 Body, none in 🐯 Costume, and a friend saved with a horse in
// Costume keeps it; ridden, the boxes are the horse's four hooves on the floor, its body from belly to back and the rider
// up on it (their hips at the saddle), and none of the rider's own soles; led, the friend's own boxes and the horse's; a
// low thing under the horse's belly is not met, one at a hoof is; 🔬 Inspection draws the horse's boxes. Exits 1 on a failure.
//   node horse492.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null;
    const rowsIn = name => (TABS.find(t => t[0] === name) || [0, 0, []])[2].flat(3).filter(x => typeof x === "string" && /^horse/.test(x));
    const tabs = { body: rowsIn("🧍 Body"), costume: rowsIn("🐯 Costume"), defaults: [DEFAULTS.body.horse, DEFAULTS.costume.horse], keys: Object.keys(DEFAULTS.body).filter(k => /^horse/.test(k)) };
    // an old save: the horse in Costume
    const old = { costume: { kind: "none", horse: "ride", horseCoat: "#1f1f22", horseSize: 80 }, body: {} }, next = clone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) next[k] = { ...DEFAULTS[k], ...(old[k] || {}) };
    upgradeHorse(next, old);
    const upgraded = [next.body.horse, next.body.horseCoat, next.body.horseSize, next.costume.horse === undefined];
    // (the review after 0.0.385) a person away, saved with a horse in their costume, keeps it in their body too
    const old2 = { costume: { kind: "none" }, body: {}, peopleAway: { p2: { id: "p2", look: { costume: { kind: "none", horse: "lead", horseCoat: "#ffffff" }, body: {} } } } }, next2 = clone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) next2[k] = { ...DEFAULTS[k], ...(old2[k] || {}) };
    upgradeHorse(next2, old2); const away = next2.peopleAway.p2.look; upgraded.push(away.body.horse, away.body.horseCoat, away.costume.horse === undefined);
    Object.assign(B, { kind: "caveroom", figX: 0, figY: 40, seat: null, things: [] }); state.access = { ...(state.access || DEFAULTS.access), showSolids: true };
    Object.assign(state.body, { horse: "ride", facing: "right", sit: false, pose: "stand", anim: "none" }); changed(); drawNow(); await w(500);
    const fz = g + B.figY, R = horseBoxes(B.figX, fz), boxes = youBoxes(B.figX, fz), Y = youHeights(), soles = feetSoles(B.figX, fz);
    const mid = (R.body[0] + R.body[1]) / 2, hoof = R.hooves[0];
    const meets = o => youBoxes(B.figX, fz).some(s => s[3] > o.back && s[2] < o.front && s[1] > o.x0 && s[0] < o.x1 && s[5] > 0 && s[4] < o.h);
    const ride = { view: horseNow && horseNow.view, n: boxes.length, hooves: R.hooves.length, solesAreHooves: JSON.stringify(soles) === JSON.stringify(R.hooves),
      hipsAtSeat: Math.abs(Y.hips - horseNow.seat * figureT.k * horseNow.hs) < 1, crownOver: Y.crown > Y.hips + 20, bellyOver: R.body[4] > 40,
      under: meets({ x0: mid - 6, x1: mid + 6, back: fz - 4, front: fz + 4, h: R.body[4] * 0.6 }), atHoof: meets({ x0: hoof[0], x1: hoof[1], back: fz - 4, front: fz + 4, h: 20 }),
      drawn: document.querySelectorAll(".you .horse-boxes polygon").length };
    const views = {};
    for (const f of ["front", "back", "left"]) { state.body.facing = f; changed(); drawNow(); await w(200); const H = horseBoxes(B.figX, fz); views[f] = H ? [horseNow.view, H.hooves.length, new Set(H.hooves.map(h => Math.round(h[2]))).size] : null; }
    // (ticket 496) the side they lead it from: kept whichever way they go; seen side on, on its far side the horse is in front
    const sides = {};
    for (const side of ["left", "right"]) for (const facing of ["right", "left", "front", "back"]) {
      Object.assign(state.body, { horse: "lead", horseLead: side, facing }); changed(); drawNow(); await w(120);
      const hg = document.querySelector("#figure .horse"); sides[side + "/" + facing] = [!!(hg && hg.hasAttribute("data-far")), Math.sign(horseNow.X), horseNow.far]; }
    Object.assign(state.body, { horse: "lead", horseLead: "left", facing: "front" }); changed(); drawNow(); await w(300);
    const lead = { own: youBoxesOwn(B.figX, fz).length, all: youBoxes(B.figX, fz).length, heights: youHeights() };
    Object.assign(state.body, { horse: "none", facing: "front" }); changed(); drawNow(); await w(200);
    const none = { boxes: youBoxes(B.figX, fz).length, horse: horseNow };
    return JSON.stringify({ tabs, upgraded, ride, views, lead, none, sides }); })()`));
  ok("the horse's settings are in 🧍 Body (each of its settings has its row there), none in 🐯 Costume", r.tabs.keys.length >= 7 && r.tabs.keys.every(k => r.tabs.body.includes(k)) && r.tabs.costume.length === 0 && r.tabs.defaults[0] === "none" && r.tabs.defaults[1] == null, r.tabs);
  ok("a friend saved with a horse in Costume keeps it, in Body", r.upgraded[0] === "ride" && r.upgraded[1] === "#1f1f22" && r.upgraded[2] === 80 && r.upgraded[3], r.upgraded);
  ok("a person away, saved with a horse in Costume, keeps it in Body too", r.upgraded[4] === "lead" && r.upgraded[5] === "#ffffff" && r.upgraded[6], r.upgraded);
  const R = r.ride;
  ok("ridden: four hooves on the floor (the soles), its body, and the rider up on it: six boxes", R.view === "side" && R.hooves === 4 && R.n === 6 && R.solesAreHooves, R);
  ok("ridden: the rider's hips at the saddle, their crown over them; the horse's belly well off the floor", R.hipsAtSeat && R.crownOver && R.bellyOver, R);
  ok("a low thing under the horse's belly is not met; one at a hoof is", !R.under && R.atHoof, R);
  ok("🔬 Inspection draws the horse's boxes (four hooves, its body's footprint and face)", R.drawn === 6, R.drawn);
  ok("every view has four hooves; seen end on, two of them farther back", Object.values(r.views).every(v => v && v[1] === 4) && r.views.front[2] === 2 && r.views.back[2] === 2, r.views);
  ok("led: the friend's own boxes, and the horse's four hooves and body besides", r.lead.all === r.lead.own + 5 && r.lead.heights.hips < 120, r.lead);
  const S = r.sides;
  ok("led from its left: walking right they are on the near side, walking left on the far side (the horse in front); facing us it stands at our left, from behind at our right", S["left/right"][0] === false && S["left/left"][0] === true && S["left/left"][2] === true && S["left/front"][1] < 0 && S["left/back"][1] > 0, S);
  ok("led from its right: the other way about", S["right/right"][0] === true && S["right/left"][0] === false && S["right/front"][1] > 0 && S["right/back"][1] < 0, S);
  ok("with no horse, no horse boxes", r.none.horse === null && r.none.boxes === r.lead.own, r.none);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
