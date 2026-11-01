// (ticket 660, M's garden; Matthew: "a new background: garden area", "a spring background (like pond, but contained so that
// land is on all sides of the screen)") The 🌻 garden and the 💧 spring, the garden's first release. Each is a place: in the
// list, in its group once (the garden home's, the spring water's), with its words, its LFO things, its scene, its back line,
// its 🔭, in the scripts' list of places in the same order as PLACES. Picked from the menu, the friend lands clear of
// everything. The garden draws its fence and arbor, its flower border, the shed and its rain barrel, the apple tree, the
// bench, the wheelbarrow, its beds of soil (as many as 🟫 says) and its stepping stones, and has bees in it; each thing that
// stands in the way is clear of every way into a square (WORLD_IN, ARRIVE) and 24 or more in front of the back line, or
// stretched to it. The spring draws its woods, the stones at its edge, its reeds, its frogs (as many as 🐸 says), the mossy
// rock and the log; its water is the pool's: wet in the middle, dry at every way in, dry round the pool; a friend wading in
// it is drawn behind the near stones; its bubbles (🫧) come and go with the setting. Exits 1 on a failure.
//   node garden660.mjs <devtools port> <url>
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
    const placeOf = kind => ({ inPlaces: PLACES.some(p => p[0] === kind), groups: PLACE_GROUPS.filter(g => g[2].includes(kind)).map(g => g[0]), phrase: PLACE_PHRASE[kind],
      lfo: SCENE_LFO_THINGS[kind] || null, scene: typeof SCENES[kind] === "function", back: !!SCENE_BACK[kind], north: NORTH_OUT.includes(kind), tune: SCENE_TUNE[kind] || null });
    const scripts = JSON.stringify(SCRIPT_PLACES_KNOWN) === JSON.stringify(PLACES.map(p => p[0]));
    const ways = [...Object.values(WORLD_IN), [0, 0]];
    const visit = async kind => {
      Object.assign(B, { kind: "none", things: [], seat: null }); state.body.sit = false; changed(); await w(100);
      set("background", "kind", kind); await w(800);
      const arrive = { at: [Math.round(B.figX), Math.round(B.figY)], inSolid: (solidAt(B.figX, SCENE.ground + B.figY) || {}).name || null };
      const back = SCENE_BACK[kind](), sol = solidsHere();
      const solids = sol.map(s => ({ name: s.name, x0: Math.round(s.x0), x1: Math.round(s.x1), back: Math.round(s.back - SCENE.ground), front: Math.round(s.front - SCENE.ground),
        toBack: Math.round(s.back - back) }));
      const blocked = ways.filter(([x, y]) => solidAt(x, SCENE.ground + y)).map(([x, y]) => [x, y, solidAt(x, SCENE.ground + y).name]);
      return { arrive, names: objs(), solids, blocked, things: (B.things || []).map(t => t.kind) };
    };
    const garden = await visit("garden");
    const beds = {};
    for (const v of [0, 2, 6]) { B.gardenBeds = v; changed(); await w(300); beds["beds" + v] = objs().filter(o => o.startsWith("soil bed")).length; }
    B.gardenBeds = 4; changed(); await w(200);
    const spring = await visit("spring");
    const wet = (x, y) => inWater(B, x, SCENE.ground + y), P = springPool(stageC());
    const water = { middle: wet(0, P.cy - SCENE.ground), ways: ways.filter(([x, y]) => wet(x, y)),
      round: [[P.rx * 1.15, P.cy - SCENE.ground], [-P.rx * 1.15, P.cy - SCENE.ground], [0, P.cy - SCENE.ground + P.ry * 1.3], [0, P.cy - SCENE.ground - P.ry * 1.3]].filter(([x, y]) => wet(x, y)) };
    Object.assign(B, { figX: -40, figY: Math.round(P.cy - SCENE.ground) }); changed(); await w(500);
    const fig = document.getElementById("figure"), near = el("stones at the spring's edge, front");
    const wading = { wet: wet(B.figX, B.figY), behindNear: !!(near && fig.compareDocumentPosition(near) & Node.DOCUMENT_POSITION_FOLLOWING) };
    const counts = {}, bubbles = () => bgShown.node.querySelectorAll("circle > animate[attributeName=r]").length;
    for (const v of [0, 1, 3]) { B.springFrogs = v; changed(); await w(300); counts["frogs" + v] = objs().filter(o => o.startsWith("frog")).length; }
    B.springBubbles = 0; changed(); await w(300); counts.bubbles0 = bubbles(); B.springBubbles = 10; changed(); await w(300); counts.bubbles10 = bubbles();
    Object.assign(B, { springFrogs: 2, springBubbles: 5, figX: 0, figY: 0 }); changed(); await w(200);
    return JSON.stringify({ places: { garden: placeOf("garden"), spring: placeOf("spring") }, scripts, garden, beds, spring, water, wading, counts }); })()`));
  const { places, scripts, garden: G, beds, spring: S, water, wading, counts } = r;
  for (const [kind, group] of [["garden", "home"], ["spring", "water"]]) { const p = places[kind];
    ok(`the ${kind} is a place: in the list, in the ${group} group once, with its words, its LFO things, its tune, its scene, its back line and its 🔭`,
       p.inPlaces && p.groups.length === 1 && p.groups[0] === group && new RegExp(kind).test(p.phrase || "") && p.lfo && p.lfo.fast && p.lfo.slow && p.tune && p.scene && p.back && p.north, p); }
  ok("the scripts' list of places is PLACES, in the same order", scripts, scripts);
  for (const [kind, V] of [["garden", G], ["spring", S]]) {
    ok(`picked from the menu, the friend lands clear of everything in the ${kind}`, !V.arrive.inSolid, V.arrive);
    ok(`no way into a square in the ${kind} is inside something in the way`, !V.blocked.length, V.blocked);
    ok(`each thing in the way in the ${kind} is 24 or more in front of its back line, or stretched to it`, V.solids.every(s => s.toBack >= 24 || s.toBack <= 0), V.solids);
  }
  ok("the garden: its fence and arbor, flower border, shed, rain barrel, apple tree, bench, wheelbarrow, stepping stones, four beds of soil, butterflies",
     ["picket fence and arbor", "flower border", "garden shed", "water barrel", "apple tree", "bench", "wheelbarrow", "stepping stones", "butterflies"].every(o => G.names.includes(o)) &&
     G.names.filter(o => o.startsWith("soil bed")).length === 4, G.names);
  ok("the garden's shed, rain barrel, apple tree, bench and wheelbarrow stand in the way",
     ["garden shed", "water barrel", "apple tree", "bench", "wheelbarrow"].every(nm => G.solids.some(s => s.name === nm)), G.solids.map(s => s.name));
  ok("the garden has bees in it, where the flowers are", G.things.filter(t => t === "bee").length === 2, G.things);
  ok("🟫 beds of soil: none, two, six", beds.beds0 === 0 && beds.beds2 === 2 && beds.beds6 === 6, beds);
  ok("the spring: its woods, the stones at its edge (left, front, right), its reeds, two frogs, the mossy rock, the log, butterflies",
     ["woods behind the spring", "stones at the spring's edge, left", "stones at the spring's edge, front", "stones at the spring's edge, right", "reeds, left", "reeds, right",
      "frog 1", "frog 2", "rock, mossy", "log", "butterflies"].every(o => S.names.includes(o)), S.names);
  ok("the spring's water is its pool: wet in the middle, dry at every way in and all round the pool", water.middle && !water.ways.length && !water.round.length, water);
  ok("a friend wading in the spring is in its water, drawn behind the stones at its near edge", wading.wet && wading.behindNear, wading);
  ok("🐸 frogs: none, one, three", counts.frogs0 === 0 && counts.frogs1 === 1 && counts.frogs3 === 3, counts);
  ok("🫧 how much it bubbles: none at 0, ten at 10", counts.bubbles0 === 0 && counts.bubbles10 === 10, counts);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
