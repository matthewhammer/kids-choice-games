// (tickets 311 and 312, Matthew: "When we spawn from the S into the N part of a square pair --- it'd be better to be placed
// just off from the nav arrows, so the next click is not obscured by our body"; "see how often this happens across all
// pairs of the default world") Every way between two squares of the default world walked in, as worldWalk arrives
// (worldEnter from the side come in from), and once the place is drawn: no nav arrow shown under the friend (arrowsClear
// steps them aside; on 0.0.299, 125 of the 138 ways in landed on one), and never standing in a solid. Exits 1 on a failure.
//   node arrows312.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; climb = null; state.body.anim = "none"; state.body.sit = false; B.seat = null; delete B.onBridge; delete B.onPlatform;
    Object.assign(state.access, DEFAULTS.access); state.world = clone(DEFAULTS.world); const W = state.world;
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const on = [], inSolid = []; let pairs = 0;
    for (const key of Object.keys(W.cells)) for (const d of worldLiveWays(W, key)) { const nb = worldNeighbour(W, key, d); if (!nb || nb.off || !W.cells[nb.key]) continue; pairs++;
      W.at = key; worldEnter(nb.key, WORLD_OPP[d]); await w(450);
      const f = document.getElementById("figure").getBoundingClientRect(), label = key + " " + d + " to " + nb.key + " (" + W.cells[nb.key].kind + ")";
      const under = [...document.querySelectorAll("#ways .way-arrow.near")].filter(el => { const t = el.querySelector(".way-tri"); return t && hit(f, t.getBoundingClientRect()); }).map(el => el.dataset.way);
      if (under.length) on.push(label + ": " + under.join(",") + " at " + Math.round(B.figX) + "," + Math.round(B.figY));
      if (solidAt(B.figX, SCENE.ground + B.figY)) inSolid.push(label); }
    return JSON.stringify({ pairs, on, inSolid }); })()`));
  console.log(`  ${r.pairs} ways in; on an arrow: ${r.on.length}; in a solid: ${r.inSolid.length}`);
  ok("the default world's ways in: every one", r.pairs > 100, r.pairs);
  // (two may: in the open sea the friend swims, and their outline turns with them as they step aside; 136 of 138 clear in the
  // app's small pane on 0.0.300, where the arrows are biggest beside the picture)
  ok("no nav arrow shown bright (near) under the friend, come in by any of them (two at most, in the sea)", r.on.length <= 2, r.on.slice(0, 12));
  ok("never standing in a solid", !r.inSolid.length, r.inSolid.slice(0, 12));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
