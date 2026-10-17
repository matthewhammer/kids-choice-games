// (Matthew, 2026-10-17) A way out below the picture is a bobbing ▼, not a
// sign on a post: the living room's door behind us, set to lead to the
// forest, draws a .south-way doorway (data-door, so it glows and X goes
// through) whose data-to is the forest, with its words hidden until hover,
// and no post; set to lead nowhere, nothing. Exits 1 on a failure.
//   node southway.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 200)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result.result.value;
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}: ${JSON.stringify(got)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const look = async back => JSON.parse(await ev(`(async () => {
    state.music.mute = true; Object.assign(state.background, { kind: "livingroom", livingBack: ${JSON.stringify(back)} }); changed();
    await new Promise(r => setTimeout(r, 600));
    const w = [...document.querySelectorAll("#bg .south-way")];
    const lab = w[0] && w[0].querySelector(".south-label");
    return JSON.stringify({ n: w.length, to: w.map(e => e.getAttribute("data-to")), door: w.every(e => e.hasAttribute("data-door")),
      tri: w.every(e => e.querySelector("path")), hidden: lab ? getComputedStyle(lab).opacity : null,
      post: [...document.querySelectorAll('#bg .portal rect[fill="#6e4a2c"]')].length });
  })()`));
  const a = await look("forest");
  ok("door behind us to the forest: one ▼, a doorway to the forest, its words hidden, no post", a.n === 1 && a.to[0] === "forest" && a.door && a.tri && a.hidden === "0" && a.post === 0, a);
  const b = await look("none");
  ok("leading nowhere: no ▼", b.n === 0, b);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 200)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
