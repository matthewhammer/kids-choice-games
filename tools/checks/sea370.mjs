// (ticket 370, Matthew: "update the 'under the sea' background with more lively stuff: bubbles that move, small fish that
// move, picnic sharks that move, a bit, somehow"; "more detail for the shipwreck"; "the background of this scene could be
// better with more layers, like deep sea") Under the sea, moving (the slow-computer mode off): each of the four fish
// swimming its loop, a school of seven, sixteen bubbles rising, each shark with a few small motions, the light
// shimmering; the far kelp's layer there; the shipwreck in detail (its chest's gold among it). Held still, as on a slow
// computer: nothing moving, and every fish where it is drawn, in the water, not at the scene's origin. Exits 1 on a failure.
//   node sea370.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; slowFlag = false; PERF.slowMoving = true;
    B.kind = "underwater"; B.figX = 40; B.figY = 70; changed(); await w(600);
    const N = bgShown.node, q = n => N.querySelector('[data-obj="' + n + '"]'), count = (el, sel) => el ? el.querySelectorAll(sel).length : -1;
    const moving = { fish: ["orange", "yellow", "pink", "blue"].map(c => count(q(c + " fish"), "animateMotion")), school: count(q("school of fish"), "animateMotion"),
      bubbles: count(q("bubbles"), "animateTransform"), sharks: ["shark, left", "shark, right"].map(n => count(q(n), "animate, animateTransform")), rays: count(q("light rays"), "animate"),
      farKelp: !!q("far kelp"), wreck: count(q("shipwreck"), "*"), gold: count(q("shipwreck"), 'circle[fill="#f2c94c"]') };
    slowFlag = true; PERF.slowMoving = false; changed(); await w(500);
    const M = pic.getScreenCTM().inverse(), mid = el => { const b = el.getBoundingClientRect(), p = new DOMPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2).matrixTransform(M); return [Math.round(p.x), Math.round(p.y)]; };
    const still = { anims: count(bgShown.node, "animate, animateTransform, animateMotion"), fish: ["orange", "yellow", "pink", "blue", "school of"].map(c => mid(bgShown.node.querySelector('[data-obj="' + c + ' fish"]'))),
      frame: [sceneFrame.left, sceneFrame.right, SCENE.top, SCENE.ground] };
    slowFlag = false; changed();
    return JSON.stringify({ moving, still }); })()`));
  const m = r.moving, s = r.still, [L, Rt, T, G] = s.frame;
  console.log("  " + JSON.stringify(r));
  ok("each of the four fish swims its loop", m.fish.every(n => n === 1), m.fish);
  ok("a school of seven swims round together", m.school === 7, m.school);
  ok("sixteen bubbles rising", m.bubbles >= 16, m.bubbles);
  ok("each picnic shark moving a little (a bob, its tail, a blink, its fork)", m.sharks.every(n => n >= 4), m.sharks);
  ok("the light shimmering, and the far water in layers (the far kelp)", m.rays >= 1 && m.farKelp, { rays: m.rays, farKelp: m.farKelp });
  ok("the shipwreck in detail, its chest's gold among it", m.wreck >= 60 && m.gold >= 3, { elements: m.wreck, gold: m.gold });
  ok("held still, as on a slow computer: nothing moving", s.anims === 0, s.anims);
  ok("and every fish, and the school, where it is drawn, in the water", s.fish.every(([x, y]) => x > L && x < Rt && y > T && y < G), s.fish);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
