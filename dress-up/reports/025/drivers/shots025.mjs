// (ticket 692, Matthew 2026-11-04: "this overview map (top down for each background) is very nice. Let's create a dress up report about
// it, with lots of screenshots of backgrounds and placed objects.") ^du_report(25)'s pictures, as shots024.mjs takes report 24's, in
// full screen: every place (a world of its own, one square each) in its usual view and then from above, flying low over its
// square (the craft and the flight's buttons hidden, so the square is all there is to see); the friend's own world flown over, low,
// halfway up and at the top, with the 🎈 balloon and the flight's buttons as a player sees them, and the 🫧 bubble over the lake; 🎒
// your items with the two crafts; the world's squares with things placed in them, from the side and from above; and every kind of
// thing there is to place, a dozen to a square, from the side and from above. Its facts (texts.json): each place's shapes from
// above, which things are still a plain dot, the quilt's size and how long it takes to build, and the frames a second flying low
// and high, on this computer. Kept with the report (not in tools/checks, so not in every release's speed run): a diag branch copies
// it into tools/checks to run it. Not a gate: exits 1 only if a scene failed.
//   node shots025.mjs <devtools port> <url>      (writes out/guide025/)
import { writeFileSync, mkdirSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const OUT = "out/guide025";
// a picture of a selector's box (the picture, #pic, unless said), at its own size
const shot = async (name, where = "#pic") => {
  const j = await ev(`(() => { const b = document.querySelector(${JSON.stringify(where)}); if (!b) return ""; const r = b.getBoundingClientRect();
    const x = Math.max(0, r.left), y = Math.max(0, r.top); return JSON.stringify({ x: scrollX + x, y: scrollY + y, width: Math.min(innerWidth - x, r.width), height: Math.min(innerHeight - y, r.height) }); })()`);
  const clip = j ? { ...JSON.parse(j), scale: 1 } : null;
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64")); console.log(`ok   ${name}.png${clip ? " (" + Math.round(clip.width) + "x" + Math.round(clip.height) + ")" : ""}`);
};
let bad = 0; const texts = { places: {}, things: {}, squares: {} };
const step = async (what, f) => { try { await f(); } catch (e) { bad++; console.log(`FAIL ${what}: ${String(e).slice(0, 300)}`); } };
mkdirSync(OUT, { recursive: true });
const W = `const w = ms => new Promise(r => setTimeout(r, ms));`;
// (flying: the craft over a spot, at a height, held there: its own climb to its first height and any move stopped; clean, the craft,
// its shadow, the clouds and the flight's buttons hidden)
const FLYTO = (x, y, h, clean) => `flight.want = null; flight.goal = null; flight.landing = false; cancelAnimationFrame(flyLoop); flyLoop = 0;
  flight.x = ${x}; flight.y = ${y}; flight.h = ${h}; document.body.classList.toggle("shot-clean", ${!!clean}); flyPlace();`;
// (the height at which a whole square fits the picture, up and down, with a little of its neighbours round it)
const FIT = `(() => { const vb = document.getElementById("pic").viewBox.baseVal, want = 1.12 * vb.width / vb.height; let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (flySpan(m) < want) lo = m; else hi = m; } return lo; })()`;
const LAND = `flight = null; flyBuilt = null; document.body.classList.remove("flying", "shot-clean"); { const f = document.getElementById("fly"); if (f) f.remove(); } flyHudShow(); changed(); draw();`;
const count = `const count = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
  const split = t => { const d = document.createElementNS("http://www.w3.org/2000/svg", "g"); d.innerHTML = t; const near = [...d.querySelectorAll(".fly-near")].reduce((a, x) => a + count(x.innerHTML), 0); return [count(t) - near, near]; };`;
// every place, each in a square of a world of its own: the outdoors, the waters, the rooms, and two insides put in a square
const KINDS = ["forest", "clearing", "fairyforest", "woodpath", "crossing", "mountains", "pasture", "lake", "sea", "deepsea", "underwater", "beach", "waterfall", "witch",
  "cemetery", "house", "farmyard", "treehouse", "campsite", "castle", "hut", "desert", "garden", "spring", "dungeon", "cavecross", "imagination", "bubblespace", "livingroom", "tent"];
const COLS = 6;
const EVERY = `state = clone(DEFAULTS); state.music.mute = true; state.access = { ...state.access };
  state.world = { id: WORLD_FIRST, name: "every place", cols: ${COLS}, rows: ${Math.ceil(KINDS.length / COLS)}, start: "0,0", cells: {} };
  ${JSON.stringify(KINDS)}.forEach((k, i) => worldPut((i % ${COLS}) + "," + Math.floor(i / ${COLS}), k)); worldJoinAll(state.world); worldEnter("0,0", null, false);
  state.body.facing = "front"; state.body.anim = "none"; changed(); draw();`;
async function scenes() {
  await ev(`(() => { const s = document.createElement("style"); s.textContent = ".pic-box > button, .ways-layer, .touchpad, #access-layer, .bar { visibility: hidden !important; }" +
    " body.shot-clean #fly-craft, body.shot-clean #fly-shadow, body.shot-clean #fly-clouds, body.shot-clean #fly-hud { visibility: hidden !important; }"; document.head.append(s);
    if (!document.body.classList.contains("big")) document.getElementById("max").click(); return 1; })()`);
  await sleep(800);
  // (1) the friend's own world: from above, low, halfway, at the top, as a player sees it; the bubble over the lake; 🎒 your items
  await step("the world flown over", async () => {
    texts.world = await ev(`(async () => { ${W} ${count} state = clone(DEFAULTS); state.music.mute = true; worldEnter(state.world.start, null, false); changed(); draw(); await w(1500);
      const [c, r] = state.world.start.split(",").map(Number); flightStart("balloon"); await w(300); ${FLYTO("c + 0.5", "r + 0.6", 0.12, false)} await w(600);
      flyBuilt = null; const t0 = performance.now(); flightDraw(); const ms = performance.now() - t0;
      return { cols: state.world.cols, rows: state.world.rows, squares: Object.keys(state.world.cells).length, shapes: count(document.getElementById("fly").innerHTML), buildMs: +ms.toFixed(1), start: state.world.start }; })()`);
    await shot("01-world-low");
    await ev(`(async () => { ${W} ${FLYTO("flight.x - 0.3", "flight.y - 0.4", 0.5, false)} await w(600); return 1; })()`); await shot("02-world-mid");
    await ev(`(async () => { ${W} ${FLYTO("state.world.cols / 2", "state.world.rows / 2", 1, false)} await w(600); return 1; })()`); await shot("03-world-high");
    // (the frames a second, flying east with → held, low and high: this computer's)
    texts.fps = await ev(`(async () => { ${W} const out = {};
      for (const [name, h] of [["low", 0.15], ["high", 1]]) { ${FLYTO(1.2, 3.5, "h", false)} await w(300); let k = 0, on = true; const tick = () => { k++; if (on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await w(3000); on = false;
        document.body.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", bubbles: true })); out[name] = Math.round(k / 3); }
      return out; })()`);
    await ev(`(async () => { ${W} ${LAND} state.pack = { ...state.pack, a: "bubbleride" }; worldEnter("2,3", null, false); changed(); draw(); await w(800); flightStart("bubbleride"); await w(300);
      ${FLYTO(2.45, 3.62, 0.06, false)} await w(600); return 1; })()`);
    await shot("04-bubble-lake");
    await ev(`(async () => { ${W} ${LAND} itemsShow(true); await w(600); return 1; })()`); await shot("05-items", "#items-screen");
    await ev(`(async () => { ${W} itemsShow(false); return 1; })()`);
  });
  // (2) the friend's world's squares with things placed in them, from the side and from above
  for (const [i, key] of ["0,4", "0,3", "1,5", "5,4", "0,0"].entries()) await step("a square with its things, " + key, async () => {
    texts.squares[key] = await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; const cell = state.world.cells["${key}"]; worldEnter("${key}", null, false);
      state.body.facing = "front"; changed(); draw(); await w(1500); return { kind: cell.kind, name: placeName(cell.kind), things: (cell.things || []).map(t => t.kind) }; })()`);
    await shot(`1${i}-square-${key.replace(",", "-")}-side`);
    await ev(`(async () => { ${W} const [c, r] = "${key}".split(",").map(Number); flightStart("balloon"); await w(200); ${FLYTO("c + 0.5", "r + 0.5", FIT, true)} await w(500); return 1; })()`);
    await shot(`1${i}-square-${key.replace(",", "-")}-above`);
    await ev(`(async () => { ${LAND} return 1; })()`);
  });
  // (3) every place: its usual view, then its square from above
  await ev(`(async () => { ${W} ${EVERY} await w(800); return 1; })()`);
  for (const [i, k] of KINDS.entries()) await step("the place " + k, async () => {
    const key = `${i % COLS},${Math.floor(i / COLS)}`, nn = String(20 + i).padStart(2, "0");
    texts.places[k] = await ev(`(async () => { ${W} ${count} worldEnter("${key}", null, false); state.body.facing = "front"; state.body.anim = "none"; changed(); draw(); await w(1400);
      return { name: placeName("${k}"), key: "${key}", look: split(flyLookOf("${k}", "${key}", state.background, state.world.cells["${key}"]) + flyPathsSvg("${k}", worldLiveWays(state.world, "${key}"))), ways: worldLiveWays(state.world, "${key}") }; })()`);
    await shot(`${nn}-${k}-side`);
    await ev(`(async () => { ${W} const [c, r] = "${key}".split(",").map(Number); flightStart("balloon"); await w(200); ${FLYTO("c + 0.5", "r + 0.5", FIT, true)} await w(500); return 1; })()`);
    await shot(`${nn}-${k}-above`);
    await ev(`(async () => { ${LAND} return 1; })()`);
  });
  // (4) every kind of thing to place, a dozen to a square (the crossing's, its paths off), from the side and from above
  const groups = await ev(`(() => { const g = {}; for (const [k, v] of Object.entries(THING_KINDS)) if (!["item", "lifted"].includes(k)) (g[v.group || "other"] = g[v.group || "other"] || []).push(k);
    const out = []; for (const [name, ks] of Object.entries(g)) for (let i = 0; i < ks.length; i += 12) out.push([name, ks.slice(i, i + 12)]); return JSON.stringify(out); })()`);
  for (const [i, [name, ks]] of JSON.parse(groups).entries()) await step("things: " + name, async () => {
    const tag = `${70 + i}-things-${name}${i ? "-" + i : ""}`;
    texts.things[tag] = await ev(`(async () => { ${W} const key = "4,0", cell = state.world.cells[key];
      for (const d of Object.keys(WORLD_DIRS)) cell["cross" + d] = false; cell.ways = [];
      cell.things = ${JSON.stringify(ks)}.map((kind, j) => ({ ...(THING_DEFAULTS[kind] || {}), kind, x: -285 + 190 * (j % 4), z: SCENE.ground - 58 + 62 * Math.floor(j / 4), seed: 900 + j, size: 100, mirror: false }));
      worldEnter(key, null, false); state.body.facing = "front"; state.background.figX = 360; changed(); draw(); await w(1500);
      const dot = k => /^<circle[^>]*stroke="#00000055" stroke-width="3"\\/>$/.test(flyThingSvg({ kind: k, x: 0, z: 330 }));
      return { group: "${name}", kinds: ${JSON.stringify(ks)}, labels: ${JSON.stringify(ks)}.map(k => (THING_KINDS[k] || {}).label || k), dots: ${JSON.stringify(ks)}.filter(dot) }; })()`);
    await shot(`${tag}-side`);
    await ev(`(async () => { ${W} flightStart("balloon"); await w(200); ${FLYTO(4.5, 0.5, FIT, true)} await w(500); return 1; })()`);
    await shot(`${tag}-above`);
    await ev(`(async () => { ${LAND} return 1; })()`);
  });
}
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Page.navigate", { url: url.replace(/#inspect$/, "") }); await sleep(5000);
  await scenes();
  texts.version = await ev(`VERSION.number`);
  writeFileSync(`${OUT}/texts.json`, JSON.stringify(texts, null, 1));
  console.log(`ok   texts (${JSON.stringify(texts).slice(0, 600)}); page errors: ${errs.length}`);
  for (const e of errs) console.log("     page error: " + e);
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`).catch(() => {}); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
