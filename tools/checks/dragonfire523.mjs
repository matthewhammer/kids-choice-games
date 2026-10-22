// (ticket 523, Matthew: "let's also add a 'fire' button within the dragon costume, with chips for testing each type, so the
// person trying on the costume need not switch to game controls to try") In 🐯 Costume, with the dragon worn, its box 🐉 the
// dragon holds 🔥 its fire: a 🔥 button and the six fires' chips, gone with another costume. A chip tapped (a real click)
// chooses that fire and breathes it for FIRE_TRY ms, then it is gone; the choice is 🎮 Controls' 🔥 its fire (one setting:
// chosen in either, lit in both). The 🔥 button, held with the mouse, breathes until it is let go or the pointer leaves it; a
// quick tap still shows; a touch held breathes and sliding off it lets go; Space held on it breathes; and it lets go when the
// panel's tab changes, the window loses the focus or the costume changes while it is held. Pressing and letting go never
// redraws the friend (no changed()); the frame rate while it is held is printed. Exits 1 on a failure.
//   node dragonfire523.mjs <devtools port> <url>
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
const mouse = (type, x, y, buttons = 0) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
const click = async ([x, y]) => { await mouse("mouseMoved", x, y); await mouse("mousePressed", x, y, 1); await mouse("mouseReleased", x, y, 0); };
const touch = (type, pts) => send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y]) => ({ x, y, id: 1 })) });
const space = type => send("Input.dispatchKeyEvent", { type, key: " ", code: "Space", text: type === "keyDown" ? " " : undefined, windowsVirtualKeyCode: 32 });
// (the fire as shown: over the picture and not fading, which fire and view; the button's pressed state)
const fireNow = async () => JSON.parse(await ev(`(() => { const O = document.getElementById("fire-over"), g = O && O.querySelector(".fi-fire"), b = document.querySelector("#panel .fire-hold");
  return JSON.stringify({ on: !!g && O.style.display !== "none" && !g.classList.contains("fi-out"), fire: g ? g.dataset.fire : "", held: !!fireBtn, pressed: b ? b.getAttribute("aria-pressed") : null }); })()`));
