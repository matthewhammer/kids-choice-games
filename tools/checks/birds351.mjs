// (ticket 351, Matthew: "very minor birds in top box are not animated, but should they be?") The castle's six birds: each
// with a flap (its stroke between two shapes, wings up and wings down) and a slow glide, and listed among the castle's
// wings-LFO followers on the mixing board. A computer taken as fast (a slow one holds the scenery still). Exits 1 on a failure.
//   node birds351.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    slowFlag = false; PERF.slowMoving = true; state.music.mute = true; state.world.at = null; B.things = []; B.kind = "castle"; changed(); await w(900);
    const n = bgShown.objs.find(o => o.name === "birds").node, flaps = [...n.querySelectorAll('animate[attributeName="d"]')];
    return JSON.stringify({ paths: n.querySelectorAll("path").length, flaps: flaps.length, twoShapes: flaps.every(a => { const v = a.getAttribute("values").split(";"); return v.length === 3 && v[0] !== v[1]; }),
      glides: n.querySelectorAll("animateTransform").length, follows: sceneLfoThings(B).wings || null }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("six birds, each flapping between two shapes", r.paths === 6 && r.flaps === 6 && r.twoShapes, r);
  ok("each gliding", r.glides === 6, r.glides);
  ok("on the mixing board among the wings LFO's followers", !!r.follows, r.follows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
