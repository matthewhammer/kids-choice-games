// (ticket 199, Matthew 2026-10-17) The pointer picks a passage: over one,
// or near where a nav arrow would be, it is the bright one; a click takes
// it, the friend walking (swimming, in deep water) to it first, a far
// picture too; and a tree house's trapdoor ladder is climbed down, out of
// sight below its edge, into the room below. Exits 1 on a failure.
//   node nav199.mjs <devtools port> <url>
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
const move = (x, y) => send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
const click = async (x, y) => { await move(x, y); await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 }); };
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; const settle = async () => { changed(); await w(400); measureMarks(); await w(50); };`;
const until = async (cond, ms = 9000) => { for (let t = 0; t < ms; t += 100) { if (await ev(cond)) return t; await sleep(100); } return null; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // in the clearing (D4), standing in its middle: the wood path's sign far off, under the pointer
  const at = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3"); B.figX = 0; B.figY = 0; await settle();
    const s = marks.pics.find(p => p.kind === "sign" && p.el.dataset.to === "woodpath"); if (!s) return JSON.stringify({ none: marks.pics.map(p => p.kind + ":" + (p.el.dataset.to || "")) });
    const r = (s.el.querySelector("rect") || s.el).getBoundingClientRect(), nearBefore = (enterTarget() || { el: null }).el === s.el;
    const P = pic.getScreenCTM(), e = marks.pics.find(p => p.kind === "nav" && p.el.dataset.way === "E"), es = new DOMPoint(e.spot[0], e.spot[1]).matrixTransform(P);
    return JSON.stringify({ sx: r.left + r.width / 2, sy: r.top + r.height / 2, nearBefore, ex: es.x, ey: es.y }); })()`));
  if (at.none) ok("the clearing's wood path sign found", false, at);
  else {
    await move(at.sx, at.sy); await sleep(300);
    const hov = JSON.parse(await ev(`JSON.stringify({ it: !!enterAt && enterAt.el.dataset.to === "woodpath" && enterAt.kind === "sign", bright: !!enterGlow && !!enterGlow.parentNode && enterGlow.parentNode.dataset.to === "woodpath" })`));
    ok("the pointer over the wood path's sign, far off: it is the bright one, X's to take", !at.nearBefore && hov.it && hov.bright, { at, hov });
    await move(at.ex - 10, at.ey + 6); await sleep(300);
    const navH = JSON.parse(await ev(`(() => { const a = document.querySelector('#ways .way-arrow[data-way="E"]'); return JSON.stringify({ aimed: !!a && a.classList.contains("aimed"), opacity: a ? getComputedStyle(a).opacity : null }); })()`));
    ok("the pointer near where the nav arrow E would be: it shows, the one picked", navH.aimed && navH.opacity === "1", navH);
    await move(at.sx, at.sy); await sleep(200); await click(at.sx, at.sy);
    await sleep(350);
    const mid = JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, x: state.background.figX, y: state.background.figY, anim: state.body.anim })`));
    const took = await until(`state.background.kind === "woodpath" && !entering`);
    ok("a click on it: the friend walks to it first, then through to the wood path", mid.kind === "clearing" && (mid.x !== 0 || mid.y !== 0) && mid.anim === "walk" && took !== null, { mid, took });
  }
  // a picture far off in the living room: walked to, then flown into
  const lr = JSON.parse(await ev(`(async () => { ${H} B.kind = "livingroom"; B.figX = -330; B.figY = 60; await settle();
    const p = marks.pics.filter(q => q.kind === "picture").sort((a, b) => Math.abs((b.x0 + b.x1) / 2 + 330) - Math.abs((a.x0 + a.x1) / 2 + 330))[0];
    if (!p) return JSON.stringify({ none: true }); const r = p.el.querySelector(":scope > svg, :scope > image").getBoundingClientRect();
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, to: p.el.dataset.to }); })()`));
  if (!lr.none) {
    await click(lr.x, lr.y); await sleep(350);
    const mid = JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, x: state.background.figX, anim: state.body.anim })`));
    const took = await until(`state.background.kind !== "livingroom" && !entering`, 10000);
    ok("a picture far off in the living room: walked to first, then flown into", mid.kind === "livingroom" && mid.x > -330 && mid.anim === "walk" && took !== null, { lr, mid, took });
  } else ok("a picture in the living room", false, lr);
  // the duck pond: in deep water, the walk to the nearest passage swims
  const pond = JSON.parse(await ev(`(async () => { ${H} worldEnter("2,3"); await w(300); const ys = []; for (let y = -200; y < 80; y += 4) if (inWater(B, 0, SCENE.ground + y)) ys.push(y);
    B.figX = 0; B.figY = ys[Math.floor(ys.length / 2)] ?? 0; await settle(); const seen = new Set(); padDoor();
    for (let i = 0; i < 20; i++) { await w(60); if (deepHere()) seen.add(state.body.anim); }
    await new Promise(r => { const t0 = performance.now(); const f = () => (!entering || performance.now() - t0 > 9000) ? r() : setTimeout(f, 100); f(); });
    return JSON.stringify({ deep: ys.length, seen: [...seen] }); })()`));
  ok("in the duck pond's deep water, the walk to a passage swims", pond.deep > 0 && pond.seen.includes("swim") && !pond.seen.includes("walk"), pond);
  // a tree house's trapdoor: climbed down, out of sight below its edge, into the room below
  const hatch = JSON.parse(await ev(`(async () => { ${H} let found = null;
    for (let i = 1; i <= 6 && !found; i++) { Object.assign(B, { kind: "treeroom", houses: 6, inside: i, figX: 0, figY: 0 }); await settle(); const L = marks.pics.find(p => p.kind === "ladder" && p.el.dataset.down !== undefined); if (L) found = { i, L }; }
    if (!found) return JSON.stringify({ none: true });
    B.figX = Math.round(found.L.spot[0]); B.figY = Math.round(found.L.spot[1] - SCENE.ground); await settle();
    const aimed = (enterTarget() || { el: null }).el === found.L.el; enterPicture();
    let sawDown = false, clipped = false; const t0 = performance.now();
    while (performance.now() - t0 < 8000) { await w(80); if (climb && climb.down) sawDown = true; if (document.querySelector("#pic g.fig-clip")) clipped = true; if (B.inside !== found.i && !entering) break; }
    return JSON.stringify({ from: found.i, to: B.inside, aimed, sawDown, clipped, ms: Math.round(performance.now() - t0), kind: B.kind }); })()`));
  ok("a tree house's trapdoor: aimed from its edge; X climbs down it, cut off below its edge, into the room below within 6 s", !hatch.none && hatch.aimed && hatch.sawDown && hatch.clipped && hatch.to !== hatch.from && hatch.kind === "treeroom" && hatch.ms < 6000, hatch);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