// (the centre of the 🔥 button, or of chip i, scrolled into the panel's view first; and, off it, a spot beside it in its own row,
// or under it: still the panel, not the picture)
const at = async sel => JSON.parse(await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return "null"; e.scrollIntoView({ block: "center" });
  const r = e.getBoundingClientRect(), y = r.top + r.height / 2, side = r.right + 40 < innerWidth - 30;
  return JSON.stringify([r.left + r.width / 2, y, side ? r.right + 40 : r.left + r.width / 2, side ? y : r.bottom + 30]); })()`));
const off = b => [b[2], b[3]];
const costumeTab = `tab = TABS.findIndex(t => t[1] === "costume"); showTab();`, controlsTab = `tab = TABS.findIndex(t => t[1] === "controls"); showTab();`;
const HOLD = "#panel .fire-hold", CHIP = i => `#panel [data-key="fireStyle"] > .row:not(.fire-hold-row) > button:nth-child(${i + 1})`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const TRY = await ev(`(async () => { state.music.mute = true; state.world.at = null; state.body.sit = false; Object.assign(state.background, { kind: "emptyroom", figX: 0, figY: 70, seat: null, things: [] });
    Object.assign(state.body, { facing: "right", anim: "none", fireStyle: "roar", fireFrom: "mouth", fireSize: 100, fireHeat: true }); set("costume", "kind", "dragon"); changed();
    ${costumeTab} await new Promise(r => setTimeout(r, 600));
    window.__changed = 0; const c0 = changed; changed = (...a) => { window.__changed++; return c0(...a); }; return FIRE_TRY; })()`);
  // the row: in 🐉 the dragon's box, a 🔥 button over the six fires' chips; gone with another costume
  const row = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), r = document.querySelector('#panel [data-key="fireStyle"]');
    if (!r) return JSON.stringify({ none: true });
    const box = r.closest("section.box"), chips = [...r.querySelectorAll(":scope > .row:not(.fire-hold-row) > button")], b = r.querySelector(".fire-hold");
    const out = { box: box ? box.querySelector(".box-name").textContent : "", name: r.querySelector(".name").textContent, hold: b ? b.textContent : "", holdFirst: !!b && !!(b.compareDocumentPosition(chips[0]) & Node.DOCUMENT_POSITION_FOLLOWING),
      chips: chips.map(c => c.textContent), want: FIRE_STYLES.map(f => f[1]), shown: !r.hidden && !box.hidden };
    set("costume", "kind", "wolf"); await w(300); out.wolf = r.hidden && box.hidden;
    set("costume", "kind", "dragon"); await w(300); out.back = !r.hidden; return JSON.stringify(out); })()`));
  ok("with the dragon worn, 🐉 the dragon's box has 🔥 its fire: a 🔥 button over the six fires' chips", row.box === "🐉 the dragon" && row.name === "🔥 its fire" && /🔥/.test(row.hold) && row.holdFirst
     && row.chips.join("|") === row.want.join("|") && row.shown, row);
  ok("not there with another costume (the wolf), and back with the dragon", row.wolf && row.back, row);
  // each chip, tapped: that fire, breathed at once
  const tries = [];
  for (let i = 0; i < 6; i++) { await click(await at(CHIP(i))); await sleep(250); const f = await fireNow(); tries.push({ i, chosen: await ev(`state.body.fireStyle`), want: await ev(`FIRE_STYLES[${i}][0]`), ...f }); }
  ok("each fire's chip, tapped, chooses it and breathes it at once (side on, as they face)", tries.every(t => t.chosen === t.want && t.on && t.fire === `${t.want} side` && !t.held), tries);
  await sleep(TRY + 700);
  ok("then the breath ends", !(await fireNow()).on, await fireNow());
  // for FIRE_TRY ms
  await click(await at(CHIP(0))); await sleep(200); const t1 = await fireNow(); await sleep(TRY - 600); const t2 = await fireNow(); await sleep(1000); const t3 = await fireNow();
  ok(`a chip's breath lasts about ${TRY} ms`, t1.on && t2.on && !t3.on, { t1, t2, t3 });
  // one setting: chosen here, lit in 🎮 Controls; chosen there, lit here
  await click(await at(CHIP(4))); await sleep(200);
  const lit = () => ev(`(() => { const r = document.querySelectorAll('#panel [data-key="fireStyle"]'), b = r.length === 1 && r[0].querySelector(':scope > .row:not(.fire-hold-row) > button[aria-pressed="true"]'); return r.length + ":" + (b ? b.textContent : ""); })()`);
  await ev(`(async () => { ${controlsTab} await new Promise(r => setTimeout(r, 400)); return 1; })()`);
  const inControls = await lit(), bricks = await ev(`FIRE_STYLES[4][1]`), twist = await ev(`FIRE_STYLES[2][1]`);
  await click(await at(`#panel [data-key="fireStyle"] > .row > button:nth-child(3)`)); await sleep(200);
  await ev(`(async () => { ${costumeTab} await new Promise(r => setTimeout(r, 400)); return 1; })()`);
  const inCostume = await lit();
  ok("one setting in two places: chosen in the costume, lit in 🎮 Controls' 🔥 its fire; chosen there, lit here", inControls === "1:" + bricks && inCostume === "1:" + twist && await ev(`state.body.fireStyle`) === "twist", { inControls, inCostume });
  await sleep(TRY + 500);
  // the 🔥 button held with the mouse: it breathes till the pointer leaves it; the frame rate meanwhile
  await ev(`window.__changed = 0; 1`);
  let b = await at(HOLD);
  await mouse("mouseMoved", b[0], b[1]); await mouse("mousePressed", b[0], b[1], 1); await sleep(300);
  await ev(`(() => { window.__gaps = []; let last = performance.now(); const f = t => { window.__gaps.push(t - last); last = t; if (window.__gaps.length < 90) requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
  await sleep(1700); const h1 = await fireNow();
  const fps = JSON.parse(await ev(`(() => { const g = window.__gaps.slice(1).sort((a, b) => a - b), sum = g.reduce((a, b) => a + b, 0); return JSON.stringify({ fps: Math.round(1000 * g.length / sum), median: +g[g.length >> 1].toFixed(1), over25: g.filter(x => x > 25).length, n: g.length }); })()`));
  console.log(`  held, the costume tab open: ${JSON.stringify(fps)}`);
  await mouse("mouseMoved", ...off(b), 1); await sleep(500); const h2 = await fireNow();
  await mouse("mouseReleased", ...off(b), 0);
  ok("held with the mouse it breathes, the button lit; the pointer leaving the button lets go", h1.on && h1.held && h1.pressed === "true" && !h2.on && !h2.held && h2.pressed === "false", { h1, h2 });
  ok("held, the frame rate stays up (over 50 frames a second)", fps.fps >= 50, fps);
  // pressed and let go on it
  b = await at(HOLD);
  await mouse("mouseMoved", b[0], b[1]); await mouse("mousePressed", b[0], b[1], 1); await sleep(600); const p1 = await fireNow();
  await mouse("mouseReleased", b[0], b[1], 0); await sleep(500); const p2 = await fireNow();
  ok("pressed and let go on it: it breathes, then stops", p1.on && !p2.on && !p2.held, { p1, p2 });
  // a quick tap still shows
  await mouse("mousePressed", b[0], b[1], 1); await mouse("mouseReleased", b[0], b[1], 0); await sleep(90); const q1 = await fireNow(); await sleep(600); const q2 = await fireNow();
  ok("a quick tap still shows a breath", q1.on && !q2.on, { q1, q2 });
  ok("pressing and letting go never redraws the friend (no changed())", await ev(`window.__changed`) === 0, await ev(`window.__changed`));
  // a touch: held breathes, sliding off lets go
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  b = await at(HOLD);
  await touch("touchStart", [b.slice(0, 2)]); await sleep(500); const u1 = await fireNow();
  await touch("touchMove", [off(b)]); await sleep(500); const u2 = await fireNow();
  await touch("touchEnd", []); await sleep(200);
  await touch("touchStart", [b.slice(0, 2)]); await sleep(500); const u3 = await fireNow(); await touch("touchEnd", []); await sleep(500); const u4 = await fireNow();
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  ok("a touch held on it breathes; sliding off it lets go", u1.on && u1.held && !u2.on && !u2.held, { u1, u2 });
  ok("a touch held and lifted: it breathes, then stops", u3.on && !u4.on && !u4.held, { u3, u4 });
  // Space held on it
  await ev(`document.querySelector("${HOLD}").focus(); 1`); await space("keyDown"); await sleep(400); const k1 = await fireNow(); await space("keyUp"); await sleep(500); const k2 = await fireNow();
  ok("Space held on it breathes; let go, it stops", k1.on && k1.held && !k2.on && !k2.held, { k1, k2 });
  // the panel's tab changed while it is held, the window losing the focus
  b = await at(HOLD);
  await mouse("mouseMoved", b[0], b[1]); await mouse("mousePressed", b[0], b[1], 1); await sleep(300); const s1 = await fireNow();
  await ev(`(async () => { ${controlsTab} return 1; })()`); await sleep(500); const s2 = await fireNow(); await mouse("mouseReleased", b[0], b[1], 0);
  await ev(`(async () => { ${costumeTab} await new Promise(r => setTimeout(r, 400)); return 1; })()`);
  ok("held as the panel's tab changes: let go", s1.on && !s2.on && !s2.held, { s1, s2 });
  b = await at(HOLD);
  await mouse("mouseMoved", b[0], b[1]); await mouse("mousePressed", b[0], b[1], 1); await sleep(300); const w1 = await fireNow();
  await ev(`window.dispatchEvent(new Event("blur")); 1`); await sleep(500); const w2 = await fireNow(); await mouse("mouseReleased", b[0], b[1], 0);
  ok("held as the window loses the focus: let go", w1.on && !w2.on && !w2.held && w2.pressed === "false", { w1, w2 });
  // the costume changed from the dragon while it is held (the 🔥 button hidden, still on the page): let go
  b = await at(HOLD);
  await mouse("mouseMoved", b[0], b[1]); await mouse("mousePressed", b[0], b[1], 1); await sleep(300); const c1 = await fireNow();
  await ev(`set("costume", "kind", "wolf"); 1`); await sleep(500); const c2 = await fireNow(); await mouse("mouseReleased", b[0], b[1], 0);
  await ev(`set("costume", "kind", "dragon"); 1`); await sleep(400);
  ok("held as the costume changes to the wolf: let go", c1.on && c1.held && !c2.on && !c2.held && c2.pressed === "false", { c1, c2 });
  ok("the controller's and F's flags untouched", await ev(`firePad === false && fireKey === false`), null);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
