// (ticket 438, Matthew: "horse in all poses we have for people that 'make sense' for using in the game as a way to ride, or
// walk/run with (holding the horse's reins, and walking/running next to it) ... Just walking and running, and standing
// still: towards, away and L R poses") The friend's horse, led by its rein: with 🧍 Body's 🐴 the horse (🐯 Costume's before 0.0.380, ticket 492) at "led by its
// rein", it is drawn before the friend, from the side facing our right or left, facing us, or from behind as they face,
// standing, walking or running with them, its legs moving through the stride; its rein runs from its noseband to the
// friend's hand; it fits the picture's frame (no scene); there is none while they lie down or sit, nor with no horse; its
// rows show only with a horse; the stable's horses keep their faces' animation, and the friend's horse's face has none.
// Ridden ("🏇 ridden"): the friend lifted onto its saddle (`.rider`), facing us or away the horse's near parts drawn over
// their legs (`.horse-over`), a rein to each hand facing us, one in profile, none seen from behind, all inside the frame;
// as it walks or runs, the friend's own drawing does not walk (only the lift bobs). Exits 1 on a failure.
//   node horse438.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { views: {}, legs: {}, off: {} };
    state.music.mute = true; state.world.at = null; state.background.kind = "none"; state.body.sit = false;
    const pic = () => document.getElementById("pic"), horse = () => pic().querySelector("#figure .horse");
    out.none = !!horse();
    set("body", "horse", "lead");
    // (each way they face, standing: the horse's view, its rein, inside the frame, before the friend's first part)
    for (const f of ["front", "right", "left", "back"]) { state.body.facing = f; changed(); drawNow(); await w(60);
      const h = horse(), vb = pic().viewBox.baseVal, b = h && h.getBBox(), fig = pic().querySelector("#figure");
      const first = fig && fig.querySelector("[data-part]"), before = h && first ? !!(h.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
      const ring = h && h.querySelector("circle[stroke='#e8b923']");
      out.views[f] = { horse: h && h.getAttribute("data-horse"), rein: !!pic().querySelector("#figure .rein"), before,
                       inside: !!b && b.x >= vb.x - 1 && b.x + b.width <= vb.x + vb.width + 1 && b.y >= vb.y - 1 && b.y + b.height <= vb.y + vb.height + 1,
                       mirrored: (h && h.querySelector("g[transform*='scale(-']")) ? true : false, box: b && [b.x, b.y, b.width, b.height].map(Math.round), vb: [vb.x, vb.y, vb.width, vb.height].map(Math.round) }; }
    // (walking and running, facing right and toward us: the legs at four points in the stride all differ)
    const lfo0 = lfoNow;
    try { for (const [g, f] of [["walk", "right"], ["run", "right"], ["walk", "front"], ["run", "back"]]) { state.body.facing = f; state.body.anim = g; const seen = [];
      for (const u of [0, 0.125, 0.25, 0.375]) { lfoNow = n => n === "B" ? { ...lfo0(n), phase: u } : lfo0(n); changed(); drawNow(); const h = horse(); seen.push(h ? h.getAttribute("data-horse") + "|" + h.innerHTML.length + "|" + h.innerHTML.slice(-3000) : null); }
      out.legs[g + " " + f] = { gait: seen.map(x => x && x.split("|")[0]), distinct: new Set(seen).size }; } }
    finally { lfoNow = lfo0; state.body.anim = "none"; }
    // (ridden: each way, the rider lifted, the horse's near parts over them facing us or away, its reins, the frame)
    set("body", "horse", "ride"); out.ride = {};
    for (const f of ["front", "right", "left", "back"]) { state.body.facing = f; state.body.anim = "none"; changed(); drawNow(); await w(60);
      const fig = pic().querySelector("#figure"), rider = fig.querySelector(":scope > .rider"), over = fig.querySelector(":scope > .horse-over"), vb = pic().viewBox.baseVal;
      const lift = rider ? +(rider.getAttribute("transform").match(/translate\\(0 (-?[\\d.]+)\\)/) || [0, 0])[1] : 0, b = fig.getBBox();
      out.ride[f] = { rider: !!rider, lift: Math.round(lift), over: !!over && !!rider && !!(rider.compareDocumentPosition(over) & Node.DOCUMENT_POSITION_FOLLOWING), reins: fig.querySelectorAll(".rein").length,
                      inside: b.y >= vb.y - 1 && b.y + b.height <= vb.y + vb.height + 1 && b.x >= vb.x - 1 && b.x + b.width <= vb.x + vb.width + 1 }; }
    try { state.body.facing = "right"; const seen = new Set(), gaits = new Set();
      for (const g of ["walk", "run"]) for (const u of [0, 0.2, 0.4]) { state.body.anim = g; lfoNow = n => n === "B" ? { ...lfo0(n), phase: u } : lfo0(n); changed(); drawNow();
        const r = pic().querySelector("#figure > .rider"); seen.add(r ? r.innerHTML : null); gaits.add(horse() && horse().getAttribute("data-horse")); }
      out.rideStill = seen.size; out.rideGaits = [...gaits]; }
    finally { lfoNow = lfo0; state.body.anim = "none"; }
    set("body", "horse", "lead"); state.body.facing = "front"; changed(); drawNow();
    // (no horse lying down or sitting)
    state.body.facing = "front"; state.body.pose = "lie"; changed(); drawNow(); out.off.lie = !!horse();
    state.body.pose = "stand"; state.body.sit = true; changed(); drawNow(); out.off.sit = !!horse();
    state.body.sit = false; changed(); drawNow(); out.off.stand = !!horse();
    // (its rows: in 🧍 Body's 🐴 the horse box (ticket 492), all with a horse, only the choice without)
    tab = TABS.findIndex(t => t[0] === "🧍 Body"); showTab(); await w(200);
    const shows = e => { for (let x = e; x && x.id !== "panel"; x = x.parentElement) if (x.hidden || getComputedStyle(x).display === "none") return false; return true; };
    const rows = () => { const b = [...document.querySelectorAll("#panel section.box")].find(x => x.querySelector(":scope > .box-name").textContent.trim() === "🐴 the horse");
      return b ? [...b.children].filter(c => !c.classList.contains("box-name") && shows(c)).length : -1; };
    out.rowsWith = rows(); set("body", "horse", "none"); changed(); showTab(); await w(200); out.rowsWithout = rows();
    // (the stable's faces nod, blink and munch; the friend's horse's is still)
    const H = { coat: "#7b4a2a", mane: "#1f1f22", mark: "blaze" };
    out.stableAnim = /<animate/.test(horseFace(H, 1, "#c0392b", false)); out.stillAnim = /<animate/.test(horseFace(H, 1, "#7a3a1a", true));
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r.views)}`);
  ok("no horse by default", !r.none, r.none);
  ok("facing us: the horse faces us; away: from behind; right: from the side; left: from the side, mirrored",
     r.views.front.horse === "front stand" && r.views.back.horse === "back stand" && r.views.right.horse === "side stand" && !r.views.right.mirrored
     && r.views.left.horse === "side stand" && r.views.left.mirrored, r.views);
  ok("each way: its rein, the horse before the friend, inside the picture's frame", Object.values(r.views).every(v => v.rein && v.before && v.inside), r.views);
  ok("walking and running, each way: the horse walks or runs with them, its legs moving (4 different drawings in a stride)",
     Object.entries(r.legs).every(([k, v]) => v.gait.every(gt => gt && gt.endsWith(k.split(" ")[0])) && v.distinct === 4), r.legs);
  ok("ridden, each way: the friend lifted onto it", Object.values(r.ride).every(v => v.rider && v.lift < -100), r.ride);
  ok("ridden facing us or away, the horse's near parts over the friend's legs; in profile none", r.ride.front.over && r.ride.back.over && !r.ride.right.over && !r.ride.left.over, r.ride);
  ok("ridden: two reins facing us, one in profile, none from behind; all inside the frame", r.ride.front.reins === 2 && r.ride.right.reins === 1 && r.ride.left.reins === 1 && r.ride.back.reins === 0 && Object.values(r.ride).every(v => v.inside), r.ride);
  ok("ridden, walking and running: the horse walks and runs, the friend's own drawing stays as it is", r.rideStill === 1 && r.rideGaits.includes("side walk") && r.rideGaits.includes("side run"), [r.rideStill, r.rideGaits]);
  ok("no horse lying down or sitting; back when standing", !r.off.lie && !r.off.sit && r.off.stand, r.off);
  ok("🐴 the horse box: seven rows with a horse (its size too, ticket 457), only the choice without", r.rowsWith === 7 && r.rowsWithout === 1, [r.rowsWith, r.rowsWithout]);
  ok("the stable's horses' faces stay animated; the friend's horse's face is still", r.stableAnim && !r.stillAnim, [r.stableAnim, r.stillAnim]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
