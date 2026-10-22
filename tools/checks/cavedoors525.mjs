// (ticket 525, Matthew: "Also need a way to place cave doors --- as objects with nav arrows associated with them."; then "world
// design panel I mean.") A 🕳️ cave passage is a cave door: put in the cave room behind the falls (its + button in 🗺️ World
// design's things, the 🦇 cave group) it has a name (uid) and its opening is a way (data-way "p-<uid>"); its card's 🧭, a
// square tapped on the small grid, links it there and puts a twin there leading back (twin uids crossed); its nav arrow names
// that square and is near when the friend stands at its foot; the arrow tapped takes them there, in front of the twin, the
// back chip shown; the twin's arrow leads back to the cave room; ✖ on one takes both; a door linked into another world is
// unlinked when that world is taken away (no orphan, no warning); the three kinds drawn as before but for the portal's
// two new attributes; and an unlinked passage still leads to its 🧭 place, with an arrow. Exits 1 on a failure.
//   node cavedoors525.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 500)}`); if (!cond) bad++; };
const center = async sel => JSON.parse(await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return "null"; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()`));
// (both ends measured after both are scrolled to, and the press checked to be
// on what it means: measured apart, the second's scroll moved the first, and
// the drag picked up the square under the palette chip's old spot)
const ends = async (fromSel, toSel) => JSON.parse(await ev(`(() => {
  const f = document.querySelector(${JSON.stringify(fromSel)}), t = ${toSel ? `document.querySelector(${JSON.stringify(toSel)})` : "null"};
  if (!f || (${JSON.stringify(!!toSel)} && !t)) return JSON.stringify({ missing: true });
  if (t) t.scrollIntoView({ block: "nearest" }); f.scrollIntoView({ block: "nearest" });
  const c = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, a = c(f), b = t ? c(t) : null;
  const on = (p, e) => { const u = document.elementFromPoint(p[0], p[1]); return !!u && (u === e || e.contains(u)); };
  return JSON.stringify({ from: a, to: b, onFrom: on(a, f), onTo: t ? on(b, t) : true });
})()`));
const dragSel = async (what, fromSel, toSel) => {
  const e = await ends(fromSel, toSel);
  if (e.missing || !e.onFrom || !e.onTo) { ok(what + ": both ends on screen", false, e); return false; }
  await mouseDrag(e.from, e.to); return true;
};
const mouseDrag = async (from, to) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from[0], y: from[1] });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: from[0], y: from[1], button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 12; i++) { const x = from[0] + (to[0] - from[0]) * i / 12, y = from[1] + (to[1] - from[1]) * i / 12; await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 }); await sleep(25); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to[0], y: to[1], button: "left", buttons: 0, clickCount: 1 });
  await sleep(400);
};
const click = async sel => { const c = await center(sel); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c[0], y: c[1], button: "left", buttons: 1, clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c[0], y: c[1], button: "left", buttons: 0, clickCount: 1 }); await sleep(400); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1400, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const settle = `await new Promise(r => setTimeout(r, 600))`;
  // the cave room behind the falls, through its waterfall square; 🗺️ World design, the 🦇 cave things
  const wf = await ev(`(async () => { state.music.mute = true; const W = state.world; W.at = null; const k = worldKeys(W).find(k => W.cells[k].kind === "waterfall"); worldEnter(k); ${settle};
    worldVisit({ kind: "caveroom", from: k }); state.background.things = []; changed(); thingGroup = "cave"; tab = TABS.findIndex(t => t[1] === "world"); showTab(); ${settle}; return k; })()`);
  await click(`#panel button[data-kind="passage"]`); await sleep(600);
  // (a)
  const a = JSON.parse(await ev(`JSON.stringify((() => { const t = (state.background.things || []).find(t => t.kind === "passage"), p = t && bgShown.node.querySelector('.portal[data-passage="' + t.uid + '"]');
    return { kind: state.background.kind, uid: t && t.uid, way: p && p.dataset.way }; })())`));
  ok("(a) a passage put in the cave room has a uid, its portal data-way p-<uid>", a.kind === "caveroom" && /^p[0-9a-z]+$/.test(a.uid || "") && a.way === "p-" + a.uid, a);
  // (b) its card's small grid: a square tapped
  const K = await ev(`(() => { const W = state.world; return worldKeys(W).find(k => W.cells[k].kind === "castle") || worldKeys(W).find(k => W.cells[k].kind !== "waterfall"); })()`);
  await click(`#panel .thingcard [data-door-to="${K}"]`); await sleep(600);
  const b = JSON.parse(await ev(`JSON.stringify((() => { const W = state.world, t = state.background.things.find(t => t.kind === "passage"), tw = (W.cells[${JSON.stringify(K)}].things || []).find(x => x.uid === t.twin);
    return { dest: t.dest, twin: t.twin, tw: tw && { twin: tw.twin, dest: tw.dest }, uid: t.uid, probs: worldProblems(W).map(p => p.text).filter(x => /cave passage/.test(x)) }; })())`));
  ok("(b) linked to the square: a twin there, uids crossed, its dest back to the cave room", b.dest && b.dest.key === K && b.tw && b.tw.twin === b.uid && b.tw.dest && b.tw.dest.kind === "caveroom" && b.tw.dest.from === wf && !b.probs.length, b);
  // (c) its arrow names K, near at its foot
  const c = JSON.parse(await ev(`(async () => { const W = state.world, B = state.background, t = B.things.find(t => t.kind === "passage"); B.figX = t.x; B.figY = Math.round(t.z - SCENE.ground + 20); changed(); ${settle};
    const e = worldWaysAt.find(e => e[0] === "p-" + t.uid), el = document.querySelector('#ways .way-arrow[data-way="p-' + t.uid + '"]');
    return JSON.stringify({ e: e && [e[0], e[5]], name: worldName(W, ${JSON.stringify(K)}), near: el && el.classList.contains("near"), n: wayNearness("p-" + t.uid) }); })()`));
  ok("(c) its nav arrow names the square, and is near at its foot", c.e && c.e[1] === c.name && c.near && c.n < 1, c);
  // (d) the arrow tapped: there, in front of the twin, the back chip shown
  await ev(`(() => { document.querySelector('#ways .way-arrow[data-way^="p-"]').click(); return 1; })()`); await sleep(5000);
  const d = JSON.parse(await ev(`JSON.stringify((() => { const W = state.world, B = state.background, tw = (B.things || []).find(x => x.kind === "passage" && x.dest && x.dest.kind === "caveroom");
    return { at: W.at, kind: B.kind, cell: W.cells[${JSON.stringify(K)}].kind, dx: tw ? Math.abs(B.figX - tw.x) : null, back: !document.getElementById("back").hidden }; })())`));
  ok("(d) through it: in the square, at the twin, ⬅️ back shown", d.at === K && d.kind === d.cell && d.dx !== null && d.dx < 60 && d.back, d);
  // (e) the twin's arrow leads back to the cave room
  const e = JSON.parse(await ev(`(async () => { const B = state.background, tw = B.things.find(x => x.kind === "passage" && x.dest && x.dest.kind === "caveroom"); B.figX = tw.x; B.figY = Math.round(tw.z - SCENE.ground + 20); changed(); ${settle};
    const en = worldWaysAt.find(e => e[0] === "p-" + tw.uid); document.querySelector('#ways .way-arrow[data-way="p-' + tw.uid + '"]').click(); await new Promise(r => setTimeout(r, 5000));
    return JSON.stringify({ label: en && en[5], kind: state.background.kind, at: state.world.at }); })()`));
  ok("(e) the twin's arrow leads back to the cave room, through its waterfall square", e.kind === "caveroom" && e.at === wf, e);
  // (f) ✖ on its card takes both
  await click(`#panel .thingcard .tdel`); await sleep(600);
  const f = JSON.parse(await ev(`JSON.stringify({ here: (state.background.things || []).filter(t => t.kind === "passage").length, there: (state.world.cells[${JSON.stringify(K)}].things || []).filter(t => t.kind === "passage").length })`));
  ok("(f) ✖ takes both away", f.here === 0 && f.there === 0, f);
  // (g) linked into another world, then that world taken away: unlinked, no warning
  const g = JSON.parse(await ev(`(async () => { const W = state.world, wid = W.id, B = state.background;
    B.things.push({ kind: "passage", x: 60, z: SCENE.ground + 40, seed: 5, size: 100, style: "wallhole", uid: "pcheckg" }); changed(); ${settle};
    const nid = worldNew("small"); ${settle}; worldSwitch(wid, ${JSON.stringify(wf)}); ${settle}; worldVisit({ kind: "caveroom", from: ${JSON.stringify(wf)} }); ${settle};
    const t = state.background.things.find(t => t.uid === "pcheckg"), T2 = worldById(nid), k2 = worldKeys(T2)[0], linked = passageLink(t, { world: nid, key: k2, kind: T2.cells[k2].kind }); ${settle};
    const twinThere = (T2.cells[k2].things || []).some(x => x.twin === "pcheckg");
    worldSwitch(nid); ${settle}; worldDrop(); ${settle}; worldSwitch(wid, ${JSON.stringify(wf)}); ${settle}; worldVisit({ kind: "caveroom", from: ${JSON.stringify(wf)} }); ${settle};
    const t2 = state.background.things.find(t => t.uid === "pcheckg");
    return JSON.stringify({ linked, twinThere, left: t2 && !!t2.dest, probs: worldProblems(state.world).map(p => p.text).filter(x => /cave passage/.test(x)) }); })()`));
  ok("(g) a door into a world taken away is unlinked, no orphan warning", g.linked && g.twinThere && g.left === false && !g.probs.length, g);
  // (h) the three kinds drawn as before, but the portal's new attributes
  const h = JSON.parse(await ev(`JSON.stringify(["arch", "wallhole", "floorhole"].map(st => { const t = { kind: "passage", style: st, to: "cave", uid: "pq" }, a = passageThingSvg(t, 42), b = passageThingSvg({ ...t, uid: undefined }, 42);
    return a.replace(' data-way="p-pq" data-passage="pq"', "") === b && a.includes('data-way="p-pq"'); }))`));
  ok("(h) the three kinds' drawings unchanged but for data-way and data-passage", h.every(Boolean), h);
  // (i) unlinked: to its 🧭 place, with an arrow
  const i = JSON.parse(await ev(`(async () => { const B = state.background, t = B.things.find(t => t.uid === "pcheckg"); t.to = "cave"; B.figX = t.x; B.figY = Math.round(t.z - SCENE.ground + 20); changed(); ${settle};
    const arrow = !!document.querySelector('#ways .way-arrow[data-way="p-pcheckg"]'); bgShown.node.querySelector('.portal[data-passage="pcheckg"]') && enterScene(bgShown.node.querySelector('.portal[data-passage="pcheckg"]'));
    await new Promise(r => setTimeout(r, 5000)); return JSON.stringify({ arrow, kind: state.background.kind }); })()`));
  ok("(i) an unlinked passage has its arrow and still leads to its 🧭 place", i.arrow && i.kind === "cave", i);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
