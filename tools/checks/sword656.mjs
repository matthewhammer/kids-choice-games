// (ticket 656, M: "sword can cut through vines and trees and other vegetation in the world, and the chopped up bits -- vanish, for
// now") The 🗡️ sword as a tool: a knight's own, swung with "use tool", cuts the nearest plant on the side it faces (one a swing), a
// scene's tree onto the place's cut list (hidden), nothing behind the friend, no row of flowers across the place; a plant put in the
// place is taken out of it; a sword held from the 🎒 swings too; and a square of the world keeps its own cuts. A computer taken as
// fast. Exits 1 on a failure.
//   node sword656.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    slowFlag = false; PERF.slowMoving = true; state = clone(DEFAULTS); state.music.mute = true; state.world.at = null;
    const swing = async () => { const s = toolUse(); await w(1500); return s; };
    const cutHere = () => ((state.background.cut || {}).clearing || []).slice();
    // a knight in the clearing, beside the left trees, facing them
    state.costume = { ...state.costume, kind: "knight" };
    state.background = { ...state.background, kind: "clearing", things: [], cut: {}, figX: -230, figY: 389 - SCENE.ground };
    state.body.facing = "left"; changed(); draw(); await w(900);
    out.inHand = toolInHand();
    out.swung = await swing(); out.cut1 = cutHere();
    const t = bgShown.objs.find(o => o.name === "tree, left, inner"); out.hidden = t ? t.node.style.display : "no tree";
    await swing(); out.cut2 = cutHere();
    state.body.facing = "right"; changed(); draw(); await w(300);
    await swing(); out.cutRight = cutHere();
    // a bush put in the place, ahead
    state.background.things = [{ ...(THING_DEFAULTS.bush || {}), kind: "bush", x: -100, z: 389, seed: 7 }]; changed(); draw(); await w(300);
    await swing(); out.bushes = state.background.things.filter(t => t.kind === "bush").length; out.cutAfterBush = cutHere();
    // no costume: the 🎒's sword, held
    state.costume = { ...state.costume, kind: "none" };
    state.backpack = [...packList(), { id: "sword", got: Date.now() }]; toolHold("sword"); await w(300);
    out.packHeld = toolInHand(); out.packDrawn = !!document.querySelector('#figure [data-tool="sword"]');
    state.background.things = [{ ...(THING_DEFAULTS.saguaro || {}), kind: "saguaro", x: -90, z: 389, seed: 8 }]; changed(); draw(); await w(300);
    await swing(); out.saguaros = state.background.things.filter(t => t.kind === "saguaro").length;
    // the world: two clearings, a tree cut in the first only
    const W = state.world; W.cells = { ...(W.cells || {}), "90,0": { kind: "clearing", things: [] }, "91,0": { kind: "clearing", things: [] } };
    worldEnter("90,0"); await w(500);
    state.background.figX = -230; state.background.figY = 389 - SCENE.ground; state.body.facing = "left"; changed(); draw(); await w(300);
    await swing(); changed(); await w(200);
    out.cellA = (W.cells["90,0"].cut || {}).clearing || [];
    worldEnter("91,0"); await w(500);
    const tB = bgShown.objs.find(o => o.name === "tree, left, inner"); out.treeInB = tB ? tB.node.style.display !== "none" : "no tree";
    worldEnter("90,0"); await w(500);
    const tA = bgShown.objs.find(o => o.name === "tree, left, inner"); out.treeBackInA = tA ? tA.node.style.display !== "none" : "no tree";
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r));
  ok("a knight's own sword is the tool in hand", r.inHand === "sword", r.inHand);
  ok("a swing cuts the nearest tree, and it is hidden", r.swung && r.cut1.length === 1 && r.cut1[0] === "tree, left, inner" && r.hidden === "none", [r.cut1, r.hidden]);
  ok("the next swing the next tree", r.cut2.length === 2 && r.cut2.includes("tree, left, outer"), r.cut2);
  ok("turned round: nothing behind, no row of flowers", r.cutRight.length === 2, r.cutRight);
  ok("a bush put in the place is taken out of it, not hidden", r.bushes === 0 && r.cutAfterBush.length === 2, [r.bushes, r.cutAfterBush]);
  ok("the 🎒's sword held, and drawn in the hand", r.packHeld === "sword" && r.packDrawn, [r.packHeld, r.packDrawn]);
  ok("and it cuts too", r.saguaros === 0, r.saguaros);
  ok("a square of the world keeps its own cuts", r.cellA.includes("tree, left, inner") && r.treeInB === true && r.treeBackInA === false, [r.cellA, r.treeInB, r.treeBackInA]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
