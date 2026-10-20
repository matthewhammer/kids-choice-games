// (ticket 443) A braided beard and each beard's length: "braided" draws a full beard gathered into a plait of lobes, facing
// us and in profile; its lobes widen with 🪢 braid width (narrow: apart, with gaps; wide: overlapping, no gaps); 📏 beard
// length lengthens every style below the chin; the braid's width row shows only with the braided style. Exits 1 on a failure.
//   node beard443.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { widths: {}, lengths: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("costume", "kind", "none"); set("hair", "color", "#6f4e37"); set("hair", "beardShade", "#c0612b"); set("hair", "beard", "braided");
    const P = () => pic.getScreenCTM().inverse(), C = "#c0612b";
    const boxOf = e => { const q = e.getBoundingClientRect(), a = new DOMPoint(q.left, q.top).matrixTransform(P()), c = new DOMPoint(q.right, q.bottom).matrixTransform(P()); return [a.x, a.y, c.x, c.y]; };
    const lobes = () => [...document.querySelectorAll("#figure ellipse")].filter(e => e.getAttribute("fill") === C);
    const bottomOf = () => Math.max(...[...document.querySelectorAll("#figure path, #figure ellipse")].filter(e => e.getAttribute("fill") === C).map(e => boxOf(e)[3]));
    state.body.facing = "right"; changed(); await w(80); out.profile = lobes().length; state.body.facing = "front";
    for (const bw of [40, 100, 240]) { set("hair", "braidWidth", bw); changed(); await w(80); const L = lobes(), bs = L.map(boxOf).sort((a, b) => a[1] - b[1]);
      // (gaps: between one lobe's bottom and the next-but-one's top, on the same side, measured along the braid)
      const gaps = bs.slice(2).map((b, i) => b[1] - bs[i][3]);
      out.widths[bw] = { n: L.length, rx: +L[0].getAttribute("rx"), gap: Math.max(...gaps) }; }
    set("hair", "braidWidth", 100);
    for (const style of ["short", "full", "long", "goatee", "braided"]) { set("hair", "beard", style);
      out.lengths[style] = []; for (const len of [50, 100, 200]) { set("hair", "beardLength", len); changed(); await w(60); out.lengths[style].push(Math.round(bottomOf())); } }
    set("hair", "beardLength", 100);
    tab = TABS.findIndex(t => t[1] === "hair"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    set("hair", "beard", "full"); await w(150); out.rowsFull = ["beardLength", "braidWidth"].map(k => shown(k) ? 1 : 0).join("");
    set("hair", "beard", "braided"); await w(150); out.rowsBraided = ["beardLength", "braidWidth"].map(k => shown(k) ? 1 : 0).join("");
    set("hair", "beard", "none");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const W = r.widths;
  ok("the braid: a plait of several lobes facing us and in profile", W[100].n >= 4 && r.profile >= 4, [W[100], r.profile]);
  ok("the braid width widens its lobes", W[40].rx < W[100].rx && W[100].rx < W[240].rx, W);
  ok("narrow, apart with gaps; wide, no gaps", W[40].gap > 0 && W[240].gap <= 0, W);
  ok("the beard length lengthens every style", Object.values(r.lengths).every(([a, b, c]) => a < b && b < c), r.lengths);
  ok("the braid width row shows only with the braided style; the length row with any", r.rowsFull === "10" && r.rowsBraided === "11", [r.rowsFull, r.rowsBraided]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
