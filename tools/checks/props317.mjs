// (ticket 317) The trap room's helmet (a knight's helm: its eye slit, breathing holes, rivets, a plume), sword (blade,
// fuller, guard, wrapped grip, pommel) and levers (a riveted panel, its slot and hub) in detail; a lever's shine, the
// room's light on it, as big as ✨ says (none at 0), flickering as the torches do unless 🔥 is 0; a placed lever too.
// Exits 1 on a failure.
//   node props317.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; if (B.seat) standUp(); state.body.anim = "none";
    B.kind = "castleroom"; B.castle = "N"; B.castleRoom = castleOf(B).rooms.indexOf("trap") + 1; B.figX = 300; B.figY = 120;
    const look = async more => { Object.assign(B, more); changed(); await w(500); draw();
      const one = sel => document.querySelector("#bg " + sel), parts = el => el ? el.querySelectorAll("*").length : 0, lev = one('[data-lever="L"]');
      return { helmet: parts(one('[data-obj="helmet"]')), plume: !!one('[data-obj="helmet"] path[fill="#c0392b"]'), sword: parts(one('[data-obj="sword"]')),
               rivets: lev ? lev.querySelectorAll('circle[fill="#9a9aa8"]').length : 0, glow: lev ? lev.querySelectorAll('circle[opacity="0.18"]').length : 0,
               flicker: lev ? lev.querySelectorAll("animate").length : 0 }; };
    const on = await look({ leverShine: 100, leverFlicker: 60 }), off = await look({ leverShine: 0 }), still = await look({ leverShine: 100, leverFlicker: 0 });
    // (a placed lever, in an empty room)
    B.kind = "emptyroom"; B.things = [{ kind: "lever", x: 0, z: SCENE.ground + 40, uid: "l1" }]; B.leverShine = 100; B.leverFlicker = 60; changed(); await w(500); draw();
    const placed = document.querySelectorAll('#bg [data-obj^="lever"] circle[opacity="0.18"]').length;
    B.things = []; B.leverShine = 100; B.leverFlicker = 60; changed();
    return JSON.stringify({ on, off, still, placed }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the helmet in detail (twenty and more parts), with its plume", r.on.helmet >= 20 && r.on.plume, r.on);
  ok("the sword in detail (ten and more parts)", r.on.sword >= 10, r.on);
  ok("the lever's panel riveted (four rivets and a hub)", r.on.rivets >= 5, r.on);
  ok("its shine: a glow on its knob, none at ✨ 0", r.on.glow >= 1 && r.off.glow === 0, { on: r.on, off: r.off });
  ok("flickering, unless 🔥 is 0", r.on.flicker >= 1 && r.still.flicker === 0, { on: r.on, still: r.still });
  ok("a placed lever shines too", r.placed >= 1, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
