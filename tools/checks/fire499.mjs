// (ticket 499, Matthew: "optional dragon breath -- need an action for that, like bubbles -- shooting fire out of our mouth.";
// "let's get serious about animating fire shooting out of things. Mock up the dragon costume and 6 fire styles."; "let's have
// the dragon fire be the best tool against bubbles -- can you add logic for that -- the heat extend further than the fire.")
// 🔥 breathing fire: the action is on the controller (button 7), on the on-screen controller (under start, clear of the
// others) and on F, held; each of the six fires draws and moves in every view (side on to our right and to our left, toward
// us, away), side on going the way the friend faces; let go, it is gone; from a hand it starts at that hand; and its heat pops
// a bubble in reach (past the flames) and not one out of reach, in bubble space and a blown one. Exits 1 on a failure.
//   node fire499.mjs <devtools port> <url>
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
const key = type => send("Input.dispatchKeyEvent", { type, key: "f", code: "KeyF", text: type === "keyDown" ? "f" : undefined, windowsVirtualKeyCode: 70 });
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; state.world.at = null; state.body.sit = false; Object.assign(state.background, { kind: "emptyroom", figX: 0, figY: 70, seat: null, things: [] });
    Object.assign(state.body, { facing: "right", anim: "none", fireStyle: "roar", fireFrom: "mouth", fireSize: 100, fireHeat: true }); changed(); await new Promise(r => setTimeout(r, 600)); document.body.focus(); return 1; })()`);
  // F held, then let go
  await key("keyDown"); await sleep(400);
  const held = JSON.parse(await ev(`(() => { const O = document.getElementById("fire-over"), g = O && O.querySelector(".fi-fire"), r = g && g.getBoundingClientRect();
    return JSON.stringify({ shown: !!O && O.style.display !== "none", fire: g && g.dataset.fire, w: r ? Math.round(r.width) : 0, anims: O ? O.getAnimations({ subtree: true }).length : 0 }); })()`));
  await key("keyUp"); await sleep(500);
  const gone = await ev(`(() => { const O = document.getElementById("fire-over"); return !O || O.style.display === "none"; })()`);
  ok("F held: the fire is drawn over the picture, moving", held.shown && held.fire === "roar side" && held.w > 40 && held.anims >= 20, held);
  ok("let go, it is gone", gone, gone);
  // every fire, in every view
  const views = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = [];
    const fig = () => { const r = document.getElementById("figure").getBoundingClientRect(); return r.left + r.width / 2; };
    for (const [st] of FIRE_STYLES) for (const facing of ["right", "left", "front", "back"]) {
      state.body.fireStyle = st; state.body.facing = facing; changed(); fireKey = true; fireGo(); await w(160);
      const O = document.getElementById("fire-over"), g = O.querySelector(".fi-fire"), big = g && g.querySelector(".fi-big"), r = big ? big.getBoundingClientRect() : null;
      out.push({ st, facing, fire: g ? g.dataset.fire : "", w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, mid: r ? Math.round(r.left + r.width / 2 - fig()) : 0,
                 anims: O.getAnimations({ subtree: true }).length, nan: /NaN|undefined/.test(O.innerHTML) });
      fireKey = false; await w(300);
    }
    return JSON.stringify(out); })()`));
  const view = { right: "side", left: "side", front: "front", back: "away" };
  for (const st of [...new Set(views.map(v => v.st))]) {
    const of = views.filter(v => v.st === st);
    ok(`${st}: drawn and moving in every view (side on, toward us, away)`, of.every(v => v.fire === `${st} ${view[v.facing]}` && v.w > 20 && v.h > 10 && v.anims >= 5 && !v.nan), of);
    const R = of.find(v => v.facing === "right"), L = of.find(v => v.facing === "left");
    ok(`${st}: side on it goes the way they face, to our right and to our left`, R.mid > 40 && L.mid < -40, { right: R.mid, left: L.mid });
  }
  // from a hand: it starts at that hand
  const hand = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), r = [];
    for (const from of ["left", "right"]) { Object.assign(state.body, { facing: "front", fireStyle: "jet", fireFrom: from }); changed(); fireKey = true; fireGo(); await w(120);
      const A = fireSim.at, hs = poseJoints.arms.map(q => figureT.dx + figureT.k * q.H[0]).sort((a, b) => a - b);
      r.push({ from, x: A && A.x, view: A && A.view, sx: A && A.sx, hand: from === "left" ? hs[0] : hs[hs.length - 1] }); fireKey = false; await w(300); }
    state.body.fireFrom = "mouth"; changed(); return JSON.stringify(r); })()`));
  ok("from a hand, facing us, it starts at that hand and goes out to its side", hand.every(h => h.view === "side" && Math.abs(h.x - h.hand) < 20 && h.sx === (h.from === "left" ? -1 : 1)), hand);
  // its heat: in bubble space, a bubble past the flames but in reach pops, one out of reach does not; a blown one in reach pops
  const pops = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    Object.assign(B, { kind: "bubblespace", figX: -260, figY: 70, bubbleCount: 5, bubbleWind: 0, bubbleBOn: false, bubbleCOn: false, bubbleDepth: 0 });
    Object.assign(state.body, { facing: "right", fireStyle: "roar", fireFrom: "mouth" }); changed(); await w(900);
    const A = fireAt(), H = fireHeatAt(A, state.body), L = bubbleSim.list, F = sceneFrame;
    if (!A || L.length < 5) return JSON.stringify({ A, n: L.length });
    // (the flames reach about two thirds of the heat: a bubble at 0.85 of it is past them, one 3 radii beyond it out of reach)
    const put = (b, d, dy = 0) => { b.x = A.x + H.ux * d; b.y = A.y + H.uy * d + dy; b.vx = b.vy = 0; b.pop = 0; b.back = 0; };
    bubbleSim.bonds = [];
    put(L[0], 0.85 * H.R); put(L[1], H.R + 3 * L[1].r);
    L.slice(2).forEach((b, i) => { b.x = F.left + 30 + 40 * i; b.y = F.top + 30; b.vx = b.vy = 0; });
    const inside = fireHot(H, L[0].x, L[0].y, L[0].r) >= 0, outside = fireHot(H, L[1].x, L[1].y, L[1].r) >= 0;
    // (a blown one in reach too)
    blowSim.list.push({ x: A.x + H.ux * 0.7 * H.R, y: A.y + H.uy * 0.7 * H.R, vx: 0, vy: 0, r: 8, th: { color: "#9ad7ff", size: 18, shine: 0.7 }, born: performance.now(), ph: 0 }); blowGo();
    const blown = blowSim.list[blowSim.list.length - 1];
    fireKey = true; fireGo(); await w(250); fireKey = false;
    const r = { inside, outside, inPopped: !!L[0].pop, outPopped: !!L[1].pop, blownPopped: !!blown.pop, reach: Math.round(H.R / A.k), heat: !!document.querySelector("#fire-over .fi-heat") };
    await w(500); return JSON.stringify(r); })()`));
  ok("its heat reaches about half again as far as its flames (the roaring flame's: 600 of the friend's units)", pops.reach === 600 && pops.heat, pops);
  ok("a bubble in bubble space past the flames, in its heat, pops", pops.inside && pops.inPopped, pops);
  ok("one out of its reach does not", !pops.outside && !pops.outPopped, pops);
  ok("a blown bubble in its heat pops", pops.blownPopped, pops);
  // the controller and the on-screen controller
  const pad = JSON.parse(await ev(`(async () => { touchWant(true); await new Promise(r => setTimeout(r, 300));
    const box = b => { const e = document.querySelector('#touchpad [data-b="' + b + '"]'); return e ? e.getBoundingClientRect() : null; };
    const apart = (a, b) => a && b && (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    const r = { action: PAD_ACTIONS.some(a => a[0] === "fire"), button: DEFAULTS.controls.fire, fire: !!box(7), label: (document.querySelector('#touchpad [data-b="7"]') || {}).textContent || "",
                apart: apart(box(7), box(9)) && apart(box(6), box(8)) };
    touchWant(false); return JSON.stringify(r); })()`));
  ok("the controller's action 🔥 (button 7), and its button on the on-screen controller, clear of start (and 🫧 clear of select)", pad.action && pad.button === 7 && pad.fire && /🔥/.test(pad.label) && pad.apart, pad);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
