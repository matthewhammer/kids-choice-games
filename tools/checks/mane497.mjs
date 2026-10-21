// (ticket 497, for M: "can we adjust the mane style? the default is good -- can we think of 5 others, to bring the total to
// 6?") The friend's horse's mane in six styles, chosen in 🧍 Body's 🐴 the horse: loose (the usual) draws exactly as before,
// each other style draws differently from it in every view (side, front, back; led and ridden) with no NaN in it, the
// friend's horse in the picture follows the choice, and the stable's horses (no style of their own) keep the loose forelock.
// Exits 1 on a failure.
//   node mane497.mjs <devtools port> <url>
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
    const styles = HORSE_MANE_STYLES.map(s => s[0]);
    const body = (TABS.find(t => t[0] === "🧍 Body") || [0, 0, []])[2].flat(3).filter(x => typeof x === "string" && /^horse/.test(x));
    const H = { coat: "#7b4a2a", mane: "#1f1f22", mark: "star", tack: "#7a3a1a", socks: false, shoes: "off", markColor: "#f7f4ee", saddle: "#6b3f1f", blanket: "auto" };
    const draw = (style, view, ride) => { const h = horseSvg(view, "walk", 0.3, style === undefined ? H : { ...H, maneStyle: style }, 0, ride); return h.svg + "|" + h.over; };
    const views = {};
    for (const view of ["side", "front", "back"]) for (const ride of [false, true]) {
      const plain = draw(undefined, view, ride), loose = draw("loose", view, ride);
      views[view + (ride ? "/ridden" : "/led")] = { looseSame: plain === loose,
        differ: styles.filter(s => s !== "loose" && draw(s, view, ride) !== loose).length,
        nan: styles.filter(s => /NaN|undefined/.test(draw(s, view, ride))) };
    }
    // the friend's horse in the picture follows the choice
    Object.assign(B, { kind: "emptyroom", figX: 0, figY: 40, seat: null, things: [] });
    const shown = {};
    for (const s of ["loose", "curly", "bows"]) { Object.assign(state.body, { horse: "lead", horseManeStyle: s, facing: "right", anim: "none" }); changed(); drawNow(); await w(150);
      const hg = document.querySelector("#figure .horse"); shown[s] = hg ? hg.innerHTML.length : 0; }
    Object.assign(state.body, { horse: "none", horseManeStyle: "loose" }); changed(); drawNow();
    const stable = horseFace({ coat: "#7b4a2a", mane: "#1f1f22", mark: "star" }, 0, "#7a3a1a", true).includes("M-9 -160 Q-16 -146 -7 -134");
    return JSON.stringify({ styles, body, def: DEFAULTS.body.horseManeStyle, views, shown, stable }); })()`));
  ok("six mane styles, loose first", r.styles.length === 6 && r.styles[0] === "loose", r.styles);
  ok("its chooser is in 🧍 Body, with the horse's other settings", r.body.includes("horseManeStyle") && r.body.includes("horseMane"), r.body);
  ok("a friend starts with the loose mane, as before", r.def === "loose", r.def);
  for (const [k, v] of Object.entries(r.views)) {
    ok(`${k}: loose draws exactly as a horse with no style`, v.looseSame, v);
    ok(`${k}: each of the other five draws differently`, v.differ === 5, v);
    ok(`${k}: no NaN or undefined in any style`, v.nan.length === 0, v);
  }
  ok("the friend's horse in the picture follows the choice", r.shown.loose > 0 && r.shown.curly !== r.shown.loose && r.shown.bows !== r.shown.loose, r.shown);
  ok("the stable's horses keep the loose forelock", r.stable, r.stable);
  ok("no errors on the page", errs.length === 0, errs);
} catch (e) { console.log("FAIL " + e.message); bad++; }
ws.close();
process.exit(bad ? 1 : 0);
