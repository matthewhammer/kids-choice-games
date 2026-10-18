// (ticket 233) The old link signs are gone from every place (the world's ways are the nav arrows now), and every way
// toward us, S, out of a room is a nav arrow, never a sign or a ▼: the living room's, a tree room's, a castle room's.
// Each leads where its room's setting says, or, set to lead nowhere, is not there at all: no doorway, no arrow. Its
// arrow shows when the friend is near the bottom; a tap on it, or walking off the bottom edge, goes there. In the castle
// designer, a room whose way out is toward us may lead nowhere; a room whose way out is an arch may not.
// (It replaces southway.mjs, the ▼'s check; that one's old-save case is here.) Exits 1 on a failure.
//   node southways233.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 600)}`); if (!cond) bad++; };
// (in the page: settle, the ways now, the feet at the back or at the bottom, and waiting for a trip to end)
const H = `const B = state.background, w = ms => new Promise(r => setTimeout(r, ms)), settle = async () => { changed(); await w(500); };
  const ways = () => ({ portals: [...document.querySelectorAll("#bg .portal.way-out")].map(e => ({ way: e.dataset.way, to: e.dataset.to || "", room: e.dataset.room || "",
      seen: [...e.querySelectorAll("path")].some(p => p.getAttribute("opacity") !== "0") })),
    arrows: [...document.querySelectorAll("#ways .way-arrow")].map(a => ({ way: a.dataset.way, near: a.classList.contains("near"), words: a.textContent })),
    south: document.querySelectorAll("#bg .south-way").length });
  const feet = async at => { B.figY = at === "bottom" ? sceneFrame.bottom - sceneFrame.ground - 2 : figYMin(sceneFrame); B.figX = 0; await settle(); };
  const until = async (f, ms = 8000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return Math.round(performance.now() - t0); await w(100); } return null; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(() => { state.music.mute = true; state.world = clone(WORLD_DEFAULT_0183); state.world.at = null; return 1; })()`);
  // the old link signs: gone from every place that had them; a place's own doorways (the clearing's far views, the
  // castle's gate, the camp's tent, the falls' cave) are not signs and stay
  const old = JSON.parse(await ev(`(async () => { ${H} const out = {};
    const OLD = ["🥾 path", "🧚 fairies", "🌲 clearing", "💦 falls", "🏕️ camp", "🌲 woods", "⛰️ trail"];
    for (const kind of ["clearing", "castle", "fairyforest", "mountains", "waterfall", "campsite", "woodpath"]) {
      Object.assign(B, { kind, things: [] }); state.world.at = null; await settle();
      const texts = [...document.querySelectorAll("#bg text")].map(t => t.textContent);
      out[kind] = { signs: texts.filter(t => OLD.some(o => t.includes(o))), to: [...document.querySelectorAll("#bg .portal[data-to]")].map(e => e.dataset.to) }; }
    return JSON.stringify(out); })()`));
  ok("no old link sign in any place that had one (🥾 path, 🧚 fairies, 🌲 clearing, the signposts' 💦 falls, 🏕️ camp, 🌲 woods, ⛰️ trail)", Object.values(old).every(p => !p.signs.length), old);
  ok("the clearing's doorways: its far views only, none to the path through the woods or the fairy forest", !old.clearing.to.includes("woodpath") && !old.clearing.to.includes("fairyforest") && old.clearing.to.includes("castle"), old.clearing);
  ok("no fixed link out of the castle, the fairy forest, the trail, the falls, the camp or the wood path (their own doorways inside stay)",
    !old.castle.to.includes("clearing") && !old.fairyforest.to.length && !old.mountains.to.length && !old.woodpath.to.length &&
    old.waterfall.to.every(t => t === "cave") && old.campsite.to.every(t => t === "tent") && old.castle.to.includes("castleroom"), old);
  // the living room's way toward us: a nav arrow, not a ▼
  const living = JSON.parse(await ev(`(async () => { ${H} const r = {};
    for (const v of ["forest", "none", DEFAULTS.background.livingOut]) { Object.assign(B, { kind: "livingroom", livingOut: v, things: [] }); await feet("back"); r[v] = ways(); }
    Object.assign(B, { kind: "livingroom", livingOut: "forest" }); await feet("bottom"); r.bottom = ways();
    document.querySelector('#ways .way-arrow[data-way="S"]').click(); r.took = await until(() => B.kind === "forest" && !entering);
    return JSON.stringify(r); })()`));
  const L = living.forest;
  ok("the living room's way toward us, to the forest: one invisible doorway S with its own data-to, no ▼", L.portals.length === 1 && L.portals[0].way === "S" && L.portals[0].to === "forest" && !L.portals[0].seen && L.south === 0, L);
  ok("its nav arrow, hidden while the friend is at the back, shown near the bottom, saying where", L.arrows.length === 1 && !L.arrows[0].near && living.bottom.arrows[0].near && /forest/.test(living.bottom.arrows[0].words), { back: L.arrows, bottom: living.bottom.arrows });
  ok("a tap on the arrow walks out to the forest", living.took !== null, living.took);
  ok("leading nowhere: no doorway, no arrow", !living.none.portals.length && !living.none.arrows.length, living.none);
  ok("at first, the living room's way toward us leads out to the house and yard", living.house && living.house.portals.length === 1 && living.house.portals[0].to === "house", living.house);
  // walking off the bottom edge takes it too (edgeGo, as the world's S)
  const edge = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "livingroom", livingOut: "beach" }); await feet("bottom");
    const went = edgeGo(["S"]); const took = await until(() => B.kind === "beach" && !entering); return JSON.stringify({ went, took }); })()`));
  ok("walking off the bottom edge goes out the way toward us", edge.went && edge.took !== null, edge);
  // a tree room's
  const tree = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "treeroom", houses: 6, inside: 2, treeBack2: "lake", things: [] }); await feet("bottom"); const a = ways();
    B.treeBack2 = "none"; await settle(); const b = ways(); return JSON.stringify({ a, b }); })()`));
  ok("a tree room's way toward us, to the lake: a nav arrow S; set to nowhere, none", tree.a.portals.length === 1 && tree.a.portals[0].to === "lake" && tree.a.arrows.length === 1 && tree.a.arrows[0].near && !tree.b.portals.length && !tree.b.arrows.length, tree);
  // the castle: N's (1 king's room, 2 greenhouse, 3 trap room, 4 and 5 dungeons)
  const castle = JSON.parse(await ev(`(async () => { ${H} const r = {}, room = async (n, set) => { Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: n, things: [], ...set }); await feet("bottom"); return ways(); };
    r.kingAuto = await room(1, { castleOut1N: "auto" }); r.kingNone = await room(1, { castleOut1N: "none" }); r.kingTo2 = await room(1, { castleOut1N: "2" });
    r.kingSign = [...document.querySelectorAll("#bg text")].map(t => t.textContent).filter(t => /⬇️/.test(t));
    r.greenNone = await room(2, { castleBack2N: "none" }); r.greenTo1 = await room(2, { castleBack2N: "1" });
    r.trapOut = await room(3, { castleBack3N: "out" }); r.dungeon = await room(4, {});
    // (a tap on the king's room's arrow goes to room 2)
    await room(1, { castleOut1N: "2" }); document.querySelector('#ways .way-arrow[data-way="S"]').click();
    r.took = await until(() => B.kind === "castleroom" && B.castleRoom === 2 && !entering);
    // (the designer's choices for a way out: nowhere for the king's room, whose way out is toward us; not for the trap room's arch)
    const opts = n => wayOutDests("N", n).filter(([, , ok]) => !ok || ok({ ...B, castle: "N" })).map(o => o[0]);
    r.kingOpts = opts(1); r.trapOpts = opts(3);
    // (a way out set to nowhere, then the room changed to an arch's: the usual way, not gone)
    B.castleOut1N = "none"; B.castleRoom1N = "greenhouse"; r.archNone = roomExits(castleOf({ ...B, castle: "N" }), 1)[0];
    B.castleOut1N = "auto"; B.castleRoom1N = "king"; await settle();
    return JSON.stringify(r); })()`));
  const one = (x, to, room = "") => x.portals.length === 1 && x.portals[0].way === "S" && x.portals[0].to === to && x.portals[0].room === room && x.arrows.length === 1 && x.arrows[0].near && x.south === 0;
  ok("the king's room's way out, toward us, the usual way (out of the castle from room 1): a nav arrow S, no ⬇️ sign", one(castle.kingAuto, "castle") && !castle.kingSign.length, { a: castle.kingAuto, sign: castle.kingSign });
  ok("set to nowhere: no doorway, no arrow", !castle.kingNone.portals.length && !castle.kingNone.arrows.length, castle.kingNone);
  ok("set to room 2: its arrow leads to room 2, and a tap goes there", one(castle.kingTo2, "castleroom", "2") && castle.took !== null, { a: castle.kingTo2, took: castle.took });
  ok("the greenhouse's way toward us: nowhere at first, nothing; set to room 1, an arrow there", !castle.greenNone.portals.length && one(castle.greenTo1, "castleroom", "1"), { none: castle.greenNone, to1: castle.greenTo1 });
  ok("the trap room's, set out of the castle: an arrow out", one(castle.trapOut, "castle"), castle.trapOut);
  ok("a dungeon has no way toward us", !castle.dungeon.portals.length && !castle.dungeon.arrows.length, castle.dungeon);
  ok("the designer: the king's room's way out may lead nowhere; the trap room's arch may not", castle.kingOpts.includes("none") && !castle.trapOpts.includes("none"), { king: castle.kingOpts, trap: castle.trapOpts });
  ok("a way out left at nowhere in a room changed to an arch's: the usual way", castle.archNone && castle.archNone.to !== null && !castle.archNone.nowhere, castle.archNone);
  // (from southway.mjs: an older save's living room)
  const up = JSON.parse(await ev(`(() => { const a = { livingOut: "house", livingBack: "none" }, b = { livingOut: "house", livingBack: "forest" };
    upgradeInside(a, { background: { livingBack: "none" } }); upgradeInside(b, { background: { livingBack: "forest" } });
    return JSON.stringify({ a: a.livingOut, b: b.livingOut, gone: !("livingBack" in a) && !("livingBack" in b) }); })()`));
  ok("an older save's 'nowhere' becomes the way out; one that named a place keeps it", up.a === "house" && up.b === "forest" && up.gone, up);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
