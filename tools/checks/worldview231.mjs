// (ticket 231) The world designer full screen shows the in-game view: on a wide window the picture itself is the right
// side's first card, its whole width (or 60% of the window's height at most), held under the bar while the cards below
// scroll; a thing dragged from the palette into it with a real mouse is put there; ticket 224's dragger resizes it; its
// 👁️ folds it away (kept in this browser) and back; the tab built again keeps it; leaving full screen or a narrow
// window puts the picture back in its own column. Exits 1 on a failure.
//   node worldview231.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 500)}`); if (!cond) bad++; };
const metrics = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
// (the press checked to be on what it means, as world2-185's: both ends measured after both are scrolled to)
const ends = async (fromSel, toSel) => JSON.parse(await ev(`(() => {
  const f = document.querySelector(${JSON.stringify(fromSel)}), t = document.querySelector(${JSON.stringify(toSel)});
  if (!f || !t) return JSON.stringify({ missing: true });
  f.scrollIntoView({ block: "nearest" });
  const c = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, a = c(f), b = c(t);
  const on = (p, e) => { const u = document.elementFromPoint(p[0], p[1]); return !!u && (u === e || e.contains(u)); };
  return JSON.stringify({ from: a, to: b, onFrom: on(a, f), onTo: on(b, t) });
})()`));
const mouseDrag = async (from, to) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from[0], y: from[1] });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: from[0], y: from[1], button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 12; i++) { const x = from[0] + (to[0] - from[0]) * i / 12, y = from[1] + (to[1] - from[1]) * i / 12; await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 }); await sleep(25); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to[0], y: to[1], button: "left", buttons: 0, clickCount: 1 });
  await sleep(400);
};
const click = async sel => { const c = JSON.parse(await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()`));
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c[0], y: c[1], button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c[0], y: c[1], button: "left", buttons: 0, clickCount: 1 }); await sleep(400); };
// where the picture is, and how big
const where = async () => JSON.parse(await ev(`(() => { const p = document.getElementById("pic"), r = p.getBoundingClientRect(), slot = document.querySelector(".world-view-pic"), card = document.querySelector(".world-view"), eye = card && card.querySelector(".eye");
  return JSON.stringify({ connected: p.isConnected, inView: !!p.closest(".world-view-pic"), home: !!p.closest(".stage .pic-area") && p.closest(".pic-box").nextElementSibling === document.querySelector(".pic-area > .bar"),
    flag: document.body.classList.contains("pic-in-world"), w: Math.round(r.width), h: Math.round(r.height), slotW: slot ? slot.clientWidth : 0, cap: Math.floor((innerHeight - 56) * 0.6),
    folded: !!card && card.classList.contains("folded"), eye: eye ? eye.getAttribute("aria-pressed") : null, kept: localStorage.getItem("dress-up-world-view"),
    sticky: card ? getComputedStyle(card).position : null }); })()`));
try {
  await send("Runtime.enable");
  await metrics(1600, 1000);
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { localStorage.removeItem("dress-up-world-view"); worldViewHidden = false; state.music.mute = true; state.world = clone(DEFAULTS.world); worldChoose(state.background.kind);
    worldEnter("3,3", null, false); tab = TABS.findIndex(t => t[1] === "world"); showTab(); setWorldBig(true); await new Promise(r => setTimeout(r, 900)); return 1; })()`);
  const a = await where();
  ok("full screen: the picture in the right side's first card, the 👁️ lit (shown by default)", a.connected && a.inView && a.flag && !a.folded && a.eye === "true" && a.kept === null, a);
  const lay = JSON.parse(await ev(`(() => { const rest = document.querySelector(".world-rest"), card = document.querySelector(".world-view");
    return JSON.stringify({ first: rest.firstElementChild === card, restW: Math.round(rest.getBoundingClientRect().width), cardW: Math.round(card.getBoundingClientRect().width), ways: !!document.getElementById("ways").closest(".world-view-pic") }); })()`));
  ok("the card first, as wide as the right side; the ways' arrows with the picture", lay.first && Math.abs(lay.restW - lay.cardW) <= 1 && lay.ways, lay);
  ok("the picture its card's whole width, or 60% of the window's height", Math.abs(a.w - a.slotW) <= 2 || Math.abs(a.h - a.cap) <= 2, a);
  // (the cards below scroll; the view and the grid stay; nothing scrolled shows between the view and the bar)
  const s = JSON.parse(await ev(`(async () => { const side = document.querySelector(".side"), card = document.querySelector(".world-view"), pal = document.querySelector(".world-palette"), grid = document.querySelector(".world-grid");
    const t0 = [card.getBoundingClientRect().top, pal.getBoundingClientRect().top, grid.getBoundingClientRect().top], room = side.scrollHeight - side.clientHeight;
    side.scrollTop = Math.min(600, room); await new Promise(r => setTimeout(r, 300));
    const c = card.getBoundingClientRect(), t1 = [c.top, pal.getBoundingClientRect().top, grid.getBoundingClientRect().top];
    const u = document.elementFromPoint(c.left + c.width / 2, c.top - 6), peek = !!u && !!u.closest(".world-rest > :not(.world-view)");
    side.scrollTop = 0; await new Promise(r => setTimeout(r, 200));
    return JSON.stringify({ room, t0: t0.map(Math.round), t1: t1.map(Math.round), peek }); })()`));
  ok("scrolled: the cards below move up, the view and the grid stay put", s.room > 100 && Math.abs(s.t0[0] - s.t1[0]) <= 1 && Math.abs(s.t0[2] - s.t1[2]) <= 1 && s.t0[1] - s.t1[1] > 100, s);
  ok("no card scrolled past shows between the view and the bar", !s.peek, s);
  // (live: a rock dragged from the things palette into the picture, a real mouse)
  const before = JSON.parse(await ev(`(() => { thingGroup = "nature"; changed(); showTab(); return JSON.stringify((state.background.things || []).length); })()`));
  await sleep(500);
  const e = await ends('.world-things button[data-kind="rock"]', "#pic");
  ok("the rock's button and the picture both on the screen", !e.missing && e.onFrom && e.onTo, e);
  if (!e.missing && e.onFrom && e.onTo) await mouseDrag(e.from, e.to);
  const after = JSON.parse(await ev(`JSON.stringify((state.background.things || []).map(t => t.kind))`));
  ok("dragged into the view, the rock is put in the place", after.length === before + 1 && after[after.length - 1] === "rock", { before, after });
  const b = await where();
  ok("the tab built again (showTab) keeps the picture in its card", b.connected && b.inView && b.flag, b);
  // (ticket 224's dragger: more room for the right side, a bigger picture)
  await ev(`(async () => { document.querySelector(".side").scrollTop = 0; document.querySelector(".world-layout").style.setProperty("--left", "40%"); await new Promise(r => setTimeout(r, 600)); return 1; })()`);
  const c = await where();
  ok("the split moved to 40%: the picture grows with the right side (or reaches its height)", c.w > b.w + 50 || Math.abs(c.h - c.cap) <= 2, { b, c });
  await ev(`(async () => { document.querySelector(".world-layout").style.removeProperty("--left"); await new Promise(r => setTimeout(r, 300)); return 1; })()`);
  // (the 👁️, with a real mouse)
  await click(".world-view .eye");
  const d = await where();
  ok("👁️ tapped: the view folds to its name, the 👁️ dim, kept; the picture home again", d.folded && d.eye === "false" && d.kept === "hidden" && !d.inView && d.home && !d.flag && d.sticky !== "sticky", d);
  await click(".world-view .eye");
  const f = await where();
  ok("👁️ again: the view back, its picture its width", !f.folded && f.eye === "true" && f.kept === null && f.inView && f.flag && f.w > 200, f);
  // (leaving full screen)
  await ev(`(async () => { setWorldBig(false); await new Promise(r => setTimeout(r, 500)); return 1; })()`);
  const g = await where();
  ok("leaving full screen: the picture back in its own column, before its buttons, its size fitted again", g.connected && g.home && !g.inView && !g.flag && g.w > 300, g);
  // (a narrow window: no right side, the picture home; wide again, in its card)
  await metrics(800, 900);
  await ev(`(async () => { setWorldBig(true); await new Promise(r => setTimeout(r, 600)); return 1; })()`);
  const h = await where();
  ok("full screen on a narrow window (800): the picture stays home", h.connected && h.home && !h.inView && !h.flag, h);
  await metrics(1600, 1000); await sleep(600);
  const i = await where();
  ok("the window wide again: the picture in its card", i.connected && i.inView && i.flag && i.w > 300, i);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
