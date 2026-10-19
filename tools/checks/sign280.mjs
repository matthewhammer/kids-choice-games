// (ticket 280, Matthew: "the automatic sign (with labeled boards) should provide a nav action on those boards, like
// the nav arrows do already"; "click is a nav action, and drag is still moving the sign post and not navigating yet")
// A signpost put in the world's square: a press let go on one of its boards (one nothing covers) starts the trip that
// way, as its nav arrow does; a press on a board dragged 40 pixels moves the signpost and starts no trip. The pointer
// events go to whatever is under the point, as a real press's do. Exits 1 on a failure or page error.
//   node sign280.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
// (the page's own: a signpost in the square the friend is in, the friend away to the left; a board nothing covers)
const SETUP = `(async () => { const tick = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true;
  const W = state.world; if (!W.at || !W.cells[W.at]) { worldEnter(W.start && W.cells[W.start] ? W.start : Object.keys(W.cells)[0]); await tick(400); }   // (ticket 369: no square yet at load, as 0.0.296 starts)
  state.background.kind = W.cells[W.at].kind; state.background.figX = -250; changed(); await tick(400);
  state.background.things = [{ kind: "signpost", x: 60, z: SCENE.ground + 10, size: 100, mirror: false, seed: 1234 }]; changed(); await tick(600);
  const b = [...document.querySelectorAll("#pic .sign-board")].map(b => { const r = b.getBoundingClientRect(), x = r.x + r.width * 0.6, y = r.y + r.height / 2, el = document.elementFromPoint(x, y);
    return { way: b.dataset.way, x, y, top: !!(el && el.closest(".sign-board") === b) }; }).find(b => b.top);
  return JSON.stringify({ at: W.at, board: b || null, to: b ? worldMeets(W, W.at, b.way) : null }); })()`;
const press = (moves) => `(async () => { const tick = ms => new Promise(r => setTimeout(r, ms));
  const b = [...document.querySelectorAll("#pic .sign-board")].map(b => { const r = b.getBoundingClientRect(), x = r.x + r.width * 0.6, y = r.y + r.height / 2, el = document.elementFromPoint(x, y);
    return { x, y, el, top: !!(el && el.closest(".sign-board") === b) }; }).find(b => b.top);
  const fire = (type, x, y) => (document.elementFromPoint(x, y) || b.el).dispatchEvent(new PointerEvent(type, { bubbles: true, isPrimary: true, pointerId: 7, clientX: x, clientY: y, button: 0, buttons: type === "pointerup" ? 0 : 1 }));
  fire("pointerdown", b.x, b.y); for (let i = 1; i <= ${moves}; i++) { fire("pointermove", b.x - 4 * i, b.y); await tick(20); }
  fire("pointerup", b.x - 4 * ${moves}, b.y); await tick(800);
  return JSON.stringify({ entering: !!entering, x: (state.background.things[0] || {}).x }); })()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const s = JSON.parse(await ev(SETUP));
  say(!!s.board, s.board ? `a board nothing covers: ${s.board.way}, to ${s.to}` : "no board on top to press");
  if (s.board) {
    const drag = JSON.parse(await ev(press(10)));
    say(!drag.entering && drag.x !== 60, `a board dragged 40 px: the signpost moved (x 60 -> ${drag.x}), no trip`);
    const click = JSON.parse(await ev(press(0)));
    say(click.entering, `a board pressed and let go: the trip ${s.board.way} has begun`);
  }
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
