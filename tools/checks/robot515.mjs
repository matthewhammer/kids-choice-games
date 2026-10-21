// (ticket 515, Matthew: "robot costume -- multiple styles -- do 8") The 🤖 robot: one costume, eight styles (🔑 wind-up tin,
// 📦 box bot, 🤗 helper bot, 🚀 space bot, 🦾 big mech, ⚡ hero bot, 📺 TV bot, 🕷️ spider bot), each its own colour row (shown
// only while it is chosen) and the 💡 lights row. Each style toward us, from behind and from the side: its head a drawing of
// its own in each view (left and right mirrored), nothing in any robot piece turned, skewed or scaled (no transform inside
// one); a faceplate's own eyes, or the friend's face through a window; every pose and animation in every facing drawn,
// nothing undefined; no mask, filter or blur in the friend; the shapes under a cap (the knight's most is 92); the tin's key
// three drawings of its own as it walks; the colours where they belong. Exits 1 on a failure.
//   node robot515.mjs <devtools port> <url>
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
  // (the drawing read as text, the friend's own group: everything below is about that text)
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, faces: {} };
    const figText = () => { const f = document.getElementById("figure"); return f ? f.outerHTML : ""; };
    // (each robot piece is a group marked data-robot: its text from its opening tag to its own closing one)
    const groupAt = (t, i) => { let d = 0; for (const m of t.slice(i).matchAll(/<(\\/?)g[\\s>]/g)) { d += m[1] ? -1 : 1; if (!d) return t.slice(i, i + m.index + 4); } return t.slice(i); };
    const groups = (t, what) => [...t.matchAll(/<g data-robot="([^"]+)"/g)].filter(m => !what || m[1] === what).map(m => groupAt(t, m.index));
    const pieces = (t, what) => groups(t, what).length, inner = (t, what) => groups(t, what)[0] || "";
    // (a transform inside a piece other than a plain move: a turned, skewed or scaled copy)
    const turnedIn = g => [...g.slice(g.indexOf(">") + 1).matchAll(/\\stransform="([^"]*)"/g)].some(m => m[1] && !/^translate\\([^)]*\\)$/.test(m[1]));
    // (the friend's own eyes: an eyes part that is not a faceplate's)
    const friendEyes = t => [...t.matchAll(/<g[^>]*data-part="eyes"[^>]*>/g)].filter(m => !t.slice(m.index, m.index + 400).includes('data-robot="eyes"')).length;
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false;
    set("body", "pose", "stand"); state.body.anim = "none"; set("costume", "kind", "robot"); changed(); await w(100);
    const C = state.costume, D = DEFAULTS.costume, ids = Object.keys(ROBOT_STYLES);
    out.chooser = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].some(([v, l]) => v === "robot" && l === "🤖 robot");
    const styleRow = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "robotStyle");
    out.styles = styleRow ? styleRow[3].map(([v, l]) => v + " " + l) : [];
    out.defaults = [D.robotStyle, D.robotLights, ...ids.map(id => D["robotColor_" + id] === ROBOT_STYLES[id].colors[0])];
    // each style, each facing: drawn, its head a drawing of each view's own, nothing turned or scaled inside a robot piece
    for (const id of ids) { set("costume", "robotStyle", id); out.v[id] = {};
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(60); const t = figText();
        const parts = ["head", "torso", "back", "arm", "leg", "eyes"].map(p => [p, pieces(t, p)]);
        out.v[id][facing] = { head: inner(t, "head").replace(/^<g[^>]*>/, ""), turned: groups(t).some(turnedIn), parts: Object.fromEntries(parts), shapes: shapes(t),
          bad: /NaN|undefined/.test(t), mask: /<mask|<filter|feGaussianBlur/.test(t) }; } }
    // the face: under the tin's plate and the helper's screen not drawn, their own eyes instead; through the others' windows
    // and openings toward us the friend's own eyes (no robot eyes); the box and the TV draw no face from the side
    state.body.facing = "front";
    for (const id of ids) { set("costume", "robotStyle", id);
      for (const facing of ["front", "right"]) { state.body.facing = facing; changed(); await w(50); const t = figText();
        out.faces[id + "/" + facing] = [pieces(t, "eyes") ? "robot" : "", friendEyes(t) ? "eyes" : ""].join(" ").trim(); } }
    state.body.facing = "front";
    // every pose and animation, every facing, every style: drawn, nothing undefined
    for (const id of ids) { set("costume", "robotStyle", id);
      for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) for (const facing of ["front", "left", "right", "back"]) {
        set("body", "pose", pose); state.body.facing = facing; changed(); await w(30); const t = figText();
        out.poses[id + " " + pose + "/" + facing] = t.length > 1000 && pieces(t, "head") === 1 && !/NaN|undefined/.test(t); }
      set("body", "pose", "stand");
      for (const anim of ["walk", "run", "crawl", "crouch", "jump", "swim"]) for (const facing of ["front", "right", "back"]) {
        state.body.facing = facing; state.body.anim = anim; changed(); await w(60); const t = figText();
        out.poses[id + " " + anim + "/" + facing] = t.length > 1000 && pieces(t, "head") === 1 && !/NaN|undefined/.test(t); }
      state.body.anim = "none"; state.body.facing = "front"; changed(); }
    // the tin's key, walking, from the side and from behind: three drawings of its own as the stride goes on
    set("costume", "robotStyle", "tin"); out.key = {};
    for (const facing of ["right", "back"]) { state.body.facing = facing; state.body.anim = "walk"; const seen = new Set();
      for (const u of [0.1, 0.45, 0.8]) { holdStill(0); stillAt = u * lfoNow("B").dur; changed(); await w(40); seen.add(inner(figText(), "back")); }
      out.key[facing] = seen.size; }
    stillAt = null; pic.unpauseAnimations(); state.body.anim = "none"; state.body.facing = "front"; changed(); await w(60);
    // the colours: each style's own colour on its head, the lights where they belong, the hero's trim white on red
    set("costume", "robotStyle", "tin"); set("costume", "robotColor_tin", "#2563eb"); set("costume", "robotLights", "#f472b6"); changed(); await w(60);
    let t = figText(); out.colours = { main: inner(t, "head").includes('fill="#2563eb"'), lights: inner(t, "eyes").includes('fill="#f472b6"'), sleeves: t.includes('#c9ced6') };
    set("costume", "robotColor_tin", D.robotColor_tin); set("costume", "robotLights", "auto");
    set("costume", "robotStyle", "hero"); set("costume", "robotColor_hero", "#dc2626"); changed(); await w(60); t = figText(); out.colours.heroOnRed = t.includes('stroke="#f1f5f9"') && !t.includes('stroke="#e23b3b"');
    set("costume", "robotColor_hero", D.robotColor_hero); changed(); await w(60); t = figText(); out.colours.hero = t.includes('stroke="#e23b3b"');
    // the space bot's flames: only in the air
    set("costume", "robotStyle", "space"); state.body.anim = "none"; changed(); await w(60); out.flames = [figText().includes('fill="#f97316"')];
    // (held at the jump's middle, in the air, whatever the computer's speed: as the picture archive's harness does)
    set("body", "anim", "jump"); const rate = Math.max(0.1, Number(state.body.jumpShortS ?? 150) || 100) / 100;
    jumpStart = performance.now() - 0.5 * JUMP_TIMES[2] * 1000 / rate; changed(); await w(20); out.flames.push(figText().includes('fill="#f97316"'));
    await w(1400); state.body.anim = "none"; changed();
    // the rules: the style row and the lights only for the robot, each colour row only while its style is chosen
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = ids.map(id => ids.map(j => rule("robotColor_" + j, { ...state.costume, kind: "robot", robotStyle: id }) ? 1 : 0).join("")).join(" ") +
      " " + [rule("robotStyle", { kind: "robot" }), rule("robotLights", { kind: "robot" }), rule("robotStyle", { kind: "knight" }), rule("robotColor_tin", { kind: "knight", robotStyle: "tin" })].map(Number).join("");
    // the tab itself: the robot's rows showing for the robot, not for the knight
    set("costume", "robotStyle", "tin"); tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["robotStyle", "robotColor_tin", "robotColor_box", "robotLights"];
    out.rowsRobot = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "knight"); changed(); await w(150); out.rowsKnight = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = r.v, ids = Object.keys(V);
  console.log(`  ${JSON.stringify({ styles: r.styles, defaults: r.defaults, key: r.key, rules: r.rules, rows: [r.rowsRobot, r.rowsKnight] })}`);
  ok("🤖 robot is among the costumes", r.chooser, r.chooser);
  ok("eight styles, the wind-up tin first", ids.length === 8 && r.styles.length === 8 && r.styles[0] === "tin 🔑 wind-up tin", r.styles);
  ok("defaults: the tin, its lights its own, each style's colour its usual first one", r.defaults[0] === "tin" && r.defaults[1] === "auto" && r.defaults.slice(2).every(Boolean), r.defaults);
  const views = ids.flatMap(id => Object.values(V[id]));
  ok("every style, every facing: a head, a torso or arm pieces, nothing undefined", views.every(v => v.parts.head === 1 && !v.bad), V);
  ok("no mask, filter or blur in the friend", views.every(v => !v.mask), V);
  ok("nothing inside a robot piece is turned, skewed or scaled (each view its own drawing)", views.every(v => !v.turned), ids.map(id => [id, Object.values(V[id]).map(v => v.turned)]));
  ok("each style's head is a drawing of its own toward us, from the side and from behind (left and right mirrored)",
     ids.every(id => new Set([V[id].front.head, V[id].right.head, V[id].back.head]).size === 3 && V[id].left.head !== V[id].right.head), ids.map(id => [id, V[id].front.head.length, V[id].right.head.length, V[id].back.head.length]));
  ok("shapes under 80 in every view (the knight's are 64 to 92)", views.every(v => v.shapes < 80), ids.map(id => [id, Object.values(V[id]).map(v => v.shapes)]));
  const F = r.faces;
  ok("faces: the tin's plate and the helper's screen draw their own eyes (not the friend's); the windows and openings show the friend's toward us; the box and TV none from the side",
     F["tin/front"] === "robot" && F["helper/front"] === "robot" && ["box", "space", "mech", "hero", "tv", "spider"].every(id => F[id + "/front"] === "eyes") &&
     F["box/right"] === "" && F["tv/right"] === "" && ["space", "mech", "hero", "spider"].every(id => F[id + "/right"] === "eyes"), F);
  ok("every pose and animation drawn, every style, toward us, from behind and from the side", Object.values(r.poses).every(Boolean), Object.entries(r.poses).filter(([, v]) => !v));
  ok("the tin's key, walking: three drawings of its own from the side and from behind", r.key.right === 3 && r.key.back === 3, r.key);
  ok("colours: the style's on its head, the lights on its eyes, the tin silver on its limbs", r.colours.main && r.colours.lights && r.colours.sleeves, r.colours);
  ok("the hero's trim red, and white on the red swatch", r.colours.hero && r.colours.heroOnRed, r.colours);
  ok("the space bot's flames only in the air", r.flames[0] === false && r.flames[1] === true, r.flames);
  ok("each colour row only while its style is chosen; the style and lights rows only for the robot",
     r.rules === "10000000 01000000 00100000 00010000 00001000 00000100 00000010 00000001 1100", r.rules);
  ok("the tab: the robot's rows for the robot (the tin's colour, not the box's)", r.rowsRobot === "1101", r.rowsRobot);
  ok("the knight shows none of the robot's rows", r.rowsKnight === "0000", r.rowsKnight);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
