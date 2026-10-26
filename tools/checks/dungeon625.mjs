// (tickets 622, 625, 629, 630, 631) The 🗝️ dungeon room's ways between floors and its things: every look drawn (the stone's
// three shades, the five mosses, the five mushrooms, both ledges, the three holes); two worlds, one the other's ⬇️ floor below,
// and the 🪜 stairs up from the room below and the 🕳️ hole down from the one above; up on a 🧱 ledge, ⬇ off its edge hops the
// friend down in front of it; a pot lifted with the action (and gone from the floor), then thrown; a 💰 chest opened with
// the action, its gift shown over the friend and then in the 🎒 backpack. Exits 1 on a failure.
//   node dungeon625.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state.music.mute = true;
    const objs = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj);
    // two worlds of one dungeon room each, the first's floor below the second
    const up = worldNew("small"); worldPut("1,1", "dungeon"); worldEnter("1,1"); await w(600);
    const down = worldNew("small"); worldPut("1,1", "dungeon"); worldEnter("1,1"); await w(600);
    worldById(up).below = down;
    const B = () => state.background;
    // every look: the stone's shade, each moss, each mushroom, each ledge and hole
    const looks = {}, look = async (name, o) => { Object.assign(B(), o); changed(); await w(250);
      looks[name] = { kind: B().kind, parts: bgShown.node.querySelectorAll("*").length, objs: objs().length }; };
    for (const s of [20, 50, 80]) await look("shade " + s, { crossShade: s });
    for (const [k] of DUNGEON_MOSS) await look("moss " + k, { crossMoss: 70, crossMossKind: k });
    for (const [k] of DUNGEON_SHROOMS) await look("mushrooms " + k, { crossShrooms: 70, crossShroomKind: k });
    for (const k of Object.keys(DUNGEON_LEDGES)) await look("ledge " + k, { crossLedge: k });
    for (const k of Object.keys(DUNGEON_HOLES)) await look("hole " + k, { crossHole: k });
    Object.assign(B(), { crossLedge: "", crossHole: "", crossMoss: 0, crossShrooms: 0, crossShade: 50, crossStairs: "right" }); changed(); await w(300);
    // up the stairs, from the room below to the one above
    const stairs = { world: state.world.id, portal: !!bgShown.node.querySelector('.portal[data-stairs="up"]') };
    if (stairs.portal) { enterScene(bgShown.node.querySelector('.portal[data-stairs="up"]')); await w(5000); }
    stairs.after = state.world.id;
    // down the hole, back to the room below
    Object.assign(B(), { crossHole: "middle" }); changed(); await w(300);
    const hole = { world: state.world.id, portal: !!bgShown.node.querySelector('.portal[data-hole="below"]') };
    if (hole.portal) { enterScene(bgShown.node.querySelector('.portal[data-hole="below"]')); await w(5000); }
    hole.after = state.world.id;
    // the hop: up on a ledge, walking down off its edge (the on-screen controller's down held, its loop called by hand)
    Object.assign(B(), { crossLedge: "middle", crossStairs: "", figX: -200, figY: -224, seat: null }); state.body.anim = "none"; changed(); await w(300);
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
    touchPad.want = true; const pad = touchPad.pad; pad.buttons.forEach(b => b.pressed = false); pad.buttons[13].pressed = true;
    let t = performance.now(); const hop = { from: B().figY };
    for (let i = 0; i < 60 && !isJump(state.body.anim); i++) { t += 16; padPoll(t); }
    hop.jumped = isJump(state.body.anim); hop.to = B().figY;
    pad.buttons[13].pressed = false; padPoll(t + 16); touchPad.want = false; window.requestAnimationFrame = raf;
    state.body.anim = "none"; Object.assign(B(), { crossLedge: "" }); changed(); await w(1500);
    // a pot: lifted with the action, then thrown
    const g = bgShown.node.querySelector('[data-obj^="pot "]'), bb = g && g.getBBox();
    const pot = { found: !!g };
    if (g) { Object.assign(B(), { figX: Math.round(bb.x + bb.width / 2), figY: Math.round(+g.dataset.z - SCENE.ground) }); changed(); await w(300);
      pot.lifted = actionPress() && !!carry; pot.gone = String(B().potsGone || "").includes(g.dataset.obj);
      await w(300); pot.drawnGone = !objs().includes(g.dataset.obj);
      potThrow(); pot.thrown = !carry; await w(1200); pot.shardsGone = !document.querySelector("[data-pot-flying]"); }
    // a chest: opened with the action, its gift in the backpack
    Object.assign(B(), { figX: 0, figY: 0 });
    B().things = [...(B().things || []), { kind: "chest", x: 40, z: SCENE.ground, open: false, treasure: "gold", gives: "crown", flourish: "chestfanfare", rec: "" }]; changed(); await w(300);
    const chest = { opened: actionPress() };
    const c = B().things.find(x => x.kind === "chest");
    chest.open = c && c.open === true; chest.packed = (state.backpack || []).some(x => x.id === "crown" && x.from === "chest");
    chest.shown = !!document.querySelector('[data-gift="crown"]');
    await w(3500); chest.done = !presenting && !document.querySelector("[data-gift]");
    return JSON.stringify({ up, down, looks, stairs, hole, hop, pot, chest }); })()`));
  const { looks: L, stairs: S, hole: H, hop: J, pot: P, chest: C } = r;
  const sizes = Object.values(L).map(l => l.parts);
  ok("every look draws a dungeon room (3 shades, 5 mosses, 5 mushrooms, 2 ledges, 3 holes)", Object.keys(L).length === 18 && Object.values(L).every(l => l.kind === "dungeon" && l.parts > 100), L);
  ok("moss and mushrooms add to the room; a ledge adds its standing parts", L["moss carpet"].parts > L["shade 50"].parts && L["mushrooms glowcap"].objs > L["shade 50"].objs && L["ledge middle"].objs > L["shade 50"].objs, L);
  ok("🪜 stairs up, in the room below: a way, and up it to the world above", S.portal && S.world === r.down && S.after === r.up, S);
  ok("🕳️ a hole, in the room above: a way, and down it to the world below", H.portal && H.world === r.up && H.after === r.down, H);
  ok("up on a 🧱 ledge, ⬇ off its edge: a hop down to the floor in front of it", J.jumped && J.to > J.from, J);
  ok("a pot within reach: lifted with the action, gone from the floor, then thrown and shattered", P.found && P.lifted && P.gone && P.drawnGone && P.thrown && P.shardsGone, P);
  ok("a shut 💰 chest within reach: opened with the action, its gift shown, then in the 🎒 backpack", C.opened && C.open && C.shown && C.packed && C.done, C);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
