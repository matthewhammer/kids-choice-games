// (ticket 557, for M: "ninja costume -- all black shirt and pants. black gloves. black face mask (we don't see the face at
// all ...) special ninja boots/shoes (very quiet), with a braided pattern of bands ... golden head band ... with a separate,
// connected golden band going from 3rd eye/ forehead to the back of the head ... a ruby (or other gem), with various shape
// options mounted in the inverted T") The 🥷 ninja: every facing, the head band on and off, drawn with its mask (the slit
// facing us and in profile, none from behind), no skin but between the bands (the face, neck and hands covered), the bands
// on both shins and both forearms (ticket 561, M's design: the skin shows between them, or none with 🌑 full darkness), the
// gold bands and the gem in front, the clasp behind; each gem kind's colour and each shape its own path; the
// boots' two styles different; the eyes only with 👀, inside the slit; every pose and animation drawn; nothing inside a
// data-ninja group turned; no mask, filter, blur or SMIL; the shapes at most the knight's 92; the rows only where they apply.
// Exits 1 on a failure.
//   node ninja557.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, gems: {}, shapes: {} };
    const figText = () => { const f = document.getElementById("figure"); return f ? f.outerHTML : ""; };
    const groupAt = (t, i) => { let d = 0; for (const m of t.slice(i).matchAll(/<(\\/?)g[\\s>]/g)) { d += m[1] ? -1 : 1; if (!d) return t.slice(i, i + m.index + 4); } return t.slice(i); };
    const groups = (t, what) => [...t.matchAll(new RegExp('<g data-ninja="' + (what || '[^"]+') + '"', "g"))].map(m => groupAt(t, m.index));
    // (ticket 561) the skin's colour outside the bands (the face, neck or hands showing), and inside them
    const unbanded = t => groups(t, "bands").concat(groups(t, "armbands")).reduce((a, g) => a.split(g).join(""), t);
    const skinOut = t => unbanded(t).toLowerCase().includes('"' + skin + '"'), skinIn = t => groups(t, "bands").concat(groups(t, "armbands")).some(g => g.toLowerCase().includes('"' + skin + '"'));
    const turnedIn = g => [...g.slice(g.indexOf(">") + 1).matchAll(/\\stransform="([^"]*)"/g)].some(m => m[1] && !/^translate\\([^)]*\\)$/.test(m[1]));
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false; state.body.horse = "none";
    set("body", "pose", "stand"); state.body.anim = "none"; set("costume", "kind", "ninja"); changed(); await w(100);
    const D = DEFAULTS.costume, skin = state.face.color.toLowerCase();
    const rows = TABS.find(t => t[1] === "costume")[2], row = k => rows.find(c => c[1] === k);
    out.chooser = row("kind")[3].some(([v, l]) => v === "ninja" && l === "🥷 ninja");
    out.boots = row("ninjaBoots") ? row("ninjaBoots")[3].map(([v]) => v) : [];
    out.gemKinds = row("ninjaGem") ? row("ninjaGem")[3].map(([v]) => v) : [];
    out.gemShapes = row("ninjaGemShape") ? row("ninjaGemShape")[3].map(([v]) => v) : [];
    out.defaults = [D.ninjaBoots, D.ninjaBand, D.ninjaGem, D.ninjaGemShape, D.ninjaEyes, D.ninjaBetween];
    out.between = row("ninjaBetween") ? row("ninjaBetween")[3].map(([v]) => v) : [];
    // each facing, the head band on and off
    for (const band of [true, false]) for (const facing of ["front", "left", "right", "back"]) {
      set("costume", "ninjaBand", band); state.body.facing = facing; changed(); await w(60); const t = figText(), low = t.toLowerCase();
      out.v[facing + (band ? "" : "/off")] = { mask: groups(t, "mask").length, slit: t.includes('data-ninja="slit"'), band: groups(t, "band").length, gem: groups(t, "gem").length,
        gold: low.includes(NINJA.gold), bands: groups(t, "bands").length, armbands: groups(t, "armbands").length, skin: skinOut(t), skinIn: skinIn(t), turned: groups(t).some(turnedIn),
        shapes: shapes(t), bad: /NaN|undefined/.test(t), effects: /<mask|<filter|feGaussianBlur|<animate/.test(t), boot: t.includes(NINJA.glove) }; }
    set("costume", "ninjaBand", true); state.body.facing = "front";
    // (ticket 561) 🌑 full darkness: no skin anywhere, the bands still there, both styles, every facing
    set("costume", "ninjaBetween", "dark"); out.dark = {};
    for (const style of ["braided", "wrapped"]) for (const facing of ["front", "left", "right", "back"]) {
      set("costume", "ninjaBoots", style); state.body.facing = facing; changed(); await w(40); const t = figText();
      out.dark[style + "/" + facing] = { skin: t.toLowerCase().includes('"' + skin + '"'), bands: groups(t, "bands").length, armbands: groups(t, "armbands").length }; }
    set("costume", "ninjaBoots", "wrapped"); set("costume", "ninjaBetween", "skin"); out.wrappedSkin = {};
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(40); const t = figText(); out.wrappedSkin[facing] = skinIn(t) && !skinOut(t); }
    set("costume", "ninjaBoots", "braided"); state.body.facing = "front";
    // each gem kind's colour; each shape its own outline
    for (const g of Object.keys(NINJA_GEMS)) { set("costume", "ninjaGem", g); changed(); await w(40); out.gems[g] = figText().includes('fill="' + NINJA_GEMS[g].c + '"'); }
    set("costume", "ninjaGem", "ruby");
    for (const [sh] of NINJA_GEM_SHAPES) { set("costume", "ninjaGemShape", sh); changed(); await w(40); const gg = groups(figText(), "gem")[0] || ""; out.shapes[sh] = (gg.match(/ d="([^"]+)"/g) || [])[1] || ""; }
    set("costume", "ninjaGemShape", "round");
    // the boots' two styles
    const bandsNow = () => groups(figText(), "bands").join("");
    set("costume", "ninjaBoots", "braided"); changed(); await w(40); const braided = bandsNow();
    set("costume", "ninjaBoots", "wrapped"); changed(); await w(40); const wrapped = bandsNow();
    out.bootStyles = [braided.length > 0, wrapped.length > 0, braided !== wrapped, braided.includes(NINJA.bandB), (braided.match(/<path/g) || []).length, (wrapped.match(/<path/g) || []).length];
    set("costume", "ninjaBoots", "braided");
    // the eyes: none in the slit unless asked; with 👀 and a coloured iris, the iris inside the slit's clip
    state.face.iris = 60; changed(); await w(40); out.eyesOff = figText().includes("ninja-slit-");
    set("costume", "ninjaEyes", true); changed(); await w(40); { const t = figText(); out.eyesOn = /clip-path="url\\(#ninja-slit-/.test(t); }
    state.body.facing = "right"; changed(); await w(40); out.eyesSide = /clip-path="url\\(#ninja-slit-/.test(figText());
    set("costume", "ninjaEyes", false); state.face.iris = DEFAULTS.face.iris; state.body.facing = "front";
    // every pose and animation, every facing: drawn, nothing undefined, nothing turned inside a ninja group, no skin
    for (const pose of ["stand", "sit", "lie", "meditate", "dance", "hug"]) for (const facing of ["front", "left", "right", "back"]) {
      set("body", "pose", pose); state.body.facing = facing; changed(); await w(30); const t = figText();
      out.poses[pose + "/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn) && !skinOut(t) && groups(t, "mask").length === 1; }
    set("body", "pose", "stand");
    for (const anim of ["walk", "run", "crawl", "swim", "climb", "jump", "crouch"]) for (const facing of ["front", "right", "back"]) {
      state.body.facing = facing; state.body.anim = anim; changed(); await w(60); const t = figText();
      out.poses[anim + "/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn) && !skinOut(t) && groups(t, "mask").length === 1; }
    state.body.anim = "none";
    for (const facing of ["left", "front", "back", "right"]) { state.body.horse = "ride"; state.body.facing = facing; changed(); await w(60); const t = figText();
      out.poses["ride/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !groups(t).some(turnedIn) && groups(t, "mask").length === 1; }
    state.body.horse = "none"; state.body.facing = "front"; changed(); await w(60);
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = [rule("ninjaBoots", { kind: "ninja" }), rule("ninjaBetween", { kind: "ninja" }), rule("ninjaBetween", { kind: "cowboy" }), rule("ninjaBand", { kind: "ninja" }), rule("ninjaGem", { kind: "ninja", ninjaBand: true }), rule("ninjaGemShape", { kind: "ninja", ninjaBand: true }),
                 rule("ninjaGem", { kind: "ninja", ninjaBand: false }), rule("ninjaEyes", { kind: "ninja" }), rule("ninjaBoots", { kind: "cowboy" }), rule("ninjaGem", { kind: "monk", ninjaBand: true })].map(Number).join("");
    out.boxed = Object.values(TAB_BOXES["🐯 Costume"]).some(([label, keys]) => label === "🥷 the ninja" && ["ninjaBoots", "ninjaBetween", "ninjaBand", "ninjaGem", "ninjaGemShape", "ninjaEyes"].every(k => keys.includes(k)));
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["ninjaBoots", "ninjaBetween", "ninjaBand", "ninjaGem", "ninjaGemShape", "ninjaEyes"];
    out.rowsNinja = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "ninjaBand", false); changed(); await w(150); out.rowsOff = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "ninjaBand", true); set("costume", "kind", "bear"); changed(); await w(150); out.rowsBear = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = r.v, views = Object.values(V);
  console.log(`  ${JSON.stringify({ defaults: r.defaults, between: r.between, boots: r.boots, gems: r.gemKinds, shapes: r.gemShapes, rules: r.rules, rows: [r.rowsNinja, r.rowsOff, r.rowsBear], bootStyles: r.bootStyles, count: Object.fromEntries(Object.entries(V).map(([k, v]) => [k, v.shapes])) })}`);
  ok("🥷 ninja is among the costumes", r.chooser, r.chooser);
  ok("the boots' bands braided (first) or wrapped", r.boots.join() === "braided,wrapped", r.boots);
  ok("six gems, the ruby first; six shapes, round first", r.gemKinds.length === 6 && r.gemKinds[0] === "ruby" && r.gemShapes.length === 6 && r.gemShapes[0] === "round", [r.gemKinds, r.gemShapes]);
  ok("defaults: braided, the head band on, a round ruby, no eyes in the slit, the skin between the bands", r.defaults.join() === "braided,true,ruby,round,false,skin", r.defaults);
  ok("between the bands: the skin (first) or full darkness", r.between.join() === "skin,dark", r.between);
  ok("every facing: one mask, nothing undefined", views.every(v => v.mask === 1 && !v.bad), V);
  ok("the face never shows: no skin colour in the friend but between the bands", views.every(v => !v.skin), Object.entries(V).filter(([, v]) => v.skin).map(([k]) => k));
  ok("the skin between the bands, at first (braided), every facing", views.every(v => v.skinIn), Object.entries(V).filter(([, v]) => !v.skinIn).map(([k]) => k));
  ok("the skin between the wrapped bands too", Object.values(r.wrappedSkin).every(Boolean), r.wrappedSkin);
  ok("🌑 full darkness: no skin anywhere, the bands on both shins and forearms, both styles", Object.values(r.dark).every(v => !v.skin && v.bands === 2 && v.armbands === 2), r.dark);
  ok("the slit facing us and in profile, none from behind", ["front", "left", "right"].every(k => V[k].slit && V[k + "/off"].slit) && !V.back.slit && !V["back/off"].slit, V);
  ok("the head band on: gold bands every way, the gem in front and in profile, none behind", ["front", "left", "right", "back"].every(k => V[k].band === 1 && V[k].gold) && ["front", "left", "right"].every(k => V[k].gem === 1) && V.back.gem === 0, V);
  ok("the head band off: no band, no gem, no gold", ["front", "left", "right", "back"].every(k => V[k + "/off"].band === 0 && V[k + "/off"].gem === 0 && !V[k + "/off"].gold), V);
  ok("the bands on both shins and both forearms facing us and from behind, on each in profile", views.every(v => v.bands === 2 && v.armbands === 2), Object.fromEntries(Object.entries(V).map(([k, v]) => [k, [v.bands, v.armbands]])));
  ok("the gloves and boots in their black", views.every(v => v.boot), V);
  ok("no mask, filter, blur or SMIL in the friend", views.every(v => !v.effects), V);
  ok("nothing inside a data-ninja group is turned, skewed or scaled", views.every(v => !v.turned), V);
  ok("shapes at most 92 in every view (the knight's most)", views.every(v => v.shapes <= 92), Object.fromEntries(Object.entries(V).map(([k, v]) => [k, v.shapes])));
  ok("each gem kind draws in its own colour", Object.values(r.gems).length === 6 && Object.values(r.gems).every(Boolean), r.gems);
  ok("each gem shape its own outline", new Set(Object.values(r.shapes)).size === 6 && Object.values(r.shapes).every(Boolean), r.shapes);
  ok("the boots' two styles: both drawn, different, the braid in two tones, each a handful of shapes", r.bootStyles[0] && r.bootStyles[1] && r.bootStyles[2] && r.bootStyles[3] && r.bootStyles[4] <= 20 && r.bootStyles[5] <= 10, r.bootStyles);
  ok("no eyes in the slit unless 👀; with it, inside the slit, facing us and in profile", !r.eyesOff && r.eyesOn && r.eyesSide, [r.eyesOff, r.eyesOn, r.eyesSide]);
  const P = r.poses;
  ok("every pose and animation drawn in every facing, the mask on, no skin, riding too", Object.values(P).every(Boolean), Object.entries(P).filter(([, p]) => !p).map(([k]) => k));
  ok("the rows' rules: the ninja's own, the gem's only with the band on", r.rules === "1101110100", r.rules);
  ok("its rows in 🐯 Costume's 🥷 the ninja box", r.boxed, r.boxed);
  ok("the tab: every ninja row for it", r.rowsNinja === "111111", r.rowsNinja);
  ok("the head band off hides the gem's rows", r.rowsOff === "111001", r.rowsOff);
  ok("the bear shows none of them", r.rowsBear === "000000", r.rowsBear);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
