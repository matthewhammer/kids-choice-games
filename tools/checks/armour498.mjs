// (ticket 498, Matthew: "let's start to think of costumes for the knight as having horse pieces (face helmets, look at images
// from Lego castles and knights) -- not just saddles"; then "just release and let the kids decide") The friend's horse's
// armour, chosen in 🧍 Body's 🐴 the horse ("🛡️ its armour"): none (the default, drawn exactly as a horse with no armour), and
// six sets (🛡️ full plate, 🦁 half caparison, 🎪 tournament, 🐉 dragon helm, 🧱 toy helmet, 🎀 parade). Each set draws
// differently from none and from every other set in every view (side, front, back; led and ridden), with no NaN or undefined
// in it; the knight's arms (both colours, the plume's colour) reach the cloth and the plume while the friend is a knight, and
// the halter's colour does otherwise; the friend's horse in the picture follows the choice; the picture's frame holds the
// plume and the horns; the chooser shows only with a horse. And (a review's two finds): from the side, running, the near
// hind leg still strides in front of the tail below the crupper or the cloth's hem, as with no armour (drawn on a canvas, the
// rear there is the same pixel for pixel as the horse's with no armour); ridden toward us, nothing of the horse is drawn over
// the rider's face (the plume a low tuft there, the toy helmet's dome flatter). Exits 1 on a failure.
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
    // (review) drawings onto a canvas, and how many pixels of two differ
    const raster = async (svg, vb, W, Hh) => { const img = new Image();
      img.src = URL.createObjectURL(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + W + '" height="' + Hh + '">' + svg + '</svg>'], { type: "image/svg+xml" })); await img.decode();
      const cv = document.createElement("canvas"); cv.width = W; cv.height = Hh; const x = cv.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, Hh).data; };
    const differ = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 16) d++; return d; };
    // (review: the tail was drawn over the near hind leg) from the side, running, at seven places in the stride: the rear (x
    // -240 to -60) below the crupper (from -190) or the cloth's hem (its height + 20, under its scallops or dags) is the same
    // as with no armour; and, so we know the test can see it, the tail drawn over everything there is not (plate, toy helmet)
    const stride = {};
    for (const s of sets.slice(1)) {
      const top = s === "plate" ? -190 : HORSE_CLOTHS[s] ? HORSE_CLOTHS[s][0] + 20 : -150, vb = "-240 " + top + " 180 " + (4 - top), W = 360, Hh = Math.round(2 * (4 - top));
      let diff = 0, seen = 0;
      for (const u of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
        const none = horseSvg("side", "run", u, { ...H, armour: "none" }, 0, true).svg, at = none.indexOf('<path d="M-147.6 '), tail = at < 0 ? "" : none.slice(at, none.indexOf("/>", at) + 2);
        const n = await raster(none, vb, W, Hh);
        diff += differ(await raster(horseSvg("side", "run", u, { ...H, armour: s, arms: knight }, 0, true).svg, vb, W, Hh), n);
        seen += differ(await raster(none + tail, vb, W, Hh), n);
      }
      stride[s] = { diff, seen };
    }
    // (review: the plume's tuft hid the rider's mouth, the toy helmet their face) ridden toward us, in an ellipse inside the
    // rider's face (round (0, -188) in the horse's face's units, 16 across and 15.5 down each way, where it is at the usual
    // sizes; the face drawn 1.25 big, its head carried 110 low: at -206 and the stride's bob) nothing of the horse is drawn,
    // in any set, standing, walking or running
    const face = {};
    for (const s of sets) { let hit = 0;
      for (const [gait, u] of [["stand", 0], ["walk", 0.2], ["run", 0.1], ["run", 0.3], ["run", 0.6]]) {
        const h = horseSvg("front", gait, u, { ...H, armour: s, arms: knight }, 0, true), cy = -206 + h.bob - 1.25 * 188, rx = 1.25 * 16, ry = 1.25 * 15.5;
        const px = await raster(h.over, "-40 " + (cy - 30) + " 80 60", 320, 240);
        for (let j = 0; j < 240; j++) for (let i = 0; i < 320; i++) { const x = -40 + (i + 0.5) / 4, y = cy - 30 + (j + 0.5) / 4;
          if ((x / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && px[(j * 320 + i) * 4 + 3] > 0) hit++; }
      }
      face[s] = hit;
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
    return JSON.stringify({ sets, body, box, def: DEFAULTS.body.horseArmour, shown: [shownWith("none"), shownWith("lead"), shownWith("ride")], views, pic, frame, stride, face }); })()`));
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
  for (const [s, v] of Object.entries(r.stride)) ok(`${s}, from the side running: below the armour the near hind leg strides in front of the tail, as with no armour`, v.diff === 0, v);
  ok("the stride test can see the tail cross the near hind leg (plate, toy helmet)", r.stride.plate.seen > 0 && r.stride.toy.seen > 0, r.stride);
  for (const [s, v] of Object.entries(r.face)) ok(`${s}, ridden toward us: nothing of the horse over the rider's face`, v === 0, v);
  ok("no errors on the page", errs.length === 0, errs);
} catch (e) { console.log("FAIL " + e.message); bad++; }
ws.close();
process.exit(bad ? 1 : 0);
