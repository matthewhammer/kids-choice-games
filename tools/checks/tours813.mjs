// (ticket 813, Matthew 2026-11-21: "the idea of turning those on would be to replay the kinds of automated speedruns that we are
// doing in CI, but now integrate them as user-facing features") 🤖 Automated play's tours, checked as the player would see them: 🌍
// Start World opens the 🤖 tab and the welcome, which offers a tour; then the full tour (every tour in turn: the deep ocean, the
// forest hike, the witch's, the healer's and the castle, the tree houses, outer space), played by the game itself through the nav
// arrows, doors, the back chip, dives and the rocket's chips, each step's expectation read as it ends (tour.log). The same tours a
// player starts from the 🤖 tab. Exits 1 on a failure.
//   node tours813.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + String(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const s0 = JSON.parse(await ev(`(async () => { document.getElementById("start-world").click(); await new Promise(r => setTimeout(r, 2500));
    const tabOn = TABS[tab] && TABS[tab][1], welcome = !!document.querySelector(".welcome-pop"), offer = document.querySelector(".welcome-tours");
    const words = (document.querySelector(".welcome-tour") || {}).textContent || "";
    if (offer) offer.click(); await new Promise(r => setTimeout(r, 800));
    return JSON.stringify({ tabOn, welcome, offer: !!offer, words, chips: [...document.querySelectorAll(".tour-chip")].map(b => b.dataset.tour) }); })()`));
  ok("🌍 Start World: the 🤖 Automated play tab open", s0.tabOn === "tours", s0);
  ok("🌍 Start World: the welcome offers a tour", s0.welcome && s0.offer && /tour/i.test(s0.words), s0);
  ok("🤖 the tours: ocean, forest, visits, trees, space, full", ["ocean", "forest", "visits", "trees", "space", "full"].every(t => s0.chips.includes(t)), s0.chips);
  await ev(`(() => { tourRun("full", { check: true }); return 1; })()`);   // (started, not waited on: it runs for minutes)
  const t0 = Date.now(); let T = null, shown = 0, sawBar = false;
  while (Date.now() - t0 < 15 * 60 * 1000) {
    await sleep(3000);
    T = JSON.parse(await ev(`JSON.stringify(tour ? { done: tour.done, log: tour.log, n: tour.steps.length, bar: !document.getElementById("tour-bar").hidden, now: (document.querySelector('.tour-step[aria-current="step"]') || {}).textContent || "" } : null)`));
    if (!T) continue;
    if (!sawBar && !T.done && T.bar && T.now) { sawBar = true; ok("the tour under way: the strip over the picture, and its outline's step lit", true); }
    for (; shown < T.log.length; shown++) ok("full tour: " + T.log[shown][1], T.log[shown][0], T.log[shown][2]);
    if (T.done) break;
  }
  ok("the full tour finished within 15 minutes, every step", T && T.done && T.log.length === T.n, T && [T.log.length, T.n]);
  ok("the tour was shown under way: the strip over the picture, its outline's step lit", sawBar, T);
  ok("no error thrown in the page", errs.length === 0, errs.join(" | "));
} catch (e) { ok("the tours ran", false, String(e)); }
console.log(bad ? `${bad} failed` : "all passed");
ws.close();
process.exit(bad ? 1 : 0);
