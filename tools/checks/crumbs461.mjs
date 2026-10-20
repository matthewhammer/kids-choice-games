// (ticket 461, Matthew: "bread crumbs look good, but they don't go as deep as they could -- for instance, background / the
// place / kind of place vs background / the place / places ('place choices', let's say)") The band names the row and the
// part of a row under the pointer: in 🏞️ Background, over the place picker's kinds, "background / the place / kind of
// place"; over its places, "background / the place / place choices" (its heading now "place choices: ..."); in 🧍 Body,
// over the short jump's height, "body / the jumps / short jump: how high". Exits 1 on a failure.
//   node crumbs461.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true; state.background.kind = "lake"; state.world.at = null; changed(); await w(300);
    const band = () => document.getElementById("crumbs").textContent, over = e => e.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(400);
    const sets = [...document.querySelectorAll("#panel .chipset")].filter(s => { const c = s.querySelector(":scope > .cap"); return c && /kind of place|place choices/.test(c.textContent); });
    const kindSet = sets.find(s => /kind of place/.test(s.querySelector(":scope > .cap").textContent)), placeSet = sets.find(s => /place choices/.test(s.querySelector(":scope > .cap").textContent));
    out.placeCap = placeSet ? placeSet.querySelector(":scope > .cap").textContent : null;
    if (kindSet) over(kindSet.querySelector("button")); await w(50); out.kind = band();
    if (placeSet) over(placeSet.querySelector("button")); await w(50); out.place = band();
    tab = TABS.findIndex(t => t[0] === "🧍 Body"); showTab(); await w(300);
    const slider = [...document.querySelectorAll("#panel input[type=range]")].find(i => /short jump: how high/.test((i.closest(".ctl") || {}).textContent || ""));
    if (slider) over(slider); await w(50); out.body = band();
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the place picker's choices are headed place choices: ...", /^place choices: /.test(r.placeCap || ""), r.placeCap);
  ok("over the kinds: background / the place / kind of place", r.kind === "background / the place / kind of place", r.kind);
  ok("over the places: background / the place / place choices", r.place === "background / the place / place choices", r.place);
  ok("🧍 Body, over the short jump's height: body / the jumps / short jump: how high", r.body === "body / the jumps / short jump: how high", r.body);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
