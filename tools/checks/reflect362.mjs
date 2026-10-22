// (ticket 362, Matthew: "every channel (esp useful for dups) should offer a reflection setting. similar to transpose, but
// extended") On couch-cushion rave A (D major), its first hook: in key 2 steps up, every note a third above and still in D
// major; mirrored, in key and its contour turned over; backward, the same notes; a canon, 8 steps later; a counter against
// the first bass, in key, only thirds and sixths from the bass note sounding. Each pitched channel has the chooser. Exits 1.
//   node reflect362.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), id = "cushionsA";
    state.music.mute = true; state.music.track = id; if (state.music.mix) delete state.music.mix[id]; changed(); await w(300);
    const S = () => songOf(id), hi = () => S().T.parts.findIndex(q => q.name === "hookA"), notes = () => S().events.filter(e => e.part === hi()).map(e => [e.at, ...(e.notes || [])]);
    const D = [2, 4, 6, 7, 9, 11, 1], inD = L => L.every(x => x.slice(1).every(m => D.includes(((m % 12) + 12) % 12)));
    const setR = q => { chan(id, "hookA·lead").reflect = q; };
    const base = notes(); setR({ mode: "key", n: 2 }); const k2 = notes(); setR({ mode: "mirror" }); const mi = notes(); setR({ mode: "back" }); const bk = notes();
    setR({ mode: "canon", n: 2 }); const ca = notes(); setR({ mode: "counter", follow: "bassA·buzz" }); const ct = notes();
    const s = S(), h = s.T.parts[hi()], bi = s.T.parts.findIndex(q => q.name === "bassA"), bs = s.T.parts[bi];
    const ivs = [...new Set(s.events.filter(e => e.part === hi()).map(e => { const L = s.events.filter(q => q.part === bi && q.at <= e.at && e.at < q.at + (q.len || 1)); if (!L.length) return null;
      return (((e.notes[0] + (h.shift || 0) - Math.max(...L.flatMap(q => q.notes)) - (bs.shift || 0)) % 12) + 12) % 12; }).filter(x => x !== null))];
    setR({ mode: "none" });
    const tab = [...document.querySelectorAll("button")].find(b => /Music/.test(b.textContent)); if (tab) tab.click(); await w(500);
    return JSON.stringify({ base: base.slice(0, 4), inKey: [inD(base), inD(k2), inD(mi), inD(ct)], thirds: k2.slice(0, 8).every((x, i) => [3, 4].includes(x[1] - base[i][1])),
      turned: (base[1][1] - base[0][1]) * (mi[1][1] - mi[0][1]) < 0, backSame: bk.map(x => x[1]).sort().join() === base.map(x => x[1]).sort().join(),
      canon: ca[0][0] - base[0][0], ivs, choosers: document.querySelectorAll('[title="how this part is reflected"]').length }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("in key, mirror and counter stay in D major", r.inKey.every(Boolean), r.inKey);
  ok("in key 2 steps up: a third above", r.thirds, r.thirds);
  ok("mirror turns the contour over", r.turned, r.turned);
  ok("backward: the same notes", r.backSame, r.backSame);
  ok("a canon of 2 beats: 8 steps later", r.canon === 8, r.canon);
  ok("a counter: only thirds and sixths against the bass", r.ivs.length > 0 && r.ivs.every(v => [3, 4, 8, 9].includes(v)), r.ivs);
  ok("a chooser on each pitched channel", r.choosers >= 8, r.choosers);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
