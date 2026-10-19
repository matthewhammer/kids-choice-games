// (ticket 290, for N) The bubble room: a place of the 🫧 bubbles kind, with bubble space; its five surfaces each foamed, an
// object each ("foam, back wall" ...), packed bubbles of many sizes (more small ones than big); each surface's foam gone
// when switched off, and a wall's foam lower when its height is lower; the friend kept in by its walls; bubbles stuck out into
// the room from its surfaces, the foam moving; a 🫧 bubble maker placed in it blowing bubbles. Exits 1 on a failure.
//   node bubbleroom290.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; delete B.onBridge; delete B.onPlatform;
    Object.assign(B, { kind: "bubbleroom", figX: 0, figY: 40, things: [], foamBack: true, foamBackH: 70, foamLeft: true, foamRight: true, foamFloor: true, foamCeil: true }); changed(); await w(500);
    const objs = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(n => n.getAttribute("data-obj"));
    // (ticket 369: since ticket 290's speed-up the still foam is one picture, an <image> of its own little SVG document, and
    // only the moving bubbles are live over it: its bubbles are read from inside that document too, each by its body, the
    // circle filled 0.2, and where its surface puts it)
    const foam = () => { const N = bgShown.node.querySelector('[data-obj="foam, back wall"]'); if (!N) return [];
      const docs = [...N.querySelectorAll("image")].map(im => new DOMParser().parseFromString(decodeURIComponent(im.getAttribute("href").replace(/^data:[^,]*,/, "")), "image/svg+xml").documentElement);
      return [N, ...docs].flatMap(R => [...R.querySelectorAll('circle[fill-opacity="0.2"]')]).map(c => { const g = c.closest('g[transform^="translate"]'), m = g && /translate\\(\\S+ ([-\\d.]+)/.exec(g.getAttribute("transform"));
        return { r: +c.getAttribute("r"), y: m ? +m[1] : NaN }; }); };
    const sizes = foam().map(b => b.r);
    const box = () => { const F = foam().filter(b => Number.isFinite(b.y)); return F.length ? Math.round(Math.min(...F.map(b => b.y - b.r))) : null; };
    const all = objs(), top70 = box();
    B.foamBackH = 30; changed(); await w(200); const top30 = box();
    B.foamLeft = false; changed(); await w(200); const noLeft = objs();
    B.foamLeft = true; B.foamBackH = 70; changed();
    const group = PLACE_GROUPS.find(g => g[2].includes("bubbleroom")), walls = !!castleWalls(B);
    for (const K of ["Back", "Left", "Right", "Floor", "Ceil"]) B["foam" + K + "Out"] = 30; changed(); await w(200);
    // (ticket 340, 0.0.306: the foam still at the start, its moving costly; moving with its slider up, as Matthew asked it could)
    const stillAtStart = bgShown.node.querySelectorAll("[data-obj^='foam'] animateTransform, [data-obj^='foam'] animate").length === 0 && (B.foamMove ?? 0) === 0;
    PERF.slowMoving = true; B.foamMove = 88; changed(); await w(400);
    const stuck = objs().filter(n => n.startsWith("bubbles stuck out")), moving = bgShown.node.querySelectorAll("[data-obj^='foam'] animateTransform, [data-obj^='foam'] animate").length;
    B.foamMove = 0; changed(); await w(200);
    B.things = [{ kind: "bubblemaker", x: -150, z: 330, size: 100, rate: 8, theme: "A", color: "#ff7eb6" }]; changed(); await w(1500);
    const blown = document.querySelectorAll("#maker-bubbles > g").length, maker = !!bgShown.node.parentNode.querySelector(".thing") || !!document.querySelector("#pic .thing");
    B.things = []; changed();
    // (walked across the floor near us: stuck-out bubbles there pop, their lot's picture drawn again without them)
    for (const kk of Object.keys(DEFAULTS.background).filter(kk => kk.startsWith("foam"))) B[kk] = DEFAULTS.background[kk];
    B.figY = 40; B.figX = -300; changed(); await w(300); ballPops.clear();
    for (let x = -300; x <= 300; x += 12) { B.figX = x; changed(); await w(40); }
    const popped = ballPops.size, popLots = [...new Set([...ballPops.values()].map(p => p.obj))];
    const popImg = popLots[0] && bgShown.node.querySelector('[data-obj="' + popLots[0] + '"] image'), popKey = popImg ? popImg.dataset.pops : null;
    const track = state.music.track; state.music.track = "scene"; const tune = tuneOf(), song = songOf("bubbledub"); state.music.track = track;
    return JSON.stringify({ stillAtStart, all, n: sizes.length, big: sizes.filter(v => v > 20).length, small: sizes.filter(v => v < 8).length, top70, top30, noLeft, group: group && group[0], with: group && group[2], walls, stuck, moving, blown, maker, tune, bpm: song && song.T.bpm, steps: song && song.steps, popped, popKey }); })()`));
  console.log(`  the bubble room: ${JSON.stringify(r)}`);
  ok("in the 🫧 bubbles kind of place, with bubble space", r.group === "bubbles" && r.with.includes("bubblespace"), r);
  ok("foam on all five surfaces, an object each", ["foam, back wall", "foam, left wall", "foam, right wall", "foam, floor", "foam, ceiling"].every(n => r.all.includes(n)), r);
  ok("packed bubbles of many sizes, more small ones than big", r.n > 100 && r.small > r.big && r.big > 0, r);
  ok("the back wall's foam lower at a lower height", r.top30 > r.top70, r);
  ok("the left wall's foam gone when it is switched off", !r.noLeft.includes("foam, left wall") && r.noLeft.includes("foam, right wall"), r);
  ok("a square room: walls the friend stays inside", r.walls, r);
  ok("bubbles stuck out into the room from its surfaces: the back wall's, and in bands by depth", r.stuck.includes("bubbles stuck out, back wall") && r.stuck.length >= 3, r);
  ok("its foam still at the start (0.0.306, ticket 340: moving foam is costly), and moving with its slider up (Matthew: dynamic, not static)", r.stillAtStart && r.moving > 0, r);
  ok("a 🫧 bubble maker placed there blows bubbles", r.maker && r.blown >= 4, r);
  ok("walking through the stuck-out bubbles pops them, and their picture is drawn again without them", r.popped > 0 && !!r.popKey, r);
  ok("its own tune, the 🫧 bubble super-dub step, slower than the 🔥 one (153)", r.tune === "bubbledub" && r.bpm < 153 && r.steps > 0, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
