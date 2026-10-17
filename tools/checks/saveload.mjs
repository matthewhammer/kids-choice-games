// (Matthew, 2026-10-17) Save and Load keep everything, the world included:
// a friend and a place with things in it (a forest crossing: its paths, its
// floor, its things and their parameters; and the world's grid, once the
// game has one), saved by the real 💾 Save (only .json ticked, downloaded
// for real), the game started over, and loaded by the real 📂 Load (the
// file handed to its input): the same state, the same picture. Then the
// autosave: the page reloaded, the same state again. (Load keeps the
// music's volume and mute as they are, by design: left out of the
// comparison.) Exits 1 on a failure.
//   node saveload.mjs <devtools port> <url>
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const [dport, url] = process.argv.slice(2);
const DIR = resolve("out/saveload");
rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true });
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
// the state to compare (Load keeps the music's volume and mute), and the picture's markup
const SNAP = `JSON.stringify({ state: JSON.parse(JSON.stringify(state, (k, v) => k === "volume" || k === "mute" ? undefined : v)), pic: [...document.querySelectorAll("#bg [data-obj]")].map(e => e.getAttribute("data-obj")).join("|") })`;
const firstDiff = (a, b, path = "") => {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], path + "." + k); if (d) return d; }
  }
  return { path, saved: a, loaded: b };
};
try {
  await send("Runtime.enable"); await send("Page.enable"); await send("DOM.enable");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DIR });
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // a friend and a world worth keeping
  await ev(`(async () => {
    state.music.mute = true; const B = state.background;
    Object.assign(B, { kind: "crossing", crossN: true, crossNE: true, crossE: false, crossSE: true, crossS: true, crossSW: false, crossW: true, crossNW: false, crossFloor: "#5f7a3a", figX: -40, figY: 30 });
    B.crossThings = [{ kind: "tree", x: -260, z: 350, seed: 4242, size: 100, mirror: true, h: 480, leaves: "autumn" },
                     { kind: "rock", x: 120, z: 390, seed: 977, size: 100, mirror: false, tone: "#a8634a" },
                     { kind: "pine", x: 300, z: 320, seed: 31337, size: 100, tiers: 8 },
                     { kind: "bush", x: -60, z: 405, seed: 55, size: 100, flowers: "#f472b6" }];
    state.face.smile = 160; state.hair.color = state.hair.color === "#ffffff" ? "#000000" : "#ffffff";
    // (the world's grid, once the game has one: a few cells of it)
    if (DEFAULTS.world) { state.world = clone(DEFAULTS.world); const C = state.world.cells || (state.world.cells = {});
      C["2,2"] = { kind: "crossing", crossN: true, crossS: true, crossThings: [{ kind: "rock", x: 0, z: 360, seed: 3, size: 100, tone: "#6f8a94" }] }; C["2,1"] = { kind: "clearing" }; }
    changed(); await new Promise(r => setTimeout(r, 600)); return 1; })()`);
  const A = JSON.parse(await ev(SNAP));
  // 💾 Save, only the .json
  await ev(`(() => { for (const b of document.querySelectorAll("#formats input")) b.checked = b.value === "json"; document.getElementById("save").click(); return 1; })()`);
  let file = null;
  for (let i = 0; i < 40 && !file; i++) { await sleep(250); file = readdirSync(DIR).find(f => f.endsWith(".json")); }
  ok("💾 Save wrote a .json", !!file, readdirSync(DIR));
  const saved = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  ok("the file is the game's own save", saved.app === "dress-up" && saved.version === 1 && saved.state && saved.state.background.kind === "crossing", Object.keys(saved));
  // started over: nothing of it left
  await ev(`(async () => { state = clone(DEFAULTS); state.music.mute = true; changed(); await new Promise(r => setTimeout(r, 400)); return 1; })()`);
  const O = JSON.parse(await ev(SNAP));
  ok("started over, the crossing is gone", O.state.background.kind !== "crossing" && !(O.state.background.crossThings || []).length, O.state.background.kind);
  // 📂 Load, the file handed to the page's own input
  const doc = await send("DOM.getDocument", { depth: 0 });
  const q = await send("DOM.querySelector", { nodeId: doc.result.root.nodeId, selector: "#load-file" });
  await send("DOM.setFileInputFiles", { nodeId: q.result.nodeId, files: [`${DIR}/${file}`] });
  await sleep(1200);
  const B = JSON.parse(await ev(SNAP));
  const d = firstDiff(A.state, B.state);
  ok("📂 Load gave back the same state", !d, d);
  ok("and the same picture (its objects, in drawing order)", A.pic === B.pic && A.pic.includes("tree 1"), [A.pic.slice(0, 200), B.pic.slice(0, 200)]);
  ok("the crossing's things and their parameters", JSON.stringify(B.state.background.crossThings) === JSON.stringify(A.state.background.crossThings), B.state.background.crossThings);
  if (A.state.world) ok("the world's grid", JSON.stringify(B.state.world) === JSON.stringify(A.state.world), B.state.world);
  // the autosave: kept, and read back on loading the page again
  await ev(`(() => { persist(); return 1; })()`);
  await send("Page.reload", { ignoreCache: true }); await sleep(4500);
  const C = JSON.parse(await ev(SNAP));
  const d2 = firstDiff(A.state, C.state);
  ok("the page reloaded: the same state from the autosave", !d2, d2);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
