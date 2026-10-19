// (ticket 335, Matthew at the tree house: "layer bug: I'm on top of the owl tree house that should be 'in front' of me.
// Let's audit, as a long-run tonight, to prevent this going forward.") The friend's layering:
// - the tree house's houses, objects of their own: up on bridge 3-4 by house 4, the friend (and the houses, big) where
//   house 2's drawing and theirs meet, house 2 on top (a lower house covers what is above it); on the ground, the friend
//   in front of every house; the tree house hidden (👁️), its houses hidden with it;
// - every place, castle room and tree room: each object with a collision box of its own name has its depth (data-z, by
//   which the friend is sorted among the objects) within its boxes, and each seat at its drawing's depth, so a friend standing just in front of a thing is
//   never drawn behind it, nor one just behind it in front (the house's wagon's seat and box sat 25 units behind its
//   drawing till 0.0.299);
// - sitting in the house's wagon, the friend drawn in it, not behind it.
// Exits 1 on a failure.
//   node layers335.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; delete B.onBridge; delete B.onPlatform; state.body.anim = "none";
    Object.assign(B, { kind: "treehouse", houses: 4, bridges: 2, treeHouseSize: 200, figSize: 250, figX: -200, figY: 60, objectsOff: {} }); changed(); await w(600);
    const lab = e => e.closest("#figure") ? "fig" : (e.closest("[data-obj]") || { dataset: {} }).dataset.obj || e.tagName;
    const j = treeWalks(B).findIndex(W => W.a === 2 && W.b === 3); B.onBridge = { j, u: 1 }; changed(); await w(500);
    const f = document.getElementById("figure").getBoundingClientRect(), h = document.querySelector('[data-obj="tree house 2"]'), q = h ? h.getBoundingClientRect() : null;
    let houseOnTop = 0, figOnTop = 0;
    if (q) { const x0 = Math.max(f.left, q.left), x1 = Math.min(f.right, q.right), y0 = Math.max(f.top, q.top), y1 = Math.min(f.bottom, q.bottom);
      if (x1 > x0 && y1 > y0) for (let i = 1; i < 12; i++) for (let k = 1; k < 12; k++) { const all = document.elementsFromPoint(x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * k / 12).map(lab);
        const fi = all.indexOf("fig"), hi = all.indexOf("tree house 2"); if (fi >= 0 && hi >= 0) { if (hi < fi) houseOnTop++; else figOnTop++; } } }
    delete B.onBridge; Object.assign(B, { treeHouseSize: 100, figSize: 100, figX: -200, figY: 60 }); changed(); await w(400);
    const fig = document.getElementById("figure"), before = []; for (let m = fig; (m = m.nextElementSibling); ) if (m.dataset && /^tree house/.test(m.dataset.obj || "")) before.push(m.dataset.obj);
    B.objectsOff = { treehouse: ["tree house"] }; changed(); await w(300);
    const shown = bgShown.objs.filter(o => /^tree house/.test(o.name) && o.node.style.display !== "none").map(o => o.name); B.objectsOff = {}; changed(); await w(200);
    // (the audit: each object's depth within the union of its own boxes)
    const bad = [], seen = { places: 0, pairs: 0 }; B.figX = -2000;
    const audit = label => { seen.places++; const objs = new Map(bgShown.objs.map(o => [o.name, o])), by = new Map();
      for (const s of solidsHere()) { if (s.pit || s.ladder || !Number.isFinite(s.front)) continue; const u = by.get(s.name); by.set(s.name, u ? { back: Math.min(u.back, s.back), front: Math.max(u.front, s.front) } : { back: s.back, front: s.front }); }
      for (const [name, u] of by) { const o = objs.get(name); if (!o || !Number.isFinite(o.z)) continue; seen.pairs++;
        if (o.z > u.front + 3 || o.z < u.back - 3) bad.push(label + ": " + name + " at " + Math.round(o.z) + ", its boxes " + Math.round(u.back) + ".." + Math.round(u.front)); }
      // (and each seat, by which a friend sitting on it is sorted, at its drawing's depth)
      for (const t of seatsHere(B)) { const o = objs.get(t.name); if (o && Number.isFinite(o.z) && Math.abs(o.z - t.z) > 6) bad.push(label + ": the seat " + t.name + " at " + Math.round(t.z) + ", drawn at " + Math.round(o.z)); } };
    for (const kd of PLACES.map(p => p[0]).filter(k => k !== "none")) { B.kind = kd; changed(); await w(200); audit(kd); }
    B.kind = "castleroom"; changed(); await w(200); const K = castleOf(B);
    for (const rk of CASTLE_ROOM_CHOICES.map(x => Array.isArray(x) ? x[0] : x)) { B["castleRoom6" + K.id] = rk; B["castleRooms" + K.id] = 6; B.castleRoom = 6; changed(); await w(220); audit("castle room " + rk); }
    for (const n of [1, 2, 3, 4]) { B.kind = "treeroom"; B.inside = n; changed(); await w(200); audit("tree room " + n); }
    // (the wagon: its seat at its drawing's depth, and sat in, the friend drawn in it)
    B.kind = "house"; B.figX = 0; changed(); await w(400);
    const seat = seatsHere(B).find(t => t.name === "wagon"), wobj = bgShown.objs.find(o => o.name === "wagon");
    let inWagon = null; if (seat && wobj) { sitOn(seat); await w(400); let m = document.getElementById("figure"), after = false; while ((m = m.previousElementSibling)) if (m.dataset && m.dataset.obj === "wagon") after = true; inWagon = after && !!state.body.sit; standUp(); }
    return JSON.stringify({ houseOnTop, figOnTop, before, shown, seen, bad, wagon: seat && wobj ? { seat: Math.round(seat.z), drawn: Math.round(wobj.z) } : null, inWagon }); })()`));
  console.log(`  bridge 3-4: house 2 on top at ${r.houseOnTop} points, the friend at ${r.figOnTop}; ${r.seen.pairs} objects with boxes in ${r.seen.places} places`);
  ok("up on bridge 3-4 by house 4, where house 2 and the friend meet, house 2 on top (a lower house covers what is above it)", r.houseOnTop > 0 && r.figOnTop === 0, r);
  ok("on the ground, the friend in front of every house", r.before.length === 0, r.before);
  ok("the tree house hidden: its houses hidden with it", r.shown.length === 0, r.shown);
  ok("every object with a box of its own name: its depth within its boxes (the friend sorted as they stand)", r.seen.pairs > 100 && !r.bad.length, r.bad);
  ok("the house's wagon: its seat at its drawing's depth, and the friend sitting in it drawn in it", r.wagon && Math.abs(r.wagon.seat - r.wagon.drawn) <= 3 && r.inWagon, { wagon: r.wagon, inWagon: r.inWagon });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
