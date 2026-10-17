// (ticket 216, Matthew: "we trigger going 'down' the ladder by pressing up,
// and animating an upward climb; that's backwards", "clip the body like the
// pit room", "show doors on the treehouse ... they open like the castle
// doors ... and we walk through them") With the on-screen controller: in a
// tree house room with a trapdoor, ⬆ at the hatch no longer climbs up its
// ladder's top; ⬇ there climbs down it, cut off below the hatch's edge, into
// the house below; ⬆ at a ladder that goes up still climbs it; and a door
// in a side wall swings open as it is taken, the friend through to the next
// house. Exits 1 on a failure.
//   node treehouse216.mjs <devtools port> <url>
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
const until = async (cond, ms = 9000) => { for (let t = 0; t < ms; t += 100) { if (await ev(cond)) return t; await sleep(100); } return null; };
// in the page: a fresh room, settled; a pad button held a while
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; const settle = async () => { changed(); await w(400); measureMarks(); await w(50); };
  const room = async i => { state.body.anim = "none"; climb = null; Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: i, figX: 0, figY: 0 }); await settle(); };
  const press = async (b, ms) => { touchWant(true); const p = touchPad.pad.buttons[b]; p.pressed = true; p.value = 1; await w(ms); p.pressed = false; p.value = 0; await w(120); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; return 1; })()`);
  // a room with a hatch, and one with a ladder that goes up
  const found = JSON.parse(await ev(`(async () => { ${H} const out = { hatch: null, up: null, side: null };
    for (let i = 1; i <= 6; i++) { await room(i);
      if (!out.hatch && marks.ladders.some(L => L.down != null && L.door)) out.hatch = i;
      if (!out.up && marks.ladders.some(L => L.down == null && L.door)) out.up = i;
      if (!out.side && bgShown.node.querySelector('.portal[data-to="treeroom"][data-door] [data-leaf]')) out.side = i; }
    return JSON.stringify(out); })()`));
  ok("a tree house room with a trapdoor, one with a ladder up, one with a door in a side wall", found.hatch && found.up && found.side, found);
  if (found.hatch) {
    // ⬆ at the hatch: nothing climbed
    const upAt = JSON.parse(await ev(`(async () => { ${H} await room(${found.hatch}); const L = marks.ladders.find(L => L.down != null && L.door);
      B.figX = Math.round(L.x); B.figY = Math.round(L.z - SCENE.ground); await settle(); await press(12, 300);
      const r = { climb: climb ? { down: !!climb.down, manual: !!climb.manual } : null, anim: state.body.anim, inside: B.inside, kind: B.kind }; state.body.anim = "none"; climb = null; return JSON.stringify(r); })()`));
    ok("⬆ at the trapdoor no longer climbs up its ladder's top", !upAt.climb && upAt.anim !== "climbup" && upAt.inside === found.hatch, upAt);
    // ⬇ at the hatch: down it, cut off, into the house below
    const before = await ev(`(async () => { ${H} await room(${found.hatch}); const L = marks.ladders.find(L => L.down != null && L.door);
      window.__to = L.door.house || L.door.to; B.figX = Math.round(L.x); B.figY = Math.round(L.z - SCENE.ground); await settle(); press(13, 200); return window.__to; })()`);
    const tDown = await until(`!!(climb && climb.down && state.body.anim === "climbup")`, 1500);
    ok("⬇ at the trapdoor starts the climb down it", tDown !== null, { tDown });
    const tClip = await until(`!!pic.querySelector(".fig-clip")`, 2500);
    ok("on the way down, the friend is cut off below the hatch's near edge (a clip, as the pits do)", tClip !== null, { tClip });
    const tBelow = await until(`state.background.kind !== "treeroom" || String(state.background.inside) === String(window.__to)`, 9000);
    const after = JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, inside: state.background.inside })`));
    ok("and through, to where the trapdoor leads", tBelow !== null, { to: before, after });
  }
  if (found.up) {
    const up = JSON.parse(await ev(`(async () => { ${H} await room(${found.up}); const L = marks.ladders.find(L => L.down == null && L.door);
      B.figX = Math.round(L.x); B.figY = Math.round(L.z - SCENE.ground); await settle(); await press(12, 200);
      const r = { climb: climb ? { down: !!climb.down, manual: !!climb.manual } : null, anim: state.body.anim }; state.body.anim = "none"; climb = null; return JSON.stringify(r); })()`));
    ok("⬆ at a ladder that goes up still climbs it", up.climb && up.climb.manual && !up.climb.down && up.anim === "climbup", up);
  }
  if (found.side) {
    const to = await ev(`(async () => { ${H} await room(${found.side}); const d = bgShown.node.querySelector('.portal[data-to="treeroom"][data-door]');
      window.__to = d.dataset.house; enterScene(d); return d.dataset.house; })()`);
    const tOpen = await until(`!!(bgShown.node && bgShown.node.querySelector('.portal[data-door] [data-leaf] path animate'))`, 3000);
    ok("the door in the side wall swings open as it is taken", tOpen !== null, { tOpen });
    const tThrough = await until(`String(state.background.inside) === String(window.__to)`, 9000);
    ok("and the friend goes through, to the next house", tThrough !== null, { to, inside: await ev("String(state.background.inside)") });
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
