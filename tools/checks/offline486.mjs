// (ticket 486, Matthew: "hardening MUDU against lack of internet on a tablet, desktop, or mobile phone"; "In the advanced tab, let's
// offer an expandable panel that instructs the user how to add the app to their device (esp mobile and tablets) so they can use in
// Airplane mode.") The game keeps a copy of itself (sw.js) and opens with no server at all. This check serves the game on a port of
// its own, lets it keep its copy, stops that server, and loads the game again: it must start, from the copy. Also: the manifest and
// its icons, and the ✈️ section in ⚙️ Advanced, saying this version is kept. Exits 1 on a failure.
//   node offline486.mjs <devtools port> <url>     (the url is not used: the game is served here, on 8486)
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const [dport] = process.argv.slice(2);
const root = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 8486, url = `http://127.0.0.1:${PORT}/dress-up/index.html`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", root], { stdio: "ignore" });
const up = async () => { try { return (await fetch(url)).ok; } catch (_) { return false; } };
for (let i = 0; i < 50 && !(await up()); i++) await sleep(100);
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
  ok("the game is served on its own port", await up(), url);
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(3000);
  // (a copy from this computer keeps nothing, unless asked: the checks on 8133 are never served from a kept copy)
  const before = JSON.parse(await ev(`(async () => JSON.stringify({ reg: !!(await navigator.serviceWorker.getRegistration()) }))()`));
  ok("served from this computer, nothing is kept unless asked", !before.reg, before);
  await ev(`(() => { localStorage.setItem("dress-up-offline", "on"); try { state.music.mute = true; changed(); } catch (_) {} return 1; })()`);
  await send("Page.navigate", { url }); await sleep(3000);
  const kept = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    let k = null; for (let i = 0; i < 60; i++) { k = await offlineKept(); if (k.total && k.kept === k.total && navigator.serviceWorker.controller) break; await w(500); }
    const m = await (await fetch("manifest.webmanifest")).json();
    const icons = await Promise.all(m.icons.map(async i => { const r = await fetch(i.src); return [i.src, r.ok, r.headers.get("content-type")]; }));
    return JSON.stringify({ k, controlled: !!navigator.serviceWorker.controller, manifest: { name: m.name, display: m.display, start: m.start_url }, icons,
      link: !!document.querySelector("link[rel=manifest]"), apple: !!document.querySelector("link[rel=apple-touch-icon]") }); })()`));
  console.log(`  ${JSON.stringify(kept)}`);
  ok("every file of this version is kept (the page, its stylesheet, every part)", kept.k.total >= 27 && kept.k.kept === kept.k.total, kept.k);
  ok("the game's page is run by its service worker", kept.controlled, kept);
  ok("a manifest: a name, standalone, starting at the game", kept.link && kept.manifest.name === "Messed Up Dress Up" && kept.manifest.display === "standalone" && kept.manifest.start === "./", kept.manifest);
  ok("its icons are there, and an iPad's", kept.apple && kept.icons.length >= 2 && kept.icons.every(([, okay, t]) => okay && /png/.test(t)), kept.icons);
  // no server: what a tablet in airplane mode sees
  server.kill(); server = null;
  for (let i = 0; i < 30 && (await up()); i++) await sleep(100);
  ok("the server is stopped", !(await up()), "still up");
  errs.length = 0;
  await send("Page.navigate", { url }); await sleep(4000);
  const off = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    const started = typeof state === "object" && !!document.querySelector("#panel") && typeof VERSION === "object";
    tab = TABS.findIndex(t => t[1] === "advanced"); showTab(); await w(400);
    const d = document.querySelector("#panel details.offline-help"); if (d) { d.open = true; d.dispatchEvent(new Event("toggle")); } await w(800);
    return JSON.stringify({ started, version: VERSION.number, controlled: !!navigator.serviceWorker.controller,
      section: !!d, summary: d ? d.querySelector("summary").textContent : "", status: d ? d.querySelector(".offline-status").textContent : "",
      steps: d ? [...d.querySelectorAll("li")].map(li => li.querySelector("b").textContent) : [] }); })()`));
  console.log(`  ${JSON.stringify(off)}`);
  ok("with no server, the game starts from the kept copy", off.started && off.controlled, off);
  ok("⚙️ Advanced has the ✈️ airplane-mode section", off.section && /airplane mode/.test(off.summary), off.summary);
  ok("it says this version is kept here", /✅/.test(off.status) && off.status.includes(off.version), off.status);
  ok("steps for an iPad or iPhone, Android, and a computer", ["iPad", "Android", "computer"].every(w => off.steps.some(s => s.includes(w))), off.steps);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally {
  if (server) server.kill();
  await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
}
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
