// (ticket 166) The 📮 buttons: with a log address set (here a stand-in
// server on this computer, through localStorage["dress-up-speed-log"]), the
// Advanced tab shows them, and sendSpeedLine posts {key, value} there, the
// shape the Fumola canister's /s/<space>/log takes; without one, no button.
// Exits 1 on a failure or page error.
//   node speedlog166.mjs <devtools port> <url>
import { createServer } from "node:http";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const got = [];
const server = createServer((req, res) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }
  let body = ""; req.on("data", c => body += c); req.on("end", () => { if (req.method === "POST") got.push({ path: req.url, body }); res.writeHead(200, { ...cors, "Content-Type": "application/json" }); res.end("{}"); });
}).listen(8767, "127.0.0.1");
const LOG = "http://127.0.0.1:8767/s/dress-up-speed/log";
let fails = 0;
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
async function open(withLog) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: withLog ? `localStorage.setItem("dress-up-speed-log", ${JSON.stringify(LOG)})` : `localStorage.removeItem("dress-up-speed-log")` });
  await send("Page.navigate", { url }); await sleep(4000);
  // (the Advanced tab opened, where the 📮 buttons are)
  await ev(`(() => { const b = [...document.querySelectorAll("#tabs button")].find(x => /Advanced/.test(x.textContent)); if (b) b.click(); return 1; })()`); await sleep(500);
  return { ev, errs, close: () => fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`) };
}
try {
  const A = await open(true);
  const buttons = await A.ev(`[...document.querySelectorAll("button")].filter(b => /send it to Matthew/.test(b.textContent)).length`);
  say(buttons === 2, `with a log address: ${buttons} 📮 buttons in the Advanced tab (🧪 and ⏱️)`);
  const sent = await A.ev(`sendSpeedLine("speed", "🧪 Dress Up test line", null)`);
  await sleep(300);
  const e = got[0] ? JSON.parse(got[0].body) : null;
  say(sent === true && e && e.value === "🧪 Dress Up test line" && /^speed \d+\.\d+\.\d+ \d{4}-/.test(e.key) && got[0].path === "/s/dress-up-speed/log",
      `a line sent: ${got.length} POST, to ${got[0] ? got[0].path : "nothing"}, ${got[0] ? got[0].body : ""}`);
  const empty = await A.ev(`sendSpeedLine("speed", "", null)`);
  say(empty === false && got.length === 1, `an empty line is not sent`);
  if (A.errs.length) { fails++; console.log("FAIL page errors:", A.errs.slice(0, 3)); }
  await A.close();
  const B = await open(false);
  const none = await B.ev(`[...document.querySelectorAll("button")].filter(b => /send it to Matthew/.test(b.textContent)).length`);
  say(none === 0, `without a log address (as released until the canister is deployed): ${none} 📮 buttons`);
  if (B.errs.length) { fails++; console.log("FAIL page errors:", B.errs.slice(0, 3)); } else console.log("page errors: none");
  await B.close();
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
server.close(); process.exit(fails ? 1 : 0);
