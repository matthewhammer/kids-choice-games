// (ticket 179) While 🧪 measures: the ⚙️ Advanced tab's buttons are
// disabled and the notice says to wait and touch nothing, with the seconds
// gone of about how long it takes (62 s since the measure grew; ticket 369 takes any figure); when it ends, the notice goes, the buttons come back
// and the line is there. Exits 1 on a failure or page error.
//   node measure179.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
const look = () => ev(`JSON.stringify({ measuring: document.body.classList.contains("measuring"), note: document.getElementById("measuring").hidden ? null : document.getElementById("measuring").textContent,
  buttons: [...document.querySelectorAll("#panel .perfrow button")].length, disabled: [...document.querySelectorAll("#panel .perfrow button")].filter(b => b.disabled).length,
  copyDisabled: !!([...document.querySelectorAll("#panel .perfrow button")].find(b => /copy/.test(b.textContent)) || {}).disabled,
  line: (document.querySelector("#panel .perfrow input.padline") || {}).value || "" })`).then(JSON.parse);
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`state.music.mute = true; tab = TABS.findIndex(t => /Advanced/.test(t[0])); showTab(); 1`); await sleep(400);
  await ev(`[...document.querySelectorAll("#panel button")].find(b => /this computer's speed/.test(b.textContent)).click(); 1`);
  await sleep(3500);
  const during = await look();
  say(during.measuring && during.note && /touch nothing/.test(during.note) && /\d+ s so far, of about \d+ s/.test(during.note), `while measuring, the notice: "${during.note}"`);
  say(during.buttons > 0 && during.disabled === during.buttons && during.copyDisabled, `while measuring, ${during.disabled} of ${during.buttons} buttons disabled, 📋 copy among them`);
  const t0 = Date.now(); let after;
  while (Date.now() - t0 < 90000) { await sleep(2000); after = await look(); if (!after.measuring) break; }
  say(after && !after.measuring && after.note === null && after.disabled === 0, `after (${Math.round((Date.now() - t0) / 1000 + 3.5)} s): the notice gone, ${after ? after.disabled : "?"} buttons disabled`);
  say(after && /^🧪 Dress Up /.test(after.line), `the line is there: ${after ? after.line.slice(0, 80) : ""}…`);
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
