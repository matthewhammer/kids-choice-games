// (ticket 278, for M) The grass hut and its rooms: each of the four places
// draws, without a page error; their doorways lead where they should (the
// hut in, the living room to the bedroom, the potion room and back out, each
// room back to the living room); and the colors reach the drawing (the hut's
// couch, the blanket, the potion). Exits 1 on a failure or page error.
//   node hut278.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const go = kind => ev(`(async () => { state.music.mute = true; state.background.kind = ${JSON.stringify(kind)}; changed(); await new Promise(r => setTimeout(r, 500));
    const pic = document.getElementById("pic"); return JSON.stringify({ bytes: pic.innerHTML.length, to: [...new Set([...pic.querySelectorAll(".portal")].map(p => p.dataset.to).filter(Boolean))] }); })()`).then(JSON.parse);
  const want = { hut: ["hutroom"], hutroom: ["hutbed", "hutpotion", "hut"], hutbed: ["hutroom"], hutpotion: ["hutroom"] };
  for (const [kind, to] of Object.entries(want)) {
    const r = await go(kind);
    say(r.bytes > 20000 && to.every(t => r.to.includes(t)), `${kind}: drawn (${r.bytes} bytes), its doorways lead to ${r.to.join(", ")}`);
  }
  const has = async (kind, key, val, what) => { await ev(`state.background[${JSON.stringify(key)}] = ${JSON.stringify(val)}; 1`); const r = await ev(`(async () => {
    state.background.kind = ${JSON.stringify(kind)}; changed(); await new Promise(r => setTimeout(r, 500)); return document.getElementById("pic").innerHTML.includes(${JSON.stringify(val)}); })()`);
    say(r, `${what}: ${val} is drawn`); };
  await has("hutroom", "hutCouchColor", "#6a4c93", "the hut's couch color");
  await has("hutbed", "hutBlanket", "#2f6f86", "the blanket's color");
  await has("hutpotion", "hutPotion", "#22c55e", "the potion's color");
  say(await ev(`groupOfPlace("hutpotion") === "hut" && PLACES.some(p => p[0] === "hut")`), "the four places are in the 🛖 group, in the places' menu");
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
