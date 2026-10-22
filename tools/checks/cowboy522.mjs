// (ticket 522, M and Matthew: "Cowgirl and Cowboy, 3 variations of style each. 6 styles of hat. Lasso to hold. No guns
// please.") The 👢 cowgirl (🌟 rodeo star, 🌻 prairie, 🐮 cow-print) and the 🤠 cowboy (⭐ sheriff, 🏅 rodeo rider, 🧥 trail
// boss), each style its own colour row (shown only while it is chosen); the 🎩 hat of six (🐂 cattleman, 🪣 ten-gallon, 🌾
// straw, 🎀 bow, 🌠 star hat, 🪶 feather) or 🚫 none, shared by both; the ➿ lasso, held in the hand chosen. What node cannot
// see: every style in every facing and pose drawn in the browser, nothing undefined, no mask (but the bangs' own), filter,
// blur, gradient or SMIL in the friend, the shapes under the robot's cap of 80 with any hat; the hat a drawing of its own
// toward us, from the side and from behind (left and right mirrored), nothing inside it or the lasso turned or scaled;
// the lasso in the friend's own hand (swapped from behind), in the far section with the far hand in profile, hidden while
// the hands are busy, twirling in four drawings while running; a style puts on its usual hat only over another style's
// usual one; the rows only where they apply. Exits 1 on a failure.
//   node cowboy522.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, hats: {} };
    const figText = () => { const f = document.getElementById("figure"); return f ? f.outerHTML : ""; };
    const groupAt = (t, i) => { let d = 0; for (const m of t.slice(i).matchAll(/<(\\/?)g[\\s>]/g)) { d += m[1] ? -1 : 1; if (!d) return t.slice(i, i + m.index + 4); } return t.slice(i); };
    const groups = (t, what) => [...t.matchAll(/<g data-western="([^"]+)"/g)].filter(m => !what || m[1] === what).map(m => groupAt(t, m.index));
    const inner = (t, what) => (groups(t, what)[0] || "").replace(/^<g[^>]*>/, "");
    const turnedIn = g => [...g.slice(g.indexOf(">") + 1).matchAll(/\\stransform="([^"]*)"/g)].some(m => m[1] && !/^translate\\([^)]*\\)$/.test(m[1]));
    const shapes = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    // (the one mask a friend with bangs already has, the bangs' own, is not new)
    const costly = t => /<filter|feGaussianBlur|Gradient|<animate|<set\\b/.test(t) || [...t.matchAll(/<mask id="([^"]*)"/g)].some(m => !/bangs/.test(m[1]));
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null }); state.body.sit = false; state.body.horse = "none";
    set("body", "pose", "stand"); state.body.anim = "none"; state.body.facing = "front";
    const C = state.costume, D = DEFAULTS.costume, kinds = { cowgirl: COWGIRL_STYLES, cowboy: COWBOY_STYLES }, hats = Object.keys(COW_HATS);
    const list = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3];
    out.chooser = [list.some(([v, l]) => v === "cowgirl" && l === "👢 cowgirl"), list.some(([v, l]) => v === "cowboy" && l === "🤠 cowboy")];
    out.styles = Object.fromEntries(Object.entries(kinds).map(([k, T]) => [k, Object.values(T).map(t => t.name)]));
    out.hatNames = Object.values(COW_HATS).map(h => h.name);
    out.defaults = [D.cowgirlStyle, D.cowboyStyle, D.cowHat, D.lasso, D.lassoHand,
                    ...Object.entries(kinds).flatMap(([k, T]) => Object.entries(T).map(([id, t]) => D[k + "Color_" + id] === t.colors[0])),
                    ...hats.map(id => D["cowHatColor_" + id] === COW_HATS[id].colors[0])];
    // each costume, each style, each hat (and none), each facing: drawn, nothing costly, under the cap, nothing turned inside
    for (const [k, T] of Object.entries(kinds)) { set("costume", "kind", k);
      for (const id of Object.keys(T)) { set("costume", k + "Style", id);
        for (const hat of ["none", ...hats]) { set("costume", "cowHat", hat);
          for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(30); const t = figText();
            out.v[k + " " + id + " " + hat + "/" + facing] = { hat: groups(t, "hat").length, torso: groups(t, "torso").length, lasso: groups(t, "lasso").length, shapes: shapes(t),
              bad: /NaN|undefined/.test(t), costly: costly(t), turned: groups(t).some(turnedIn) }; } } } }
    state.body.facing = "front";
    // each hat a drawing of its own toward us, from the side and from behind; left and right mirrored
    set("costume", "kind", "cowboy");
    for (const hat of hats) { set("costume", "cowHat", hat); out.hats[hat] = {};
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(30); out.hats[hat][facing] = inner(figText(), "hat"); } }
    state.body.facing = "front";
    // every pose and animation, every facing, every style: drawn, nothing undefined; the lasso hidden while the hands are busy
    out.busy = {};
    for (const [k, T] of Object.entries(kinds)) { set("costume", "kind", k);
      for (const id of Object.keys(T)) { set("costume", k + "Style", id);
        for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) for (const facing of ["front", "left", "right", "back"]) {
          set("body", "pose", pose); state.body.facing = facing; changed(); await w(20); const t = figText();
          out.poses[k + " " + id + " " + pose + "/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !costly(t);
          if (pose === "lie") out.busy[k + " " + id + " lie/" + facing] = groups(t, "lasso").length; }
        set("body", "pose", "stand");
        for (const anim of ["walk", "run", "crawl", "crouch", "jump", "swim", "climb", "climbup", "stairs"]) for (const facing of ["front", "right", "back"]) {
          state.body.facing = facing; state.body.anim = anim; changed(); await w(40); const t = figText();
          out.poses[k + " " + id + " " + anim + "/" + facing] = t.length > 1000 && !/NaN|undefined/.test(t) && !costly(t);
          if (/crawl|swim|climb/.test(anim)) out.busy[k + " " + id + " " + anim + "/" + facing] = groups(t, "lasso").length; }
        state.body.anim = "none"; state.body.facing = "front"; changed(); } }
    // the lasso: in the left hand by default (our right facing us, our left from behind), the right hand when chosen; off
    set("costume", "kind", "cowgirl"); set("costume", "cowgirlStyle", "rodeo"); out.side = {};
    const fig = () => document.getElementById("figure"), midX = el => { const b = el.getBoundingClientRect(); return b.left + b.width / 2; };
    const bodyX = () => midX(fig().querySelector('[data-western="torso"]'));
    for (const hand of ["left", "right"]) { set("costume", "lassoHand", hand);
      for (const facing of ["front", "back"]) { state.body.facing = facing; changed(); await w(60); const l = fig().querySelector('[data-western="lasso"]');
        out.side[hand + "/" + facing] = l ? Math.sign(Math.round(midX(l) - bodyX())) : null; } }
    set("costume", "lassoHand", "left");
    // in profile: the left hand is the far one facing our right, its lasso drawn before the body (the far section); near
    // facing our left, drawn after it
    out.order = {};
    for (const facing of ["right", "left"]) { state.body.facing = facing; changed(); await w(60); const t = figText();
      out.order[facing] = t.indexOf('data-western="lasso"') < t.indexOf('data-western="torso"') ? "before" : "after"; }
    state.body.facing = "front"; set("costume", "lasso", false); changed(); await w(60); out.off = groups(figText(), "lasso").length; set("costume", "lasso", true);
    // running, the loop twirls: four drawings by LFO B's phase, the frame room for it
    state.body.facing = "right"; state.body.anim = "run"; const seen = new Set();
    for (const u of [0.05, 0.3, 0.55, 0.8]) { holdStill(0); stillAt = u * lfoNow("B").dur; changed(); await w(40); seen.add(inner(figText(), "lasso")); }
    out.twirl = seen.size; stillAt = null; pic.unpauseAnimations(); state.body.anim = "none"; state.body.facing = "front"; changed(); await w(60);
    // the usual hat: a style puts its own on while the hat is another style's usual one, never over a hat picked
    set("costume", "kind", "cowboy"); set("costume", "cowHat", "star"); set("costume", "cowboyStyle", "rider"); out.usual = [C.cowHat];
    set("costume", "cowHat", "none"); set("costume", "cowboyStyle", "sheriff"); out.usual.push(C.cowHat);
    set("costume", "cowHat", "cattleman"); set("costume", "kind", "cowgirl"); set("costume", "cowgirlStyle", "prairie"); out.usual.push(C.cowHat);
    // no guns: nothing in the picture or the settings named so
    out.noGuns = !/gun|holster|pistol|revolver|rifle|bullet|cartridge/i.test(JSON.stringify([COWGIRL_STYLES, COWBOY_STYLES, COW_HATS]) + figText());
    // the rules: each style's colour row only while it is chosen, the hat's colour row the hat worn's, the lasso rows for both
    const S = SHOWN_WHEN, rule = (k, c) => !!S["costume." + k](c);
    out.rules = [Object.keys(COWGIRL_STYLES).map(id => Object.keys(COWGIRL_STYLES).map(j => rule("cowgirlColor_" + j, { kind: "cowgirl", cowgirlStyle: id }) ? 1 : 0).join("")).join(" "),
                 Object.keys(COWBOY_STYLES).map(id => Object.keys(COWBOY_STYLES).map(j => rule("cowboyColor_" + j, { kind: "cowboy", cowboyStyle: id }) ? 1 : 0).join("")).join(" "),
                 hats.map(id => hats.map(j => rule("cowHatColor_" + j, { kind: "cowboy", cowHat: id }) ? 1 : 0).join("")).join(" "),
                 [rule("cowHat", { kind: "cowgirl" }), rule("cowHat", { kind: "knight" }), rule("lasso", { kind: "cowboy" }), rule("lassoHand", { kind: "cowboy", lasso: true }),
                  rule("lassoHand", { kind: "cowboy", lasso: false }), rule("lasso", { kind: "witch" }), rule("cowgirlStyle", { kind: "cowboy" }), rule("cowHatColor_cattleman", { kind: "cowboy", cowHat: "none" })].map(Number).join("")];
    // the tab itself
    set("costume", "kind", "cowboy"); set("costume", "cowboyStyle", "sheriff"); set("costume", "cowHat", "star"); tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["cowboyStyle", "cowboyColor_sheriff", "cowboyColor_rider", "cowgirlStyle", "cowHat", "cowHatColor_star", "cowHatColor_bow", "lasso", "lassoHand"];
    out.rowsCowboy = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "knight"); changed(); await w(150); out.rowsKnight = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  const V = Object.entries(r.v);
  console.log(`  ${JSON.stringify({ styles: r.styles, hats: r.hatNames, defaults: r.defaults, side: r.side, order: r.order, twirl: r.twirl, usual: r.usual, rules: r.rules, rows: [r.rowsCowboy, r.rowsKnight] })}`);
  ok("👢 cowgirl and 🤠 cowboy are among the costumes", r.chooser.every(Boolean), r.chooser);
  ok("three styles each, six hats", r.styles.cowgirl.join() === "🌟 rodeo star,🌻 prairie,🐮 cow-print" && r.styles.cowboy.join() === "⭐ sheriff,🏅 rodeo rider,🧥 trail boss" &&
     r.hatNames.join() === "🐂 cattleman,🪣 ten-gallon,🌾 straw,🎀 bow,🌠 star hat,🪶 feather", [r.styles, r.hatNames]);
  ok("defaults: the rodeo star, the sheriff, the cattleman, the lasso in the left hand, every colour its usual first",
     r.defaults.slice(0, 5).join() === "rodeo,sheriff,cattleman,true,left" && r.defaults.slice(5).every(Boolean), r.defaults);
  ok("every style, hat and facing drawn, nothing undefined, with its pieces over the shirt and the hat (none with 🚫)",
     V.every(([k, v]) => !v.bad && v.torso === 1 && v.hat === (k.includes(" none/") ? 0 : 1)), V.filter(([k, v]) => v.bad || v.torso !== 1));
  ok("the lasso held in every standing view (on by default)", V.every(([, v]) => v.lasso === 1), V.filter(([, v]) => v.lasso !== 1).map(([k]) => k));
  ok("no mask (but the bangs' own), filter, blur, gradient or SMIL in the friend", V.every(([, v]) => !v.costly), V.filter(([, v]) => v.costly).map(([k]) => k));
  ok("nothing inside the hat, the lasso or the pieces turned, skewed or scaled", V.every(([, v]) => !v.turned), V.filter(([, v]) => v.turned).map(([k]) => k));
  ok("shapes under 80 in every view with any hat (the robot's cap)", V.every(([, v]) => v.shapes < 80), V.map(([k, v]) => [k, v.shapes]).filter(([, s]) => s >= 72));
  ok("each hat a drawing of its own toward us, from the side and from behind (left and right mirrored)",
     Object.values(r.hats).every(h => new Set([h.front, h.right, h.back]).size === 3 && h.left !== h.right && h.front.length > 100), Object.entries(r.hats).map(([k, h]) => [k, h.front.length, h.right.length, h.back.length]));
  ok("every pose and animation drawn, every style and facing", Object.values(r.poses).every(Boolean), Object.entries(r.poses).filter(([, v]) => !v));
  ok("the lasso hidden while lying, crawling, swimming and climbing", Object.values(r.busy).every(v => v === 0), Object.entries(r.busy).filter(([, v]) => v));
  ok("the lasso in the friend's own hand: left on our right facing us and our left from behind; right the other way",
     r.side["left/front"] === 1 && r.side["left/back"] === -1 && r.side["right/front"] === -1 && r.side["right/back"] === 1, r.side);
  ok("in profile the far hand's lasso is drawn behind the body, the near hand's in front", r.order.right === "before" && r.order.left === "after", r.order);
  ok("➿ lasso off: none drawn", r.off === 0, r.off);
  ok("running, the loop twirls in four drawings", r.twirl === 4, r.twirl);
  ok("a style's usual hat goes on over another style's usual one, never over a hat picked", r.usual.join() === "tengallon,none,straw", r.usual);
  ok("no guns, holsters or bullets anywhere in the costumes", r.noGuns, r.noGuns);
  ok("each colour row only while its style or hat is chosen; the hat and lasso rows only for the cowgirl and the cowboy",
     r.rules[0] === "100 010 001" && r.rules[1] === "100 010 001" && r.rules[2] === "100000 010000 001000 000100 000010 000001" && r.rules[3] === "10110000", r.rules);
  ok("the tab: the cowboy's rows for the cowboy (the sheriff's colour, the star hat's)", r.rowsCowboy === "110011011", r.rowsCowboy);
  ok("the knight shows none of them", r.rowsKnight === "000000000", r.rowsKnight);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
