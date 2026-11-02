// (ticket 660, part 3 of 3, for M's garden; Matthew: "Watering can is in the tree house. ... We can fill up the watering can at the
// spring or the pond, or castle moat, etc --- and then water plants. Each plant has a watering level, and a way to get the watering
// level when we are on the same screen. Plants grow based on how much they are watered.") The 💧 watering can: a tool and a thing to
// carry, on the tree room's floor the first time it is shown, and the next time in a tree room seen before it was there (its own
// mark); picked up, in the 🎒 and in the hand at once. Empty, by a plant, it says so and pours nothing. By the garden's water barrel
// it fills (all its pours); by a sprout, it pours one 💧 into it, a pour out of the can, until the plant's meter is full (then it
// will not); a plant just put from the menu is sprouts. While the can is held each plant not all grown shows its meter over it, one
// a plant, none for one all grown, none with the can put away. A plant drinks its water, a 💧 every DRINK_MS, growing a stage with
// each, drawn again as it grows; all grown, it drinks no more and its meter goes. The can fills at a place's own water too (the
// spring, the duck pond, the tree house's stream, a castle's moat). Put down and picked up, its water stays in it. Exits 1 on a failure.
//   node can660.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, W = state.world;
    state.music.mute = true; state.world.at = null; slowFlag = false; PERF.slowMoving = true;
    const said = () => { const b = document.getElementById("script-say"); return b && !b.hidden ? b.textContent : ""; }, hush = () => { const b = document.getElementById("script-say"); if (b) b.hidden = true; };
    const go = async (kind, x = 0, y = 0, f = "right") => { Object.assign(B, { kind: "none", things: [], seat: null }); changed(); await w(100); set("background", "kind", kind); await w(700);
      Object.assign(B, { figX: x, figY: y }); state.body.facing = f; changed(); draw(); await w(300); };
    const pic = parse => !new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + parse + '</svg>', "image/svg+xml").querySelector("parsererror");
    const tool = { tool: !!TOOLS.can, carry: CHEST_GIFTS.some(g => g[0] === "can"), drawn: pic(giftSvg("can", {})) && pic(toolSvg("can", -1)) && !/NaN|undefined/.test(giftSvg("can", {}) + toolSvg("can", -1)) };
    // the tree room: the can on its floor; again in a room seen before it was there (shown for the first time: no marks, nothing kept)
    for (const k of Object.keys(W.carrySeeded || {})) if (/treeroom/.test(k)) delete W.carrySeeded[k];
    for (const k of Object.keys(W.off || {})) if (/^treeroom/.test(k)) delete W.off[k];
    state.backpack = []; state.pack = { ...(state.pack || {}), tool: "" };
    await go("treeroom", 40, -30);
    const room = (B.things || []).filter(t => t.kind === "item" && t.id === "can").length, mark = Object.keys(W.carrySeeded || {}).find(k => k.endsWith(":can"));
    const roomKey = mark && mark.slice(0, -4), saw = { room, mark: !!mark, roomMark: !!(roomKey && W.carrySeeded[roomKey]) };
    // picked up: in the 🎒, in the hand
    const near = carryNear(), canNear = near >= 0 && B.things[near].id === "can";
    actionPress(); await w(900);
    const got = { canNear, pack: packList().map(o => o.id), held: toolHeld(), drawn: !!document.querySelector('#figure [data-tool="can"]'), water: canWater() };
    // the garden: a sprout from the menu's defaults, and one all grown
    await go("garden", 60, -10, "right");
    B.things = [{ ...THING_DEFAULTS.flowerbed, kind: "flowerbed", flower: "columbine", x: 170, z: SCENE.ground - 10, seed: 31 },
                { ...THING_DEFAULTS.veggies, kind: "veggies", veg: "corn", grown: 100, x: -330, z: SCENE.ground + 60, seed: 32 }];
    changed(); draw(); await w(500);
    const sprout = B.things[0], meters = () => document.querySelectorAll("[data-water-meters] > g").length;
    const start = { grown: sprout.grown, stage: gardenStage(sprout), meters: meters() };
    hush(); const tipped = toolUse(); await w(1500);
    const empty = { tipped, said: said(), water: sprout.water || 0, can: canWater() };
    // by the water barrel: filled
    const barrel = bgShown.objs.find(o => o.name === "water barrel"), bb = barrel.node.getBBox();
    Object.assign(B, { figX: Math.round(bb.x + bb.width + 50), figY: Math.round(barrel.z - SCENE.ground + 5) }); state.body.facing = "left"; changed(); draw(); await w(300);
    hush(); toolUse(); await w(1400);
    const filled = { can: canWater(), said: said(), holds: CAN_HOLDS };
    // by the sprout: a pour each, till its meter is full
    Object.assign(B, { figX: 60, figY: -10 }); state.body.facing = "right"; changed(); draw(); await w(300);
    const pours = [];
    for (let j = 0; j < 4; j++) { hush(); toolUse(); await w(1500); pours.push({ water: Math.round(plantNow(sprout).water * 10) / 10, can: canWater(), said: said() }); }
    // the meters: the sprout's, not the corn's; none with the can put away
    const shown = { held: meters(), away: 0, back: 0 };
    toolHold("can"); await w(300); shown.away = meters(); toolHold("can"); await w(300); shown.back = meters();
    // drinking: a 💧 and a half drunk (as if DRINK_MS and a half had gone by): a stage up, drawn again, half a 💧 left
    const node = () => bgShown.node.querySelector('[data-obj="flowerbed 1"]'), before = node() ? node().innerHTML : "";
    sprout.grown = 0; sprout.water = 3; sprout.wet = Date.now() - 1.5 * DRINK_MS; gardenDrink(true); await w(500);
    const drank = { grown: sprout.grown, stage: gardenStage(sprout), water: Math.round(sprout.water * 100) / 100, redrawn: !!before && node() && node().innerHTML !== before };
    // all of it drunk: all grown, drinking no more, its meter gone
    sprout.wet = Date.now() - 2 * DRINK_MS; gardenDrink(true); await w(500);
    const grown = { grown: sprout.grown, water: sprout.water, done: plantDone(sprout), meters: meters() };
    // filled at a place's own water: from a dry spot by it
    const fills = {};
    for (const kind of ["spring", "lake", "treehouse", "castle"]) {
      await go(kind); canSet(0); changed();
      const at = waterHere(B); let spot = null;
      if (at) outer: for (let y = SCENE.top + 40; y < SCENE.ground + 80; y += 10) for (let x = -380; x <= 380; x += 10)
        if (!at(x, y) && !solidAt(x, y) && [[90, 0], [-90, 0], [0, 50], [0, -50]].some(([dx, dy]) => at(x + dx, y + dy))) { spot = [x, y - SCENE.ground]; break outer; }
      if (spot) { Object.assign(B, { figX: spot[0], figY: spot[1] }); changed(); draw(); await w(200); hush(); toolUse(); await w(1300); }
      fills[kind] = { spot, can: canWater() };
    }
    // put down and picked up: its water still in it
    await go("garden", 0, 0, "front"); canSet(4); changed();
    putDown(canAt()); await w(900);
    const down = (B.things || []).find(t => t.kind === "item" && t.id === "can");
    if (down) { Object.assign(B, { figX: down.x, figY: down.z - SCENE.ground - 20 }); changed(); await w(200); actionPress(); await w(900); }
    const kept = { down: !!down, downWater: down && down.water, water: canWater(), held: toolHeld() };
    // the room seen before the can: its mark taken back, the room's kept: the can there next time
    if (mark) delete W.carrySeeded[mark];
    await go("treeroom", -133, 0);
    const later = { cans: (B.things || []).filter(t => t.kind === "item" && t.id === "can").length, mark: !!mark && !!W.carrySeeded[mark] };
    Object.assign(B, { kind: "none", things: [] }); state.backpack = []; changed();
    return JSON.stringify({ tool, saw, got, start, empty, filled, pours, shown, drank, grown, fills, kept, later }); })()`));
  const { tool, saw, got, start, empty, filled, pours, shown, drank, grown, fills, kept, later } = r;
  ok("the 💧 watering can: a tool, a thing to carry, drawn well (held either way, and standing)", tool.tool && tool.carry && tool.drawn, tool);
  ok("the tree room has the can on its floor the first time, with a mark of its own beside the room's", saw.room === 1 && saw.mark && saw.roomMark, saw);
  ok("picked up there: in the 🎒 and in the hand at once, empty", got.canNear && got.pack.includes("can") && got.held === "can" && got.drawn && got.water === 0, got);
  ok("a flower bed put from the menu is sprouts; with the can held it shows its meter, the corn all grown none", start.grown === 0 && start.stage === 0 && start.meters === 1, start);
  ok("empty, by a plant: it says so, and pours nothing", empty.tipped && /empty/i.test(empty.said) && empty.water === 0 && empty.can === 0, empty);
  ok("by the garden's water barrel it fills: all its pours", filled.can === filled.holds && /full/i.test(filled.said), filled);
  // (each a second and a half after the last, a little drunk in between: a fifteenth of a 💧 a second)
  ok("by the sprout: a 💧 a pour, out of the can, till the meter is full (three), then none", [1, 2, 3].every((v, j) => Math.abs(pours[j].water - v) <= 0.4) && pours[3].water <= pours[2].water
     && pours[2].can === filled.holds - 3 && pours[3].can === filled.holds - 3 && /water it can drink/.test(pours[3].said), pours);
  ok("the meters: one for the sprout while the can is held, none with it put away, back with it held again", shown.held === 1 && shown.away === 0 && shown.back === 1, shown);
  ok("a 💧 and a half drunk: a stage up (25 of how grown a 💧), drawn again, a 💧 and a half left", drank.stage === 1 && Math.abs(drank.grown - 37.5) < 0.6 && drank.redrawn && Math.abs(drank.water - 1.5) < 0.05, drank);
  ok("all of it drunk: all grown, drinking no more, its meter gone", grown.grown === 100 && grown.water === 0 && grown.done && grown.meters === 0, grown);
  for (const kind of ["spring", "lake", "treehouse", "castle"])
    ok(`the can fills at the ${kind}'s water, from the bank`, !!fills[kind].spot && fills[kind].can === filled.holds, fills[kind]);
  ok("put down and picked up again, its water still in it", kept.down && kept.downWater === 4 && kept.water === 4 && kept.held === "can", kept);
  ok("a tree room seen before the can was there has it the next time", later.cans >= 1 && later.mark, later);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
