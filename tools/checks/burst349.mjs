// (ticket 349, for N) In the trap room, standing on the right pit as its boulder falls: the friend bursts into a stack of
// rainbow bubbles (hidden, 40 or more bubbles), which pop one by one, and then the friend is back, shown again and free to
// move, within a few seconds. Exits 1 on a failure.
//   node burst349.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.things = [];
    B.kind = "castleroom"; B.castleRoom = castleOf(B).rooms.indexOf("trap") + 1; changed(); await w(500);
    const n = B.castleRoom, K = castleOf(B);
    if (trapState(B, n, K.id).covered[1]) { roomBoulderPull("R"); await w(2500); }
    const lid = bgShown.node.querySelector('.pit-lid[data-pit-i="1"]') || bgShown.node.querySelector('[data-boulder="1"]'), P = pic.getScreenCTM().inverse(), rr = lid.getBoundingClientRect();
    const mid = new DOMPoint(rr.left + rr.width / 2, rr.top + rr.height * 0.6).matrixTransform(P);
    B.figX = Math.round(mid.x); B.figY = Math.round(mid.y - SCENE.ground); changed(); await w(300);
    roomBoulderPull("R");
    let most = 0, burst = false, hidden = false, back = null; const t0 = performance.now();
    while (performance.now() - t0 < 8000) { await w(60);
      if (figBurst) { burst = true; most = Math.max(most, document.querySelectorAll("#friend-burst > g").length);
        const f = document.getElementById("figure"); if (f && f.style.visibility === "hidden") hidden = true; }
      else if (burst && !entering) { back = Math.round(performance.now() - t0); break; } }
    const f = document.getElementById("figure");
    return JSON.stringify({ burst, most, hidden, back, shown: f ? f.style.visibility !== "hidden" : null }); })()`));
  console.log(`  a boulder on the friend: ${JSON.stringify(r)}`);
  ok("the boulder landing on the friend bursts them into a stack of bubbles", r.burst && r.most >= 40, r);
  ok("the friend hidden while the bubbles spill and pop", r.hidden, r);
  ok("then back, shown and free to move again, within a few seconds", r.back !== null && r.back < 7000 && r.shown, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
