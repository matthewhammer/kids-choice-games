// (ticket 660, part 2, for M's garden; Matthew: "flower beds. Chose 8 actual types, from Colorado. vegetables. Choose 8 types
// that grow in the United States") The things to plant: a 🌷 flower bed of one of eight Colorado wildflowers and a 🥕 vegetable
// patch of one of eight vegetables, both in the 🌻 garden group of things to put. Each flower and each vegetable, at each of
// its four stages of 🌱 how grown (sprouts, young, in bud, in flower or ripe), draws well-formed markup with no NaN or
// undefined in it, and each stage draws differently from the others; both kinds' cards offer which one and how grown (a
// range, so moving it does not rebuild the cards); put in the garden, every one is drawn as an object of its own and none
// stands in the way; moving how grown redraws it. Exits 1 on a failure.
//   node plants660.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; slowFlag = false; PERF.slowMoving = true;
    const kinds = { group: THING_GROUPS.some(g => g[0] === "garden"), flowerbed: THING_KINDS.flowerbed && THING_KINDS.flowerbed.group, veggies: THING_KINDS.veggies && THING_KINDS.veggies.group };
    const params = Object.fromEntries(["flowerbed", "veggies"].map(k => [k, thingParams(k).map(p => p[1] + ":" + p[2])]));
    // (each one at each stage: well formed as SVG, nothing made up from a missing number, its four stages each its own drawing)
    const parse = s => !new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + s + '</svg>', "image/svg+xml").querySelector("parsererror");
    const draws = [], same = [];
    for (const [kind, list, key, draw] of [["flowerbed", GARDEN_FLOWERS, "flower", flowerBedSvg], ["veggies", GARDEN_VEGETABLES, "veg", vegetablePatchSvg]])
      for (const [id] of list) { const st = [10, 30, 60, 100].map(g => draw({ [key]: id, grown: g }, 1234));
        st.forEach((s, j) => draws.push({ id, stage: j, ok: parse(s) && !/NaN|undefined/.test(s), len: s.length }));
        if (new Set(st).size !== 4) same.push(id); }
    // put in the garden, every one of them
    Object.assign(B, { kind: "none", things: [], seat: null }); changed(); await w(100);
    set("background", "kind", "garden"); await w(600);
    const xs = [-300, -100, 100, 300], rows = [-95, -55, -5, 55];
    B.things = [...GARDEN_FLOWERS.map(([id], i) => ({ ...THING_DEFAULTS.flowerbed, kind: "flowerbed", flower: id, x: xs[i % 4], z: SCENE.ground + rows[i >> 2], seed: 2000 + i })),
                ...GARDEN_VEGETABLES.map(([id], i) => ({ ...THING_DEFAULTS.veggies, kind: "veggies", veg: id, x: xs[i % 4], z: SCENE.ground + rows[2 + (i >> 2)], seed: 2100 + i }))];
    changed(); await w(800);
    const names = bgShown.objs.map(o => o.name), drawn = names.filter(nm => /^(flowerbed|veggies) \\d+$/.test(nm)).length;
    const inWay = solidsHere().filter(s => /^(flowerbed|veggies)/.test(s.name)).map(s => s.name);
    // how grown, moved: the pumpkins (the 12th) drawn again, as young plants
    const node = () => bgShown.node.querySelector('[data-obj="veggies 12"]'), full = node() ? node().innerHTML : "";
    B.things[11].grown = 30; changed(); await w(400);
    const young = node() ? node().innerHTML : "";
    Object.assign(B, { things: [] }); changed(); await w(100);
    return JSON.stringify({ kinds, params, draws, same, drawn, inWay, regrown: !!full && !!young && full !== young && young.length < full.length }); })()`));
  const { kinds: K, params: Pm, draws: D, same: S, drawn, inWay, regrown } = r;
  ok("the 🌻 garden group of things to put, with the 🌷 flower bed and the 🥕 vegetable patch in it", K.group && K.flowerbed === "garden" && K.veggies === "garden", K);
  ok("a flower bed's card: which flower (chips) and how grown (a range)", Pm.flowerbed.includes("🌼 which flower:choice") && Pm.flowerbed.includes("🌱 how grown:range"), Pm.flowerbed);
  ok("a vegetable patch's card: which vegetable (chips) and how grown (a range)", Pm.veggies.includes("🥕 which vegetable:choice") && Pm.veggies.includes("🌱 how grown:range"), Pm.veggies);
  ok("eight flowers and eight vegetables, each at four stages: 64 drawings, every one well formed, no NaN or undefined", D.length === 64 && D.every(d => d.ok), D.filter(d => !d.ok));
  ok("each one's four stages draw differently (sprouts, young, in bud, in flower or ripe)", !S.length, S);
  ok("put in the garden, all sixteen are drawn, each an object of its own", drawn === 16, drawn);
  ok("none of them stands in the way (walked through, as a garden's plants are)", !inWay.length, inWay);
  ok("moving how grown draws it again, smaller (ripe pumpkins to young vines)", regrown, regrown);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
