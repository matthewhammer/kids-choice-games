// (ticket 516, Matthew: "New background --- round tree house interior, inspired by hut."; "Can we show a round treehouse room
// with a tree trunk in the center, and lots of limbs reaching into the roof?") The round room at the top of the tree, a place
// of its own (treetop): its ways' markup with 1, 2, 4 and 6 houses (one hatch down to the house below, topHouse, on that
// house's side; that house's ladder up to it; two windows out; the shell outside a doorway in); up the ladder and down the
// hatch, both ways, arriving beside the hatch and at the ladder's foot, never in a solid; the lever on its post shutting the
// trap door and opening it again, and the ceiling below following it; the round wall stopping the friend; a lane behind the
// trunk and a walk round it; one house, mirrored; inside against outside (the same limbs in the same order, the braid's five
// strands, the hatch and the ladder on one side, no windows outside); its settings shown only there. Exits 1 on a failure.
//   node top516.mjs <devtools port> <url>
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
// (ticket 407: masks and filters counted outside the friend, who stands among the scene's objects by depth)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, c = stageC();
  const settle = async (ms = 450) => { changed(); await w(ms); measureMarks(); };
  const go = async set => { Object.assign(B, { things: [], seat: null }, set); await settle(); };
  const climbTo = async (L, done) => { climbLadder(L); const t0 = performance.now(); while (performance.now() - t0 < 15000) { await w(60); if (done() && !entering) break; } await settle(); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // every way's markup, with 1, 2, 4 and 6 houses
  const marks = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; climb = null; const out = {};
    for (const houses of [1, 2, 4, 6]) {
      await go({ kind: "treetop", houses, ladders: 3, bridges: 2, hatchShutTop: false });
      const N = bgShown.node, hatch = N.querySelector('.portal[data-to="treeroom"]'), top = topHouse(B);
      const r = { top, sd: topSide(B), hatchHouse: hatch && +hatch.dataset.house, hatchX: hatch && hatch.querySelector("[data-hole]") && +hatch.querySelector("[data-hole]").dataset.hole.split(" ")[0],
        hole: !!(hatch && hatch.querySelector("[data-hole]")), down: !!(hatch && hatch.querySelector("[data-ladder][data-down]")), lid: !!N.querySelector('.pit-lid[data-pit-i="hatch"]'),
        lever: !!N.querySelector('[data-obj="hatch lever"] [data-lever="H"] .lever-arm'), windows: N.querySelectorAll('.portal[data-to="treehouse"]').length,
        trunk: !!N.querySelector('[data-obj="tree trunk"] [data-trunk]'), footprint: !!N.querySelector('[data-obj="tree trunk"] [data-footprint]'), ring: !!N.querySelector('[data-here="top"]'),
        masks: [...N.querySelectorAll("mask, filter")].filter(m => !figShown.some(f => f.contains(m))).length, objs: bgShown.objs.map(o => o.name) };
      await go({ kind: "treeroom", inside: top });
      const up = bgShown.node.querySelector('.portal[data-to="treetop"]');
      r.upHere = !!(up && up.querySelector("[data-ladder][data-up]"));
      r.upElse = [1, 2, 3, 4, 5, 6].filter(i => i <= houses && i !== top).filter(i => { B.inside = i; changed(); return !!bgShown.node.querySelector('.portal[data-to="treetop"]'); });
      await go({ kind: "treehouse", treeSize: 50 });
      r.outside = !!bgShown.node.querySelector('.portal[data-to="treetop"]');
      out[houses] = r; }
    return JSON.stringify(out); })()`));
  for (const [h, r] of Object.entries(marks)) {
    ok(`${h} houses: one hatch down to house ${r.top}, its hole, ladder, lid and lever`, r.hatchHouse === r.top && r.hole && r.down && r.lid && r.lever, r);
    ok(`${h} houses: on the house below's side (${r.sd > 0 ? "right" : "left"}), two windows, the trunk marked with its footprint, the sign's ring`, Math.sign(r.hatchX) === r.sd && r.windows === 2 && r.trunk && r.footprint && r.ring && !r.masks, r);
    ok(`${h} houses: house ${r.top}'s ladder up into it, and no other room's; outside, its shell a doorway in`, r.upHere && !r.upElse.length && r.outside, r);
  }
  ok("one house: the hatch on the left, the arrival on the right", marks[1].sd === -1 && marks[1].hatchX < 0, marks[1]);
  // up the ladder, down the hatch: both ways, arriving beside each, never in a solid
  const trip = JSON.parse(await ev(`(async () => { ${H} await go({ kind: "treeroom", houses: 4, ladders: 3, bridges: 2, inside: 4, figX: 0, figY: 0, hatchShutTop: false });
    const L0 = bgShown.node.querySelector('.portal[data-to="treetop"] [data-ladder][data-up]'); B.figX = 0; B.figY = 0; await settle();
    await climbTo(L0, () => B.kind === "treetop");
    const { sd, hx, hy } = topHatchAt(c, B), up = { kind: B.kind, at: [B.figX, B.figY], want: [Math.round(hx - sd * 110 * c.k), Math.round(30 * c.k)], inSolid: !!solidAt(B.figX, SCENE.ground + B.figY) };
    const L1 = bgShown.node.querySelector('.portal[data-to="treeroom"] [data-ladder][data-down]');
    await climbTo(L1, () => B.kind === "treeroom");
    const down = { kind: B.kind, inside: B.inside, at: [B.figX, B.figY], inSolid: !!solidAt(B.figX, SCENE.ground + B.figY) };
    B.kind = "treetop"; [B.figX, B.figY] = ARRIVE.treetop; arriveSettle = true; await settle();
    const arrive = { at: ARRIVE.treetop, inSolid: !!solidAt(ARRIVE.treetop[0], SCENE.ground + ARRIVE.treetop[1]) };
    return JSON.stringify({ up, down, arrive, inside: INSIDES.treehouse }); })()`));
  ok("up house 4's ladder into the round room, a step from the hatch, toward the middle, in no solid", trip.up.kind === "treetop" && Math.abs(trip.up.at[0] - trip.up.want[0]) < 40 && !trip.up.inSolid, trip.up);
  ok("down its hatch into house 4, at the ladder up's foot, in no solid", trip.down.kind === "treeroom" && trip.down.inside === 4 && trip.down.at[0] !== 0 && !trip.down.inSolid, trip.down);
  ok("arriving by the place menu: clear of every solid; an inside of the tree house", !trip.arrive.inSolid && trip.inside.includes("treetop"), trip);
  // the lever on its post: shut and open, the ceiling below following it
  const lev = JSON.parse(await ev(`(async () => { ${H} await go({ kind: "treetop", houses: 4, hatchShutTop: false, figX: -150, figY: 50 });
    const look = () => { const N = bgShown.node, arm = N.querySelector('[data-lever="H"] .lever-arm'); return { shut: !!B.hatchShutTop, up: arm ? /rotate\\(\\d/.test(arm.getAttribute("transform")) : null,
      hole: !!N.querySelector("[data-hole]"), way: !!N.querySelector('.portal[data-to="treeroom"]'), solid: solidsHere().some(o => o.name === "trapdoor") }; };
    const below = async () => { const was = B.kind; B.kind = "treeroom"; B.inside = 4; await settle(300); const r = !!bgShown.node.querySelector('[data-ladder][data-up]'); B.kind = was; await settle(300); return r; };
    const open0 = look(); roomLeverPull("H"); await w(1600); const shut = look(), belowShut = await below();
    roomLeverPull("H"); await w(1600); const open1 = look(), belowOpen = await below();
    return JSON.stringify({ open0, shut, open1, belowShut, belowOpen }); })()`));
  ok("the lever: open to start (handle up, the hole a solid, a way down)", lev.open0.up && lev.open0.hole && lev.open0.way && lev.open0.solid && !lev.open0.shut, lev.open0);
  ok("pulled: shut (handle down, no hole, no way down); house 4's ladder up no way up", lev.shut.shut && !lev.shut.up && !lev.shut.hole && !lev.shut.way && lev.belowShut === false, lev);
  ok("pulled again: open, and the way up again", !lev.open1.shut && lev.open1.up && lev.open1.way && lev.belowOpen === true, lev);
  // the round wall, the lane behind the trunk, and a walk round it
  const walls = JSON.parse(await ev(`(async () => { ${H} await go({ kind: "treetop", houses: 4, figX: -150, figY: 50 });
    const G = topGeom(c), Wl = castleWalls(B), back = SCENE.ground + figYMin(sceneFrame), trunk = solidsHere().find(o => o.name === "tree trunk");
    const wallAt = [[0.95 * G.R, G.Yf + 20 * c.k], [-0.6 * G.R, G.Yf + 6 * c.k], [0, G.Yf + 20 * c.k]].map(([x, z]) => !!(solidAt(x, z, true) || {}).wall);
    const L = planPath(-160, back - SCENE.ground + 6, 160, back - SCENE.ground + 6, 10), pts = [[-160, back + 6], ...L.map(([x, y]) => [x, SCENE.ground + y])];
    let through = false; for (let i = 1; i < pts.length; i++) for (let s = 0; s <= 20; s++) { const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s / 20, z = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s / 20;
      if (trunk && x > trunk.x0 && x < trunk.x1 && z > trunk.back && z < trunk.front) through = true; }
    return JSON.stringify({ wallAt, half: [Wl.half(G.Yf + G.Df), Wl.half(G.Yf + 5)].map(Math.round), back: Math.round(back), wallFoot: Math.round(G.Yf),
      trunk: trunk && { x0: Math.round(trunk.x0), x1: Math.round(trunk.x1), back: Math.round(trunk.back), front: Math.round(trunk.front), lane: trunk.lane != null }, lane: trunk && Math.round(trunk.back - back), path: L.length, short: !!L.short, through }); })()`));
  ok("the round wall: out past it near the back, it stops the friend; the middle is clear", walls.wallAt[0] && walls.wallAt[1] && !walls.wallAt[2] && walls.half[0] > walls.half[1], walls);
  ok("the back line at the wall's foot at the back (SCENE_BACK, as the flat rooms')", Math.abs(walls.back - walls.wallFoot - 3) <= 1, walls);
  ok(`a lane behind the trunk (${walls.lane} ≥ LANE_MIN 24), its box its footprint's`, walls.trunk && walls.lane >= 24 && !walls.trunk.lane && walls.trunk.x1 - walls.trunk.x0 < 200, walls);
  ok("a walk from one side behind it to the other goes round it, not through", walls.path > 0 && !walls.short && !walls.through, walls);
  // inside against outside: the same limbs, the braid's five strands, the hatch and the ladder on one side, no windows outside
  const same = JSON.parse(await ev(`(async () => { ${H} await go({ kind: "treetop", houses: 4 });
    const inL = topLimbsIn({ ...c, R: crownR, o: B }).map(L => [L.j, L.sd]), outL = crownLimbs(crownR).slice(0, TOP.limbs).map(L => [L.j, L.sd]);
    const strandsIn = bgShown.node.querySelectorAll('[data-obj="tree trunk"] [data-trunk] polygon').length, hatchSd = topHatchAt(c, B).sd;
    await go({ kind: "treehouse", treeSize: 50 });
    const shell = bgShown.node.querySelector('.portal[data-to="treetop"]'), strandsOut = bgShown.node.querySelector('[data-obj="tree house"] [data-trunk]').querySelectorAll("polygon").length;
    return JSON.stringify({ inL, outL, strandsIn, strandsOut, hatchSd, ladderSd: Math.sign(topLadderAt(B).lx), windowsOut: shell ? shell.querySelectorAll("circle, rect").length : -1 }); })()`));
  ok("the same crown limbs inside as outside, in the same order and sides", JSON.stringify(same.inL) === JSON.stringify(same.outL) && same.inL.length === 8, same);
  ok("the braid's five strands (and its core) inside and out; the hatch inside on the ladder's side outside; no windows on the shell", same.strandsIn === 6 && same.strandsOut === 6 && same.hatchSd === same.ladderSd && same.windowsOut === 0, same);
  // its settings, shown only there
  const shown = JSON.parse(await ev(`(async () => { ${H} const S = k => !!SHOWN_WHEN["background." + k](B), keys = ["hatchShapeTop", "hatchShutTop", "treetopBack", "windowSize", "leverShine"];
    await go({ kind: "treetop", houses: 4 }); const here = keys.map(S), toys = SHOWN_WHEN["background.toys"] ? S("toys") : false;
    B.treetopBack = "lake"; const ways = insideWays(B).map(q => q.to); B.treetopBack = "none";
    await go({ kind: "treeroom", inside: 4 }); const below = keys.map(S);
    await go({ kind: "treeroom", inside: 1 }); const other = keys.map(S);
    return JSON.stringify({ here, toys, ways, below, other, phrase: PLACE_PHRASE.treetop, place: PLACES.some(p => p[0] === "treetop"), group: groupOfPlace("treetop") }); })()`));
  ok("in the round room: its trap door's opening, shut, way toward us, window size and lever shine; no toys", shown.here.every(Boolean) && !shown.toys, shown);
  ok("its way toward us leads where it says", shown.ways.join() === "lake", shown);
  ok("in house 4 (below): only its opening (its ceiling's) of the three; elsewhere none", shown.below.join() === "true,false,false,true,false" && !shown.other[0] && !shown.other[1] && !shown.other[2], shown);
  ok("a place in 🏠 home, with its caption", shown.place && shown.group === "home" && !!shown.phrase, shown);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
