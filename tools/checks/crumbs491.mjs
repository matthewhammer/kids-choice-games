// (ticket 491, Matthew: "fix for breadcrumbs in single column mode (on my desktop at half screen width)") In one column
// (760 px and less) the band of breadcrumbs sticks just under the picture and its buttons, never across the picture, as
// the controls scroll under them; at two columns it is at the top, as before. Exits 1 on a failure.
//   node crumbs491.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
const measure = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true;
  crumbsShow(document.querySelector("#panel h3, #panel summary, #panel *")); window.scrollTo(0, 1600); await w(600);
  const s = document.querySelector(".stage").getBoundingClientRect(), c = document.getElementById("crumbs").getBoundingClientRect();
  return JSON.stringify({ narrow: matchMedia("(max-width: 760px)").matches, stageBottom: Math.round(s.bottom), crumbsTop: Math.round(c.top), crumbsH: Math.round(c.height), scrolled: Math.round(scrollY) }); })()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 753, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const a = JSON.parse(await ev(measure));
  ok("one column: the band is under the picture and its buttons, not over them", a.narrow && a.scrolled > 0 && a.crumbsH > 0 && a.crumbsTop >= a.stageBottom - 1 && a.crumbsTop <= a.stageBottom + 12, a);
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(800);
  const b = JSON.parse(await ev(measure));
  ok("two columns: the band at the top, as before (within the panel's top padding)", !b.narrow && b.crumbsTop < 12, b);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
