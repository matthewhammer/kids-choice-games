// (ticket 371, Matthew: "crawling animation for scuba tank has it on our belly -- inverted from correct. Let's do an audit,
// long run, for similar mistakes"; then "Switched to fairy costume and its still there?") What the audit found, kept so:
// the 🛢️ tank on the back in every crawl (toward us, over the back, never below the head; away, seen short with the back;
// in profile, on the upper side); the old diving suit's hose rising from the helmet whatever way the body is turned
// (lying, crawling in profile, swimming flat), not pointing the way the head does; and the diving gear coming off with a
// diving suit, yet put on again with any costume. Exits 1 on a failure.
//   node gear371.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, body = state.body, C = state.costume;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; delete B.onBridge; delete B.onPlatform;
    const box = sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, top: b.top, bottom: b.bottom }; };
    const pose = async (kind, b) => { B.kind = kind; B.figX = 0; B.figY = 40; Object.assign(body, clone(DEFAULTS.body), b); if (b.pose) strikePose(b.pose); changed(); await w(300); draw(); };
    Object.assign(C, clone(DEFAULTS.costume), { kind: "scuba", tank: true, mask: true, snorkel: false });
    const tank = {};
    for (const [label, b] of [["back", { facing: "back" }], ["crawl toward", { anim: "crawl", facing: "front" }], ["crawl away", { anim: "crawl", facing: "back" }], ["crawl left", { anim: "crawl", facing: "left" }]]) {
      await pose("none", b); tank[label] = { tank: box('#figure [data-dive="tank"]'), fig: box("#figure"), head: box("#figure .head, #figure [data-layer=head]") }; }
    Object.assign(C, clone(DEFAULTS.costume), { kind: "diver" });
    const hose = {};
    for (const [label, kind, b] of [["lying", "none", { pose: "lie" }], ["crawling in profile", "none", { anim: "crawl", facing: "left" }], ["swimming flat", "sea", { anim: "swim", facing: "right" }], ["swimming flat, the other way", "sea", { anim: "swim", facing: "left" }]]) {
      await pose(kind, b); hose[label] = box("#figure [data-hose]"); }
    // (the gear and a change of costume)
    Object.assign(C, clone(DEFAULTS.costume), { kind: "scuba", tank: true, mask: true, snorkel: true }); set("costume", "kind", "fairy");
    const off = { tank: !!C.tank, mask: !!C.mask, snorkel: !!C.snorkel }; set("costume", "tank", true); set("costume", "kind", "witch"); const kept = !!C.tank;
    Object.assign(body, clone(DEFAULTS.body)); Object.assign(C, clone(DEFAULTS.costume)); B.kind = "underwater"; changed();
    return JSON.stringify({ tank, hose, off, kept }); })()`));
  const T = r.tank;
  console.log("  " + JSON.stringify(r).slice(0, 600));
  ok("standing, from behind: the tank on the back", !!T.back.tank && T.back.tank.h > 40, T.back);
  ok("crawling toward us: the tank on the back, rising behind the head, never below it (on the belly)", !T["crawl toward"].tank || T["crawl toward"].tank.bottom <= T["crawl toward"].fig.y, T["crawl toward"]);
  ok("crawling away: the tank seen short with the back (under 0.7 of its height from behind)", !!T["crawl away"].tank && T["crawl away"].tank.h < 0.7 * T.back.tank.h, { away: T["crawl away"].tank, back: T.back.tank });
  ok("crawling in profile: the tank on the upper side", !!T["crawl left"].tank && T["crawl left"].tank.y < T["crawl left"].fig.y, T["crawl left"]);
  ok("the old diving suit's hose rising, however the body is turned (taller than three times its width)", Object.values(r.hose).every(h => h && h.h > 3 * h.w), r.hose);
  ok("out of the scuba suit into the fairy: the snorkel, the mask and the tank off with it", !r.off.tank && !r.off.mask && !r.off.snorkel, r.off);
  ok("and a tank put on with the fairy stays on into another costume", r.kept, r.kept);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
