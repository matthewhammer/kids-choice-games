// (ticket 474, Matthew: "add link and citation for https://arxiv.org/abs/1703.05410 into the MUDU advanced panel, near the top --- the link says
// 'See also -- Languages of Play: Towards Semantic Foundations For Game Interfaces (2017)'"; "let's offer [the HTML version] in the advanced panel
// (after citation)") In ⚙️ Advanced, near the top (before the version row): "See also", a link to the paper on arXiv with its title and year, its
// authors, and a link to its HTML version, after the citation. Exits 1 on a failure.
//   node seealso474.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true; changed(); await w(300);
    tab = TABS.findIndex(t => t[1] === "advanced"); showTab(); await w(300);
    const row = document.querySelector("#panel .see-also"), rows = [...document.querySelectorAll("#panel .row")];
    const links = row ? [...row.querySelectorAll("a")].map(a => [a.textContent, a.href]) : [];
    const verRow = rows.findIndex(x => x.querySelector(".newer"));
    return JSON.stringify({ row: !!row, text: row ? row.textContent : "", links, at: rows.indexOf(row), verRow }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("⚙️ Advanced has a See also row", r.row && /See also/.test(r.text), r);
  ok("near the top: before the version row", r.at >= 0 && r.verRow > r.at, r);
  ok("the paper's title and year, linked to arXiv", r.links.length >= 1 && /Languages of Play: Towards Semantic Foundations For Game Interfaces \(2017\)/.test(r.links[0][0]) && r.links[0][1] === "https://arxiv.org/abs/1703.05410", r.links);
  ok("its authors", /Chris Martens and Matthew A\. Hammer/.test(r.text), r.text);
  ok("its HTML version, after the citation", r.links.length === 2 && r.links[1][1] === "https://arxiv.org/html/1703.05410v1", r.links);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
