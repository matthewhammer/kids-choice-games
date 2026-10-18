// (ticket 256, Matthew: "when we get close to a closed door on a side wall, in the tree house or the castle, let's have
// it open and reveal what's behind it. In the castle, it can just be a solid color indicating if the next room is
// bright or dim"; "when the door like this in the tree house is glowing, it should animate opening. And when it
// unglows, it closes"; "we can walk through an open door, by just colliding with it") With the on-screen controller:
// beside a tree room's door to a bridge, the glow on it, it swings open (its leaf narrows to a sliver); walked away, the
// glow off it, it swings shut; walking on into the side wall there, through it, out onto the bridge. In the king's
// room, its side door's doorway the color of the next room's light; beside it, it opens; walked into, through it.
// Exits 1 on a failure.
//   node doors256.mjs <devtools port> <url>
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
// (in the page: a door's feet, near and far, in the picture's units; its leaf's width now; the friend put beside it)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, P = () => pic.getScreenCTM().inverse();
  const feet = d => { const s = d.querySelector("path"), T = P().multiply(s.getScreenCTM()), n = s.getAttribute("d").match(/-?[0-9]+([.][0-9]+)?/g).map(Number), pt = (x, y) => new DOMPoint(x, y).matrixTransform(T);
    return { near: pt(n[0], n[1]), far: pt(n[n.length - 2], n[n.length - 1]) }; };
  const leafW = d => { const r = d.querySelector("[data-leaf] path").getBoundingClientRect(); return Math.round(r.width); };
  const beside = async d => { const f = feet(d), sd = Math.sign(f.near.x), z = (f.near.y + f.far.y) / 2; B.figX = Math.round(f.near.x - sd * 40); B.figY = Math.round(z - SCENE.ground); state.body.anim = "none"; state.body.facing = "front";
    changed(); await w(300); measureMarks(); showEnterGlow(); await w(800); };
  const settled = async () => { changed(); await w(300); measureMarks(); showEnterGlow(); await w(800); };
  const press = b => { touchWant(true); const p = touchPad.pad.buttons[b]; p.pressed = true; p.value = 1; };
  const release = async () => { for (const p of touchPad.pad.buttons) { p.pressed = false; p.value = 0; } await w(300); touchWant(false); await w(200); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // the tree room's door to house 2
  const tree = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; climb = null;
    Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 5, inside: 1, figX: 0, figY: 80, things: [] }); delete B.onBridge; await settled();
    const sel = '.portal[data-door][data-house="2"]', d = () => bgShown.node.querySelector(sel); if (!d()) return JSON.stringify({ none: true });
    const shut0 = leafW(d()); await beside(d());
    const glow = !!(enterAt && enterAt.el === d()), open = leafW(d()), swung = d().querySelector("[data-leaf]").dataset.swung;
    B.figX = 0; B.figY = 90; await settled();
    const away = { glow: !!(enterAt && enterAt.el === d()), w: leafW(d()), swung: d().querySelector("[data-leaf]").dataset.swung };
    await beside(d()); const f = feet(d()); press(f.near.x > 0 ? 15 : 14);
    const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(B.kind === "treehouse" && !entering)) await w(60); await release();
    return JSON.stringify({ shut0, glow, open, swung, away, out: { kind: B.kind, on: B.onBridge || null } }); })()`));
  console.log(`  tree room 1's door to house 2: ${JSON.stringify(tree)}`);
  if (tree.none) ok("tree room 1 has a door to house 2", false, tree);
  else {
    ok("beside it, the glow on it: it swings open (its leaf a sliver)", tree.glow && tree.swung === "open" && tree.open < 0.6 * tree.shut0, tree);
    ok("walked away, the glow off it: it swings shut again", !tree.away.glow && tree.away.swung === "shut" && tree.away.w > 0.9 * tree.shut0, tree.away);
    ok("walking on into the wall at the open door: through it, out onto the bridge", tree.out.kind === "treehouse" && !!tree.out.on, tree.out);
  }
  // the king's room's side door
  const king = JSON.parse(await ev(`(async () => { ${H} state.world.at = null; climb = null; state.access.showSolids = false;
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 1, figX: 0, figY: 60, things: [] }); await settled();
    const d0 = bgShown.node.querySelector('.portal[data-door][data-to="castleroom"]'); if (!d0) return JSON.stringify({ none: true });
    const to = +d0.dataset.room, sel = '.portal[data-door][data-room="' + to + '"]', d = () => bgShown.node.querySelector(sel), kind = castleOf(B).rooms[to - 1];
    const fills = [...d().querySelectorAll(":scope > path")].map(p => p.getAttribute("fill")), want = roomLightBehind(kind);
    const shut0 = leafW(d()); await beside(d()); const glow = !!(enterAt && enterAt.el === d()), open = leafW(d());
    const f = feet(d()); press(f.near.x > 0 ? 15 : 14);
    const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(B.castleRoom === to && !entering)) await w(60); await release();
    return JSON.stringify({ to, kind, want, fills, shut0, glow, open, now: B.castleRoom, lights: ["dungeon1", "kitchen", "greenhouse"].map(roomLightBehind) }); })()`));
  console.log(`  the king's room's door to room ${king.to} (${king.kind}): ${JSON.stringify(king)}`);
  if (king.none) ok("the king's room has a side door", false, king);
  else {
    ok("its doorway the color of the next room's light", king.fills.includes(king.want), king);
    ok("a dungeon darker than the kitchen, the kitchen darker than the greenhouse", (h => h(king.lights[0]) < h(king.lights[1]) && h(king.lights[1]) < h(king.lights[2]))(c => parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16)), king.lights);
    ok("beside it, the glow on it: it swings open", king.glow && king.open < 0.6 * king.shut0, king);
    ok("walking on into the wall at the open door: through it, into the next room", king.now === king.to, king);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
