// (ticket 286) Crawling toward us or away, the friend is on the floor, seen short, not crawling up a wall. Away: the back
// seen short (squashed), in front of the hair, the soles showing, standing on its shadow. Toward: the face low, the
// shirt and the pants turned over behind it as the back and the raised seat (above the head), the hands lowest, on the
// shadow. From the side, and standing, nothing of it. Exits 1 on a failure.
//   node crawl286.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.body;
    state.music.mute = true; state.world.at = null; climb = null; state.background.kind = "emptyroom"; changed(); await w(400);
    const look = facing => { B.anim = "crawl"; B.facing = facing; draw();
      const f = document.getElementById("figure"), kids = [...f.children], shadow = kids.find(k => k.tagName === "ellipse" && k.getAttribute("fill") === "#000");
      const tf = k => k.getAttribute("transform") || "", box = k => k.getBoundingClientRect();
      const bottom = Math.max(...kids.filter(k => k !== shadow).map(k => box(k).bottom).filter(Number.isFinite));
      const sh = shadow ? box(shadow) : null, shY = sh ? (sh.top + sh.bottom) / 2 : null;
      const squashAt = kids.findIndex(k => /matrix\\(1 0 0 0\\.45/.test(tf(k)) && k.querySelector("polygon, path") && box(k).height > 10);
      const flips = kids.filter(k => /matrix\\(1 0 0 -0\\.5/.test(k.innerHTML.slice(0, 400)) || /matrix\\(1 0 0 -/.test(tf(k)) || k.querySelector('[transform^="matrix(1 0 0 -"]'));
      const faces = kids.filter(k => /^translate\\([-0-9.]+ [-0-9.]+\\) scale\\(/.test(tf(k)));
      const headTop = faces.length ? Math.min(...faces.map(k => box(k).top)) : null, headAt = faces.length ? kids.indexOf(faces[faces.length - 1]) : -1;
      const flipTop = flips.length ? Math.min(...flips.map(k => box(k).top)) : null;
      return { squashAt, headAt, flips: flips.length, flipTop: flipTop && Math.round(flipTop), headTop: headTop && Math.round(headTop),
               float: shY === null ? null : Math.round(shY - bottom), h: Math.round(box(f).height), seat: !!f.querySelector('clipPath[id^="crawl-seat"]') }; };
    const away = look("back"), toward = look("front"), side = look("left");
    B.anim = "none"; B.facing = "front"; draw();
    const stand = { squash: [...document.getElementById("figure").querySelectorAll('[transform^="matrix(1 0 0 0.45"], [transform^="matrix(1 0 0 -"]')].length };
    return JSON.stringify({ away, toward, side, stand }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("away: the back seen short (a squashed body)", r.away.squashAt >= 0, r.away);
  ok("away: the back drawn after the head, so it hides the hanging hair", r.away.squashAt > r.away.headAt && r.away.headAt >= 0, r.away);
  ok("away: on its shadow, not floating (within 12 px)", r.away.float !== null && Math.abs(r.away.float) <= 12, r.away);
  ok("toward: the shirt and pants turned over behind the head, the seat clipped round", r.toward.flips > 0 && r.toward.seat, r.toward);
  ok("toward: the raised seat shows above the head", r.toward.flipTop !== null && r.toward.flipTop < r.toward.headTop, r.toward);
  ok("toward: the hands on the shadow, not floating (within 12 px)", r.toward.float !== null && Math.abs(r.toward.float) <= 12, r.toward);
  ok("from the side: no squashed or turned-over body", r.side.squashAt < 0 && r.side.flips === 0 && !r.side.seat, r.side);
  ok("standing: no squashed or turned-over body", r.stand.squash === 0, r.stand);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
