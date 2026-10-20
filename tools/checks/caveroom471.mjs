// (ticket 471, Matthew: "a background that represents being in a cave room, rounded, fractal structure on the ground
// (walkable) suface. Different cave rock formations (6 styles for floor, and 6 styles for ceiling)") The 🦇 cave room: a
// place in the camping group, inside the waterfall's square with the cave; in from the cave behind the falls by its
// archway and back by the room's own; each floor style drawn, its formations standing (and stopping the feet) or, the
// rimstone pools, lying flat; a boulder and a mushroom to sit on; no column hiding the archway; each ceiling style drawn;
// things moving; the friend arriving clear of everything. Exits 1 on a failure.
//   node caveroom471.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null;
    const objsNow = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj), portals = () => [...bgShown.node.querySelectorAll(".portal")].map(p => p.dataset.to);
    const place = { inPlaces: PLACES.some(p => p[0] === "caveroom"), group: PLACE_GROUPS.filter(g => g[2].includes("caveroom")).map(g => g[0]), inside: INSIDES.waterfall.includes("caveroom"),
      phrase: PLACE_PHRASE.caveroom, lfo: !!SCENE_LFO_THINGS.caveroom };
    Object.assign(B, { kind: "cave", figX: -150, figY: 25, seat: null, things: [] }); state.body.sit = false; changed(); await w(600);
    const ca = bgShown.node.querySelector('[data-obj="archway to the cave room"] path'), cr = ca && ca.getBoundingClientRect();
    const cave = { portals: portals(), arch: objsNow().includes("archway to the cave room"), covered: cr ? [...bgShown.node.querySelectorAll("[data-obj]")].filter(o => /stalagmite|chest|crystals/.test(o.dataset.obj))
      .filter(o => { const b = o.getBoundingClientRect(); return b.left < cr.right && b.right > cr.left && b.top < cr.bottom && b.bottom > cr.top; }).map(o => o.dataset.obj) : ["no archway"] };
    Object.assign(B, { kind: "caveroom", figX: ARRIVE.caveroom[0], figY: ARRIVE.caveroom[1], caveFloor: "stalagmites", caveCeiling: "stalactites" }); changed(); await w(600);
    const room = { portals: portals(), anims: bgShown.node.querySelectorAll("animate, animateTransform").length, arriveClear: !solidAt(ARRIVE.caveroom[0], SCENE.ground + ARRIVE.caveroom[1]) };
    const floors = {};
    for (const [sty] of CAVE_FLOORS) { B.caveFloor = sty; changed(); await w(400);
      const sol = solidsHere().map(o => o.name), arch = bgShown.node.querySelector('[data-obj="archway to the cave"] path');
      const ab = arch && arch.getBoundingClientRect(), hidden = ab ? [...bgShown.node.querySelectorAll('[data-obj^="column"]')].some(c => { const cb = c.getBoundingClientRect(); return cb.left < ab.right - 4 && cb.right > ab.left + 4; }) : true;
      floors[sty] = { objs: objsNow().filter(o => /stalagmite|boulder|column|crystal|mushroom|rimstone/.test(o)), solids: sol.length, seats: seatsHere(B).map(t => t.name), archHidden: hidden }; }
    B.caveFloor = "stalagmites";
    const roofs = {};
    for (const [sty, label] of CAVE_CEILINGS) { B.caveCeiling = sty; changed(); await w(300); roofs[sty] = objsNow().filter(o => o.startsWith("the ceiling's")); }
    B.caveCeiling = "stalactites"; changed(); await w(300);
    // back to the cave through the room's archway, and in again through the cave's
    enterScene(bgShown.node.querySelector('.portal[data-to="cave"]')); await w(5000);
    const out = B.kind;
    enterScene(bgShown.node.querySelector('.portal[data-to="caveroom"]')); await w(5000);
    return JSON.stringify({ place, cave, room, floors, roofs, trip: [out, B.kind] }); })()`));
  const { place: P, cave: C, room: Rm, floors: F, roofs: Rf, trip } = r;
  ok("the cave room is a place: in the list, in the camping group once, inside the waterfall's square, with its words and its LFO things", P.inPlaces && P.group.length === 1 && P.group[0] === "camping" && P.inside && /cave room/.test(P.phrase || "") && P.lfo, P);
  ok("the cave behind the falls has an archway to the cave room (and still its way out to the falls)", C.arch && C.portals.includes("caveroom") && C.portals.includes("waterfall"), C);
  ok("nothing in the cave stands in front of that archway (its stalagmites, its chest, its crystals)", !C.covered.length, C.covered);
  ok("the cave room has its way back to the cave, and things moving", Rm.portals.includes("cave") && Rm.anims >= 8, Rm);
  ok("the friend arrives clear of every formation", Rm.arriveClear, Rm);
  for (const [sty, f] of Object.entries(F)) {
    const flat = sty === "rimstone";
    ok(`floor "${sty}": drawn, ${flat ? "lying flat (no solids)" : "its formations standing in the way"}`, flat ? f.objs.includes("rimstone pools") && f.solids === 0 : f.objs.length >= 5 && f.solids >= 5, f);
    ok(`floor "${sty}": the archway back is not hidden by a column`, !f.archHidden, f);
  }
  ok("a boulder and a mushroom can be sat on", F.boulders.seats.some(s => s.startsWith("boulder")) && F.mushrooms.seats.some(s => s.startsWith("mushroom")), { b: F.boulders.seats, m: F.mushrooms.seats });
  ok("each ceiling style drawn, named for itself", Object.values(Rf).every(v => v.length === 1) && new Set(Object.values(Rf).map(v => v[0])).size === 6, Rf);
  ok("through the archways: out to the cave, and in again", trip[0] === "cave" && trip[1] === "caveroom", trip);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
