// (ticket 184: the controller audit read the tree house and the healer's hut STUCK since 0.0.189 at least: the friend
// arrived inside the healer's tea table, and in the tree house picked from the menu inside its trunk, where a step
// toward a solid's middle never lets them out) Every place picked from the menu, as a player picks it: the friend,
// once it is drawn, stands in no solid, and a step one way or the other moves them (beside a solid, the step toward it
// is rightly blocked). Exits 1 on a failure.
//   node arrive184.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground, out = [];
    state.music.mute = true; state.world.at = null;
    for (const kind of PLACES.map(p => p[0]).filter(k => k !== "none")) {
      Object.assign(B, { kind: "none" }); changed(); await w(60);
      set("background", "kind", kind); await w(500);
      const x = B.figX, z = B.figY, inSolid = (solidAt(x, g + z) || {}).name || null;
      const right = solidMove(x, z, x + 4, z)[0] - x, left = solidMove(x, z, x - 4, z)[0] - x;
      out.push({ kind, at: [Math.round(x), Math.round(z)], arrive: ARRIVE[kind] || [0, 0], inSolid, right: Math.round(right * 10) / 10, left: Math.round(left * 10) / 10 });
    }
    return JSON.stringify(out); })()`));
  for (const p of r) if (p.inSolid || (p.right <= 0 && p.left >= 0) || p.at[0] !== p.arrive[0]) console.log(`  ${p.kind}: arrives at ${JSON.stringify(p.at)} (its ARRIVE ${JSON.stringify(p.arrive)}), in ${p.inSolid || "nothing"}; a step right ${p.right}, left ${p.left}`);
  ok("every place picked from the menu: the friend in no solid", r.every(p => !p.inSolid), r.filter(p => p.inSolid));
  ok("and free to step one way or the other", r.every(p => p.right > 0 || p.left < 0), r.filter(p => !(p.right > 0 || p.left < 0)));
  ok("the tree house's friend beside its trunk, the healer's beside the tea table: moved from where they arrive", ["treehouse", "healerroom"].every(k => { const p = r.find(q => q.kind === k); return p && p.at[0] !== p.arrive[0]; }), r.filter(p => ["treehouse", "healerroom"].includes(p.kind)));
  ok("the tree house and the healer's hut among them", ["treehouse", "healerroom"].every(k => r.some(p => p.kind === k)), r.map(p => p.kind));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
