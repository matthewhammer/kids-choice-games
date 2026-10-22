// (ticket 536, Matthew: "moth costume, 3 styles. Follow the bird costume examples for wing ideas, but we want moth wings
// here, and antenna, etc") The 🦋 moth: an animal suit in three styles (🌙 luna moth, 🦚 emperor moth, 🌫️ night moth), each
// its own wing colour row (shown only while it is chosen), and 👁️ eyespots. What node cannot see: each style in every facing
// drawn with both wings, its antennae, collar and bands (a luna's tails), nothing undefined, no mask, filter, blur or SMIL,
// nothing inside a data-moth group turned, skewed or scaled, the shapes at most the knight's 92, and every piece inside the
// picture's frame (standing, the arms raised and level, riding); every pose and animation drawn with its wings; choosing a
// style puts on its body colours; the chosen wing colour is the wing's; the eyespots chip; the rows only where they apply.
// Exits 1 on a failure.
//   node moth536.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, body: {}, poses: {}, inside: {} };
    const figText = () => { const f = document.getElementById("figure"); return f ? f.outerHTML : ""; };
    const groupAt = (t, i) => { let d = 0; for (const m of t.slice(i).matchAll(/<(\\/?)g[\\s>]/g)) { d += m[1] ? -1 : 1; if (!d) return t.slice(i, i + m.index + 4); } return t.slice(i); };
    const groups = t => [...t.matchAll(/<g data-moth="([^"]+)"/g)].map(m => groupAt(t, m.index));
    const turnedIn = g => [...g.slice(g.indexOf(">") + 1).matchAll(/\\stransform="([^"]*)"/g)].some(m => m[1] && !/^translate\\([^)]*\\)$/.test(m[1]));
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    const count = (t, what) => (t.match(new RegExp('data-moth="' + what + '"', "g")) || []).length;
    // every piece of the moth inside the picture's frame (with no place, the picture is the friend's frame): each one's box,
    // in the picture's own units, within its viewBox (2 to spare)
    const inside = () => { const pic = document.getElementById("pic"), vb = pic.viewBox.baseVal, inv = pic.getScreenCTM().inverse();
      return [...document.querySelectorAll("#figure [data-moth]")].filter(e => { const b = e.getBBox(), m = inv.multiply(e.getScreenCTM());
        return [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m))
          .some(p => p.x < vb.x - 2 || p.x > vb.x + vb.width + 2 || p.y < vb.y - 2 || p.y > vb.y + vb.height + 2); }).map(e => e.getAttribute("data-moth")); };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false;
    set("body", "pose", "stand"); state.body.anim = "none"; set("body", "horse", "none"); set("costume", "kind", "moth"); changed(); await w(100);
    const D = DEFAULTS.costume, ids = Object.keys(MOTH_STYLES);
    out.chooser = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].some(([v, l]) => v === "moth" && l === "🦋 moth");
    const styleRow = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "mothStyle");
    out.styles = styleRow ? styleRow[3].map(([v, l]) => v + " " + l) : [];
    out.defaults = [D.mothStyle, D.mothSpots, ...ids.map(id => D["mothColor_" + id] === MOTH_STYLES[id].colors[0])];
    // each style: its body colours put on; each facing: drawn with its pieces, nothing turned inside one, inside the frame
    for (const id of ids) { set("costume", "mothStyle", id); out.v[id] = {};
      out.body[id] = ["fur", "marks", "belly", "accent"].every(k => state.costume[k] === MOTH_STYLES[id].body[k]);
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(60); const t = figText();
        out.v[id][facing] = { wings: count(t, "wing"), antennae: count(t, "antennae"), collar: count(t, "collar"), bands: count(t, "bands"), tails: count(t, "tail"),
          spots: count(t, "spot"), turned: groups(t).some(turnedIn), shapes: shapes(t), bad: /NaN|undefined/.test(t), mask: /<mask|<filter|feGaussianBlur|<animate/.test(t), out: inside() }; } }
    // the arms raised and level, toward us and from behind; riding, every facing
    set("costume", "mothStyle", "luna");
    for (const [k, arms] of [["up", -45], ["level", 0]]) for (const facing of ["front", "back", "right"]) {
      state.body.arms = arms; state.body.facing = facing; changed(); await w(60); out.inside[k + "/" + facing] = inside(); }
    state.body.arms = DEFAULTS.body.arms; set("body", "horse", "ride");
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(60); const t = figText(); out.inside["ride/" + facing] = inside();
      out.poses["ride/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn), wings: count(t, "wing") }; }
    set("body", "horse", "none"); state.body.arms = DEFAULTS.body.arms; state.body.facing = "front";
    // every pose and animation, every facing: drawn with both wings, nothing undefined, nothing turned inside a group
    for (const pose of ["stand", "sit", "lie", "meditate", "dance", "hug"]) for (const facing of ["front", "left", "right", "back"]) {
      set("body", "pose", pose); state.body.facing = facing; changed(); await w(30); const t = figText();
      out.poses[pose + "/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn), wings: count(t, "wing") }; }
    set("body", "pose", "stand");
    for (const anim of ["walk", "run", "crawl", "swim", "climb", "jump", "crouch"]) for (const facing of ["front", "right", "back"]) {
      state.body.facing = facing; state.body.anim = anim; changed(); await w(60); const t = figText();
      out.poses[anim + "/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn), wings: count(t, "wing") }; }
    state.body.anim = "none"; state.body.facing = "front";
    // the eyespots chip, on the emperor; the chosen colour is the wings'
    set("costume", "mothStyle", "emperor"); changed(); await w(60); out.spotsOn = count(figText(), "spot");
    set("costume", "mothSpots", false); changed(); await w(60); out.spotsOff = count(figText(), "spot"); set("costume", "mothSpots", true);
    set("costume", "mothColor_emperor", "#a77bb8"); changed(); await w(60); out.colour = /data-moth="wing"[\\s\\S]*fill="#a77bb8"/.test(figText());
    set("costume", "mothColor_emperor", D.mothColor_emperor); set("costume", "mothStyle", "luna");
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = ids.map(id => ids.map(j => rule("mothColor_" + j, { ...state.costume, kind: "moth", mothStyle: id }) ? 1 : 0).join("")).join(" ") + " " +
      ids.map(id => rule("mothSpots", { ...state.costume, kind: "moth", mothStyle: id }) ? 1 : 0).join("") + " " +
      [rule("mothStyle", { kind: "moth" }), rule("fur", { kind: "moth" }), rule("belly", { kind: "moth" }), rule("eyes", { kind: "moth" }), rule("mothStyle", { kind: "bear" })].map(Number).join("");
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["mothStyle", "mothColor_luna", "mothColor_emperor", "mothSpots"];
    out.rowsMoth = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "bear"); changed(); await w(150); out.rowsBear = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = r.v, ids = Object.keys(V), views = ids.flatMap(id => Object.values(V[id]));
  console.log(`  ${JSON.stringify({ styles: r.styles, defaults: r.defaults, rules: r.rules, rows: [r.rowsMoth, r.rowsBear], spots: [r.spotsOn, r.spotsOff], shapes: ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]) })}`);
  ok("🦋 moth is among the costumes", r.chooser, r.chooser);
  ok("three styles, the luna moth first", ids.length === 3 && r.styles.length === 3 && r.styles[0] === "luna 🌙 luna moth", r.styles);
  ok("defaults: the luna moth, eyespots on, each style's colour its first", r.defaults[0] === "luna" && r.defaults[1] === true && r.defaults.slice(2).every(Boolean), r.defaults);
  ok("choosing a style puts on its body colours", Object.values(r.body).every(Boolean), r.body);
  ok("every style, every facing: two wings, antennae, collar and bands, nothing undefined", views.every(v => v.wings === 2 && v.antennae === 1 && v.collar === 1 && v.bands === 1 && !v.bad), V);
  ok("the luna's two long tails (one on each hindwing), only the luna's", Object.values(V.luna).every(v => v.tails === 2) && ids.filter(id => id !== "luna").every(id => Object.values(V[id]).every(v => v.tails === 0)), V);
  ok("no mask, filter, blur or SMIL in the friend", views.every(v => !v.mask), V);
  ok("nothing inside a data-moth group is turned, skewed or scaled", views.every(v => !v.turned), V);
  ok("shapes at most 92 in every view (the knight's most)", views.every(v => v.shapes <= 92), ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]));
  ok("every piece inside the picture's frame, every style and facing", views.every(v => !v.out.length), ids.map(id => [id, Object.values(V[id]).map(v => v.out)]));
  ok("inside the frame with the arms raised and level, and riding", Object.values(r.inside).every(o => !o.length), r.inside);
  const P = r.poses;
  ok("every pose and animation drawn with both wings in every facing", Object.values(P).every(p => p.ok && p.wings === 2), Object.entries(P).filter(([, p]) => !p.ok || p.wings !== 2));
  ok("the 👁️ chip off takes the eyespots away", r.spotsOn > 0 && r.spotsOff === 0, [r.spotsOn, r.spotsOff]);
  ok("the chosen colour is the wings'", r.colour, r.colour);
  ok("each colour row only while its style is chosen; eyespots for the luna and the emperor; the animal rows kept", r.rules === "100 010 001 110 11110", r.rules);
  ok("the tab: the moth's rows for it (the luna's colour, not the emperor's)", r.rowsMoth === "1101", r.rowsMoth);
  ok("the bear shows none of them", r.rowsBear === "0000", r.rowsBear);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
