// (ticket 219, Matthew) The 🪸 deep sea: a place in the background list and
// the world designer's places, deep water meeting open water (and nothing on
// land); its scene drawn, its light shimmering (its fish school dropped: ticket 234)
// (animations), its kelp, rocks, vent and bubbles; and each 🐚 sea thing put in
// it drawn: coral, shells, a starfish crawling, a fish swimming round (and its
// bubbles), a chest, an anchor and its chain, the four sea plants, two of them
// swaying. Exits 1 on a failure.
//   node deepsea219.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null;
    const place = { inPlaces: PLACES.some(p => p[0] === "deepsea"), inPalette: worldPalette().includes("deepsea"), group: PLACE_GROUPS.filter(g => g[2].includes("deepsea")).length,
      withSea: worldNaturalPair("sea", "S", "deepsea") && worldNaturalPair("deepsea", "N", "sea") && worldNaturalPair("deepsea", "E", "deepsea"),
      withLand: worldNaturalPair("deepsea", "E", "forest") || worldNaturalPair("beach", "S", "deepsea") };
    Object.assign(B, { kind: "deepsea", figX: 0, figY: 40, things: [] }); changed(); await w(600);
    const node = bgShown.node, objs = [...node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj);
    const scene = { deep: !!node.querySelector("#bg-deep"), anims: node.querySelectorAll("animate, animateTransform").length, objs };
    const KINDS = ["coral", "shell", "starfish", "seafish", "chest", "anchor", "kelp", "seagrass", "seafan", "sealettuce"];
    B.things = KINDS.map((kind, i) => ({ kind, x: -380 + (i % 5) * 190, z: 340 + Math.floor(i / 5) * 60, seed: 50 + i, size: 100, ...structuredClone(THING_DEFAULTS[kind] || {}) }));
    changed(); await w(600);
    const things = [...bgShown.node.querySelectorAll(".thing")].map(el => { const i = +el.dataset.drag.split(":")[1], kind = B.things[i].kind, b = el.getBBox();
      return { kind, w: Math.round(b.width), h: Math.round(b.height), anims: el.querySelectorAll("animateTransform").length, circles: el.querySelectorAll("circle").length,
        scale: [...el.querySelectorAll('animateTransform[type="scale"]')].length }; });
    return JSON.stringify({ place, scene, things, KINDS }); })()`));
  const P = r.place, S = r.scene, T = Object.fromEntries(r.things.map(t => [t.kind, t]));
  ok("the deep sea is a place: in the list, in the water group once, among the world designer's places", P.inPlaces && P.inPalette && P.group === 1, P);
  ok("deep water meets open water and other deep sea; nothing on land", P.withSea && !P.withLand, P);
  ok("its scene is drawn: the deep water, and things moving (the light, the kelp, the bubbles)", S.deep && S.anims >= 7, S);
  ok("its kelp, rocks and vent stand at their depths; no school of fish (ticket 234: dropped until one moves well)", ["kelp, left", "kelp, right", "vent"].every(nm => S.objs.includes(nm)) && S.objs.some(o => o.startsWith("rock")) && !S.objs.includes("school of fish"), S.objs);
  ok("every 🐚 sea thing drawn, each with a size", r.KINDS.every(k => T[k] && T[k].w > 10 && T[k].h > 10), r.things);
  ok("the starfish crawls (it moves to and fro)", T.starfish && T.starfish.anims >= 2, T.starfish);
  ok("the fish swims round (moving and turning) and blows bubbles", T.seafish && T.seafish.anims >= 4 && T.seafish.scale === 1 && T.seafish.circles >= 5, T.seafish);
  ok("the kelp and the sea grass sway", T.kelp && T.kelp.anims >= 1 && T.seagrass && T.seagrass.anims >= 1, { kelp: T.kelp, seagrass: T.seagrass });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
