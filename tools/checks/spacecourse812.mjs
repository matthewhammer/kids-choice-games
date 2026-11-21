// (ticket 812, Matthew 2026-11-21: "let's be sure that the following course is possible: blast off from start world (choose a view
// starting squares); blast into outer space; go through outer space grid until we get to different planets; nav to each planet;
// once there (near surface), exit space craft; nav around planet a bit as a team; re-enter spacecraft; blast off into outer space;
// go to next planet or, go back to start world", "let's add this to our CI speedrun logic", and "let's do team variations throughout
// the blast off test ... and ensure that it continues to be correct and semantically meaningful")
// 🚀 The space course, played as a player plays it: by the rocket's action chips beside the friend (🚀 blast off, 🪐 land, ⏏️ step
// out, 🚀 board, 🏡 home) and the nav arrows, from two starting squares of the start world, with a team of three. At each step:
// which world and square, whether they ride, the actions offered, the team aboard (a porthole each, none of them standing about) or
// out with the friend (each one placed in the friend's square); each trip's motion (the copy rising out of the top, then coming down,
// the friend shown again at the end). Then the team varied on the way: a cat made in space (aboard at once), the one played changed
// in space (the rocket and the team kept), a new person made on a planet (the one played till then joins the team, the rocket
// theirs), one left to stay on a planet (there still when the team comes back), and people made in the air over the quilt (none left
// behind where the flight took off: Matthew's report, 2026-11-21). The course itself is spacecourse812-page.js, run in the page (so it
// can be run by hand in a browser too); this loads it, starts it, and reports what it found. Exits 1 on a failure.
//   node spacecourse812.mjs <devtools port> <url>
import { readFileSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + String(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { document.getElementById("start-world").click(); await new Promise(r => setTimeout(r, 2500));
    const x = [...document.querySelectorAll("button")].find(b => /Let's explore/.test(b.textContent)); if (x) x.click(); return 1; })()`);
  await ev(readFileSync(new URL("./spacecourse812-page.js", import.meta.url), "utf8") + "\n; 1");
  await ev("window.__courseRun(); 1");   // (started, not waited on: it runs for minutes)
  const t0 = Date.now(); let C = null, shown = 0;
  while (Date.now() - t0 < 15 * 60 * 1000) {
    await sleep(3000);
    C = JSON.parse(await ev("JSON.stringify(window.__course)"));
    for (; shown < C.log.length; shown++) ok(C.log[shown][1], C.log[shown][0], C.log[shown][2]);
    if (C.done) break;
  }
  ok("the course finished within 15 minutes", C && C.done, C && C.log.length);
  ok("no error thrown in the page", errs.length === 0, errs.join(" | "));
} catch (e) { ok("the course ran", false, String(e)); }
console.log(bad ? `${bad} failed` : "all passed");
ws.close();
process.exit(bad ? 1 : 0);
