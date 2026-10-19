// (ticket 286) Crawling toward us or away, the friend is on the floor, seen short, not crawling up a wall. Away: the back
// seen short (squashed), in front of the hair, the soles showing, standing on its shadow, the hands down on the floor
// beside the legs (0.0.256 had them at the hips). Toward: the face low, a little of the back turned over behind it, no
// legs, the hands lowest, on the shadow. Their collision boxes as drawn (0.0.257): from the side a box under the knees
// and feet, one under the hands, and the body lying between, low; toward or away the body running back into the
// picture. Toward, the knees between the arms, near the hands. Standing, nothing of it. Exits 1 on a failure.
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
      const fb = box(f), handY = Math.max(...poseJoints.arms.map(a => a.H[1])), legsShown = !!f.querySelector('[stroke-dasharray="9 9"]');
      const yb = youBoxes(0, 300).map(b => b.map(n => Math.round(n))), t = yb[yb.length - 1];
      return { squashAt, headAt, flips: flips.length, flipTop: flipTop && Math.round(flipTop), headTop: headTop && Math.round(headTop),
               float: shY === null ? null : Math.round(shY - bottom), h: Math.round(fb.height), crawl: poseJoints.crawl,
               boxes: yb, torsoW: t[1] - t[0], torsoD: t[3] - t[2], soleD: yb[0][3] - yb[0][2], top: t[5], upright: Math.round(youHeights(true).crown) }; };
    const away = look("back"), toward = look("front"), side = look("left");
    B.anim = "none"; B.facing = "front"; draw();
    const hands = facing => { B.anim = "crawl"; B.facing = facing; draw(); const f = document.getElementById("figure").getBoundingClientRect(),
      hs = [...document.querySelectorAll("#figure g")].filter(g => /scale\(1 0\.6\)/.test(g.getAttribute("transform") || "")).map(g => g.getBoundingClientRect());
      const ks = [...document.querySelectorAll("#figure [data-knee]")].map(k => k.getBoundingClientRect()), mid = r => (r.left + r.right) / 2;
      const between = ks.length === 2 && hs.length === 2 && ks.every(k => mid(k) > Math.min(...hs.map(mid)) && mid(k) < Math.max(...hs.map(mid)));
      return { n: hs.length, low: hs.length ? Math.round(100 * (Math.min(...hs.map(r => r.top)) - f.top) / f.height) : null,
               knees: ks.length, between, kneeLow: ks.length ? Math.round(100 * (Math.max(...ks.map(r => r.bottom)) - f.top) / f.height) : null }; };
    const handsAway = hands("back"), handsToward = hands("front");
    B.anim = "none"; B.facing = "front"; draw();
    const yb = youBoxes(0, 300), st = yb[yb.length - 1];
    const stand = { squash: [...document.getElementById("figure").querySelectorAll('[transform^="matrix(1 0 0 0.45"], [transform^="matrix(1 0 0 -"]')].length,
                    crawl: poseJoints.crawl, torsoW: Math.round(st[1] - st[0]), top: Math.round(st[5]), upright: Math.round(youHeights(true).crown) };
    return JSON.stringify({ away, toward, side, stand, handsAway, handsToward }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("away: the back seen short (a squashed body)", r.away.squashAt >= 0, r.away);
  ok("away: the back drawn after the head, so it hides the hanging hair", r.away.squashAt > r.away.headAt && r.away.headAt >= 0, r.away);
  ok("away: on its shadow, not floating (within 12 px)", r.away.float !== null && Math.abs(r.away.float) <= 12, r.away);
  ok("away: both hands flat on the floor, low beside the legs (their tops in the lower half of the friend), not at the hips", r.handsAway.n === 2 && r.handsAway.low > 50, r.handsAway);
  ok("toward: a little of the back turned over behind the head", r.toward.flips > 0, r.toward);
  ok("toward: both hands flat on the floor, lowest", r.handsToward.n === 2 && r.handsToward.low > 70, r.handsToward);
  ok("toward: the knees between the arms, down near the hands (their bottoms in the lowest quarter)", r.handsToward.knees === 2 && r.handsToward.between && r.handsToward.kneeLow > 75, r.handsToward);
  ok("away: no knees drawn between the arms (the legs are drawn whole, nearest)", r.handsAway.knees === 0, r.handsAway);
  ok("toward: the hands on the shadow, not floating (within 12 px)", r.toward.float !== null && Math.abs(r.toward.float) <= 12, r.toward);
  ok("from the side: no squashed or turned-over body", r.side.squashAt < 0 && r.side.flips === 0, r.side);
  const [kb, hb] = r.side.boxes;
  ok("from the side, the collision boxes as drawn: one under the knees and feet, one under the hands, apart", r.side.crawl === "side" && r.side.boxes.length === 3 && (hb[0] > kb[1] || kb[0] > hb[1]), r.side);
  ok("from the side, the body's box lies along the floor (wider than tall) and low (under 60% of their height standing)", r.side.torsoW > r.side.top - r.side.boxes[2][4] && r.side.top < 0.6 * r.side.upright, r.side);
  ok("toward and away, the body's box runs back into the picture (deeper than 3 soles)", r.toward.torsoD > 3 * r.toward.soleD && r.away.torsoD > 3 * r.away.soleD, { toward: r.toward, away: r.away });
  ok("standing: no squashed or turned-over body, and the torso's box up to the crown", r.stand.squash === 0 && !r.stand.crawl && Math.abs(r.stand.top - r.stand.upright) <= 1, r.stand);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
