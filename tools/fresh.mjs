// (ticket 369) Before each check: the game's saved state emptied, so a check starts as a fresh visitor's page, as it was
// written against. The run's checks share one browser, and the game keeps what it was left with in localStorage (its
// save, and the slow-computer mark): pits214 met boulder323's fallen rock on its pit, sign280 found no square at load,
// and swing240 passed alone but not after a check that had marked the computer slow.
//   node fresh.mjs <devtools port> <origin, e.g. http://127.0.0.1:8133>
const [dport, origin] = process.argv.slice(2);
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const r = await send("Storage.clearDataForOrigin", { origin, storageTypes: "local_storage,indexeddb,cache_storage,service_workers" });
if (r.error) console.log("fresh: " + JSON.stringify(r.error));
await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
process.exit(0);
