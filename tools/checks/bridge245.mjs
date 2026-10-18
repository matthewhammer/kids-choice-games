// (ticket 245, Matthew: "some logic for walking across bridges, on the outside of the tree house, with the correct figure
// size, and collision boxes (and maybe other structures in that system we lack now) that indicate the curved path that's
// allowed -- it's very linear in this case, and no N/S is permitted, except to re-orient the pose") At the tree house,
// six houses and five bridges: the friend dragged up by a real drag till their feet are on a bridge is put on it, sized
// to fit the houses' doors, in front of the tree; walking with the controller's ▶ and ◀ they go along the bridge's curve
// and stop at its ends; ⬆ and ⬇ only turn them; ♿'s boxes show each bridge's way along it; dragged down to the ground,
// they are off it, their own size again; and a place left and come back to starts them off it. Exits 1 on a failure.
//   node bridge245.mjs <devtools port> <url>
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
const mouse = (type, x, y, buttons = 0) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
// (in the page: where the friend is, and how big, in the picture's units)
const NOW = `(() => { const B = state.background, T = figureT, f = document.getElementById("figure"), P = pic.getScreenCTM().inverse();
  const r = f.getBoundingClientRect(), a = new DOMPoint(r.left, r.top).matrixTransform(P), b = new DOMPoint(r.right, r.bottom).matrixTransform(P);
  const at = bridgeNow(), tree = bgShown.node.querySelector('[data-obj="tree house"]');
  return { on: B.onBridge ? { ...B.onBridge } : null, x: +(B.figX ?? 0).toFixed(1), y: +(B.figY ?? 0).toFixed(1), feet: [+T.dx.toFixed(1), +(T.sg + T.dy).toFixed(1)], k: +T.k.toFixed(4),
    tall: +(b.y - a.y).toFixed(1), facing: state.body.facing, turn: state.body.turn || "", curve: at ? [+at.x.toFixed(1), +at.y.toFixed(1)] : null,
    door: at ? +(72 * at.W.s * at.W.hz).toFixed(1) : null, afterTree: !!(tree && (tree.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)), kind: B.kind }; })()`;
const now = async () => JSON.parse(await ev(`JSON.stringify(${NOW})`));
// (holding the on-screen controller's buttons a while, the friend's place sampled as they go)
const hold = async (buttons, ms) => JSON.parse(await ev(`(async () => { touchWant(true); for (const b of ${JSON.stringify(buttons)}) { const p = touchPad.pad.buttons[b]; p.pressed = true; p.value = 1; }
  const seen = [], t0 = performance.now(); while (performance.now() - t0 < ${ms}) { await new Promise(r => setTimeout(r, 60)); const B = state.background, at = bridgeNow();
    seen.push({ u: at ? +at.u.toFixed(4) : null, x: +(B.figX ?? 0).toFixed(1), z: +(SCENE.ground + (B.figY ?? 0)).toFixed(1), off: at ? +Math.hypot(at.x - (B.figX ?? 0), at.y - SCENE.ground - (B.figY ?? 0)).toFixed(2) : null, anim: state.body.anim }); }
  for (const p of touchPad.pad.buttons) { p.pressed = false; p.value = 0; } await new Promise(r => setTimeout(r, 300)); touchWant(false); await new Promise(r => setTimeout(r, 200));
  return JSON.stringify(seen); })()`));
// (a real drag of the friend: pressed on them, moved by (dx, dy) on the screen in steps, let go)
const dragBy = async (p, dx, dy) => { await mouse("mouseMoved", p[0], p[1]); await mouse("mousePressed", p[0], p[1], 1);
  for (let i = 1; i <= 30; i++) { await mouse("mouseMoved", p[0] + dx * i / 30, p[1] + dy * i / 30, 1); await sleep(20); }
  await mouse("mouseReleased", p[0] + dx, p[1] + dy, 0); await sleep(600); };
