// (tickets 149 and 176) What the friend can't walk through, with a fake
// controller (as fpsgate.mjs): the flat rooms' back walls (176), the standing
// objects, place by place, walked into and, when low and narrow, jumped
// over (176), and 149's castle walls and seats again. Prints each case,
// ok or FAIL; exits 1 on any failure or page error.
//   node collide176.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
const hold = async (btn, ms, also = null) => {
  await ev(`__pad.buttons[${btn}].pressed = true; 1`);
  if (also !== null) { await sleep(120); await ev(`__pad.buttons[state.controls.${also}].pressed = true; 1`); await sleep(120); await ev(`__pad.buttons[state.controls.${also}].pressed = false; 1`); await sleep(ms - 240); }
  else await sleep(ms);
  await ev(`__pad.buttons.forEach(b => b.pressed = false); 1`); await sleep(1300);   // (a jump lands)
};
const at = async () => JSON.parse(await ev(`JSON.stringify({ x: state.background.figX, y: state.background.figY, z: SCENE.ground + state.background.figY })`));
const place = async (bg) => { await ev(`state = Object.assign(clone(DEFAULTS), { controls: state.controls }); state.music.mute = true;
  Object.assign(state.background, ${JSON.stringify(bg)}); state.body.anim = "none"; changed(); 1`); await sleep(500); };
