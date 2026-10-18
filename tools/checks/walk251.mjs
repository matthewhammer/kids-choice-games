// (ticket 251, Matthew: "accessibility toggle, and walk to click feature. When enabled, we show a glowing circle of some
// custom color over any area on the ground that's 'walkable' when the cursor is over it. When clicked, we plan a path to
// that point, and execute the path plan.") In the witch's hut, ♿ 👆 on: the pointer over open floor shows the glow there,
// in its colour; over the cauldron, none; a click past the cauldron walks the friend round it (a plan of more than one
// leg, never inside it) to that spot; with 👆 off, no glow and a click walks nowhere. Exits 1 on a failure.
//   node walk251.mjs <devtools port> <url>
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
const spot = () => ev(`(() => { const e = document.querySelector("#access-layer svg.walk-spot ellipse"); return e ? JSON.stringify({ cx: +e.getAttribute("cx"), cy: +e.getAttribute("cy"), stroke: getComputedStyle(e).stroke }) : "null"; })()`).then(JSON.parse);
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const at = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; Object.assign(state.access, { clickWalk: true, clickWalkColor: "#ff00aa" });
    Object.assign(B, { kind: "witchroom", things: [] }); changed(); await w(500);
    const o = solidsHere().find(s => s.name === "cauldron"); if (!o) return JSON.stringify({ none: solidsHere().map(s => s.name) });
    const z = Math.round((o.back + o.front) / 2), sx = feetSpan()[0];
    B.figX = Math.round(o.x1 + sx + 40); B.figY = z - SCENE.ground; state.body.anim = "none"; changed(); await w(400);
    const M = pic.getScreenCTM(), scr = (x, y) => { const q = new DOMPoint(x, y).matrixTransform(M); return [q.x, q.y]; };
    return JSON.stringify({ o: [o.x0, o.x1, o.back, o.front].map(Math.round), z, from: B.figX, to: Math.round(o.x0 - sx - 40), target: scr(o.x0 - sx - 40, z), inside: scr((o.x0 + o.x1) / 2, z) }); })()`));
  if (at.none) throw new Error("no cauldron: " + JSON.stringify(at.none));
  // over the cauldron: no glow; over the floor past it: the glow there, its colour
  await mouse("mouseMoved", at.inside[0], at.inside[1]); await sleep(150); const over = await spot();
  await mouse("mouseMoved", at.target[0], at.target[1]); await sleep(150); const floor = await spot();
  console.log(`  the cauldron ${JSON.stringify(at.o)}; over it: ${JSON.stringify(over)}; over the floor past it: ${JSON.stringify(floor)}`);
  ok("👆 on: over the cauldron, no glow", over === null, over);
  ok("over the open floor past it: the glow there, in its colour", !!floor && Math.abs(floor.cx + (await ev(`document.getElementById("access-layer").getBoundingClientRect().left`)) - at.target[0]) < 2 && /255, 0, 170/.test(floor.stroke), floor);
  // a click there: walked round the cauldron, never in it, to the spot
  await ev(`(() => { window.__in = []; window.__iv = setInterval(() => { const B = state.background, r = solidAt(B.figX, SCENE.ground + B.figY, true); if (r.list.some(o => o.name === "cauldron")) window.__in.push(Math.round(B.figX)); }, 40); return 1; })()`);
  await mouse("mousePressed", at.target[0], at.target[1], 1); await mouse("mouseReleased", at.target[0], at.target[1], 0);
  await sleep(300); const plan = JSON.parse(await ev(`JSON.stringify(walkPath ? walkPath.pts.map(p => p.map(Math.round)) : null)`));
  await sleep(6000);
  const end = JSON.parse(await ev(`(() => { clearInterval(window.__iv); const B = state.background; return JSON.stringify({ x: Math.round(B.figX), z: Math.round(SCENE.ground + B.figY), anim: state.body.anim, entering, inside: window.__in }); })()`));
  console.log(`  clicked past it: the plan ${JSON.stringify(plan)}; ended ${JSON.stringify(end)}`);
  ok("a click there plans a way round the cauldron (more than one leg)", !!plan && plan.length > 2, plan);
  ok("and walks it, never inside the cauldron, to the spot clicked", Math.abs(end.x - at.to) <= 2 && Math.abs(end.z - at.z) <= 2 && !end.inside.length && !end.entering, { end, to: at.to, z: at.z });
  // 👆 off: no glow, no walk
  await ev(`(() => { state.access.clickWalk = false; const B = state.background; B.figX = ${at.from}; B.figY = ${at.z} - SCENE.ground; changed(); return 1; })()`);
  await mouse("mouseMoved", at.target[0] + 3, at.target[1]); await sleep(150); const offSpot = await spot();
  await mouse("mousePressed", at.target[0], at.target[1], 1); await mouse("mouseReleased", at.target[0], at.target[1], 0); await sleep(1500);
  const still = JSON.parse(await ev(`JSON.stringify(Math.round(state.background.figX))`));
  ok("👆 off: no glow, and a click on the floor walks nowhere", offSpot === null && still === at.from, { offSpot, still, from: at.from });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
