// (ticket 194, M) A light / dark switch in ⚙️ Advanced: auto (the system's),
// light, dark; each whatever the system says; this browser keeps it, a
// reload too. Exits 1 on a failure.
//   node theme194.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 600)}`); if (!cond) bad++; };
const DARK = "rgb(29, 26, 38)", LIGHT = "rgb(243, 240, 255)";
try {
  await send("Runtime.enable");
  const scheme = v => send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: v }] });
  await send("Page.navigate", { url }); await sleep(4000);
  const pick = t => ev(`(async () => { tab = TABS.findIndex(x => x[1] === "advanced"); showTab(); await new Promise(r => setTimeout(r, 200));
    const b = document.querySelector('button[data-theme-choice="${t}"]'); if (!b) return "no button"; b.click(); await new Promise(r => setTimeout(r, 100));
    return getComputedStyle(document.body).backgroundColor + "|" + (document.documentElement.dataset.theme || "auto") + "|" + b.getAttribute("aria-pressed"); })()`);
  await scheme("dark");
  const autoDark = await pick("auto"), light = await pick("light"), dark = await pick("dark");
  await scheme("light");
  const darkInLight = await pick("dark"), autoLight = await pick("auto");
  ok("auto follows the system: dark when it is dark, light when it is light", autoDark.startsWith(DARK) && autoLight.startsWith(LIGHT), { autoDark, autoLight });
  ok("light is light with the system dark; dark is dark with the system light", light.startsWith(LIGHT + "|light|true") && darkInLight.startsWith(DARK + "|dark|true"), { light, darkInLight, dark });
  await pick("dark"); await send("Page.reload"); await sleep(4000);
  const kept = await ev(`(document.documentElement.dataset.theme || "auto") + "|" + getComputedStyle(document.body).backgroundColor`);
  ok("kept by this browser: dark again after a reload", kept === "dark|" + DARK, kept);
  await pick("auto");
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
