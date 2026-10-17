// (ticket 164 / 177) The still pictures switch on, in Chrome: the duck pond
// on a computer found choppy, the friend moving, its pictures made and
// ready, and the drawings using them. Since 0.0.95 the gate's still-pictures
// case read 0% (Matthew, 2026-10-17: find why, and fix it). When they are
// not ready it says which wait never finished: the <image>'s load, its own
// decode(), or the kept Image's decode(). Exits 1 on a failure.
//   node stills164.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1500)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable"); await send("Page.enable");
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => {
    const wait = ms => new Promise(res => setTimeout(res, ms)), frame = () => new Promise(res => requestAnimationFrame(res));
    state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("2,2"); choppy = true; changed(); await wait(800);
    // (moving, as the controller moves them, for two seconds: the pictures made, then used)
    const move = async ms => { const t0 = performance.now(); let i = 0; while (performance.now() - t0 < ms) { state.background.figX = Math.round(60 * Math.sin(i++ / 20)); moved(); await frame(); } };
    stillPic.draws = stillPic.drawsOn = 0; await move(2000);
    const parts = [...stillPic.parts.values()].map(p => ({ lo: p.lo, hi: p.hi, img: !!p.img, inPage: !!(p.img && p.img.isConnected), ready: !!p.ready }));
    const first = { wanted: stillPicWanted(), still: sceneryStill(), hidden: document.hidden, parts, share: stillPic.draws ? Math.round(100 * stillPic.drawsOn / stillPic.draws) : null, draws: stillPic.draws };
    // (which wait never finishes, tried afresh on one part's picture)
    const p = [...stillPic.parts.values()].find(q => q.url), T = (pr, ms) => Promise.race([pr.then(() => "ok", e => "error: " + e), wait(ms).then(() => "never, in " + ms + " ms")]);
    let probe = null;
    if (p) {
      const pre = new Image(); pre.src = p.url;
      const NS = "http://www.w3.org/2000/svg", img = document.createElementNS(NS, "image");
      for (const [k, v] of [["x", 0], ["y", 0], ["width", 10], ["height", 10]]) img.setAttribute(k, v);
      img.setAttribute("decoding", "sync"); img.style.visibility = "hidden";
      const loaded = T(new Promise(res => img.addEventListener("load", res, { once: true })), 3000);
      img.setAttribute("href", p.url);
      const own = img.decode ? T(img.decode(), 3000) : Promise.resolve("no decode()");
      const kept = T(pre.decode(), 3000);
      bgShown.node.append(img);
      probe = { load: await loaded, ownDecode: await own, keptDecode: await kept };
      img.remove();
    }
    return JSON.stringify({ first, probe });
  })()`));
  ok("on a choppy computer at the duck pond, moving: its still pictures made", r.first.wanted && r.first.parts.length > 0, r);
  ok("and every one ready, in the page", r.first.parts.length > 0 && r.first.parts.every(q => q.ready && q.inPage), r);
  ok("the drawings while moving use them (80% or more)", r.first.share >= 80, r);
  console.log("probe:", JSON.stringify(r.probe));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
