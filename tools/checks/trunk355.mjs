// (ticket 355, Matthew: "why can I walk through these collision boxes near the corner, for the tree? Are they too small?") In
// each of the six tree rooms, the trunk's box reaches as far forward as its foot is drawn in the floor (a dark ellipse outside
// its marked trunk shapes, which the box left out, so the feet stood on it), and walking into it from the front, the left and
// the right, by the controller's steps (solidMove), the feet stop outside it. Exits 1 on a failure.
//   node trunk355.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, b = state.body;
    state.music.mute = true; state.world.at = null; climb = null; b.sit = false; B.seat = null; b.pose = "stand"; b.anim = "none"; B.things = [];
    const walk = (x0, y0, dx, dy) => { let x = x0, y = y0; for (let i = 0; i < 150; i++) { const [nx, ny] = solidMove(x, y, x + dx, y + dy); if (nx === x && ny === y) break; x = nx; y = ny; } return [x, y]; };
    const out = {};
    for (let n = 1; n <= 6; n++) { B.kind = "treeroom"; B.inside = n; changed(); await w(450);
      const g = SCENE.ground, t = solidsHere().find(o => o.name === "tree trunk"); if (!t) { out[n] = null; continue; }
      const to = bgShown.objs.find(o => o.name === "tree trunk"), P = pic.getScreenCTM().inverse();
      const foot = [...to.node.querySelectorAll("ellipse")].filter(e => (e.getAttribute("fill") || "") !== "#000" && (e.getAttribute("fill") || "") !== "#000000").map(e => new DOMPoint(0, e.getBoundingClientRect().bottom).matrixTransform(P).y);
      const footBot = foot.length ? Math.max(...foot) : t.front, mid = (t.x0 + t.x1) / 2, [sx] = feetSpan();
      const f = walk(mid, t.front - g + 60, 0, -2), l = walk(t.x0 - 70, (t.back + t.front) / 2 - g, 2, 0), rr = walk(t.x1 + 70, (t.back + t.front) / 2 - g, -2, 0);
      out[n] = { front: t.front - g, footBot: footBot - g, stopFront: f[1], left: l[0] + sx <= t.x0 + 1, right: rr[0] - sx >= t.x1 - 1 }; }
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r));
  const rooms = Object.values(r).filter(Boolean);
  ok("each room's trunk box reaches its foot in the floor", rooms.length === 6 && rooms.every(q => q.front >= q.footBot - 1), r);
  ok("from the front, the feet stop in front of the box", rooms.every(q => q.stopFront >= q.front), r);
  ok("from the left and the right, the soles stop at its sides", rooms.every(q => q.left && q.right), r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
