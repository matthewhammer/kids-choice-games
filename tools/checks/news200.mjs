// (ticket 200, Matthew: "M wants to read the list of recent features as we
// work") ⚙️ Advanced ends with what's new: every version from VERSIONS.md
// as a card, newest first, this one marked, bold as bold, in a box that
// scrolls on its own. Exits 1 on a failure.
//   node news200.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 700)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { tab = TABS.findIndex(t => t[1] === "advanced"); showTab();
    for (let i = 0; i < 50 && !document.querySelector(".news .news-card"); i++) await new Promise(r => setTimeout(r, 100));
    const box = document.querySelector(".news"), cards = [...document.querySelectorAll(".news .news-card")], first = cards[0];
    const panel = box && box.parentNode, last = panel ? [...panel.children].filter(c => !c.hidden).pop() : null;
    return JSON.stringify({ cards: cards.length, first: first && first.dataset.version, now: first && first.classList.contains("now"), version: VERSION.number,
      scrolls: !!box && box.scrollHeight > box.clientHeight + 50 && getComputedStyle(box).overflowY === "auto", last: last === box,
      raw: box ? /\\*\\*|^##/m.test(box.textContent) : true, bold: box ? box.querySelectorAll("li b").length : 0, firstText: first ? first.textContent.slice(0, 80) : "" }); })()`));
  ok("⚙️ Advanced ends with what's new: a card for every version (over a hundred), newest first", r.cards > 100 && r.first === r.version && r.last, r);
  ok("this version's card marked, bold as bold, no markdown showing", r.now && r.bold > 50 && !r.raw, r);
  ok("in a box that scrolls on its own", r.scrolls, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
