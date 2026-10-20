// (ticket 442) Beards in 💇 Hair: each of the four styles (short, full, long, goatee) drawn facing us and in profile, none
// from behind, longer in that order below the chin (a goatee short); "auto" the hair's colour; the moustache on and off;
// the wizard and the gnome man put on a white beard when the friend has none, and take it off again on leaving the
// costume (or the gnome becoming a woman), but keep one the player chose; the Hair tab's rows. Exits 1 on a failure.
//   node beard442.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { styles: {}, give: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("costume", "kind", "none"); set("hair", "color", "#6f4e37"); set("hair", "beardShade", "#c0612b");
    const P = () => pic.getScreenCTM().inverse();
    const beardBox = () => { const els = [...document.querySelectorAll('#figure path')].filter(e => e.getAttribute("fill") === beardShade(state.hair)); if (!els.length) return null;
      const bs = els.map(e => { const q = e.getBoundingClientRect(), a = new DOMPoint(q.left, q.top).matrixTransform(P()), c = new DOMPoint(q.right, q.bottom).matrixTransform(P()); return [a.x, a.y, c.x, c.y]; });
      return { n: els.length, bottom: Math.max(...bs.map(b => b[3])) }; };
    for (const style of ["short", "full", "long", "goatee"]) { set("hair", "beard", style); const v = {};
      for (const facing of ["front", "right", "back"]) { state.body.facing = facing; changed(); await w(80); v[facing] = beardBox(); }
      out.styles[style] = v; }
    state.body.facing = "front"; set("hair", "beard", "full");
    set("hair", "moustache", false); changed(); await w(60); const noMo = beardBox(); set("hair", "moustache", true); changed(); await w(60); const mo = beardBox();
    out.moustache = [noMo && noMo.n, mo && mo.n];
    set("hair", "beardShade", "auto"); out.autoIsHair = beardShade(state.hair) === state.hair.color;
    // the costumes: put on when none, taken off on leaving; one the player chose stays
    set("hair", "beard", "none"); set("costume", "gnomeWho", "man"); set("costume", "kind", "wizard"); out.give.wizard = [state.hair.beard, state.hair.beardShade];
    set("costume", "kind", "gnome"); out.give.gnome = [state.hair.beard, state.hair.beardShade];
    set("costume", "gnomeWho", "woman"); out.give.woman = state.hair.beard;
    set("costume", "gnomeWho", "man"); set("hair", "beard", "goatee"); set("costume", "kind", "none"); out.give.kept = state.hair.beard;
    set("hair", "beard", "none");
    tab = TABS.findIndex(t => t[1] === "hair"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rowsNone = ["beard", "beardShade", "moustache"].map(k => shown(k) ? 1 : 0).join("");
    set("hair", "beard", "short"); await w(150); out.rowsOn = ["beard", "beardShade", "moustache"].map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const S = r.styles;
  ok("every style drawn facing us and in profile, none from behind", Object.values(S).every(v => v.front && v.right && !v.back), S);
  ok("longer in turn below the chin: goatee and short, then full, then long", S.long.front.bottom - S.full.front.bottom > 0.5 * (S.full.front.bottom - S.short.front.bottom) && S.full.front.bottom > S.short.front.bottom && S.full.front.bottom > S.goatee.front.bottom, S);
  ok("the moustache on and off", r.moustache[1] === r.moustache[0] + 1, r.moustache);
  ok("“auto” is the hair’s colour", r.autoIsHair, r.autoIsHair);
  ok("the wizard puts on a long white beard, the gnome man a full one; the gnome woman none", r.give.wizard[0] === "long" && r.give.wizard[1] === "#f4f1ea" && r.give.gnome[0] === "full" && r.give.woman === "none", r.give);
  ok("a beard the player chose stays when the costume comes off", r.give.kept === "goatee", r.give);
  ok("the Hair tab: the beard's colour and moustache only with a beard", r.rowsNone === "100" && r.rowsOn === "111", [r.rowsNone, r.rowsOn]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
