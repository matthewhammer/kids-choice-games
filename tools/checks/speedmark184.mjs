// (ticket 184) The 🚧🐢 mark after the version: speed.json (answered here,
// in place of the file) says this version is slow: the mark shows, links
// the run; "ok": hidden; no speed.json: hidden. Exits 1 on a failure.
//   node speedmark184.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RUN = "https://github.com/matthewhammer/kids-choice-games/actions/runs/1";
async function look(answer) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 200));
    if (m.method === "Fetch.requestPaused") {
      const body = answer === null ? null : JSON.stringify(answer(m.params.request.url));
      send("Fetch.fulfillRequest", body === null ? { requestId: m.params.requestId, responseCode: 404, body: "" }
        : { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(body).toString("base64") });
    } });
  try {
    await send("Runtime.enable"); await send("Fetch.enable", { patterns: [{ urlPattern: "*speed.json*" }] });
    await send("Page.navigate", { url }); await sleep(7000);   // (the page asks 5 s after loading)
    const r = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => { const e = document.getElementById("speed-mark"); return e && { hidden: e.hidden, text: e.textContent, href: e.getAttribute("href"), version: VERSION.number }; })()` });
    return { ...r.result.result.value, errs };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}: ${JSON.stringify(got)}`); if (!cond) bad++; };
const vOf = async () => (await look(null)).version;
const v = await vOf();
const slow = await look(() => ({ [v]: { result: "slow", failed: ["the frame-rate gate"], run: RUN } }));
ok("slow: the mark shows, with the run", !slow.hidden && /🐢/.test(slow.text) && slow.href === RUN && !slow.errs.length, slow);
const broken = await look(() => ({ [v]: { result: "broken", failed: ["the checks"], run: RUN } }));
ok("broken: 🚧 shows", !broken.hidden && /🚧/.test(broken.text) && !/🐢/.test(broken.text), broken);
const fine = await look(() => ({ [v]: { result: "ok", failed: [], run: RUN }, "0.0.1": { result: "slow" } }));
ok("ok: no mark (another version's slowness is not this one's)", fine.hidden, fine);
const none = await look(null);
ok("no speed.json: no mark", none.hidden && !none.errs.length, none);
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
