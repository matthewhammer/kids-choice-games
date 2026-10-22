// (ticket 544, Matthew, for his friend Nick: "giraffe as a costume in dress up") The 🦒 giraffe: an animal suit in three
// styles (🦒 reticulated, 🌳 Masai, 🍼 baby), each its patches' own colour row (shown only while it is chosen), and 🦒 neck's
// length. Each style in every facing drawn with its neck, its own head on top and its tufted tail (data-giraffe pieces), the
// mane only where it shows (in profile and from behind, not toward us); no mask, filter, blur or SMIL; the shapes at most the
// knight's 92; every pose and animation drawn, nothing undefined; the giraffe's head always inside the picture's frame
// (standing, riding, crawling, lying, jumping, the longest neck) and always upright (turned with the friend, crawling or
// lying, its neck bends up and its head is not turned); a longer neck puts the head higher; hooves for hands; the chosen
// colour is the patches'; a door is too low for it sooner than for the plain friend (youHeights' upright crown, which
// doorTooLow reads); the rows only where they apply. Exits 1 on a failure.
//   node giraffe544.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, frame: {} };
    const fig = () => document.getElementById("figure"), figText = () => { const f = fig(); return f ? f.outerHTML : ""; };
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    const has = what => !!document.querySelector('#figure [data-giraffe="' + what + '"]');
    // (the giraffe's head in the picture's own units: its box's corners through the head's own transform, against the frame,
    // the viewBox; and whether it is upright: no turn, only moved and sized, mirrored in profile)
    const pic = document.getElementById("pic");
    const head = () => { const g = document.querySelector('#figure [data-giraffe="head"]'); if (!g) return null;
      const m = pic.getScreenCTM().inverse().multiply(g.getScreenCTM()), b = g.getBBox(), vb = pic.viewBox.baseVal;
      const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      return { inside: Math.min(...xs) >= vb.x - 0.5 && Math.max(...xs) <= vb.x + vb.width + 0.5 && Math.min(...ys) >= vb.y - 0.5 && Math.max(...ys) <= vb.y + vb.height + 0.5,
               upright: Math.abs(m.b) < 1e-3 * Math.abs(m.d) && Math.abs(m.c) < 1e-3 * Math.abs(m.d) && m.d > 0, top: Math.min(...ys), vbTop: vb.y }; };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false; state.body.horse = "none";
    set("body", "pose", "stand"); state.body.anim = "none"; set("costume", "kind", "deer"); changed(); await w(100);
    out.deerTop = pic.viewBox.baseVal.y;
    set("costume", "kind", "giraffe"); changed(); await w(100);
    const D = DEFAULTS.costume, ids = Object.keys(GIRAFFE_STYLES);
    out.chooser = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].some(([v, l]) => v === "giraffe" && l === "🦒 giraffe");
    const styleRow = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "giraffeStyle");
    out.styles = styleRow ? styleRow[3].map(([v, l]) => v + " " + l) : [];
    out.defaults = [D.giraffeStyle, D.giraffeNeck, ...ids.map(id => D["giraffeColor_" + id] === GIRAFFE_STYLES[id].colors[0])];
    out.giraffeTop = pic.viewBox.baseVal.y;
    // each style, each facing: its neck, head and tail, the mane only in profile and from behind, the head in the frame and upright
    for (const id of ids) { set("costume", "giraffeStyle", id); out.v[id] = {};
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(60); const t = figText(), h = head();
        out.v[id][facing] = { neck: has("neck"), head: !!h, tail: has("tail"), mane: has("mane"), inside: h && h.inside, upright: h && h.upright, shapes: shapes(t),
          bad: /NaN|undefined/.test(t), mask: /<mask|<filter|feGaussianBlur|<animate/.test(t) }; } }
    state.body.facing = "front"; set("costume", "giraffeStyle", "reticulated");
    // every pose and animation, every facing: drawn, nothing undefined, the head there, upright and in the frame
    const pose = async (name, facing, wait) => { await w(wait); const t = figText(), h = head();
      out.poses[name + "/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && has("neck"), inside: !!h && h.inside, upright: !!h && h.upright }; };
    for (const p of ["stand", "sit", "lie", "meditate", "dance", "hug"]) for (const facing of ["front", "left", "right", "back"]) {
      set("body", "pose", p); state.body.facing = facing; changed(); await pose(p, facing, 40); }
    set("body", "pose", "stand");
    for (const anim of ["walk", "run", "crawl", "swim", "climb", "jump", "crouch"]) for (const facing of ["front", "right", "back"]) {
      state.body.facing = facing; if (anim === "jump") { state.body.anim = "none"; startJump("none", "jump"); } else state.body.anim = anim; changed(); await pose(anim, facing, anim === "jump" ? 300 : 60); }
    state.body.anim = "none";
    for (const facing of ["front", "left", "back"]) { state.body.horse = "ride"; state.body.facing = facing; changed(); await pose("ride", facing, 60); }
    state.body.horse = "none"; state.body.facing = "front"; changed(); await w(60);
    // the neck's length: the head higher with a longer neck, and in the frame at the longest
    const at = async v => { set("costume", "giraffeNeck", v); changed(); await w(60); const h = head(); return h; };
    const short = await at(50), long = await at(250); await at(100);
    out.neck = { higher: !!(short && long) && long.top < short.top - 50, inside: !!long && long.inside };
    // hooves, and the chosen colour the patches'
    out.hooves = suitHands(costumeOn(), "giraffe").style === "hoof";
    set("costume", "giraffeColor_reticulated", "#5c3317"); changed(); await w(60);
    out.colour = [...document.querySelectorAll("#pat-fur path")].some(p => p.getAttribute("fill") === "#5c3317");
    set("costume", "giraffeColor_reticulated", D.giraffeColor_reticulated); changed(); await w(60);
    // a door: the upright crown doorTooLow reads, the giraffe's (its neck and head) well over the plain friend's
    Object.assign(state.background, { kind: "emptyroom" }); changed(); await w(150);
    const tall = youHeights(true).crown; set("costume", "kind", "none"); changed(); await w(100); const plain = youHeights(true).crown;
    out.door = [Math.round(tall), Math.round(plain)];
    Object.assign(state.background, { kind: "none" }); set("costume", "kind", "giraffe"); changed(); await w(100);
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = ids.map(id => ids.map(j => rule("giraffeColor_" + j, { ...state.costume, kind: "giraffe", giraffeStyle: id }) ? 1 : 0).join("")).join(" ") +
      " " + [rule("giraffeStyle", { kind: "giraffe" }), rule("giraffeNeck", { kind: "giraffe" }), rule("fur", { kind: "giraffe" }), rule("belly", { kind: "giraffe" }), rule("eyes", { kind: "giraffe" }), rule("giraffeStyle", { kind: "bear" })].map(Number).join("");
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["giraffeStyle", "giraffeColor_reticulated", "giraffeColor_masai", "giraffeNeck"];
    out.rowsG = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "bear"); changed(); await w(150); out.rowsBear = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = r.v, ids = Object.keys(V), views = ids.flatMap(id => Object.values(V[id]));
  console.log(`  ${JSON.stringify({ styles: r.styles, defaults: r.defaults, rules: r.rules, rows: [r.rowsG, r.rowsBear], door: r.door, tops: [r.deerTop, r.giraffeTop], shapes: ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]) })}`);
  ok("🦒 giraffe is among the costumes", r.chooser, r.chooser);
  ok("three styles, the reticulated first", ids.length === 3 && r.styles.length === 3 && r.styles[0] === "reticulated 🦒 reticulated", r.styles);
  ok("defaults: the reticulated, its neck 100, each style's colour its first", r.defaults[0] === "reticulated" && r.defaults[1] === 100 && r.defaults.slice(2).every(Boolean), r.defaults);
  ok("every style, every facing: its neck, its head and its tail, nothing undefined", views.every(v => v.neck && v.head && v.tail && !v.bad), V);
  ok("the mane in profile and from behind, not toward us", ids.every(id => !V[id].front.mane && V[id].left.mane && V[id].right.mane && V[id].back.mane), ids.map(id => [id, Object.values(V[id]).map(v => v.mane)]));
  ok("the head inside the frame and upright in every view", views.every(v => v.inside && v.upright), V);
  ok("no mask, filter, blur or SMIL in the friend", views.every(v => !v.mask), V);
  ok("shapes at most 92 in every view (the knight's most)", views.every(v => v.shapes <= 92), ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]));
  ok("the frame's top raised for the neck (higher than the deer's antlers)", r.giraffeTop < r.deerTop - 50, [r.giraffeTop, r.deerTop]);
  const P = r.poses;
  ok("every pose and animation drawn in every facing, with its neck", Object.values(P).every(p => p.ok), Object.entries(P).filter(([, p]) => !p.ok));
  ok("the head inside the frame in every pose (riding, crawling, lying, jumping too)", Object.values(P).every(p => p.inside), Object.entries(P).filter(([, p]) => !p.inside).map(([k]) => k));
  ok("the head upright in every pose (turned with the friend, its neck bends up)", Object.values(P).every(p => p.upright), Object.entries(P).filter(([, p]) => !p.upright).map(([k]) => k));
  ok("a longer neck: the head higher, and still in the frame", r.neck.higher && r.neck.inside, r.neck);
  ok("hooves for hands", r.hooves, r.hooves);
  ok("the chosen colour is the patches'", r.colour, r.colour);
  ok("a door is too low for the giraffe sooner (its upright crown well over the plain friend's)", r.door[0] > 1.2 * r.door[1], r.door);
  ok("each colour row only while its style is chosen; the animal fur and belly rows hidden, the eyes kept", r.rules === "100 010 001 110010", r.rules);
  ok("the tab: the giraffe's rows for it (the reticulated's colour, not the Masai's)", r.rowsG === "1101", r.rowsG);
  ok("the bear shows none of them", r.rowsBear === "0000", r.rowsBear);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
