// (ticket 250, Matthew: "let's use these UX improvements in the non-FS mode of Music panel. Also, in this FS mode, the song
// progress sub-panel ... can extend to fill the rest of the row"; "maybe stack the first two subpanels vertically") The
// 🎵 Music tab, in its normal view and full screen: its controls cards in a grid, more than one to a row; 🔊 sound and ▶
// playing one over the other in the first column; ⏯️ where the tune is beside them, to the row's end; the tune picker and
// the mixing board across. Exits 1 on a failure.
//   node music250.mjs <devtools port> <url>
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
const LOOK = `(() => { const P = document.getElementById("panel"), pr = P.getBoundingClientRect(), r = k => { const e = P.querySelector('.ctl[data-key="' + k + '"]'); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); };
  const tops = [...P.querySelectorAll(":scope > .ctl")].map(e => Math.round(e.getBoundingClientRect().top)), perRow = Math.max(...Object.values(tops.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {})));
  const cs = getComputedStyle(P), inner = pr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
  const across = sel => { const e = P.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return b.right - b.left >= inner - 4; };
  return { panel: [pr.left, pr.top, pr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth), pr.bottom].map(Math.round), grid: getComputedStyle(P).display, mute: r("mute"), now: r("now"), where: r("where"), perRow,
    tunesAcross: across(':scope > .ctl:has(.chipset)'), mixAcross: across(":scope > .mixctl") }; })()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const views = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true; tab = TABS.findIndex(t => t[1] === "music"); showTab(); changed(); await w(500);
    const normal = ${LOOK}; setMusicBig(true); await w(600); const big = ${LOOK}; setMusicBig(false); await w(300); return JSON.stringify({ normal, big }); })()`));
  for (const [name, v] of Object.entries(views)) {
    console.log(`  ${name}: ${JSON.stringify(v)}`);
    const stacked = v.mute && v.now && v.where && Math.abs(v.mute[0] - v.now[0]) <= 2 && v.now[1] > v.mute[3] - 2;
    const beside = v.where && v.mute && v.where[0] > v.mute[2] - 2 && Math.abs(v.where[1] - v.mute[1]) <= 2 && v.where[2] >= v.panel[2] - 4;
    ok(`${name}: the controls cards in a grid, more than one to a row`, v.grid === "grid" && v.perRow >= 2, v);
    ok(`${name}: 🔊 and ▶ one over the other in the first column`, stacked, v);
    ok(`${name}: ⏯️ where the tune is beside them, to the row's end`, beside, v);
    ok(`${name}: the tune picker and the mixing board across`, v.tunesAcross && v.mixAcross, v);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
