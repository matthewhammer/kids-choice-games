// (ticket 215, Matthew: "when the player clicks a picture, or another
// passageway, we should plan a path ... avoiding obstacles in the room, and
// walking (or swimming) around them") In the places as they are: for each,
// its solids (seats and the things that can't be walked through) and its
// passages (doors, signs, doorways), and a start on the floor from which the
// straight line to a passage's foot crosses a solid. The friend walks to it
// (walkInto) with the path planned and, first, without (planPath straight: the
// feet in a solid show the check can see it); every frame's feet recorded.
// With the path: never inside a solid, and through. Exits 1 on a failure.
//   node paths215.mjs <devtools port> <url>
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
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
  const settle = async () => { changed(); await w(450); measureMarks(); await w(50); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; window.__plan = planPath; return 1; })()`);
  // the cases: a place, a passage, and a start whose straight line to it crosses a solid
  const cases = JSON.parse(await ev(`(async () => { ${H} const out = [];
    for (const [kind] of PLACES) {
      if (kind === "none" || out.length >= 6) continue;
      state.world = clone(DEFAULTS.world); state.world.at = null;
      Object.assign(B, { kind, inside: 1, figX: 0, figY: 0 }); state.body.anim = "none"; climb = null; await settle();
      const S = solidsHere(); if (!S.length) continue;
      const F = sceneFrame, ps = marks.pics.filter(p => ["door", "sign", "south", "doorway"].includes(p.kind) && p.spot);
      let found = null;
      for (const p of ps) { for (let i = 1; i < 8 && !found; i++) for (let j = 1; j < 5 && !found; j++) {
        const x = F.left + (F.right - F.left) * i / 8, z = g + figYMin(F) + (F.bottom - g - figYMin(F)) * j / 5;
        if (solidAt(x, z) || p.spot[1] < g + figYMin(F)) continue;
        const crosses = S.some(o => segBox(x, z, p.spot[0], p.spot[1], o.x0 - SOLID_MARGIN, o.back, o.x1 + SOLID_MARGIN, o.front) && !(p.spot[0] > o.x0 - SOLID_MARGIN && p.spot[0] < o.x1 + SOLID_MARGIN && p.spot[1] > o.back && p.spot[1] < o.front));
        if (crosses) found = { kind, inside: B.inside ?? null, idx: marks.pics.indexOf(p), what: p.kind + ":" + (p.el.dataset.to || ""), x: Math.round(x), y: Math.round(z - g) };
      } if (found) break; }
      if (found) out.push(found);
    }
    return JSON.stringify(out); })()`));
  ok("places with a passage behind a solid, from some start", cases.length > 0, cases);
  const walkOne = (c, planned) => ev(`(async () => { ${H}
    window.planPath = ${planned ? "window.__plan" : "(x0, y0, x1, y1) => [[x1, y1]]"};
    state.world = clone(DEFAULTS.world); state.world.at = null;
    Object.assign(B, { kind: "${c.kind}", inside: ${c.inside ?? 1}, figX: ${c.x}, figY: ${c.y} }); state.body.anim = "none"; climb = null; await settle();
    const p = marks.pics[${c.idx}]; if (!p) return JSON.stringify({ none: true });
    const F = sceneFrame, ask = planPath(${c.x}, ${c.y}, p.spot[0], p.spot[1] - g).map(q => q.map(Math.round));
    const boxes = solidsHere().map(o => o.name + " x " + Math.round(o.x0) + ".." + Math.round(o.x1) + " z " + Math.round(o.back - g) + ".." + Math.round(o.front - g));
    const from = B.kind, inSolid = [], t0 = performance.now(); let frames = 0;
    // (every frame's feet, while the walk lasts: a solid they started or end in does not count)
    // (0.0.156: judged as the game judges, by the friend's own boxes, the soles and the torso's, at each solid's heights,
    // with 2 units' grace for a swinging foot; a solid they touch where they start or where the walk ends does not count)
    const S = solidsHere(), touches = (o, x, z, e = 0) => youBoxes(x, z).some(s => s[3] > o.back + e && s[2] < o.front - e && (!o.oval || ovalMeets(o, s[0] + e, s[1] - e, s[2] + e, s[3] - e)) && solidBands(o).some(b => s[1] > b.x0 + e && s[0] < b.x1 - e && s[5] > b.lo && s[4] < b.hi));   // (ticket 337: an oval one met as an oval)
    const startIn = new Set(S.filter(o => touches(o, ${c.x}, g + ${c.y})));
    let watching = true, endIn = null;
    // (not the step through the doorway at the end, once the planned path is walked: at a house's door, up its front step)
    const look = () => { if (!watching) return; frames++; const x = B.figX ?? 0, z = g + (B.figY ?? 0);
      if (!endIn && walkPath && walkPath.pts.length) { const q = walkPath.pts[walkPath.pts.length - 1]; endIn = new Set(S.filter(o => touches(o, q[0], g + q[1]))); }
      if (walkPath && walkPath.leg >= walkPath.pts.length - 1) { requestAnimationFrame(look); return; }
      for (const o of S) if (!startIn.has(o) && !(endIn && endIn.has(o)) && touches(o, x, z, 2)) inSolid.push(o.name + "@" + Math.round(x) + "," + Math.round(z - g));
      requestAnimationFrame(look); };
    requestAnimationFrame(look);
    enterScene(p.el);
    for (let t = 0; t < 9000 && B.kind === from && (entering || t < 300); t += 100) await w(100);
    watching = false; await w(50);
    const r = { through: B.kind !== from || !entering, frames, inSolid: [...new Set(inSolid)].slice(0, 6), plan: (walkPath && walkPath.pts || []).map(q => q.map(Math.round)),
      ask, boxes, frame: [F.left, F.right, Math.round(figYMin(F)), Math.round(F.bottom - g)].map(Math.round), spot: p.spot.map(Math.round) };
    window.planPath = window.__plan; return JSON.stringify(r); })()`);
  let seen = 0;
  for (const c of cases) {
    const straight = JSON.parse(await walkOne(c, false)), round = JSON.parse(await walkOne(c, true));
    if (straight.inSolid.length) seen++;
    if (round.inSolid.length) console.log(`  (why) ${c.kind}: planPath said ${JSON.stringify(round.ask)}; solids ${round.boxes.join("; ")}; frame ${round.frame}; the passage's foot ${round.spot}`);
    console.log(`  ${c.kind}, to ${c.what} from ${c.x},${c.y}: straight through ${straight.inSolid.length ? straight.inSolid.join(" ") : "nothing"}; planned ${JSON.stringify(round.plan)}, ${round.frames} frames, in a solid ${round.inSolid.length ? round.inSolid.join(" ") : "never"}`);
    ok(`${c.kind}: the walk to ${c.what} goes round, never inside a solid`, !round.none && round.inSolid.length === 0, round);
    ok(`${c.kind}: and on through it`, round.through, round);
  }
  ok("walked straight, the feet go through a solid at least once (the check sees it)", seen > 0, { seen, of: cases.length });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
