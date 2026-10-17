// (ticket 180) The pictures for OBJECTS.md: every place at its defaults,
// the friend hidden and the animations held still, a picture of the place,
// and each object clipped from it by its box on the screen (a margin round
// it), as WebP, with the list (out/objects/objects.json). tools/objects_md.py
// writes OBJECTS.md from them. Never fails.
//   node objects180.mjs <devtools port> <url>      (writes out/objects/)
import { writeFileSync, mkdirSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const OUT = "out/objects";
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = s => s.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").toLowerCase() || "x";
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const shot = async (clip, file, scale = 1) => {
  const r = await send("Page.captureScreenshot", { format: "webp", quality: 80, clip: { ...clip, scale } });
  writeFileSync(file, Buffer.from(r.result.data, "base64"));
};
const records = [];
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const version = await ev("VERSION.number");
  let places = JSON.parse(await ev(`JSON.stringify(PLACES.filter(([k]) => !["none", "castleroom", "treeroom"].includes(k)))`));
  places = [...places, ...[1, 2, 3, 4, 5, 6].map(r => [`treeroom:${r}`, `🪜 tree house room ${r}`]),
            ...JSON.parse(await ev(`JSON.stringify(Object.entries(ROOM_KINDS).map(([st, R]) => ["castleroom:" + st, R.label]))`))];
  for (const [kind, label] of places) {
    const set = kind.startsWith("castleroom") ? `Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: ${JSON.stringify(kind.split(":")[1])}, castleRoom: 6 })`
      : kind.startsWith("treeroom") ? `Object.assign(B, { kind: "treeroom", houses: 6, inside: ${kind.split(":")[1]} })` : `B.kind = ${JSON.stringify(kind)}`;
    const R = JSON.parse(await ev(`(async () => {
      for (const [p, v] of Object.entries(DEFAULTS)) if (state[p] && typeof v === "object") { for (const key of Object.keys(state[p])) delete state[p][key]; Object.assign(state[p], structuredClone(v)); }
      state.music.mute = true; const B = state.background; ${set}; B.figX = 0; B.figY = 0; changed();
      if (!bgShown.objs.length) { await new Promise(r => setTimeout(r, 1500)); changed(); }
      await new Promise(r => setTimeout(r, 400));
      const pic = document.getElementById("pic"); pic.pauseAnimations(); pic.setCurrentTime(1);
      for (const n of figShown) if (n.style) n.style.visibility = "hidden";
      for (const n of document.querySelectorAll("#mute, #max, .pad-btn, #hud, #touchpad, .measuring-note")) n.style.visibility = "hidden";   // (the buttons over the picture)
      const P = pic.getBoundingClientRect();
      const box = r => { const m = 8, x0 = Math.max(P.left, r.left - m), y0 = Math.max(P.top, r.top - m), x1 = Math.min(P.right, r.right + m), y1 = Math.min(P.bottom, r.bottom + m);
        return x1 - x0 >= 4 && y1 - y0 >= 4 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null; };
      return JSON.stringify({ pic: { x: P.left, y: P.top, width: P.width, height: P.height },
        objects: bgShown.objs.map(o => ({ name: o.name, z: Number.isFinite(o.z) ? Math.round(o.z * 10) / 10 : "front", clip: box(o.node.getBoundingClientRect()) })) });
    })()`));
    const dir = `${OUT}/${slug(kind)}`; mkdirSync(dir, { recursive: true });
    await shot(R.pic, `${dir}/place.webp`, 0.5);
    const objects = [];
    for (const o of R.objects) {
      let file = null;
      if (o.clip) { file = `${slug(kind)}/${slug(o.name)}.webp`; await shot(o.clip, `${OUT}/${file}`, Math.min(1, 200 / Math.max(o.clip.width, o.clip.height))); }
      objects.push({ name: o.name, z: o.z, picture: file });
    }
    records.push({ kind, label, picture: `${slug(kind)}/place.webp`, objects });
    console.log(`${label}: ${objects.length} objects, ${objects.filter(o => o.picture).length} pictures`);
    await ev(`(() => { document.getElementById("pic").unpauseAnimations(); for (const n of figShown) if (n.style) n.style.visibility = ""; for (const n of document.querySelectorAll("#mute, #max, .pad-btn, #hud, #touchpad")) n.style.visibility = ""; return 1; })()`);
  }
  writeFileSync(`${OUT}/objects.json`, JSON.stringify({ version, places: records }, null, 1));
  console.log(`${records.length} places, ${records.reduce((s, r) => s + r.objects.length, 0)} objects, on ${version}; errors: ${errs.length ? errs.slice(0, 3).join(" | ") : "none"}`);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(0); }
