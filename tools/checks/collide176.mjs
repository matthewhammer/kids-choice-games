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
  // (an x with no solid across it at any depth, for walking straight back)
  const clearX = () => ev(`(() => { const S = solidsHere(); return [0, -120, 120, -220, 220, -300, 300].find(x => !S.some(o => x > o.x0 - 20 && x < o.x1 + 20)) ?? null; })()`);
  // 176: the flat rooms' back walls
  for (const kind of ["livingroom", "treeroom", "witchroom", "healerroom", "tent"]) {
    await place({ kind });
    const back = await ev("sceneFrame.back"), x = await clearX();
    if (x === null) { say(false, `${kind}: no clear way to the back wall`); continue; }
    await put(x, 40); await hold(12, 4500);   // up, to the back wall
    const b = await at();
    say(Math.abs(b.z - back) < 3, `${kind}: back wall's foot at ${back.toFixed(1)}, feet stopped at ${b.z.toFixed(1)} (x ${x})`);
  }
  // 176: the standing objects, place by place: the nearest walkable one, and a low one if there is one
  const legs = await ev("legReach()");
  for (const bg of [{ kind: "forest" }, { kind: "witch" }, { kind: "campsite" }, { kind: "fairyforest" }, { kind: "castle" }, { kind: "clearing" },
                    { kind: "mountains" }, { kind: "woodpath" }, { kind: "cemetery" }, { kind: "house" }, { kind: "treehouse" }, { kind: "beach" },
                    { kind: "waterfall" }, { kind: "livingroom" }, { kind: "witchroom" }, { kind: "healerroom" }, { kind: "treeroom" },
                    { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "kitchen" }]) {
    await place(bg);
    const label = bg.kind + (bg.castleRoom1N ? " " + bg.castleRoom1N : "");
    const S = JSON.parse(await ev(`JSON.stringify(solidsHere().filter(o => o.standing && o.x1 - o.x0 > 8 && o.front > SCENE.ground + figYMin(sceneFrame) + 4
      && o.front < sceneFrame.bottom - 4 && o.x0 - 70 > sceneFrame.left && o.x1 + 70 < sceneFrame.right).sort((a, b) => b.front - a.front))`));
    const all = JSON.parse(await ev(`JSON.stringify(solidsHere().filter(o => o.standing).map(o => o.name))`));
    if (!S.length) { console.log(`-    ${label}: no standing object to walk into (${all.length} standing: ${all.join("; ") || "none"})`); continue; }
    const picks = [S[0], S.find(o => o !== S[0] && o.h < legs && o.x1 - o.x0 < 90)].filter(Boolean);
    for (const o of picks) {
      const z = (o.back + o.front) / 2, y = z - await ev("SCENE.ground");
      // (from the left, or from the right when the left is blocked)
      const fromLeft = await ev(`!solidAt(${o.x0 - 60}, ${z})`), x0 = fromLeft ? o.x0 - 60 : o.x1 + 60, dir = fromLeft ? 15 : 14;
      await put(x0, y); await hold(dir, 2200);
      const w = await at(), stopped = fromLeft ? w.x <= o.x0 - 4 : w.x >= o.x1 + 4;
      const low = o.h < legs && o.x1 - o.x0 < 90;
      let jumped = "";
      if (low) {
        await put(x0, y); await hold(dir, 2200, "jumpHigh");
        const j = await at(), over = fromLeft ? j.x > o.x1 : j.x < o.x0;
        jumped = `; jumping high ${over ? "cleared it" : "did NOT clear it"} (x ${j.x})`;
        if (!over) { say(false, `${label}: "${o.name}" high jump`); }
      }
      say(stopped, `${label}: "${o.name}" ${o.x0.toFixed(0)}..${o.x1.toFixed(0)} at depth ${o.back.toFixed(0)}..${o.front.toFixed(0)}, height ${o.h.toFixed(0)}: walking ${fromLeft ? "right" : "left"} into it stopped at x ${w.x}${jumped}`);
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
    say(w.x <= o.x0 - 4, `${label}: seat "${o.name}" ${o.x0.toFixed(0)}..${o.x1.toFixed(0)}: walking into it stopped at x ${w.x}`);
  }
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 4)); } else console.log("page errors: none");
  console.log(fails ? `${fails} FAILED` : "all ok");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 400)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
