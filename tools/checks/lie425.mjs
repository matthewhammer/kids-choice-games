// (ticket 425) Lying along the orange tent's sleeping bags, the friend keeps their own hair style: each style draws hair
// (none draws none), long hair and an afro reach wider than short, pigtails stay on the bag at their longest on both bags,
// and a part half see-through is drawn so. Exits 1 on a failure.
//   node lie425.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, Hr = state.hair, out = {};
    state.music.mute = true; state.world.at = null; climb = null; state.body.sit = false; B.seat = null; B.things = [];
    B.kind = "tent"; B.tent = 1; B.figX = 0; B.figY = 40; changed(); await w(500);
    const P = () => pic.getScreenCTM().inverse(), box = el => { const q = el.getBoundingClientRect(), a = new DOMPoint(q.left, q.top).matrixTransform(P()), c = new DOMPoint(q.right, q.bottom).matrixTransform(P()); return [a.x, a.y, c.x, c.y]; };
    const hairOf = () => { const v = document.querySelector('#figure [data-lie="along"]'), hd = v && v.querySelector("circle.lie-head"); if (!v || !hd) return null;
      const n = [...v.querySelectorAll("*")].filter(e => (e.getAttribute("fill") || "") === Hr.color || (e.getAttribute("stroke") || "") === Hr.color);
      const bs = n.map(box); return { n: n.length, w: bs.length ? Math.max(...bs.map(b => b[2])) - Math.min(...bs.map(b => b[0])) : 0, x0: bs.length ? Math.min(...bs.map(b => b[0])) : 0, x1: bs.length ? Math.max(...bs.map(b => b[2])) : 0 }; };
    for (const st of ["none", "short", "long", "curly", "spiky", "afro", "pigtails"]) { sitOn(placeSeats(B)[0]); Object.assign(Hr, { style: st, length: 100, bangs: 100 }); changed(); await w(200); out[st] = hairOf(); }
    out.edges = [];
    for (const i of [0, 1]) { const t = placeSeats(B)[i]; sitOn(t); Object.assign(Hr, { style: "pigtails", length: 400 }); changed(); await w(200); const h = hairOf(), bag = [...document.querySelectorAll("#pic [data-obj]")].find(e => (e.getAttribute("data-obj") || "") === t.name);
      out.edges.push({ hair: h && [Math.round(h.x0), Math.round(h.x1)], bag: bag ? box(bag).map(Math.round) : null }); }
    Object.assign(Hr, { style: "long", length: 100 }); state.visible = { ...(state.visible || {}), shirt: 50 }; sitOn(placeSeats(B)[0]); changed(); await w(200);
    out.seeThrough = [...document.querySelectorAll('#figure [data-lie="along"] g[opacity]')].map(g => g.getAttribute("opacity"));
    state.visible = { ...(state.visible || {}), shirt: 100 }; standUp(); changed();
    return JSON.stringify(out); })()`));
  console.log(`  the hair lying: ${JSON.stringify(r)}`);
  const styles = ["short", "long", "curly", "spiky", "afro", "pigtails"];
  ok("every style draws hair lying on the pillow, and none draws none", styles.every(s => r[s] && r[s].n > 0) && r.none && r.none.n === 0, r);
  ok("long hair and an afro reach wider than short hair", r.long.w > r.short.w && r.afro.w > r.short.w, r);
  ok("pigtails at their longest stay on the bag, on both bags", r.edges.every(e => e.hair && e.bag && e.hair[0] >= e.bag[0] - 12 && e.hair[1] <= e.bag[2] + 12), r.edges);
  ok("the shirt half see-through is drawn so", r.seeThrough.includes("0.50"), r.seeThrough);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
