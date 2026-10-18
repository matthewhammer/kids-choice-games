// (ticket 261, Matthew: "remove them from the scene if they are more than 75% occluded (rough approx is fine)") What
// leaving out the hidden drawings changes on the screen: every place drawn with them (CULL_HIDDEN off, the caches
// emptied) and without, each as a still picture on a canvas, compared pixel by pixel; the share of pixels that differ
// (any channel by more than 32 of 255), less the place's own noise (drawn twice with everything: its moving things),
// must be small, under 2% in every place (the busiest tree house's crowns, 100 leaves, 1.8%: the edges of pads in other
// greens; side by side it looks the same), and the count of drawings smaller.
// The places that change most are saved side by side, out/cull261/<place>.png. Exits 1 on a failure.
//   node cull261.mjs <devtools port> <url>
import { mkdirSync, writeFileSync } from "node:fs";
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`window.__cmp = async (setup) => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; for (const g of VISIBLE_PARTS) state.visible[g] = 0;
    const draw = async on => { CULL_HIDDEN = on; PARTS.clear(); READS.clear(); TRIMMED.clear(); STILLS.clear(); SCENE_PARTS.clear(); bgShown.text = null; bgShown.kept = new Map();
      Object.assign(B, setup, { things: [] }); changed(); await w(350); changed(); await w(250);
      const c = pic.cloneNode(true), vb = pic.viewBox.baseVal, W = 960, H = Math.round(960 * vb.height / vb.width);
      c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", W); c.setAttribute("height", H); c.removeAttribute("style"); c.removeAttribute("class");
      for (const a of c.querySelectorAll("animate,animateTransform,animateMotion,set")) a.remove();
      const elements = bgShown.node.querySelectorAll("*").length;
      const img = new Image(); img.src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: "image/svg+xml" })); await img.decode();
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d"); x.drawImage(img, 0, 0);
      return { cv, data: x.getImageData(0, 0, W, H).data, elements, W, H }; };
    const all = await draw(false), again = await draw(false), cut = await draw(true);
    const differ = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 4) if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > 32) d++; return d; };
    const noise = differ(all.data, again.data), diff = Math.max(0, differ(all.data, cut.data) - noise);
    const both = document.createElement("canvas"); both.width = all.W * 2 + 8; both.height = all.H; const bx = both.getContext("2d"); bx.fillStyle = "#ff00ff"; bx.fillRect(0, 0, both.width, both.height);
    bx.drawImage(all.cv, 0, 0); bx.drawImage(cut.cv, all.W + 8, 0);
    return JSON.stringify({ share: diff / (all.W * all.H), noise: noise / (all.W * all.H), before: all.elements, after: cut.elements, png: both.toDataURL("image/png").split(",")[1] }); }; 1`);
  const kinds = JSON.parse(await ev(`JSON.stringify(PLACES.map(p => p[0]).filter(k => k !== "none"))`));
  const cases = [...kinds.map(k => [k, { kind: k, figX: 0, figY: 60 }]), ["treehouse at its busiest", { kind: "treehouse", houses: 6, ladders: 6, bridges: 6, leaves: 100, figX: 0, figY: 60 }],
                 ["the greenhouse", { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "greenhouse", castleRoom: 6, figX: 0, figY: 60 }]];
  const rows = [];
  mkdirSync("out/cull261", { recursive: true });
  for (const [label, setup] of cases) {
    const r = JSON.parse(await ev(`__cmp(${JSON.stringify(setup)})`));
    rows.push({ label, share: r.share, noise: r.noise, before: r.before, after: r.after });
    if (r.share > 0.002) writeFileSync(`out/cull261/${label.replace(/[^a-z0-9]+/gi, "-")}.png`, Buffer.from(r.png, "base64"));
  }
  await ev(`CULL_HIDDEN = true; PARTS.clear(); changed(); 1`);
  for (const r of rows) if (r.before !== r.after || r.share > 0) console.log(`  ${r.label}: ${r.before} -> ${r.after} elements (${r.before - r.after} fewer), ${(100 * r.share).toFixed(2)}% of pixels differ (its own noise ${(100 * r.noise).toFixed(2)}%, taken off)`);
  const fewer = rows.reduce((a, r) => a + r.before - r.after, 0);
  console.log(`  in all: ${fewer} fewer elements drawn; the most changed: ${rows.slice().sort((a, b) => b.share - a.share).slice(0, 3).map(r => r.label + " " + (100 * r.share).toFixed(2) + "%").join(", ")}`);
  ok("every place: under 2% of its pixels differ, the hidden drawings left out", rows.every(r => r.share < 0.02), rows.filter(r => r.share >= 0.02));
  ok("fewer elements drawn: the forest, the castle, the waterfall, the tree house", ["forest", "castle", "waterfall", "treehouse"].every(k => { const r = rows.find(q => q.label === k); return r && r.after < r.before; }), rows.filter(r => ["forest", "castle", "waterfall", "treehouse"].includes(r.label)));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