// (a point on the friend where a press moves them: they are the topmost thing there, and it is not on a joint, which a
// press would pose, nor on the face; nearest their middle; and the screen's offset from their feet to a picture point)
const grab = async (tx, ty) => JSON.parse(await ev(`(() => { const B = state.background, M = pic.getScreenCTM(), f = document.getElementById("figure"), r = f.getBoundingClientRect();
  let p = null, best = Infinity; for (let i = 0; i <= 12; i++) for (let j = 0; j <= 16; j++) { const x = r.left + r.width * i / 12, y = r.top + r.height * j / 16, e = { clientX: x, clientY: y, pointerType: "mouse" };
    const d = Math.hypot(i / 12 - 0.5, j / 16 - 0.5); if (d < best && onFigure(e) && !onJoint(e) && !onFace(e)) { best = d; p = [x, y]; } }
  const s = (x, y) => { const q = new DOMPoint(x, y).matrixTransform(M); return [q.x, q.y]; }, foot = s(figureT.dx, figureT.sg + figureT.dy), to = s(${tx}, ${ty});
  return JSON.stringify({ p, d: [to[0] - foot[0], to[1] - foot[1]] }); })()`));
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const setup = JSON.parse(await ev(`(async () => { state.music.mute = true; state.world.at = null; state.body.anim = "none"; state.body.facing = "front"; climb = null;
    Object.assign(state.background, { kind: "treehouse", houses: 6, ladders: 6, bridges: 5, treeSize: 100, treeHouseSize: 100, figX: -250, figY: 60, figSize: 100, things: [] }); delete state.background.onBridge;
    changed(); await new Promise(r => setTimeout(r, 800));
    const W = treeWalks(), mid = walkAt(W[1], 0.5);
    return JSON.stringify({ n: W.length, names: W.map(w => (w.a + 1) + "-" + (w.b + 1)), mid: mid.map(v => +v.toFixed(1)) }); })()`));
  console.log(`  bridges: ${setup.names.join(", ")}; bridge 1-2's middle ${JSON.stringify(setup.mid)}`);
  ok("the tree house has a walkway for each of its five bridges", setup.n === 5, setup);
  const ground = await now();
  // (dragged by its feet to bridge 1-2's middle)
  const g1 = await grab(setup.mid[0], setup.mid[1]);
  if (!g1.p) throw new Error("no point on the friend that is on top");
  await dragBy(g1.p, g1.d[0], g1.d[1]);
  const on = await now();
  console.log(`  on the ground: ${ground.tall} tall; dragged up: ${JSON.stringify(on)}`);
  ok("dragged till their feet are on the bridge: put on it, near its middle", !!on.on && on.on.j === 1 && Math.abs(on.on.u - 0.5) < 0.12, on);
  ok("their feet on its deck", !!on.curve && Math.hypot(on.feet[0] - on.curve[0], on.feet[1] - on.curve[1]) < 1, on);
  ok("sized to fit the houses' doors: about BRIDGE_TALL of the tree's units tall, far smaller than on the ground", on.door && on.tall > 0.5 * on.door && on.tall < 1.6 * on.door && on.tall < 0.5 * ground.tall, { tall: on.tall, door: on.door, ground: ground.tall });
  ok("drawn in front of the tree house, its houses and bridges", on.afterTree, on);
  // walking ▶, then ◀: along the curve
  const right = await hold([15], 1500), afterR = await now(), left = await hold([14], 1500), afterL = await now();
  const offs = [...right, ...left].filter(s => s.off !== null).map(s => s.off), zs = right.map(s => s.z);
  console.log(`  ▶ for 1.5 s: u ${on.on.u} → ${afterR.on && afterR.on.u}, x ${on.x} → ${afterR.x}; ◀: → u ${afterL.on && afterL.on.u}, x ${afterL.x}; the farthest off the curve ${Math.max(...offs)}`);
  ok("▶ walks them along the bridge, to the right, still on it", !!afterR.on && afterR.x > on.x + 20 && right.some(s => s.anim === "walk") && afterR.facing === "right", { afterR, anims: [...new Set(right.map(s => s.anim))] });
  ok("◀ walks them back along it, to the left", !!afterL.on && afterL.x < afterR.x - 20 && afterL.facing === "left", afterL);
  ok("every step on the bridge's curve: their feet on its deck as it sags and rises", offs.length > 10 && Math.max(...offs) < 1 && Math.max(...zs) - Math.min(...zs) > 2, { off: Math.max(...offs), zSpan: Math.max(...zs) - Math.min(...zs) });
  // ⬆ and ⬇: turned, not moved
  const up = await hold([12], 700), afterU = await now(), down = await hold([13], 700), afterD = await now();
  ok("⬆ turns them away from us, and they stay where they are", afterU.facing === "back" && !!afterU.on && Math.abs(afterU.on.u - afterL.on.u) < 1e-3 && up.every(s => s.anim !== "walk"), afterU);
  ok("⬇ turns them toward us, and they stay where they are", afterD.facing === "front" && !!afterD.on && Math.abs(afterD.on.u - afterL.on.u) < 1e-3, afterD);
  // all the way: stopped at the end
  const far = await hold([15], 6000), end = await now();
  const toRight = JSON.parse(await ev(`JSON.stringify((() => { const W = treeWalks()[1]; return W.q[0] >= W.p[0] ? 1 : 0; })())`));
  ok("walking on: stopped at the bridge's end, still on it", !!end.on && Math.abs(end.on.u - toRight) < 1e-3 && far.slice(-5).every(s => s.u === far[far.length - 1].u), end);
  // ♿'s boxes: each bridge's way along it
  const hud = JSON.parse(await ev(`(async () => { Object.assign(state.access, DEFAULTS.access, { showSolids: true }); changed(); await new Promise(r => setTimeout(r, 400));
    const ov = document.querySelector("#access-layer svg.solid-boxes"), M = pic.getScreenCTM(), box = document.getElementById("access-layer").getBoundingClientRect();
    const walks = [...ov.querySelectorAll("[data-walk]")].map(g => { const pts = g.querySelector("polyline.walk").getAttribute("points").split(" ").map(p => p.split(",").map(Number)); return { name: g.dataset.walk, pts }; });
    const far = treeWalks().map((W, i) => { const w = walks[i]; if (!w) return 999; return Math.max(...w.pts.map((p, j) => { const q = new DOMPoint(...walkAt(W, j / (w.pts.length - 1))).matrixTransform(M); return Math.hypot(q.x - box.left - p[0], q.y - box.top - p[1]); })); });
    state.access.showSolids = false; changed();
    return JSON.stringify({ names: walks.map(w => w.name), far }); })()`));
  console.log(`  ♿ shows: ${hud.names.join(", ")}`);
  ok("♿'s collision boxes show each bridge's way along it, on its curve", hud.names.length === 5 && hud.far.every(d => d < 1.5), hud);
  // dragged down to the ground: off it, their own size again
  const g2 = await grab(-250, JSON.parse(await ev("SCENE.ground")) + 60);
  await dragBy(g2.p, g2.d[0], g2.d[1]);
  const off = await now();
  console.log(`  dragged down: ${JSON.stringify(off)}`);
  ok("dragged down to the ground: off the bridge, their own size again", !off.on && off.y > 0 && Math.abs(off.tall - ground.tall) < 0.15 * ground.tall, off);
  // a place left and come back to: off the bridge
  const back = JSON.parse(await ev(`(async () => { const B = state.background; bridgeOn(2, 0.5); changed(); const was = !!B.onBridge;
    B.kind = "lake"; changed(); await new Promise(r => setTimeout(r, 300)); B.kind = "treehouse"; changed(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ was, now: B.onBridge || null }); })()`));
  ok("a place left and come back to: they are no longer on the bridge", back.was && !back.now, back);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
