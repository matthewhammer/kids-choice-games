// (ticket 501, for M: "dessert -- sand dunes in distance-- placeable objects are 6 types of dessert plants (cactus,etc)";
// the desert, Matthew means) The 🏜️ desert: a place of its own kind, outdoors (its 🔭 an outdoor place's), with its words,
// its tune and its LFO things; its dunes far and near, what is far off as its 🏜️ setting says (red mesas to start with,
// snowy peaks, nothing); its plants and rocks standing at their depths and in the way, the lizard, the tumbleweed and the
// hawk not; things moving with the music; the friend arriving clear of everything. And the 🌵 desert things: six kinds in
// their own group, each drawn and in the way (the tall ones by their columns, trunks and stems, not their arms: a saguaro's
// box narrower than its drawing; a young one's, with no arms, as wide as its column), each one's settings changing its drawing;
// the red mesas on the horizon, none below it. Exits 1 on a failure.
//   node desert501.mjs <devtools port> <url>
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
const KINDS = ["saguaro", "pricklypear", "barrelcactus", "agave", "joshuatree", "ocotillo"];
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; slowFlag = false; PERF.slowMoving = true;
    const objsNow = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj);
    const anims = name => { const o = bgShown.node.querySelector('[data-obj="' + name + '"]'); return o ? o.querySelectorAll("animate, animateTransform, animateMotion").length : -1; };
    const place = { inPlaces: PLACES.some(p => p[0] === "desert"), group: PLACE_GROUPS.filter(g => g[2].includes("desert")).map(g => g[0]), outdoors: NORTH_OUT.includes("desert"),
      phrase: PLACE_PHRASE.desert, tune: SCENE_TUNE.desert, lfo: SCENE_LFO_THINGS.desert || {}, back: !!SCENE_BACK.desert };
    Object.assign(B, { kind: "desert", figX: ARRIVE.desert[0], figY: ARRIVE.desert[1], seat: null, things: [], desertFar: "mesas" }); state.body.sit = false; changed(); await w(800);
    const objs = objsNow(), sol = solidsHere().map(o => o.name);
    const scene = { objs, solids: sol, seats: seatsHere(B).map(t => t.name), arriveClear: !solidAt(ARRIVE.desert[0], SCENE.ground + ARRIVE.desert[1]),
      moving: { tumbleweed: anims("tumbleweed"), lizard: anims("lizard"), hawk: anims("hawk"), sand: anims("sand blowing off the dunes") }, all: bgShown.node.querySelectorAll("animate, animateTransform, animateMotion").length };
    // (the red mesas stand on the horizon, none of them below it: the bottom of what is far off, against the sky's gradient's foot)
    const skyFoot = +bgShown.node.querySelector("#bg-desert-sky").getAttribute("y2"), farEl = bgShown.node.querySelector('[data-obj="far mountains"]');
    const mesas = farEl ? { bottom: Math.round(10 * (farEl.getBBox().y + farEl.getBBox().height)) / 10, horizon: skyFoot } : null;
    const far = {};
    for (const v of ["mesas", "snowy", "none"]) { B.desertFar = v; changed(); await w(300); far[v] = objsNow().includes("far mountains"); }
    B.desertFar = "mesas";
    // the things, in the empty room: each kind at its defaults, then each at other settings
    // (one seed for all, so a drawing changes by its settings alone)
    const thing = (kind, x, p = {}) => ({ kind, x, z: 360, seed: 777, size: 100, mirror: false, ...structuredClone(THING_DEFAULTS[kind]), ...p });
    const boxOf = el => { const b = el.getBBox(); return { w: Math.round(b.width), h: Math.round(b.height), shapes: el.querySelectorAll("path, ellipse, circle, line").length }; };
    const drawn = async T => { B.things = T; changed(); await w(500);
      return [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]]; return { kind: t.kind, ...boxOf(el) }; }); };
    Object.assign(B, { kind: "emptyroom", figX: 0, figY: 70 }); changed(); await w(500);
    const group = ${JSON.stringify(KINDS)}.map(k => THING_KINDS[k] && THING_KINDS[k].group);
    const plain = await drawn(${JSON.stringify(KINDS)}.map((k, i) => thing(k, -330 + i * 130)));
    const things = solidsHere().filter(o => /^(saguaro|pricklypear|barrelcactus|agave|joshuatree|ocotillo) \\d/.test(o.name)).map(o => ({ name: o.name, w: Math.round(o.x1 - o.x0) }));
    const wide = await drawn([thing("saguaro", 0, { arms: 4 })]), wideBox = solidsHere().filter(o => /^saguaro/.test(o.name)).map(o => Math.round(o.x1 - o.x0));
    const other = await drawn([thing("saguaro", -300, { arms: 0, flowers: false }), thing("pricklypear", -180, { bloom: "none" }), thing("barrelcactus", -60, { flowers: false }),
      thing("agave", 60, { stalk: true }), thing("joshuatree", 180, { flowers: true }), thing("ocotillo", 300, { leaves: false, flowers: false })]);
    // (a young saguaro, with no arms: its boxes as wide as its column, at every height; its column measured as standingHere does)
    const young = (() => { const el = [...bgShown.node.querySelectorAll(".thing")].find(e => B.things[+e.dataset.drag.split(":")[1]].kind === "saguaro");
      const col = el && el.querySelector('path[d^="M-22 0 "]'), Pinv = document.getElementById("pic").getScreenCTM().inverse();
      const q = col && boxThrough(col.getBBox(), Pinv.multiply(col.getScreenCTM())), o = solidsHere().find(s => /^saguaro/.test(s.name));
      return { col: q ? [Math.round(q.x), Math.round(q.x + q.width)] : null, bands: o && o.bands ? o.bands.map(b => [Math.round(b.x0), Math.round(b.x1)]) : [] }; })();
    return JSON.stringify({ place, scene, mesas, far, group, plain, things, wide: [wide[0], wideBox], young, other }); })()`));
  const { place: P, scene: S, far: F, plain, other } = r;
  ok("the desert is a place: in the list, a kind of its own, outdoors, with its words, its tune, its back line and its quick and slow things",
     P.inPlaces && P.group.length === 1 && P.group[0] === "desert" && P.outdoors && /desert/.test(P.phrase || "") && P.tune === "canyon" && P.back && P.lfo.fast && P.lfo.slow, P);
  ok("its dunes, far and near, and the sand blowing off them", ["far dunes", "near dunes", "sand blowing off the dunes"].every(o => S.objs.includes(o)), S.objs);
  const plants = ["saguaro, near", "saguaro, far", "prickly pear", "barrel cactus", "agave", "joshua tree", "ocotillo"];
  ok("its plants stand in it, each an object", plants.every(o => S.objs.includes(o)), S.objs);
  ok("its plants and rocks are in the way; the lizard, the tumbleweed and the hawk are not", plants.every(o => S.solids.includes(o)) && S.solids.some(s => s.startsWith("rock")) &&
     !S.solids.some(s => /^(lizard|tumbleweed|hawk)/.test(s)), S.solids);
  ok("its rocks can be sat on", S.seats.some(s => s.startsWith("rock")), S.seats);
  ok("things moving with the music: the tumbleweed rolling and bouncing, the lizard's push-ups, the hawk circling, the sand blowing",
     S.moving.tumbleweed >= 3 && S.moving.lizard >= 2 && S.moving.hawk >= 2 && S.moving.sand >= 2, S.moving);
  ok("the friend arrives clear of everything", S.arriveClear, S);
  ok("far off: red mesas, snowy peaks, or nothing, as 🏜️ says", F.mesas && F.snowy && !F.none, F);
  ok("the red mesas stand on the horizon, none below it (no pale seam at their foot)", r.mesas && Number.isFinite(r.mesas.horizon) && r.mesas.bottom <= r.mesas.horizon + 0.2, r.mesas);
  ok("the six desert plants are 🌵 desert things", r.group.every(g => g === "desert"), r.group);
  ok("each desert plant drawn", KINDS.every(k => { const e = plain.find(p => p.kind === k); return e && e.w > 30 && e.h > 40; }), plain);
  ok("each desert plant is in the way", KINDS.every(k => r.things.some(t => t.name.startsWith(k + " "))), r.things);
  ok("a saguaro with arms is in the way by its column, not its arms (its box narrower than its drawing)", r.wide[1].length === 1 && r.wide[1][0] < 0.5 * r.wide[0].w, r.wide);
  ok("a young saguaro, with no arms, is in the way by all its column, at every height", r.young.col && r.young.bands.length >= 3 &&
     r.young.bands.every(b => b[0] <= r.young.col[0] + 1 && b[1] >= r.young.col[1] - 1), r.young);
  const by = (list, k) => list.find(p => p.kind === k) || {};
  ok("each one's settings change its drawing (no arms or flowers, no bloom, no flowers, a flower stalk, in bloom, no leaves or flowers)",
     KINDS.every(k => by(other, k).shapes !== by(plain, k).shapes) && by(other, "agave").h > by(plain, "agave").h + 100 && by(other, "saguaro").w < by(plain, "saguaro").w, { plain, other });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
