// (ticket 503, for M; Matthew: "field/pasture for animals (like horses) to graze.") The 🌾 pasture: a place in the woods'
// group (the outdoor places), picked from the menu with the friend landing clear of everything; its fence and gate, its
// big tree, its water trough, its three horses grazing (each its tail moving, each standing in the way by a footprint a
// body's width deep, its depth within it), its rows of grass and flowers, its butterflies; the friend walks behind a horse
// (drawn before it) and in front of it (drawn after it); its settings (how many horses, how many patches of flowers) do
// what they say; a horse led in by the friend is as big as the grazing ones at the same depth, and leaves the pasture as it
// was; no doorway in it (its gate is shut: the world's ways are the nav arrows). Exits 1 on a failure.
//   node pasture503.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; slowFlag = false; PERF.slowMoving = true;
    const objs = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj), el = name => bgShown.node.querySelector('[data-obj="' + name + '"]');
    const place = { inPlaces: PLACES.some(p => p[0] === "pasture"), groups: PLACE_GROUPS.filter(g => g[2].includes("pasture")).map(g => g[0]), phrase: PLACE_PHRASE.pasture,
      lfo: SCENE_LFO_THINGS.pasture || null, scene: typeof SCENES.pasture === "function", back: !!SCENE_BACK.pasture, north: NORTH_OUT.includes("pasture") };
    // picked from the menu, as a player picks it
    Object.assign(B, { kind: "none", things: [], seat: null }); state.body.sit = false; changed(); await w(100);
    set("background", "kind", "pasture"); await w(800);
    const arrive = { at: [Math.round(B.figX), Math.round(B.figY)], inSolid: (solidAt(B.figX, SCENE.ground + B.figY) || {}).name || null };
    const names = objs(), horses = names.filter(o => o.startsWith("grazing horse"));
    const drawn = { names, anims: bgShown.node.querySelectorAll("animate, animateTransform").length, portals: bgShown.node.querySelectorAll(".portal").length,
      tails: horses.map(h => el(h).querySelectorAll("animateTransform").length) };
    // their boxes: each horse, the trough, the tree; each horse's shallow, its depth within it
    const sol = solidsHere(), box = name => { const bs = sol.filter(s => s.name === name); return bs.length ? { x0: Math.min(...bs.map(b => b.x0)), x1: Math.max(...bs.map(b => b.x1)),
      back: Math.min(...bs.map(b => b.back)), front: Math.max(...bs.map(b => b.front)) } : null; };
    const zOf = name => { const o = bgShown.objs.find(o => o.name === name); return o ? o.z : null; };
    const boxes = Object.fromEntries([...horses, "water trough", "big tree"].map(h => [h, { box: box(h), z: zOf(h) }]));
    // behind the grey horse, then in front of it: where the friend is drawn
    const G = boxes["grazing horse, grey"].box, mid = G ? (G.x0 + G.x1) / 2 : 0, fig = () => document.getElementById("figure");
    const after = name => !!(fig().compareDocumentPosition(el(name)) & Node.DOCUMENT_POSITION_FOLLOWING);
    const spot = G ? { x: mid, z: G.back - 8 } : null;
    const behind = spot ? { free: !solidAt(spot.x, spot.z), inFront: spot.z > SCENE_BACK.pasture() } : null;
    if (spot) { Object.assign(B, { figX: mid, figY: spot.z - SCENE.ground }); changed(); await w(400); behind.drawnBefore = after("grazing horse, grey"); }
    if (G) { Object.assign(B, { figX: mid, figY: G.front + 12 - SCENE.ground }); changed(); await w(400); }
    const front = { drawnAfter: G ? !after("grazing horse, grey") : false };
    // a horse led in, at the grey horse's depth: as big as it (each one's horse units on the screen), and the pasture as it was
    const greyZ = zOf("grazing horse, grey");
    Object.assign(B, { figX: 0, figY: greyZ - SCENE.ground }); set("body", "horse", "lead"); state.body.facing = "front"; changed(); drawNow(); await w(500);
    const scaleOf = g => { const m = g && g.getScreenCTM(); return m ? Math.hypot(m.a, m.b) : 0; };
    const led = { mine: scaleOf(document.querySelector("#pic .horse > g[transform]")), grey: scaleOf(el("grazing horse, grey").querySelector(":scope > g")), names: objs() };
    set("body", "horse", "none"); changed(); await w(200);
    // the settings: how many horses, how many patches of flowers
    const counts = {};
    for (const h of [0, 2, 3]) { B.pastureHorses = h; changed(); await w(300); counts["horses" + h] = objs().filter(o => o.startsWith("grazing horse")).length; }
    const paths = () => [...bgShown.node.querySelectorAll('[data-obj^="grass and flowers"] path')].length;
    B.pastureFlowers = 0; changed(); await w(300); counts.flowers0 = paths(); B.pastureFlowers = 24; changed(); await w(300); counts.flowers24 = paths();
    B.pastureFlowers = 10; B.pastureHorses = 3; changed(); await w(200);
    return JSON.stringify({ place, arrive, drawn, boxes, behind, front, led, counts }); })()`));
  const { place: P, arrive: A, drawn: D, boxes: X, behind: Bh, front: F, led: L, counts: C } = r;
  ok("the pasture is a place: in the list, in the woods' group once, with its words, its LFO things, its scene, its back line and its 🔭",
     P.inPlaces && P.groups.length === 1 && P.groups[0] === "woods" && /pasture/.test(P.phrase || "") && P.lfo && P.lfo.fast && P.lfo.slow && P.scene && P.back && P.north, P);
  ok("picked from the menu, the friend lands clear of everything", !A.inSolid, A);
  ok("drawn: the fence and gate, the big tree, the water trough, three horses grazing, rows of grass and flowers, butterflies",
     ["fence and gate", "big tree", "water trough", "grazing horse, bay", "grazing horse, grey", "grazing horse, chestnut", "butterflies"].every(o => D.names.includes(o)) &&
     D.names.filter(o => o.startsWith("grass and flowers")).length >= 4, D.names);
  ok("things moving: each horse's tail swishing, and the rest (clouds, grass, trough, butterflies)", D.tails.length === 3 && D.tails.every(t => t >= 1) && D.anims >= 15, D);
  ok("no doorway in it: the gate is shut (the world's ways are the nav arrows)", D.portals === 0, D.portals);
  for (const [name, { box: b, z }] of Object.entries(X)) {
    const horse = name.startsWith("grazing horse");
    ok(`${name}: in the way, its depth within its box${horse ? ", a body's width deep" : ""}`, !!b && z != null && z <= b.front + 3 && z >= b.back - 3 && (!horse || b.front - b.back < 30), { b, z });
  }
  ok("the friend can stand behind the grey horse (clear, in front of the back line), drawn behind it", Bh && Bh.free && Bh.inFront && Bh.drawnBefore, Bh);
  ok("in front of the grey horse, the friend is drawn in front of it", F.drawnAfter, F);
  ok("a horse led in by the friend is as big as the grazing ones at the same depth (within 4%)", L.mine > 0 && L.grey > 0 && Math.abs(L.mine / L.grey - 1) < 0.04, L);
  ok("with the friend's own horse, the pasture is as it was", D.names.join("|") === L.names.join("|"), { before: D.names, after: L.names });
  ok("🐴 horses grazing: none, two, three", C.horses0 === 0 && C.horses2 === 2 && C.horses3 === 3, C);
  ok("🌼 patches of wildflowers: more of them, more drawn", C.flowers24 > C.flowers0 + 24, C);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
