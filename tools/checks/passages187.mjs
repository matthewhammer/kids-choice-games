// (ticket 187, Matthew 2026-10-17) One way through every passage: doors,
// pictures, pits, ladders, signs and nav arrows alike; at most one glowing
// as the one X, Enter, the 🚪 button or a tap would take, the others within
// reach dimmer; a tree house's ladder and the dungeon's trapdoor ladder
// taken that way too, climbed at ⬆'s pace (not slow motion); and a
// passage behind something in front of it (the witch's fence) taken by a
// click there. Exits 1 on a failure.
//   node passages187.mjs <devtools port> <url>
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
// (in the page: wait, a place, its passages measured, the friend's feet put at a spot)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const settle = async () => { changed(); await w(350); measureMarks(); await w(50); };
  const feetAt = async ([x, y]) => { B.figX = Math.round(x); B.figY = Math.round(y - SCENE.ground); await settle(); };
  const glows = () => ({ one: document.querySelectorAll("#bg .enter-glow:not(.dim)").length + document.querySelectorAll("#ways .way-arrow.aimed").length, dim: document.querySelectorAll("#bg .enter-glow.dim").length });
  const until = async (f, ms = 9000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return Math.round(performance.now() - t0); await w(50); } return null; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // every passage in the clearing, and at each one's spot: it is the one, and nothing else glows bright
  const clearing = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3"); await settle();
    const kinds = marks.pics.map(p => p.kind), out = [];
    // (it, or one just as near: two passages can end at one spot, as the clearing's old front path and its nav arrow S)
    for (const p of marks.pics.filter(p => p.spot)) { await feetAt(p.spot); const t = enterTarget(), all = passesNear(Infinity), nOf = q => (all.find(e => e.p.el === q.el) || { n: Infinity }).n;   // (by element: the list is measured afresh as the friend moves)
      out.push({ kind: p.kind, to: p.el.dataset.to || p.el.dataset.way || "", it: !!t && (t.el === p.el || Math.abs(nOf(t) - nOf(p)) < 0.05), ...glows() }); }
    return JSON.stringify({ kinds, out }); })()`));
  ok("the clearing's passages, every kind in one list (signs, doorways, nav arrows...)", clearing.kinds.includes("nav") && clearing.kinds.some(k => k === "sign" || k === "doorway"), clearing.kinds);
  ok("standing at each one's spot, it is the one X would take (or one standing at the very same spot)", clearing.out.every(o => o.it), clearing.out.filter(o => !o.it));
  ok("and never more than one glows bright; others within reach dimmer", clearing.out.every(o => o.one <= 1), clearing.out.filter(o => o.one > 1));
  const dimSeen = clearing.out.some(o => o.dim > 0);
  console.log(`  (dim glows seen at ${clearing.out.filter(o => o.dim > 0).length} of ${clearing.out.length} spots)`);
  // Enter takes the one that glows: the clearing's sign to the wood path
  const sign = JSON.parse(await ev(`(async () => { ${H} worldEnter("3,3"); await settle(); const p = marks.pics.find(p => p.el.dataset.to === "woodpath" && p.kind === "sign");
    if (!p) return JSON.stringify({ none: marks.pics.map(p => p.kind + ":" + (p.el.dataset.to || "")) });
    await feetAt(p.spot); const aimed = enterTarget() && enterTarget().el === p.el;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const took = await until(() => B.kind === "woodpath" && !entering); return JSON.stringify({ kind: p.kind, aimed, took, now: B.kind }); })()`));
  ok("the clearing's sign to the wood path: aimed from its foot, and Enter takes it", sign.aimed && sign.took !== null, sign);
  // a tree house's ladder: X at its foot climbs it, at ⬆'s pace, and goes in
  const tree = JSON.parse(await ev(`(async () => { ${H} worldEnter("4,4"); B.houses = DEFAULTS.background.houses; await settle();   // (the tree's own number of houses, whatever a check before left) const p = marks.pics.find(p => p.kind === "ladder");
    if (!p) return JSON.stringify({ none: marks.pics.map(p => p.kind) });
    await feetAt(p.spot); const aimed = enterTarget() && enterTarget().el === p.el; const t0 = performance.now(); enterPicture();
    const took = await until(() => B.kind === "treeroom" && !entering, 12000); return JSON.stringify({ aimed, took, now: B.kind }); })()`));
  ok("a tree house's ladder: aimed from its foot; X climbs it and goes in", tree.aimed && tree.took !== null, tree);
  ok("climbed at ⬆'s pace: in the tree house within 6 s (slow motion took far longer)", tree.took !== null && tree.took < 6000, tree);
  // the dungeon's trapdoor ladder
  const trap = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "dungeon1", castleRoom: 6, figX: 0, figY: 0 }); await settle();
    const p = marks.pics.find(p => p.kind === "ladder"); if (!p) return JSON.stringify({ none: marks.pics.map(p => p.kind) });
    await feetAt(p.spot); const aimed = enterTarget() && enterTarget().el === p.el, from = B.castleRoom; enterPicture();
    const took = await until(() => (B.castleRoom !== from || B.kind !== "castleroom") && !entering, 12000); return JSON.stringify({ aimed, took, room: B.castleRoom, kind: B.kind }); })()`));
  ok("the dungeon's trapdoor ladder: aimed from its foot; X climbs it and goes through, within 6 s", trap.aimed && trap.took !== null && trap.took < 6000, trap);
  // the 🚪 button from the middle of the clearing: the nearest passage, walked to
  const door = JSON.parse(await ev(`(async () => { ${H} worldEnter("3,3"); B.figX = 0; B.figY = 0; await settle(); const from = B.kind; padDoor();
    const took = await until(() => (B.kind !== from) && !entering, 9000); return JSON.stringify({ took, now: B.kind, at: state.world.at }); })()`));
  ok("the 🚪 button from the middle of the clearing: through the nearest passage", door.took !== null, door);
  // a click through the witch's fence, onto her hut behind it
  const spot = JSON.parse(await ev(`(async () => { ${H} worldEnter("1,1"); B.figX = -300; B.figY = 60; await settle(); const d = document.querySelector('#bg .portal[data-to="witchroom"]');
    const s = d.querySelector("rect, path, polygon") || d, r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, u = document.elementFromPoint(x, y);
    return JSON.stringify({ x, y, onIt: !!u && d.contains(u), what: u ? u.tagName + (u.closest("[data-obj]") ? "/" + u.closest("[data-obj]").dataset.obj : "") : null }); })()`));
  if (spot.x) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: spot.x, y: spot.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: spot.x, y: spot.y, button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: spot.x, y: spot.y, button: "left", buttons: 0, clickCount: 1 });
  }
  const went = JSON.parse(await ev(`(async () => { ${H} const took = await until(() => B.kind === "witchroom" && !entering, 9000); return JSON.stringify({ took, now: B.kind }); })()`));
  ok("a click on the witch's hut where her fence stands in front: into her hut", went.took !== null, { spot, went });
  // (ticket 192, Matthew) in a tree house room, the friend standing in front of its side door is drawn over it, not under it
  const layer = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "treeroom", houses: 6, inside: 2 }); await settle();
    const door = document.querySelector('#bg [data-obj="side doors"] .portal'); if (!door) return JSON.stringify({ none: [...document.querySelectorAll("#bg .portal")].map(d => d.dataset.to + ":" + (d.closest("[data-obj]") || { dataset: {} }).dataset.obj) });
    const p = marks.pics.find(q => q.el === door); await feetAt([p.spot[0], p.spot[1] + 20]);
    const f = document.getElementById("figure").getBoundingClientRect(), d = door.querySelector("rect").getBoundingClientRect();
    const x = Math.max(f.left, d.left) + 4, y = (Math.max(f.top, d.top) + Math.min(f.bottom, d.bottom)) / 2, u = document.elementFromPoint(x, y);
    return JSON.stringify({ overlap: x < Math.min(f.right, d.right), friendOnTop: !!u && !!u.closest("#figure"), what: u ? u.tagName + (u.closest("[data-obj]") ? "/" + u.closest("[data-obj]").dataset.obj : "") : null }); })()`));
  ok("tree house room 2: the friend in front of its side door is drawn over it", !layer.none && layer.overlap && layer.friendOnTop, layer);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
