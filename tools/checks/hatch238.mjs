// (ticket 238, Matthew: "there's a layering issue when we use the trap door ladders in the tree house: we get (the main
// char) gets drawn below the ladder, the trap door flap, and we don't visibly go into the hole") A tree room's hatch
// (its lid, its hole, its ladder's top) stands at the hole's far edge: climbing down it the friend is drawn over it,
// cut off at the hole's near edge as they go down; standing behind the hole, behind its lid. Exits 1 on a failure.
//   node hatch238.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 800)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    const settle = async () => { changed(); await w(400); measureMarks(); };
    state.music.mute = true; state.world.at = null; state.body.facing = "front"; state.body.anim = "none";
    let room = null, L = null;
    for (let i = 1; i <= 6 && !room; i++) { Object.assign(B, { kind: "treeroom", houses: 6, inside: i, figX: 0, figY: 0, things: [] }); await settle();
      const p = marks.pics.find(q => q.kind === "ladder" && q.el.dataset.down !== undefined); if (p) { room = i; L = p; } }
    if (!room) return JSON.stringify({ none: true });
    // (drawn after: later in the picture; the friend's pieces, the first of them)
    const hatch = () => bgShown.node.querySelector('[data-obj="hatch"]'), fig = () => document.getElementById("figure");
    const after = () => { const h = hatch(), f = fig(); return !!(h && f && (h.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)); };
    const hz = +hatch().dataset.z, [hx0, hx1, hb, hf] = bgShown.node.querySelector("[data-hole]").dataset.hole.split(" ").map(Number);
    // standing behind the hole: behind its lid
    B.figX = Math.round((hx0 + hx1) / 2); B.figY = Math.round(hb - 30 - g); await settle(); const behind = after();
    // climbing down it, from its near edge
    B.figX = Math.round(L.spot[0]); B.figY = Math.round(L.spot[1] - g); await settle();
    enterPicture(); let during = null, clipped = false; const t0 = performance.now();
    while (performance.now() - t0 < 8000) { await w(60); if (climb && climb.down && climb.got < 0 && during === null) during = after(); if (document.querySelector("#pic g.fig-clip")) clipped = true; if (B.inside !== room && !entering) break; }
    return JSON.stringify({ room, hatchZ: Math.round(hz), hole: [Math.round(hb), Math.round(hf)], behind, during, clipped, to: B.inside }); })()`));
  if (r.none) ok("a tree room with a trapdoor found", false, r);
  else {
    ok("the hatch stands at the hole's far edge (its lid's foot)", Math.abs(r.hatchZ - r.hole[0]) <= 1, r);
    ok("standing behind the hole: the friend behind the hatch (its lid in front)", r.behind === false, r);
    ok("climbing down it: the friend drawn over the hatch, its ladder and its lid, and cut off at the near edge", r.during === true && r.clipped, r);
    ok("and down into the room below", r.to !== r.room, r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
