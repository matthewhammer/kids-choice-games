// (ticket 518, Matthew: "body can hold things in each hand. Audit all MUDU objects to hold (staff, broom, sword, shield, horse
// rein) and add every option to body sub-panel, somehow.") 🧍 Body's 🫴 holding: a chip per hand (🫱 right, then 🫲 left)
// naming what it holds; a tap opens a box over the panel with the costume's own, nothing, every thing (the rein only with a
// horse) and ✖ cancel. Each thing drawn in each hand, every facing, nothing undefined or costly; from behind it stays in its
// own hand (our left for the left hand); in profile a thing in the far hand goes behind the body; the costume's own still
// as before toward us; a moved lasso leaves the other hand; a hand holding something lets go of its rein riding; an old
// save's costume.lassoHand "right" loads as the right hand holding the lasso. Exits 1 on a failure.
//   node hold518.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true; changed(); await w(300);
    const fig = () => document.getElementById("figure"), figText = () => fig().outerHTML;
    const midX = n => { const b = n.getBoundingClientRect(); return b.left + b.width / 2; };
    const costly = t => /<filter|feGaussianBlur|Gradient|<animate|<set\\b/.test(t);
    // the rows and the box
    tab = TABS.findIndex(t => t[1] === "body"); showTab(); await w(300);
    const chip = k => document.querySelector('#panel [data-key="' + k + '"] .hold-chip');
    out.rows = ["holdR", "holdL"].map(k => chip(k) ? chip(k).textContent : null);
    const order = [...document.querySelectorAll("#panel .hold-chip")].map(b => b.closest("[data-key]").dataset.key);
    out.order = order.join();
    chip("holdR").click(); await w(200);
    const box = () => document.querySelector(".person-pick");
    out.chips = box() ? [...box().querySelectorAll(".hold-pick-chip")].map(b => b.dataset.hold) : [];
    out.cancelLast = !!box() && box().lastElementChild.querySelector(".person-pick-cancel") !== null;
    box() && box().querySelector('[data-hold="sword"]').click(); await w(200);
    out.picked = [state.body.holdR, !box(), chip("holdR").textContent];
    state.body.horse = "lead"; changed(); await w(100); chip("holdL").click(); await w(200);
    out.chipsHorse = box() ? [...box().querySelectorAll(".hold-pick-chip")].map(b => b.dataset.hold) : [];
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await w(100); out.esc = !box();
    state.body.horse = "none"; state.body.holdR = "auto";
    // every thing, each hand, each facing
    out.draw = {};
    for (const id of Object.keys(HOLDABLES).filter(x => x !== "rein")) for (const own of ["L", "R"]) for (const facing of ["front", "left", "right", "back"]) {
      state.body.holdL = state.body.holdR = "none"; state.body["hold" + own] = id; state.body.facing = facing; changed(); await w(25);
      const t = figText(); out.draw[id + "/" + own + "/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !costly(t); }
    // from behind, the left hand's sword is on our left; toward us, on our right
    const torsoX = () => midX(fig().querySelector('[data-part="head"]') || fig());
    state.body.holdL = "lasso"; state.body.holdR = "none"; out.side = {};
    for (const facing of ["front", "back"]) { state.body.facing = facing; changed(); await w(60); const l = fig().querySelector('[data-western="lasso"]');
      out.side[facing] = l ? Math.sign(Math.round(midX(l) - torsoX())) : null; }
    // in profile, facing our right, the left hand is the far one: its lasso drawn before the head (with the far hand); facing our left, after
    state.body.facing = "right"; changed(); await w(60); { const t = fig().closest("svg").outerHTML, i = t.indexOf('data-western="lasso"'); out.far = i >= 0 && i < t.indexOf('data-part="head"'); }
    state.body.facing = "left"; changed(); await w(60); { const t = fig().closest("svg").outerHTML, i = t.indexOf('data-western="lasso"'); out.near = i >= 0 && i > t.indexOf('data-part="head"'); }
    // a cowgirl's own lasso toward us, then moved to the right hand: one lasso only
    state.body.holdL = state.body.holdR = "auto"; state.body.facing = "front"; set("costume", "kind", "cowgirl"); await w(60);
    out.cowOwn = fig().querySelectorAll('[data-western="lasso"]').length;
    set("body", "holdR", "lasso"); await w(60); out.cowMoved = [fig().querySelectorAll('[data-western="lasso"]').length, Math.sign(Math.round(midX(fig().querySelector('[data-western="lasso"]')) - torsoX()))];
    // riding, a knight's two hands full: no rein; with nothing held, both
    set("costume", "kind", "knight"); state.body.holdL = state.body.holdR = "auto"; set("body", "horse", "ride"); await w(100); out.reinsFull = fig().closest("svg").querySelectorAll(".rein").length;
    state.body.holdL = state.body.holdR = "none"; changed(); await w(100); out.reinsFree = fig().closest("svg").querySelectorAll(".rein").length;
    set("body", "horse", "none");
    // an old save
    const old = clone(DEFAULTS); old.costume.kind = "cowgirl"; old.costume.lassoHand = "right"; delete old.body.holdR; delete old.body.holdL;
    const next = clone(DEFAULTS); for (const k of Object.keys(DEFAULTS)) next[k] = { ...DEFAULTS[k], ...(old[k] || {}) }; upgradeLassoHand(next);
    out.old = [next.body.holdR, next.body.holdL, next.costume.lassoHand === undefined];
    // only a cowgirl or cowboy whose lasso showed keeps it; a knight, or a lasso turned off, loads on the costume's own
    out.oldOthers = [["knight", true], ["cowgirl", false]].map(([kind, lasso]) => { const o = clone(DEFAULTS); o.costume.kind = kind; o.costume.lasso = lasso; o.costume.lassoHand = "right"; delete o.body.holdR;
      const n = clone(DEFAULTS); for (const k of Object.keys(DEFAULTS)) n[k] = { ...DEFAULTS[k], ...(o[k] || {}) }; upgradeLassoHand(n); return [n.body.holdR, n.costume.lassoHand === undefined].join(); });
    // (ticket 528) the right hand's own style (different hands, claws) follows that hand: our left toward us, our right from
    // behind, also with the left hand's sword's fist on the other; handSvg spied on for each hand's side and style
    out.styles = {}; { const o = handSvg; window.handSvg = (x, y, a, s, h, k) => { out.styles[out.k].push(Math.sign(Math.round(x)) + ":" + h.style); return o(x, y, a, s, h, k); };
      state = clone(DEFAULTS); state.music.mute = true; state.hands.different = true; state.rightHand = { ...state.rightHand, style: "claw" };
      for (const [k, facing, holdL] of [["front", "front", "none"], ["back", "back", "none"], ["backSword", "back", "sword"]]) {
        out.k = k; out.styles[k] = []; state.body.facing = facing; state.body.holdL = holdL; changed(); await w(60); out.styles[k] = out.styles[k].slice(-2).sort().join(); }
      window.handSvg = o; }
    // (ticket 529) crawling toward us, each thing drawn in heldSvg's "floor" view, drawn, nothing undefined or costly;
    // swimming (in the sea, in profile and toward us), nothing held is drawn. Each case named (out.k) before it is drawn:
    // set() and changed() draw at once, and named after, that draw went to the case before, by then its result, a string
    // (0.0.409's run, then 0.0.411's to 0.0.426's, stopped there). Crawling put on before facing us: set()'s anim, chosen
    // facing us, turns the friend to our right (ANIM_SIDEWAYS), crawling in profile, heldSvg's "side"
    out.views = {}; { const o = heldSvg; window.heldSvg = (id, H, view, x) => { out.views[out.k].push(view); return o(id, H, view, x); };
      for (const id of Object.keys(HOLDABLES).filter(x => x !== "rein" && x !== "lasso")) { state = clone(DEFAULTS); state.music.mute = true; state.body.holdL = id; state.body.anim = "crawl"; state.body.facing = "front"; out.k = "crawl/" + id; out.views[out.k] = []; changed(); await w(80);
        const t = figText(); out.views[out.k] = [...new Set(out.views[out.k])].join() + (t.length > 1000 && !/NaN|undefined/.test(t) && !costly(t) ? "" : " bad"); }
      for (const facing of ["left", "front"]) { state = clone(DEFAULTS); state.music.mute = true; state.costume.kind = "knight"; state.background.kind = "sea"; state.body.facing = facing; out.k = "swim/" + facing; out.views[out.k] = []; set("body", "anim", "swim"); await w(150); out.views[out.k] = out.views[out.k].length; }
      window.heldSvg = o; }
    return JSON.stringify(out); })()`));
  const D = Object.entries(r.draw);
  console.log("  " + JSON.stringify({ rows: r.rows, order: r.order, chips: r.chips, picked: r.picked, side: r.side, far: r.far, cow: [r.cowOwn, r.cowMoved], reins: [r.reinsFull, r.reinsFree], old: r.old }));
  ok("🫴 holding: the right hand's chip, then the left's, each on the costume's own", r.order === "holdR,holdL" && r.rows.every(t => t === "🎭 the costume's own"), r);
  ok("the box: the costume's own, nothing, every thing but the rein (no horse), ✖ cancel last", r.chips.join() === "auto,none,broom,bow,scepter,sword,shield,staff,lasso" && r.cancelLast, r.chips);
  ok("with a horse, the rein is a choice too", r.chipsHorse.includes("rein"), r.chipsHorse);
  ok("a chip chosen: the hand holds it, the box closes, the row says so", r.picked[0] === "sword" && r.picked[1] && r.picked[2] === "🗡️ sword", r.picked);
  ok("Escape closes the box", r.esc, r.esc);
  ok("every thing, in either hand, every facing: drawn, nothing undefined or costly", D.every(([, v]) => v), D.filter(([, v]) => !v).map(([k]) => k));
  ok("the left hand is on our right toward us, our left from behind", r.side.front === 1 && r.side.back === -1, r.side);
  ok("in profile, the far hand's thing is behind the body, the near one's in front", r.far && r.near, [r.far, r.near]);
  ok("a cowgirl's own lasso, moved to the right hand, is one lasso, on our left", r.cowOwn === 1 && r.cowMoved[0] === 1 && r.cowMoved[1] === -1, [r.cowOwn, r.cowMoved]);
  ok("riding, full hands let go of the reins; empty ones hold them", r.reinsFull === 0 && r.reinsFree > 0, [r.reinsFull, r.reinsFree]);
  ok("an old save's lassoHand on a knight, or a lasso turned off, adds no lasso", r.oldOthers.every(x => x === "auto,true"), r.oldOthers);
  ok("an old save's lasso in the right hand loads as 🫱 holding the lasso", r.old.join() === "lasso,auto,true", r.old);
  ok("from behind, the right hand's own style is on our right, the left hand's sword fist on our left (ticket 528)", r.styles.front === "-1:claw,1:round" && r.styles.back === "-1:round,1:claw" && r.styles.backSword === "-1:round,1:claw", r.styles);
  ok("crawling toward us, each thing lies on the floor (its floor drawing); swimming, nothing held is drawn (ticket 529)", Object.entries(r.views).every(([k, v]) => k.startsWith("swim") ? v === 0 : v === "floor"), r.views);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
