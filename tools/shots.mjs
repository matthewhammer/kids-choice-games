// Pictures of the game for a branch: each case's JavaScript runs on the
// defaults (music muted), then the page is shot as a PNG. For checking a
// drawing where no browser can run (CI on GitHub's computers, ticket 165).
// The cases are a JSON list: [{ "name": "...", "js": "...", "wait": ms }];
// a case may name its own window, "w" and "h" (ticket 210), else W x H.
//   node shots.mjs <devtools port> <url> <cases.json> <outdir>   env: W H DPR
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const [dport, url, casesFile, outdir] = process.argv.slice(2);
const W = +(process.env.W || 1600), H = +(process.env.H || 1000), DPR = +(process.env.DPR || 1);
const cases = JSON.parse(readFileSync(casesFile, "utf8"));
mkdirSync(outdir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
const report = [];
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  for (let i = 0; i < 40; i++) { if (await ev("typeof state") === "object") break; await sleep(250); }
  let size = W + "x" + H;
  for (const c of cases) {
    const want = (c.w || W) + "x" + (c.h || H);
    if (want !== size) { size = want; await send("Emulation.setDeviceMetricsOverride", { width: c.w || W, height: c.h || H, deviceScaleFactor: DPR, mobile: false }); await sleep(600); }
    const r = await ev(`(async () => { state = clone(DEFAULTS); state.music.mute = true; ${c.js}; changed(); return "ok"; })()`);
    await sleep(c.wait ?? 1200);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${outdir}/${c.name}.png`, Buffer.from(shot.result.data, "base64"));
    report.push(`${c.name}: ${r}`); console.log(`${c.name}: ${r}`);
  }
  console.log("errors:", errs.length ? errs.slice(0, 4) : "none");
  writeFileSync(`${outdir}/shots.txt`, report.join("\n") + `\nerrors: ${errs.length ? errs.join("\n") : "none"}\n`);
} finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(errs.length ? 1 : 0); }
