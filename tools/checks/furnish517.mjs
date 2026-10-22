// (ticket 517, Matthew: "5 styles with objects we have already. How should we furnish a round room?") The round room at
// the top of the tree, furnished: each style (topFurnish), with the hatch on the right (4 houses) and on the left (1
// house): its pieces drawn, each that stands in the way a solid by its footprint; the arrivals (the place menu's, up the
// ladder beside the hatch) and the lever's post in no solid; a walk from the arrival to the lane behind the trunk and on
// to the hatch's side; its seats where its pieces are; no masks or filters; the setting shown only there. Exits 1 on a failure.
//   node furnish517.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, c = stageC();
  const settle = async (ms = 450) => { changed(); await w(ms); measureMarks(); };
  const go = async set => { Object.assign(B, { things: [], seat: null }, set); await settle(); };`;
const WANT = { parlour: ["couch", "rug", "lamp", "plant", "wind chime"], loft: ["bunk beds", "toy chest", "bed", "stump", "dreamcatcher"],
  reading: ["shelves on the trunk", "beanbag", "telescope", "lantern"], potions: ["potion shelves", "shelf of potions 1", "drying herbs 1", "cauldron", "worktable"],
  tea: ["chair, left", "chair, right", "tea table", "counter", "stove", "log 1", "log 2", "log 3"] };
const SOLID = { parlour: ["lamp", "plant"], loft: ["bunk beds", "toy chest", "bed", "stump"], reading: ["telescope"], potions: ["potion shelves", "cauldron", "worktable"],
  tea: ["chair, left", "chair, right", "tea table", "counter", "stove", "log 1"] };
const SEATS_N = { parlour: 1, loft: 2, reading: 1, potions: 0, tea: 5 };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const res = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; climb = null; const out = {};
    for (const style of ${JSON.stringify(Object.keys(WANT))}) for (const houses of [4, 1]) {
      await go({ kind: "treetop", houses, ladders: 3, bridges: 2, hatchShutTop: false, topFurnish: style, figX: ARRIVE.treetop[0], figY: ARRIVE.treetop[1] });
      const N = bgShown.node, { sd, hx, px, pz } = topHatchAt(c, B), solids = solidsHere(), g = SCENE.ground, back = g + figYMin(sceneFrame);
      const inSolid = (x, z) => { const s = solidAt(x, z); return s ? s.name : null; };
      const a = ARRIVE.treetop, plan1 = planPath(a[0], a[1], 0, back - g + 6, 10), plan2 = planPath(0, back - g + 6, sd * 160, 30 * c.k, 10);
      out[style + houses] = { sd, names: bgShown.objs.map(o => o.name), solids: solids.map(o => o.name), masks: N.querySelectorAll("mask, filter").length,
        arrive: inSolid(a[0], g + a[1]), ladder: inSolid(hx - sd * 110 * c.k, g + 30 * c.k), lever: inSolid(px - sd * 30 * c.k, pz + 6 * c.k),
        walk: [plan1.length > 0 && !plan1.short, plan2.length > 0 && !plan2.short], seats: placeSeats(B).map(s => [s.name, Math.sign(s.x0 + s.x1)]) };
    }
    B.topFurnish = "none"; await settle();
    const shown = [SHOWN_WHEN["background.topFurnish"](B), SHOWN_WHEN["background.topFurnish"]({ ...B, kind: "treeroom" }), SHOWN_WHEN["background.topFurnish"]({ ...B, kind: "hutroom" })];
    return JSON.stringify({ out, shown, none: bgShown.objs.map(o => o.name), def: DEFAULTS.background.topFurnish }); })()`));
  for (const [key, r] of Object.entries(res.out)) {
    const style = key.replace(/[0-9]+$/, ""), side = r.sd > 0 ? "right" : "left";
    ok(`${key}: its pieces drawn (hatch on the ${side})`, WANT[style].every(n => r.names.includes(n)) && !r.masks, r);
    ok(`${key}: what stands in the way is a solid by its footprint`, SOLID[style].every(n => r.solids.includes(n)), r);
    ok(`${key}: the arrivals and the lever's post in no solid`, !r.arrive && !r.ladder && !r.lever, r);
    ok(`${key}: a walk from the arrival round behind the trunk to the hatch's side`, r.walk[0] && r.walk[1], r);
    ok(`${key}: its seats (${SEATS_N[style]})`, r.seats.length === SEATS_N[style], r);
  }
  ok("the pieces follow the hatch: mirrored with it (the couch on the side away from it)", res.out.parlour4.seats[0][1] === -1 && res.out.parlour1.seats[0][1] === 1, res.out.parlour4);
  ok("none: nothing of the five, and none to start with", !Object.values(WANT).flat().some(n => res.none.includes(n)) && res.def === "none", res);
  ok("its chip row shown only in the round room", res.shown.join() === "true,false,false", res.shown);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
