// (ticket 415, for N) In the trap room, standing on the right pit as its boulder falls: the friend goes to rainbow
// bubbles part by part as the boulder comes down on them, head, then torso, then legs, then feet (the picture's data-burst
// names the parts gone, in that order), the head before the boulder lands, and then the friend is back, every part
// shown again, within a few seconds. Exits 1 on a failure.
//   node burst415.mjs <devtools port> <url>
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
    const seen = [], t0 = performance.now(); let last = null, whole = null, back = null, started = false;
    while (performance.now() - t0 < 8000) { await w(10);
      const a = pic.getAttribute("data-burst"), e = Math.round(performance.now() - t0);
      if (a !== last) { seen.push([e, a]); last = a; }
      if (a) started = true;
      if (figBurst && whole === null) whole = e;
      if (started && !a && !bursting) { back = e; break; } }
    await w(100);
    const shown = ["head", "eyes", "hair", "shirt", "hands", "pants", "feet"].every(p => [...document.querySelectorAll('#figure [data-part="' + p + '"]')].every(el => getComputedStyle(el).visibility !== "hidden"));
    return JSON.stringify({ seen, whole, back, shown }); })()`));
  console.log(`  a boulder on the friend: ${JSON.stringify(r)}`);
  const order = ["head", "torso", "legs", "feet"], gone = r.seen.filter(([, a]) => a).map(([e, a]) => [e, a.split(" ")]);
  const inOrder = gone.length > 0 && gone.every(([, ps]) => ps.every((p, i) => p === order[i]));
  const first = gone[0], all = gone.find(([, ps]) => ps.length === 4);
  ok("the parts go to bubbles in order: head, torso, legs, feet", inOrder && !!all, r.seen);
  ok("part by part: the head goes first, alone, before the rest", first && first[1].length === 1 && all && all[0] > first[0], r.seen);
  ok("seen going one at a time: at least three steps", gone.length >= 3, r.seen);
  ok("then back, every part shown again, within a few seconds", r.back !== null && r.back < 7000 && r.shown, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
