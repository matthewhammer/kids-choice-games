// (ticket 444, Matthew: "the walking away pose shouldn't show a belt buckle, just the forwards facing pose, L and R") From
// behind, no belt buckle (the gnome man's, the witch's), no hat buckle (the witch's), no knot or tassels (the wizard's cord),
// no hanging rope ends (the monk's); facing us and in profile, each as before. Exits 1 on a failure.
//   node behind444.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const out = {}; state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null });
    const has = sel => !!document.querySelector("#figure " + sel);
    const marks = { gnome: 'rect[stroke="#f2c230"][height="18"]', witch: 'rect[stroke="#f2c230"][height="18"]', witchHat: 'rect[stroke="#f2c230"][height="16"]', wizard: 'circle[r="5"][fill="#e0b030"]', monk: 'path[d*="l-3 44"]' };
    for (const key of ["gnome", "witch", "witchHat", "wizard", "monk"]) { const kind = key === "witchHat" ? "witch" : key; set("costume", "kind", kind); if (kind === "gnome") set("costume", "gnomeWho", "man");
      out[key] = ["front", "left", "right", "back"].map(f => { state.body.facing = f; changed(); return has(marks[key]) ? 1 : 0; }).join(""); }
    set("costume", "kind", "none"); state.body.facing = "front"; changed();
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("facing us and in profile: the buckles, the knot, the rope's ends; from behind, none", Object.values(r).every(v => v === "1110"), r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
