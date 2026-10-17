// (ticket 254, Matthew: "the dragging performance issue we had in prior days is re-surfacing, but now with placed
// objects in the scene designer. when we drag them, the music pauses and glitches") A placed thing dragged with a real
// mouse (the forest, 15 rocks, as in his save): it moves on the screen at every move, the picture is drawn for real
// only a few times a second (a drawing at each move cost five times a friend's drag), and let go, it is where it was
// let go, drawn there, its transform gone. Exits 1 on a failure.
//   node dragthing254.mjs <devtools port> <url>
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
const ROCKS = [[-260, 330], [-68, 359], [125, 388], [-203, 347], [-10, 376], [182, 335], [-146, 364], [47, 393], [308, 371], [-88, 381], [104, 340], [-224, 369], [-31, 398], [327, 325], [-166, 386]];
const mouse = (type, x, y, buttons = 0) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const at = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world = clone(DEFAULTS.world); const key = Object.keys(state.world.cells).find(k => state.world.cells[k].kind === "forest"); worldEnter(key); await w(400);
    B.things = ${JSON.stringify(ROCKS)}.map(([x, z], i) => ({ kind: "rock", x, z, seed: 900 + i, size: 100, mirror: false, tone: ROCK_TONES[i % ROCK_TONES.length] })); changed(); await w(600);
    window.__draws = 0; const d0 = draw; window.draw = function (...a) { window.__draws++; return d0.apply(this, a); };
    // (a point on rock 7 where it is the topmost thing: rocks overlap, and the press takes what is on top)
    const rock = bgShown.node.querySelector('[data-drag="thing:6"]'), r = rock.getBoundingClientRect();
    let p = null; for (const [u, v] of [[0.5, 0.5], [0.5, 0.3], [0.3, 0.5], [0.7, 0.5], [0.5, 0.7], [0.3, 0.3], [0.7, 0.3]]) { const x = r.left + r.width * u, y = r.top + r.height * v, el = document.elementFromPoint(x, y);
      if (el && el.closest('[data-drag="thing:6"]')) { p = [x, y]; break; } }
    if (!p) return JSON.stringify({ none: true });
    return JSON.stringify({ x: p[0], y: p[1], t: [B.things[6].x, B.things[6].z] }); })()`));
  if (at.none) throw new Error("no point on rock 7 that is on top");
  // (a drag of 150 moves, about 2.4 s; halfway, how it is shown)
  await mouse("mouseMoved", at.x, at.y); await mouse("mousePressed", at.x, at.y, 1);
  let mid = null;
  for (let i = 1; i <= 150; i++) {
    await mouse("mouseMoved", at.x + i * 1.2, at.y + i * 0.4, 1); await sleep(16);
    if (i === 75) mid = JSON.parse(await ev(`(() => { const el = bgShown.node.querySelector('[data-drag="thing:6"]'), h = el && el.closest("[data-obj]"); return JSON.stringify({ tf: h && h.getAttribute("transform"), t: [state.background.things[6].x, state.background.things[6].z] }); })()`));
  }
  const during = await ev("window.__draws");
  await mouse("mouseReleased", at.x + 180, at.y + 60, 0); await sleep(500);
  const end = JSON.parse(await ev(`(() => { const T = state.background.things[6], el = bgShown.node.querySelector('[data-drag="thing:6"]'), h = el && el.closest("[data-obj]");
    return JSON.stringify({ t: [T.x, T.z], tf: h && h.getAttribute("transform"), drawnZ: h && h.dataset.z, saved: JSON.parse(localStorage.getItem("dress-up-v1") || "{}").background?.things?.[6] }); })()`));
  console.log(`  draws during the 150 moves: ${during}; halfway ${JSON.stringify(mid)}; let go ${JSON.stringify(end)}`);
  ok("while dragged, the rock moves on the screen by a transform of its own drawing, and its place follows the mouse", !!(mid && mid.tf && /translate/.test(mid.tf)) && mid.t[0] !== at.t[0], mid);
  ok("the picture drawn for real only a few times a second, not at each of the 150 moves", during > 3 && during <= 25, during);
  ok("let go: the rock where it was let go, drawn there (its depth), no transform left, and saved", end.t[0] > at.t[0] + 100 && !end.tf && Math.abs(+end.drawnZ - end.t[1]) < 1 && end.saved && end.saved.x === end.t[0], end);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
