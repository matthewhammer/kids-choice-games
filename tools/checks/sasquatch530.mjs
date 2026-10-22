// (ticket 530, Matthew: "mint and enqueue -- dress-up -- Sasquatch costume.") The 🦶 Sasquatch: an animal suit in four
// styles (🦶 Bigfoot, ❄️ yeti, 🌿 mossy, 🍭 fluffy), each its own colour row (shown only while it is chosen), 👣 footprints
// and a 🙂 big grin. Each style in every facing drawn with its shag (data-sasquatch groups, nothing inside one turned,
// skewed or scaled) and its shaggy crown; every pose and animation drawn; no mask, filter, blur or SMIL; the shapes at most
// the knight's 92; footprints only standing still; the rows only where they apply. Exits 1 on a failure.
//   node sasquatch530.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {} };
    const figText = () => { const f = document.getElementById("figure"); return f ? f.outerHTML : ""; };
    const groupAt = (t, i) => { let d = 0; for (const m of t.slice(i).matchAll(/<(\\/?)g[\\s>]/g)) { d += m[1] ? -1 : 1; if (!d) return t.slice(i, i + m.index + 4); } return t.slice(i); };
    const groups = t => [...t.matchAll(/<g data-sasquatch="([^"]+)"/g)].map(m => groupAt(t, m.index));
    const turnedIn = g => [...g.slice(g.indexOf(">") + 1).matchAll(/\\stransform="([^"]*)"/g)].some(m => m[1] && !/^translate\\([^)]*\\)$/.test(m[1]));
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false;
    set("body", "pose", "stand"); state.body.anim = "none"; set("costume", "kind", "sasquatch"); changed(); await w(100);
    const D = DEFAULTS.costume, ids = Object.keys(SASQUATCH_STYLES);
    out.chooser = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].some(([v, l]) => v === "sasquatch" && l === "🦶 Sasquatch");
    const styleRow = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "sasquatchStyle");
    out.styles = styleRow ? styleRow[3].map(([v, l]) => v + " " + l) : [];
    out.defaults = [D.sasquatchStyle, D.sasquatchPrints, D.sasquatchGrin, ...ids.map(id => D["sasquatchColor_" + id] === SASQUATCH_STYLES[id].colors[0])];
    // each style, each facing: drawn, its shag groups there, nothing turned inside one, under the knight's 92 shapes
    for (const id of ids) { set("costume", "sasquatchStyle", id); out.v[id] = {};
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(60); const t = figText();
        out.v[id][facing] = { pieces: groups(t).length, turned: groups(t).some(turnedIn), shapes: shapes(t), crown: t.includes('data-sasquatch="crown"'),
          prints: t.includes('data-sasquatch="prints"'), bad: /NaN|undefined/.test(t), mask: /<mask|<filter|feGaussianBlur|<animate/.test(t) }; } }
    state.body.facing = "front"; set("costume", "sasquatchStyle", "bigfoot");
    // every pose and animation, every facing: drawn, nothing undefined, nothing turned inside a shag group; prints only standing
    for (const pose of ["stand", "sit", "lie", "meditate", "dance", "hug"]) for (const facing of ["front", "left", "right", "back"]) {
      set("body", "pose", pose); state.body.facing = facing; changed(); await w(30); const t = figText();
      out.poses[pose + "/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn), prints: t.includes('data-sasquatch="prints"') }; }
    set("body", "pose", "stand");
    for (const anim of ["walk", "run", "crawl", "swim", "climb", "jump"]) for (const facing of ["front", "right", "back"]) {
      state.body.facing = facing; if (anim === "jump") { state.body.anim = "none"; startJump("none", "jump"); } else state.body.anim = anim; changed(); await w(anim === "jump" ? 300 : 60); const t = figText();
      out.poses[anim + "/" + facing] = { ok: t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn), prints: t.includes('data-sasquatch="prints"') }; }
    state.body.anim = "none"; state.body.facing = "front"; changed(); await w(60);
    set("costume", "sasquatchPrints", false); changed(); await w(60); out.printsOff = figText().includes('data-sasquatch="prints"');
    set("costume", "sasquatchPrints", true);
    // the colours: the style's chosen colour is the fur
    set("costume", "sasquatchColor_bigfoot", "#3f2a1a"); changed(); await w(60); out.colour = figText().includes('fill="#3f2a1a"');
    set("costume", "sasquatchColor_bigfoot", D.sasquatchColor_bigfoot);
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = ids.map(id => ids.map(j => rule("sasquatchColor_" + j, { ...state.costume, kind: "sasquatch", sasquatchStyle: id }) ? 1 : 0).join("")).join(" ") +
      " " + [rule("sasquatchStyle", { kind: "sasquatch" }), rule("sasquatchPrints", { kind: "sasquatch" }), rule("fur", { kind: "sasquatch" }), rule("belly", { kind: "sasquatch" }), rule("eyes", { kind: "sasquatch" }), rule("sasquatchStyle", { kind: "bear" })].map(Number).join("");
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["sasquatchStyle", "sasquatchColor_bigfoot", "sasquatchColor_yeti", "sasquatchPrints"];
    out.rowsSq = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "bear"); changed(); await w(150); out.rowsBear = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = r.v, ids = Object.keys(V), views = ids.flatMap(id => Object.values(V[id]));
  console.log(`  ${JSON.stringify({ styles: r.styles, defaults: r.defaults, rules: r.rules, rows: [r.rowsSq, r.rowsBear], shapes: ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]) })}`);
  ok("🦶 Sasquatch is among the costumes", r.chooser, r.chooser);
  ok("four styles, the Bigfoot first", ids.length === 4 && r.styles.length === 4 && r.styles[0] === "bigfoot 🦶 Bigfoot", r.styles);
  ok("defaults: the Bigfoot, prints and grin on, each style's colour its first", r.defaults[0] === "bigfoot" && r.defaults[1] === true && r.defaults[2] === true && r.defaults.slice(3).every(Boolean), r.defaults);
  ok("every style, every facing: drawn with its shag and crown, nothing undefined", views.every(v => v.pieces >= 2 && v.crown && !v.bad), V);
  ok("no mask, filter, blur or SMIL in the friend", views.every(v => !v.mask), V);
  ok("nothing inside a data-sasquatch group is turned, skewed or scaled", views.every(v => !v.turned), V);
  ok("shapes at most 92 in every view (the knight's most)", views.every(v => v.shapes <= 92), ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]));
  const P = r.poses;
  ok("every pose and animation drawn in every facing", Object.values(P).every(p => p.ok), Object.entries(P).filter(([, p]) => !p.ok));
  ok("footprints standing still only (not sitting, lying, moving, swimming or climbing)", Object.entries(P).every(([k, p]) => p.prints === k.startsWith("stand/")), Object.entries(P).map(([k, p]) => k + ":" + p.prints));
  ok("the 👣 chip off takes the prints away", r.printsOff === false, r.printsOff);
  ok("the chosen colour is the fur", r.colour, r.colour);
  ok("each colour row only while its style is chosen; the animal fur and belly rows hidden, the eyes kept", r.rules === "1000 0100 0010 0001 110010", r.rules);
  ok("the tab: the Sasquatch's rows for it (the Bigfoot's colour, not the yeti's)", r.rowsSq === "1101", r.rowsSq);
  ok("the bear shows none of them", r.rowsBear === "0000", r.rowsBear);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
