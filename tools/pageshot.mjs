// (ticket 182) Pictures of pages, on GitHub's computers, since no browser
// runs on Matthew's laptop: each shots/*.html, whole length, at a desktop
// width and a phone's, light and dark. Never fails.
//   node tools/pageshot.mjs <devtools port> <base url> <out dir>
import { writeFileSync, mkdirSync, readdirSync } from "node:fs";
const [dport, base, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const f of readdirSync("shots").filter(f => f.endsWith(".html")))
  for (const [w, h, mobile] of [[1400, 900, false], [390, 844, true]])
    for (const scheme of ["light", "dark"]) {
      const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
      const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
      let n = 0; const pending = new Map(), errs = [];
      ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 200)); });
      const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
      try {
        await send("Runtime.enable"); await send("Page.enable");
        await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
        await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
        await send("Page.navigate", { url: `${base}/shots/${f}` }); await sleep(3000);
        const m = await send("Page.getLayoutMetrics"), H = Math.min(12000, Math.ceil(m.result.cssContentSize.height));
        const sw = (await send("Runtime.evaluate", { expression: "document.documentElement.scrollWidth", returnByValue: true })).result.result.value;
        const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: H, scale: 1 } });
        const name = `${f.replace(/\.html$/, "")}-${w}-${scheme}.png`;
        writeFileSync(`${out}/${name}`, Buffer.from(r.result.data, "base64"));
        console.log(`${name}: ${w}x${H}, scroll width ${sw}${sw > w ? " (WIDER THAN THE WINDOW)" : ""}, errors: ${errs.length ? errs.join(" | ") : "none"}`);
      } catch (e) { console.log(`${f} ${w} ${scheme}: stopped: ${String(e).slice(0, 200)}`); }
      finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
    }
process.exit(0);
