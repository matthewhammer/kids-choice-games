// (ticket 457, Matthew: "horse needs its own 'size compared to main friend' param, to adjust the scales of different
// characters on the horse, for it to look right (e.g., small gnome on normal horse, next to other horses in stable scene)";
// "we want that the 'default horse' and its scale looks right in the stable scene"; "test with a small gnome (size in each
// scene is small)"; "Maybe we add a body param for 'default size in scene' scale ... after we have that refinement, adjusting
// the horse to look right on the character should be possible to set just once, and then reuse in different scenes") In the
// castle's stable, the friend at the stalls' depth leading their horse toward us: at 📏 its size 100 its face is as big as
// the stable's horses' faces (within 15%); a small gnome (🧍 Body's 📏 their own size 50) leaves the horse as big as it was;
// the place's 🧍 size in the scene at 50 halves the friend and the horse alike; its own size at 50 halves it; ridden toward
// us, the small gnome's face shows beside the horse's head. Exits 1 on a failure.
//   node horse457.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state.music.mute = true; state.world.at = null; const B = state.background;
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "stable", castleRoom: 6, figX: 0, figY: -92, figSize: 100 });
    set("costume", "horse", "lead"); state.body.facing = "front"; changed(); await w(900);
    // (a face: the stable's face path, as horseFace draws it, its height on the screen)
    const faceH = root => { const p = root && [...root.querySelectorAll("path")].find(p => /^M-16 -157/.test(p.getAttribute("d") || "")); return p ? p.getBoundingClientRect().height : 0; };
    const mine = () => { drawNow(); return faceH(document.querySelector("#figure .horse")); };
    out.stable = [...document.querySelectorAll('[data-obj^="horse "]')].map(faceH).filter(h => h > 0);
    out.at100 = mine();
    set("body", "size", 50); out.small = mine(); set("body", "size", 100);
    B.figSize = 50; out.place = mine(); B.figSize = 100;
    set("costume", "horseSize", 50); out.half = mine(); set("costume", "horseSize", 100);
    // (ridden by a small gnome, facing us: the gnome's head above the horse's, not hidden)
    set("costume", "kind", "gnome"); set("costume", "horse", "ride"); set("body", "size", 50); changed(); drawNow(); await w(200);
    const head = document.querySelector("#figure .rider"), over = document.querySelector("#figure .horse-over");
    const hr = head && head.getBoundingClientRect(), orr = over && over.getBoundingClientRect();
    out.riderTop = hr ? Math.round(hr.top) : null; out.horseTop = orr ? Math.round(orr.top) : null;
    // (and the gnome's face not covered by the horse's: the point at the face's middle is the rider's)
    const fr = document.querySelector("#figure .rider [data-part=head]"), fb = fr && fr.getBoundingClientRect();
    const at = fb && document.elementFromPoint(fb.left + fb.width / 2, fb.top + fb.height / 2);
    out.faceShows = !!(at && at.closest(".rider"));
    set("costume", "kind", "none"); set("costume", "horse", "none"); set("body", "size", 100); changed();
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const st = r.stable.reduce((a, b) => a + b, 0) / Math.max(1, r.stable.length);
  ok("at its size 100 its face is as big as the stable's horses' (within 15%)", r.stable.length >= 2 && r.at100 > 0.85 * st && r.at100 < 1.15 * st, [st, r.at100]);
  ok("a small friend (their own size 50) leaves the horse as big as it was (within 3%)", Math.abs(r.small - r.at100) < 0.03 * r.at100, [r.at100, r.small]);
  ok("the place's size for people at 50 halves the horse with them (within 5%)", Math.abs(r.place - r.at100 / 2) < 0.05 * r.at100, [r.at100, r.place]);
  ok("its size at 50 halves it (within 5%)", Math.abs(r.half - r.at100 / 2) < 0.05 * r.at100, [r.at100, r.half]);
  ok("ridden toward us by a small gnome: the gnome's face shows, beside the horse's head", r.faceShows, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
