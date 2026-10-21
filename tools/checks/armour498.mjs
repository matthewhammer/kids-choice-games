// (ticket 498, Matthew: "let's start to think of costumes for the knight as having horse pieces (face helmets, look at images
// from Lego castles and knights) -- not just saddles"; then "just release and let the kids decide") The friend's horse's
// armour, chosen in 🧍 Body's 🐴 the horse ("🛡️ its armour"): none (the default, drawn exactly as a horse with no armour), and
// six sets (🛡️ full plate, 🦁 half caparison, 🎪 tournament, 🐉 dragon helm, 🧱 toy helmet, 🎀 parade). Each set draws
// differently from none and from every other set in every view (side, front, back; led and ridden), with no NaN or undefined
// in it; the knight's arms (both colours, the plume's colour) reach the cloth and the plume while the friend is a knight, and
// the halter's colour does otherwise; the friend's horse in the picture follows the choice; the picture's frame holds the
// plume and the horns; the chooser shows only with a horse. Exits 1 on a failure.
//   node armour498.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null;
    const sets = HORSE_ARMOURS.map(s => s[0]);
    const body = (TABS.find(t => t[0] === "🧍 Body") || [0, 0, []])[2].flat(3).filter(x => typeof x === "string" && /^horse/.test(x));
    const box = ((TAB_BOXES["🧍 Body"] || []).find(b => /horse/.test(b[0])) || [0, []])[1];
    const shownWith = h => SHOWN_WHEN["body.horseArmour"]({ ...state.body, horse: h });
    const H = { coat: "#7b4a2a", mane: "#1f1f22", mark: "star", tack: "#15803d", socks: false, shoes: "off", markColor: "#f7f4ee", saddle: "#6b3f1f", blanket: "auto", maneStyle: "loose" };
    const knight = { knightA: "#8a2b2b", knightB: "#e0b030", tabardLayout: "halves", emblem: "crown", plumeColor: "#2f6db5" };
    const draw = (armour, view, ride, arms = null) => { const h = horseSvg(view, "walk", 0.3, armour === undefined ? H : { ...H, armour, arms }, 0, ride); return h.svg + "|" + h.over; };
    const views = {};
    for (const view of ["side", "front", "back"]) for (const ride of [false, true]) {
      const plain = draw(undefined, view, ride), all = sets.map(s => draw(s, view, ride, knight));
      views[view + (ride ? "/ridden" : "/led")] = { noneSame: plain === draw("none", view, ride, knight),
        apart: new Set(all).size, nan: sets.filter((s, i) => /NaN|undefined/.test(all[i]) || /NaN|undefined/.test(draw(s, view, ride))),
        // (the knight's two colours in every cloth set; the plume's in every plumed one; the halter's in its place otherwise)
        knightCloth: ["half", "tourney", "dragon", "toy"].filter(s => { const t = draw(s, view, ride, knight); return t.includes("#8a2b2b") && t.includes("#e0b030"); }),
        knightPlume: ["plate", "half", "tourney", "toy", "parade"].filter(s => draw(s, view, ride, knight).includes("#2f6db5")),
        plainCloth: ["half", "tourney", "dragon", "toy"].filter(s => { const t = draw(s, view, ride); return !t.includes("#8a2b2b") && t.includes(mix("#15803d", "#ffffff", 0.6)); }) };
    }
    // (the friend's horse in the picture: a knight's arms on it while they are a knight, the halter's when not; the frame holds
    // the plume and the horns in every view)
    Object.assign(B, { kind: "none", figX: 0, figY: 0, seat: null, things: [] });
    const was = { ...state.costume };
    Object.assign(state.costume, { kind: "knight", knightA: "#2e7d32", knightB: "#f4f1ea", tabardLayout: "quartered", emblem: "falcon", plumeColor: "#7b3f8c" });
    Object.assign(state.body, { horse: "ride", horseArmour: "half", horseTack: "#7a3a1a", facing: "right", anim: "none", sit: false, pose: "stand" }); changed(); drawNow(); await w(200);
    const hg = () => document.querySelector("#figure .horse"), html = () => (hg() ? hg().innerHTML : "") + (document.querySelector("#figure .horse-over") || { innerHTML: "" }).innerHTML;
    const pic = { knight: html().includes("#2e7d32") && html().includes("#7b3f8c") };
    state.costume.kind = "none"; changed(); drawNow(); await w(200);
    pic.plain = !html().includes("#2e7d32") && !html().includes("#7b3f8c") && html().includes(mix("#7a3a1a", "#ffffff", 0.6));
    state.body.horseArmour = "none"; changed(); drawNow(); await w(200); pic.noneLen = html().length;
    const frame = [];
    for (const facing of ["right", "front", "back"]) for (const s of sets.slice(1)) for (const horse of ["lead", "ride"]) {
      Object.assign(state.body, { horse, horseArmour: s, facing }); changed(); drawNow(); await w(60);
      const p = document.getElementById("pic").getBoundingClientRect(), h = hg().getBoundingClientRect();
      if (h.top < p.top - 1) frame.push([facing, s, horse, Math.round(p.top - h.top)]);
      if (facing === "right" && horse === "ride" && s === "tourney") pic.tourneyLen = html().length;
    }
    Object.assign(state.body, { horse: "none", horseArmour: "none", facing: "front" }); Object.assign(state.costume, was); changed(); drawNow();
    return JSON.stringify({ sets, body, box, def: DEFAULTS.body.horseArmour, shown: [shownWith("none"), shownWith("lead"), shownWith("ride")], views, pic, frame }); })()`));
  ok("seven choices: none first, then the six sets", r.sets.length === 7 && r.sets[0] === "none", r.sets);
  ok("its chooser is in 🧍 Body's 🐴 the horse, with the horse's other settings", r.body.includes("horseArmour") && r.box.includes("horseArmour"), { body: r.body, box: r.box });
  ok("a friend's horse starts with none", r.def === "none", r.def);
  ok("the chooser shows only with a horse", !r.shown[0] && r.shown[1] && r.shown[2], r.shown);
  for (const [k, v] of Object.entries(r.views)) {
    ok(`${k}: none draws exactly as a horse with no armour`, v.noneSame, v);
    ok(`${k}: each of the seven draws differently`, v.apart === 7, v);
    ok(`${k}: no NaN or undefined in any set`, v.nan.length === 0, v);
    ok(`${k}: the knight's two colours on each cloth`, v.knightCloth.length === 4, v);
    ok(`${k}: the knight's plume colour on each plume`, v.knightPlume.length === 5, v);
    ok(`${k}: not a knight, each cloth in the halter's colours`, v.plainCloth.length === 4, v);
  }
  ok("in the picture, the knight's arms reach the horse's cloth and the plume", r.pic.knight, r.pic);
  ok("in the picture, not a knight, the halter's colour does instead", r.pic.plain, r.pic);
  ok("the picture follows the choice", r.pic.tourneyLen > r.pic.noneLen, r.pic);
  ok("the picture's frame holds the plume and the horns, every set, every view", r.frame.length === 0, r.frame);
  ok("no errors on the page", errs.length === 0, errs);
} catch (e) { console.log("FAIL " + e.message); bad++; }
ws.close();
process.exit(bad ? 1 : 0);
