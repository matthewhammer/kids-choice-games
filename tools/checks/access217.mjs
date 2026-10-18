// (ticket 217, Matthew) The ♿ Accessibility tab: every nav arrow shown, the
// far ones dimmer and in their own colour; the arrows' size (and shown
// together, still never overlapping, at twice the size); the words in the
// game bigger; the planned path drawn while the friend walks to a passage,
// and gone when they arrive; and Surprise me leaves it alone. Exits 1 on a
// failure.
//   node access217.mjs <devtools port> <url>
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
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, A = state.access, g = SCENE.ground;
  const frames = k => new Promise(r => { const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  const clearing = async () => { state.world = clone(WORLD_DEFAULT_0183); worldEnter("3,3", null, false); B.figX = 0; B.figY = 0; changed(); await frames(4); };
  const arrows = () => [...document.querySelectorAll("#ways .way-arrow")];
  const rect = el => { const r = [el.querySelector(".way-tri"), el.querySelector(".way-words")].filter(e => getComputedStyle(e).display !== "none").map(e => e.getBoundingClientRect());   // (words dropped, ticket 227: not there)
    if (r.length === 1) r.push(r[0]); return [Math.min(r[0].left, r[1].left), Math.min(r[0].top, r[1].top), Math.max(r[0].right, r[1].right), Math.max(r[0].bottom, r[1].bottom)]; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; return 1; })()`);
  // (the friend put back after: Surprise me's dice once left a friend no tap could send through a passage, and the
  // autosave carried it into the next check)
  const tab = JSON.parse(await ev(`(async () => { const t = TABS.find(t => t[1] === "access"), keep = clone(state); const before = JSON.stringify(state.access);
    for (let i = 0; i < 5; i++) document.getElementById("surprise").click(); await new Promise(r => setTimeout(r, 300));
    const same = JSON.stringify(state.access) === before; state = clone(keep); changed(); await new Promise(r => setTimeout(r, 300));
    // (ticket 230) each overlay a row, its toggle and its own settings beside it, while on, boxed; the words' size in a box of its own
    const rows = t ? t[2].filter(c => c[0] === "accbox") : [], keys = rows.flatMap(c => [c[1], ...c[3].map(i => i[1])]).filter(Boolean);
    const boxes = [...document.querySelectorAll("#panel .accbox")];
    return JSON.stringify({ has: !!t, rows: rows.map(c => c[1]), covered: Object.keys(DEFAULTS.access).every(k => keys.includes(k)), same, brick: rows.some(c => c[2].startsWith("🧱")) }); })()`));
  ok("a ♿ Accessibility tab: a row for each overlay (arrows, path, boxes, the boxes' a 🧱 brick wall, since ticket 258 🧩 what it's made of), then the words' size, every setting in one of them",
     tab.has && JSON.stringify(tab.rows) === JSON.stringify(["allArrows", "showPath", "showSolids", "showMadeOf", null]) && tab.covered && tab.brick, tab);
  const shown = JSON.parse(await ev(`(async () => { const keep = clone(state.access); const i = TABS.findIndex(t => t[1] === "access"); document.querySelectorAll("#tabs button")[i].click(); await new Promise(r => setTimeout(r, 300));
    const rowOf = k => [...document.querySelectorAll("#panel .accbox")].find(b => b.querySelector("button.flip") && b.querySelector("button.flip").textContent.includes(k));
    Object.assign(state.access, { allArrows: false, showSolids: true }); changed(); await new Promise(r => setTimeout(r, 200));
    const off = rowOf("all arrows"), on = rowOf("collision boxes");
    const r = { offHidden: !!off && off.querySelector(".accmore").hidden && !off.classList.contains("on"), onShown: !!on && !on.querySelector(".accmore").hidden && on.classList.contains("on"),
      onItems: on ? on.querySelectorAll(".accitem").length : 0, oneLine: on ? Math.round(on.getBoundingClientRect().height) : 0 };
    state.access = keep; changed(); return JSON.stringify(r); })()`));
  ok("a row off: just its chip, no box; on: its colour and sizes beside it, boxed", shown.offHidden && shown.onShown && shown.onItems === 4, shown);
  console.log(`  (the boxes' row, on, at 1600 wide: ${shown.oneLine}px tall; one line is about 50)`);
  ok("Surprise me leaves it alone", tab.same, tab);
  // every arrow shown: off, none far shows; on, all, the far ones dim and coloured
  const all = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access); await clearing();
    const vis = () => arrows().map(el => +getComputedStyle(el).opacity);
    const off = vis(); A.allArrows = true; A.arrowDim = 40; A.arrowColor = "#f472b6"; changed(); await frames(4); await w(400);
    const far = arrows().filter(el => !el.classList.contains("near") && !el.classList.contains("aimed"));
    const r = { n: arrows().length, offShown: off.filter(o => o > 0.05).length, onAlways: arrows().filter(el => el.classList.contains("always")).length,
      farOpacity: far.map(el => +getComputedStyle(el).opacity), farColor: far.map(el => getComputedStyle(el.querySelector(".way-tri"), "::before").backgroundColor) };
    return JSON.stringify(r); })()`));
  ok("off: the far arrows hidden, as before", all.n > 2 && all.offShown === 0, all);
  ok("on: every arrow shown", all.onAlways === all.n, all);
  ok("the far ones at the brightness set (40%)", all.farOpacity.length > 0 && all.farOpacity.every(o => Math.abs(o - 0.4) < 0.06), all);
  ok("in the colour set", all.farColor.length > 0 && all.farColor.every(c => c === "rgb(244, 114, 182)"), all);
  // twice the size, every way open, three windows: shown together, never overlapping
  for (const [W, Ht] of [[1600, 1000], [2400, 1000], [1180, 820]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: Ht, deviceScaleFactor: 1, mobile: false }); await sleep(600);
    const big = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { allArrows: true, arrowSize: 200 });
      state.world = clone(WORLD_DEFAULT_0183); const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      for (const c of Object.values(state.world.cells)) { if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d)); }
      const over = [], scales = new Set();
      for (const key of ["3,3", "1,1", "2,3"]) { worldEnter(key, null, false); B.figX = 0; B.figY = 0; changed(); await frames(4);
        const s = arrows().map(el => ({ d: el.dataset.way, r: rect(el) })); arrows().forEach(el => scales.add(getComputedStyle(el).scale));
        for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) { const a = s[i].r, b = s[j].r;
          if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1) over.push(key + ": " + s[i].d + " over " + s[j].d); } }
      return JSON.stringify({ over, scales: [...scales] }); })()`));
    ok(`${W}x${Ht}: arrows at twice the size, every one shown, none over another`, big.over.length === 0 && big.scales.includes("2"), big);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(600);
  // the words: a sign in the clearing, bigger
  const font = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access); await clearing();
    const t = bgShown.node.querySelector("text"); if (!t) return JSON.stringify({ none: true }); const h0 = t.getBoundingClientRect().height;
    A.gameFont = 200; changed(); await frames(4); const t2 = bgShown.node.querySelector("text"); const h1 = t2.getBoundingClientRect().height;
    const r = { h0, h1, cls: document.body.classList.contains("game-font") }; A.gameFont = 100; changed(); await frames(3); return JSON.stringify(r); })()`));
  ok("the words in the game at twice the size: a sign's words grow", !font.none && font.cls && font.h1 > 1.6 * font.h0, font);
  // the planned path: shown while walking to a passage, gone after
  const path = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { showPath: true });
    state.world = clone(WORLD_DEFAULT_0183); state.world.at = null; Object.assign(B, { kind: "livingroom", figX: -300, figY: 60 }); changed(); await w(450); measureMarks();
    // (one that is walked to: the way south, else the farthest passage; a picture within reach is flown into, no walk)
    const far = q => Math.abs((q.x0 + q.x1) / 2 - B.figX), p = marks.pics.find(q => q.kind === "nav" && q.el.dataset.way === "S") || [...marks.pics].sort((a, b) => far(b) - far(a))[0]; if (!p) return JSON.stringify({ none: true });
    const from = B.kind; enterScene(p.el); let seen = 0, lines = 0;
    for (let t = 0; t < 4000 && entering; t += 50) { await w(50); const ov = document.querySelector("#access-layer svg.walk-path"); if (ov) { seen++; lines = Math.max(lines, ov.querySelectorAll("polyline").length); } }
    await w(300); const after = !!document.querySelector("#access-layer svg.walk-path"); A.showPath = false; changed();
    return JSON.stringify({ seen, lines, after, kind: B.kind, from }); })()`));
  ok("the planned path is drawn while the friend walks to a passage", !path.none && path.seen > 0 && path.lines > 0, path);
  ok("and gone once they are there", !path.after, path);
  // the collision boxes: one drawn for each solid, gone when hidden
  const sol = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { showSolids: true });
    state.world = clone(WORLD_DEFAULT_0183); state.world.at = null; Object.assign(B, { kind: "livingroom", figX: 0, figY: 40 }); changed(); await w(500); changed(); await frames(3);
    const ov = document.querySelector("#access-layer svg.solid-boxes"), n = solidsHere().length, drawn = ov ? ov.querySelectorAll("[data-solid] polygon:not(.face)").length : 0, names = ov ? [...ov.querySelectorAll(":scope > text")].map(t => t.textContent) : [];
    A.showSolids = false; changed(); await frames(3); const gone = !document.querySelector("#access-layer svg.solid-boxes");
    return JSON.stringify({ n, drawn, names, gone }); })()`));
  ok("🟥 the collision boxes: one drawn for each solid in the living room, named", sol.n > 0 && sol.drawn === sol.n && sol.names.length === sol.n, sol);
  ok("and gone when hidden", sol.gone, sol);
  // (ticket 229) the friend's own box, and a collision: it and the box met glowing
  const hit = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { showSolids: true });
    state.world = clone(WORLD_DEFAULT_0183); state.world.at = null; Object.assign(B, { kind: "livingroom", figX: 0, figY: 90 }); changed(); await w(500); changed(); await frames(3);
    const S = solidsHere(), couch = S.find(o => /couch/.test(o.name)) || S[0]; if (!couch) return JSON.stringify({ none: true });
    // (facing us, whatever a step before left: facing a side, one foot stands behind the other and their soles overlap)
    state.body.facing = "front"; state.body.anim = "none";
    const x = (couch.x0 + couch.x1) / 2, y = couch.front - SCENE.ground + 4; B.figX = x; B.figY = y; changed(); await frames(2);
    const [mx, my] = solidMove(x, y, x, y - 30); changed(); await frames(3);
    const ov = document.querySelector("#access-layer svg.solid-boxes"), you = ov ? [...ov.querySelectorAll(".you polygon")] : [];
    // (Matthew: a box under each foot, the size of its sole; and the torso's, between them, as wide as their gap, from the crotch up through the head)
    const soles = feetSoles(0, 0), T = torsoBox(0, soles), gap = soles.length === 2 ? Math.max(soles[0][0], soles[1][0]) - Math.min(soles[0][1], soles[1][1]) : 0;
    const face = you[3] && you[3].getAttribute("points") ? you[3].getAttribute("points").split(" ").map(p => +p.split(",")[1]) : [];
    const pole = T ? [(T[0] + T[1]) / 2 - 1, (T[0] + T[1]) / 2 + 1] : null;
    const r = { youPts: you.slice(0, 2).every(p => p.getAttribute("points")), soles: soles.map(s => s.map(Math.round)), torso: T && T.map(Math.round), gap: Math.round(gap),
      torsoFits: !T || Math.abs((T[1] - T[0]) - Math.max(gap, 4 * figureT.k)) < 0.5, poleMissesSoles: !pole || !soles.some(s => s[1] > pole[0] && s[0] < pole[1]), poleMeetsTorso: !pole || (T[1] > pole[0] && T[0] < pole[1]),
      faceTall: !T || (face.length === 4 && Math.max(...face) - Math.min(...face) > 40),
      stopped: my > y - 30, youHit: !!(ov && ov.querySelector(".you.hit")), boxHit: !!(ov && ov.querySelector('[data-solid].hit')), name: solidHit.name };
    A.showSolids = false; changed(); return JSON.stringify(r); })()`));
  ok("🟥 the friend's own boxes drawn: one under each foot", !hit.none && hit.youPts && hit.soles.length === 2, hit);
  ok("and the torso's, between the feet, as wide as their gap, standing from the crotch up through the head", !hit.none && hit.torsoFits && hit.faceTall, hit);
  ok("a pole between the feet misses both soles, and meets the torso's box", !hit.none && hit.poleMissesSoles && hit.poleMeetsTorso, hit);
  ok("walked into the couch: stopped, and both boxes glow", !hit.none && hit.stopped && hit.youHit && hit.boxHit, hit);
  // (0.0.139, Matthew's bug: the boxes shifted the arrows onto each other's places, and vanished with a new square's arrows)
  const keep = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { allArrows: true, arrowSize: 150, gameFont: 150 }); await clearing(); await w(300);
    const where = () => arrows().map(el => el.dataset.way + "@" + el.style.left + "," + el.style.top).join(" ");
    const before = where(); A.showSolids = true; changed(); await frames(4); await w(200); const after = where();
    worldEnter("2,3", null, false); changed(); await frames(5); const still = !!document.querySelector("#access-layer svg.solid-boxes");
    const firstIsArrow = arrows().length === document.getElementById("ways").children.length;
    Object.assign(A, DEFAULTS.access); changed(); await frames(3);
    return JSON.stringify({ same: before === after, before, after, still, firstIsArrow }); })()`));
  ok("with the collision boxes shown, every arrow stays where it was", keep.same && keep.firstIsArrow, keep);
  ok("and the boxes stay shown in the next square, till they are hidden", keep.still, keep);
  // (0.0.145, Matthew's bug: into full screen, the arrows kept the smaller picture's places, all in its top left)
  const fs = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { allArrows: true }); await clearing(); await w(300);
    const E = () => { const e = arrows().find(el => el.dataset.way === "E"), lw = document.getElementById("ways").getBoundingClientRect().width; return e ? +(parseFloat(e.style.left) / lw).toFixed(3) : null; };
    const before = E(); setBig(true, true); await w(700); const after = E(); setBig(false, true); await w(500); const back = E();
    Object.assign(A, DEFAULTS.access); changed(); return JSON.stringify({ before, after, back }); })()`));
  ok("into full screen and out, the E arrow stays at the picture's right edge (placed again for its new size)", fs.before > 0.85 && fs.after > 0.85 && fs.back > 0.85, fs);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
