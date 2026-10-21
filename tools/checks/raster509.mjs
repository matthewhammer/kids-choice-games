// (ticket 509) The imagination's 36 framed pictures as pixels in play: on GitHub's computers, drawing without a graphics card,
// each picture's shapes were drawn again whenever anything near it moved, and the place walked at about 48 frames a second
// (diag-509b). In play each still picture is drawn once into a WebP (RASTERS); held still (the archive) it stays SVG, the
// same text every time. Checked: in play every picture of the map a WebP within 20 s, the scene drawn again once for them;
// the friend moved about, no new picture made; a save's copy SVG again; held still, every picture SVG; play again, WebP
// again; no page errors.
//   node raster509.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; state.music.mute = true; state.world.at = null;
    const count = () => ({ webp: document.querySelectorAll('#bg .portal image[href^="data:image/webp"]').length, svg: document.querySelectorAll('#bg .portal image[href^="data:image/svg"]').length });
    B.kind = "imagination"; [B.figX, B.figY] = ARRIVE.imagination || [0, 0]; changed();
    for (let i = 0; i < 200 && (RASTER_JOBS.length || rasterBusy || count().svg > 0 || !count().webp); i++) await w(100);
    await w(300);
    const play = { ...count(), made: RASTERS.size, gen: RASTER_GEN };
    for (let i = 0; i < 8; i++) { B.figX = (B.figX || 0) + (i % 2 ? -20 : 25); changed(); await w(200); }
    await w(1000);
    const moved = { ...count(), made: RASTERS.size, jobs: RASTER_JOBS.length, gen: RASTER_GEN };
    const copy = unrastered(document.getElementById("pic").cloneNode(true));
    const saved = { webp: copy.querySelectorAll('.portal image[href^="data:image/webp"]').length, svg: copy.querySelectorAll('.portal image[href^="data:image/svg"]').length, onPage: count().webp };
    holdStill(0); changed(); await w(800);
    const held = count();
    stillAt = null; const p = document.getElementById("pic"); if (p && p.unpauseAnimations) p.unpauseAnimations(); changed(); await w(800);
    const again = count();
    return JSON.stringify({ play, moved, saved, held, again }); })()`));
  ok("in play every picture of the map is a WebP, made once each", r.play.webp >= 30 && r.play.svg === 0 && r.play.made === r.play.webp, r.play);
  ok("the friend moved about: no picture made again, the scene not drawn again for pictures", r.moved.webp === r.play.webp && r.moved.made === r.play.made && r.moved.jobs === 0 && r.moved.gen === r.play.gen, r);
  ok("a save or a postcard's copy has every picture as SVG, the page's still WebP", r.saved.svg === r.play.webp && r.saved.webp === 0 && r.saved.onPage === r.play.webp, r.saved);
  ok("held still (the archive's way): every picture SVG", r.held.svg === r.play.webp && r.held.webp === 0, r.held);
  ok("in play again: WebP again", r.again.webp === r.play.webp && r.again.svg === 0, r.again);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
