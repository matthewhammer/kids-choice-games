// (ticket 450, Matthew: "less bell shaped robe at the ankle/feet area -- it's a robe, not a dress") The monk's, the wizard's
// and the king's robes fall nearly straight to a straight hem: much narrower at the hem than the queen's gown (a dress,
// flaring, scalloped), and no wider at the hem than 1.35 times at the waist. Exits 1 on a failure.
//   node robes450.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false; state.body.facing = "front";
    for (const k of ["monk", "wizard", "king", "queen"]) { set("costume", "kind", k); changed(); await w(80);
      // (the skirt: the path from the waist, M-hw L-10, in the robe's fill)
      const sk = [...document.querySelectorAll("#figure path")].find(e => /^M-[\\d.]+ [\\d.]+ L[\\d.]+ [\\d.]+ L/.test(e.getAttribute("d") || "") && (e.getAttribute("fill") || "").length > 3 && e.getBBox().height > 60);   // (in the drawing's own units: on GitHub's smaller picture the robe is 30 px tall on the screen, and a 40 px test found nothing)
      if (!sk) { out[k] = null; continue; }
      const d = sk.getAttribute("d").match(/^M(-[\\d.]+)/), waist = 2 * Math.abs(+d[1]), b = sk.getBBox();
      out[k] = { hem: Math.round(b.width), waist: Math.round(waist) }; }
    set("costume", "kind", "none"); set("hair", "beard", "none");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("each robe's hem no wider than 1.35 times its waist", ["monk", "wizard", "king"].every(k => r[k] && r[k].hem <= 1.35 * r[k].waist), r);
  ok("the robes much narrower at the hem than the queen's gown", ["monk", "wizard", "king"].every(k => r[k] && r.queen && r[k].hem < 0.8 * r.queen.hem), r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