const put = async (x, y) => { await ev(`Object.assign(state.background, { figX: ${Math.round(x)}, figY: ${Math.round(y)} }); state.body.anim = "none"; state.body.sit = false; state.background.seat = null; changed(); 1`); await sleep(300); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  console.log("version", await ev("VERSION.number"));
  await ev(`(() => {
    window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true });
    const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1; })()`);
  // (an x with nothing across it at any depth, for walking straight back: no solid, ladder or doorway)
  const clearX = () => ev(`(() => { const S = solidsHere(), P = document.getElementById("pic").getScreenCTM().inverse(), spans = [];
    for (const el of bgShown.node.querySelectorAll("[data-ladder], .portal")) { const r = el.getBBox(), E = el.getScreenCTM(); if (!E) continue; const m = P.multiply(E);
      const xs = [r.x, r.x + r.width].map(x => m.a * x + m.c * r.y + m.e); spans.push([Math.min(...xs) - 40, Math.max(...xs) + 40]); }
    for (const o of S) spans.push([o.x0 - 25, o.x1 + 25]);
    const xs = []; for (let d = 0; d <= 330; d += 15) xs.push(d, -d);
    // (ticket 248: inside the side walls at the back, where a square room's side walls stand in nearer: the walk up meets the back wall, not a side one)
    const W = castleWalls(state.background), back = SCENE.ground + figYMin(sceneFrame), inWalls = x => !W || Math.abs(x) < W.half(back) - 40;
    return xs.find(x => x > sceneFrame.left + 40 && x < sceneFrame.right - 40 && inWalls(x) && !spans.some(([a, b]) => x > a && x < b)) ?? null; })()`);
  // (what stopped the friend, or let them through, for a failure's line)
  const diag = () => ev(`JSON.stringify({ ahead: (o => o ? (o.wall ? "wall" : o.name) : null)(solidAt(state.background.figX, SCENE.ground + state.background.figY - 4)),
    here: (o => o ? (o.wall ? "wall" : o.name) : null)(solidAt(state.background.figX, SCENE.ground + state.background.figY)),
    anim: state.body.anim, sit: state.body.sit, seat: state.background.seat, climbing: !!climb, still: typeof stillPic !== "undefined" ? stillPic.parts.size : null })`);
  // 176: the flat rooms' back walls: the limit itself (the controller, a drag and the place control all keep to figYMin), then a walk up to it
  for (const kind of ["livingroom", "treeroom", "witchroom", "healerroom", "tent"]) {
    await place({ kind });
    // (ticket 248: a tree room with an x clear of its things, ladders and doors, inside its side walls at the back)
    if (kind === "treeroom") for (let i = 1; i <= 6 && (await clearX()) === null; i++) await place({ kind, houses: 6, inside: i });
    const lim = JSON.parse(await ev(`JSON.stringify({ back: sceneFrame.back, deepest: SCENE.ground + figYMin(sceneFrame) })`));
    say(Math.abs(lim.deepest - lim.back) < 0.5, `${kind}: the deepest the feet may go, ${lim.deepest.toFixed(1)}, is the back wall's foot, ${lim.back.toFixed(1)}`);
    const x = await clearX();
    if (x === null) { console.log(`-    ${kind}: no x clear of solids, ladders and doorways to walk up at`); continue; }
    await put(x, 40); await hold(12, 4500);   // up, to the back wall
    const b = await at(), ok = Math.abs(b.z - lim.back) < 3;
    say(ok, `${kind}: walking up at x ${x} stopped the feet at ${b.z.toFixed(1)}${ok ? "" : " " + await diag()}`);
  }
  // 176: the standing objects, place by place: the nearest walkable one, and a low one if there is one
  const legs = await ev("legReach()");
  for (const bg of [{ kind: "forest" }, { kind: "witch" }, { kind: "campsite" }, { kind: "fairyforest" }, { kind: "castle" }, { kind: "clearing" },
                    { kind: "mountains" }, { kind: "woodpath" }, { kind: "cemetery" }, { kind: "house" }, { kind: "treehouse" }, { kind: "beach" },
                    { kind: "waterfall" }, { kind: "livingroom" }, { kind: "witchroom" }, { kind: "healerroom" }, { kind: "treeroom" },
                    { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "kitchen" }]) {
    await place(bg);
    const label = bg.kind + (bg.castleRoom1N ? " " + bg.castleRoom1N : "");
    // (ticket 248: nothing too tall to jump just past it, the way it would be jumped: a tree just past woodpath's right
    // mushroom stops a jump in the air, and it comes down inside the mushroom, then out of it, back the way it came)
    const S = JSON.parse(await ev(`JSON.stringify(solidsHere().filter(o => o.standing && o.x1 - o.x0 > 8 && o.front > SCENE.ground + figYMin(sceneFrame) + 4
      && o.front < sceneFrame.bottom - 4 && o.x0 - 70 > sceneFrame.left && o.x1 + 70 < sceneFrame.right).sort((a, b) => b.front - a.front)
      .map(o => { const z = (o.back + o.front) / 2, fromLeft = !solidAt(o.x0 - 60, z), sx = feetSpan()[0], tall = legReach(), [a, b] = fromLeft ? [o.x1, o.x1 + sx + 60] : [o.x0 - sx - 60, o.x0];
        const room = !solidsHere().some(s => s !== o && s.h >= tall && s.x0 < b && s.x1 > a && s.back < z + sx && s.front > z - sx); return { ...o, room }; }))`));
    const all = JSON.parse(await ev(`JSON.stringify(solidsHere().filter(o => o.standing).map(o => o.name))`));
    if (!S.length) { console.log(`-    ${label}: no standing object to walk into (${all.length} standing: ${all.join("; ") || "none"})`); continue; }
    const picks = [S[0], S.find(o => o !== S[0] && o.h < legs && o.x1 - o.x0 < 90 && o.room)].filter(Boolean);
    for (const o of S.filter(o => o.h < legs && o.x1 - o.x0 < 90 && !o.room)) console.log(`-    ${label}: "${o.name}": something too tall to jump just past it, its high jump not tried`);
    for (const o of picks) {
      const z = (o.back + o.front) / 2, y = z - await ev("SCENE.ground");
      // (from the left, or from the right when the left is blocked)
      const fromLeft = await ev(`!solidAt(${o.x0 - 60}, ${z})`), x0 = fromLeft ? o.x0 - 60 : o.x1 + 60, dir = fromLeft ? 15 : 14;
      await put(x0, y); await hold(dir, 2200);
      const w = await at(), sat = await ev(`state.body.sit ? state.background.seat : ""`);
      // (a seat on the way: stopping at it sits on it, the game's own way (ticket 50), which moves the feet; inconclusive)
      if (sat) { console.log(`-    ${label}: "${o.name}": the friend sat on "${sat}" on the way, inconclusive`); continue; }
      // (0.0.156: stopped before it, the middle of the feet short of its box; the soles, not a 6-unit margin, meet it now)
      // (at its edge counts: a sole on its line)
      const stopped = fromLeft ? w.x <= o.x0 : w.x >= o.x1, why = stopped ? "" : " " + await diag() + ` (feet at depth ${w.z.toFixed(1)}, started at x ${Math.round(x0)})`;
      const low = o.h < legs && o.x1 - o.x0 < 90 && o.room;
      let jumped = "";
      if (low) {
        await put(x0, y); await hold(dir, 2200, "jumpHigh");
        const j = await at(), over = fromLeft ? j.x > o.x1 : j.x < o.x0;
        jumped = `; jumping high ${over ? "cleared it" : "did NOT clear it"} (x ${j.x})`;
        if (!over) { say(false, `${label}: "${o.name}" high jump`); }
      }
      say(stopped, `${label}: "${o.name}" ${o.x0.toFixed(0)}..${o.x1.toFixed(0)} at depth ${o.back.toFixed(0)}..${o.front.toFixed(0)}, height ${o.h.toFixed(0)}: walking ${fromLeft ? "right" : "left"} into it stopped at x ${w.x}${why}${jumped}`);
    }
    console.log(`     ${label}: standing here: ${all.join("; ")}`);
  }
  // 149, again: castle rooms' back and side walls
  for (const st of ["king", "hallway", "kitchen"]) {
    await place({ kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: st, figX: 0, figY: 40 });
    const W = JSON.parse(await ev(`JSON.stringify((W => ({ back: W.back }))(castleWalls(state.background)))`)), x = await clearX();
    await put(x ?? 0, 40); await hold(12, st === "hallway" ? 9000 : 4000);
    const b = await at(), sat = await ev(`state.body.sit ? state.background.seat : ""`);
    say(sat || Math.abs(b.z - W.back - 3) < 2, `castleroom ${st}: back wall at ${W.back.toFixed(1)}, feet stopped at ${b.z.toFixed(1)}${sat ? " (sat down on " + sat + ")" : ""}`);
  }
  // 149, again: a seat walked into, and jumped over when low
  for (const bg of [{ kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "dining" }, { kind: "campsite" }, { kind: "livingroom" }]) {
    await place(bg);
    const S = JSON.parse(await ev(`JSON.stringify(solidsHere().filter(o => !o.standing && o.x1 - o.x0 > 8 && o.front > SCENE.ground + figYMin(sceneFrame) + 4).sort((a, b) => b.front - a.front))`));
    const label = bg.kind + (bg.castleRoom1N ? " " + bg.castleRoom1N : "");
    if (!S.length) { console.log(`-    ${label}: no seats`); continue; }
    const o = S[0], y = (o.back + o.front) / 2 - await ev("SCENE.ground");
    await put(o.x0 - 60, y); await hold(15, 2200);
    const w = await at();
    say(w.x <= o.x0, `${label}: seat "${o.name}" ${o.x0.toFixed(0)}..${o.x1.toFixed(0)}: walking into it stopped at x ${w.x}`);
  }
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 4)); } else console.log("page errors: none");
  console.log(fails ? `${fails} FAILED` : "all ok");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 400)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
