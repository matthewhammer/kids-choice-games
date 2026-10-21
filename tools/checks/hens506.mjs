// (ticket 506, for M; Matthew: "chickens -- already in stable 30 in stable.", then "just release and let the kids decide")
// The stable's hens, as many as its room's 🐔 setting says, 0 to 30, two to start with. The setting is the stable's own
// (in its room's box, shown only for a stable); at 0 no hens; at 2 the stable exactly as before (the two hens where
// they always stood, drawn as they were, nothing else changed, and a save from before the setting the same); at 30,
// thirty hens in their looks by turn, each its own object at its feet, those past the first two on the floor clear of the
// trough, its buckets, the hay heap, the ladder and the side doors (the first two stand where they always stood), all off
// the stalls' doors, away from where the friend arrives, inside the picture, no two on one spot and none much over
// another; each pecking and walking its own way in, with the music's LFOs, three animations a hen at most; one more hen
// leaving the others where they were. Frame rates with 2 and 30 hens, and how long the room takes to draw afresh (as a
// mixing-board LFO knob's step draws it) with each, are recorded, not a verdict. Exits 1 on a failure.
//   node hens506.mjs <devtools port> <url>
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
    // (GitHub's computer measures slow, and a slow computer's scenery is held still: keep it moving, as birds351 does)
    slowFlag = false; PERF.slowMoving = true; state.music.mute = true; state.world.at = null; state.body.sit = false;
    // (castle N's room 6 a stable, its four side doors each leading somewhere, so all four are drawn)
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "stable", castleRoom: 6, castleHallDoors6N: 4, figX: 0, figY: 40, things: [], objectsOff: {} });
    B[hallDoorKey("N", 6, 1)] = "5";
    const key = stableHensKey(6, "N");
    // the setting: in the room's box, 0 to 30, 2 to start with, shown in a stable and not in a king's room
    const find = (t, k) => Array.isArray(t) ? (t[1] === k ? t : t.reduce((a, x) => a || (Array.isArray(x) ? find(x, k) : null), null)) : null;
    const row = find(TABS, key), box = find(TABS, "castleRoomBox6N");
    const setting = { row: row && row.slice(0, 5), inBox: !!box && !!find(box, key), dflt: DEFAULTS.background[key],
                      stable: SHOWN_WHEN["background." + key](B), king: SHOWN_WHEN["background." + key]({ ...B, castleRoom6N: "king" }) };
    // (the room drawn afresh, held still at 0, no kept parts: its markup; and the stable's frame, c, kept from its drawing)
    let cap = null; const orig = ROOM_KINDS.stable.draw; ROOM_KINDS.stable.draw = (c, K, r) => { cap = c; return orig(c, K, r); };
    const room = v => { if (v === null) delete B[key]; else B[key] = v; holdStill(0); PARTS.clear(); READS.clear();
      return backgroundSvg("castleroom", SCENE.left, SCENE.top, -SCENE.left, SCENE.bottom, SCENE.ground, sceneOpts(B)).replaceAll(SEP, ""); };
    // (the second 30 with the kept spots let go, so it is searched for again: the same, seeded)
    const s2 = room(2), sOld = room(null), s0 = room(0), s30 = room(30), s30b = (henSpotsMemo.clear(), room(30)), s29 = room(29);
    // (recorded: the room drawn afresh, the mean of ten, with 2 hens and with 30; the hens' spots are kept, so 30 costs little more)
    const drawMs = v => { room(v); const t0 = performance.now(); for (let i = 0; i < 10; i++) room(v); return +((performance.now() - t0) / 10).toFixed(1); };
    const draws = [drawMs(2), drawMs(30)], kept30 = room(30) === s30;
    ROOM_KINDS.stable.draw = orig;
    // (the two hens as the stable drew them before ticket 506: its four lines, here as they were)
    const L = stablePlaces(cap), { k } = cap;
    const old = [[-0.42 * L.bw, -0.2, 1, 0], [0.36 * L.bw, -0.3, -1, 1]].map(([X, z, sd, i]) => { const [hx, hy] = L.at(X, L.floor, z), s = k / (1 + z) * 0.9;
      return obj(i ? "hen, white" : "hen, brown", hy, henSvg(cap.o, hx, hy, s, sd, i)); }).join("").replaceAll(SEP, "");
    // (each count's hens, as objects in the markup: names, depths, their animations, where each stands and walks to)
    const parse = s => { const d = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + s + '</svg>', "image/svg+xml");
      return [...d.querySelectorAll('[data-obj^="hen"]')].map(g => { const walk = g.querySelector('animateTransform[type="translate"]'), at = g.querySelector('[data-hen] > g[transform]');
        return { name: g.dataset.obj, z: +g.dataset.z, anims: g.querySelectorAll("animate, animateTransform").length, at: at ? at.getAttribute("transform") : null,
                 go: walk ? +walk.getAttribute("values").split(";")[2].split(" ")[0] : 0, walkBegin: walk ? walk.getAttribute("begin") : null, walkDur: walk ? walk.getAttribute("dur") : null,
                 peckBegin: (g.querySelector('animateTransform[type="rotate"]') || { getAttribute: () => null }).getAttribute("begin") }; }); };
    const h0 = parse(s0), h2 = parse(s2), h30 = parse(s30), h29 = parse(s29);
    // (the room less its hens, at 30, as at 0: the hens add nothing else)
    const less = s => { const d = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + s + '</svg>', "image/svg+xml"); if (d.querySelector("parsererror")) return "unreadable " + Math.random();
      d.querySelectorAll('[data-obj^="hen"]').forEach(g => g.remove()); return d.documentElement.innerHTML; };
    const slowDur = (lfoNow(sceneLfoName(B, "slow")) || { dur: 0 }).dur.toFixed(4) + "s";
    const wander = [sceneLfoThings({ ...B, [key]: 2 }).slow, sceneLfoThings({ ...B, [key]: 30 }).slow];
    // the live picture at 30: each hen at rest (its animations taken out), its box, and as far as it walks; what it must keep off
    B[key] = 30; stillAt = null; picGap = null; { const p = document.getElementById("pic"); if (p && p.unpauseAnimations) p.unpauseAnimations(); } changed(); await w(900);
    const sc = bgShown.node, bb = el => { const b = el.getBBox(); return { xa: b.x, xb: b.x + b.width, ya: b.y, yb: b.y + b.height }; };
    const live = [...sc.querySelectorAll('[data-obj^="hen"]')].map(g => { const wk = g.querySelector('animateTransform[type="translate"]'), go = wk ? +wk.getAttribute("values").split(";")[2].split(" ")[0] : 0;
      g.querySelectorAll("animate, animateTransform").forEach(a => a.remove()); const b = bb(g); return { name: g.dataset.obj, z: +g.dataset.z, ...b, lane: { ...b, xa: b.xa + Math.min(0, go), xb: b.xb + Math.max(0, go) } }; });
    const keep = ["water trough", "buckets", "hay heap", "ladder"].map(nm => sc.querySelector('[data-obj="' + nm + '"]')).filter(Boolean).map(g => ({ name: g.dataset.obj, ...bb(g) }))
      .concat([...sc.querySelectorAll('[data-obj^="door"]')].map(g => ({ name: g.dataset.obj, ...bb(g) })));
    const meets = (a, b) => a.xa < b.xb - 1 && b.xa < a.xb - 1 && a.ya < b.yb - 1 && b.ya < a.yb - 1;
    // (the hens past the first two only: those two stand where they always stood, the brown one at the buckets' rim)
    const onThings = live.filter(h => /^hen \d+,/.test(h.name)).flatMap(h => keep.filter(t => meets(h.lane, t)).map(t => h.name + " on " + t.name));
    const stallZ = live.map(h => 1 / ((h.z - L.vy) / (L.floor - L.vy)) - 1);
    const feet = { xa: -45 * k, xb: 45 * k, ya: SCENE.ground + 15 * k, yb: SCENE.ground + 65 * k };
    const onFriend = live.filter(h => meets(h.lane, feet)).map(h => h.name);
    const off = live.filter(h => h.lane.xa < SCENE.left || h.lane.xb > -SCENE.left || h.yb > SCENE.bottom + 4).map(h => h.name);
    // (no two on one spot; how much the most overlapped two overlap, as a share of the smaller's box, at rest)
    let worst = 0, near = Infinity;
    for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) { const A = live[a], C = live[b];
      const ix = Math.max(0, Math.min(A.xb, C.xb) - Math.max(A.xa, C.xa)), iy = Math.max(0, Math.min(A.yb, C.yb) - Math.max(A.ya, C.ya)), ar = s => (s.xb - s.xa) * (s.yb - s.ya);
      worst = Math.max(worst, ix * iy / Math.min(ar(A), ar(C))); near = Math.min(near, Math.hypot((A.xa + A.xb - C.xa - C.xb) / 2, A.z - C.z)); }
    // (frame rates, recorded: two seconds standing in the stable with 2 hens, then with 30)
    const fps = async v => { B[key] = v; changed(); await w(800); let f = 0, t0 = performance.now(); await new Promise(res => { const st = () => { f++; if (performance.now() - t0 < 2000) requestAnimationFrame(st); else res(); }; requestAnimationFrame(st); }); return Math.round(f / ((performance.now() - t0) / 1000)); };
    const rates = [await fps(2), await fps(30)];
    return JSON.stringify({ setting, same2: s2 === sOld, has2: s2.includes(old), rest2: s2.replace(old, "") === s0, rest30: less(s30) === less(s0), again: s30 === s30b,
      h0, h2: h2.map(h => [h.name, h.anims]), h30, kept29: h29.every(a => h30.some(b => b.name === a.name && b.at === a.at && b.z === a.z)), slowDur, wander,
      live: live.length, onThings, stallZ: Math.max(...stallZ), onFriend, off, worst, near, rates, draws, kept30 }); })()`));
  const H = r.h30, extra = H.filter(h => /^hen \d+,/.test(h.name)), looks = ["brown", "white", "black"].map(c => H.filter(h => h.name.endsWith(", " + c)).length);
  ok("🐔 hens is a setting in the stable room's own box, 0 to 30, two to start with", r.setting.inBox && r.setting.row && r.setting.row[0] === "range" && r.setting.row[3] === 0 && r.setting.row[4] === 30 && r.setting.dflt === 2, r.setting);
  ok("it shows in a stable, not in a king's room", r.setting.stable === true && r.setting.king === false, r.setting);
  ok("at 0, no hens", r.h0.length === 0, r.h0);
  ok("at 2, the stable's two hens, the brown and the white, each pecking", r.h2.length === 2 && r.h2[0][0] === "hen, brown" && r.h2[1][0] === "hen, white" && r.h2.every(([, a]) => a === 1), r.h2);
  ok("at 2, the two hens are drawn where and as they were before", r.has2, r.has2);
  ok("at 2, the rest of the stable is the stable at 0: the same as before", r.rest2, r.rest2);
  ok("a save from before the setting draws the same stable as 2", r.same2, r.same2);
  ok("at 30, thirty hens, each its own object", H.length === 30 && new Set(H.map(h => h.name)).size === 30 && r.live === 30, H.map(h => h.name));
  ok("in their looks by turn: ten brown, ten white, ten black", looks.join() === "10,10,10", looks);
  ok("the hens add nothing else to the stable", r.rest30, r.rest30);
  ok("drawn the same each time (seeded)", r.again, r.again);
  ok("the kept spots draw the same 30 hens as a fresh search", r.kept30, r.kept30);
  ok("one more hen leaves the others where they were (29 within 30)", r.kept29, r.kept29);
  ok("each hen past the first two pecks, walks and turns: three animations, no more", extra.length === 28 && extra.every(h => h.anims === 3 && h.go !== 0), extra.map(h => [h.name, h.anims, h.go]));
  ok("their walks keep time with the slow LFO", extra.every(h => h.walkDur === r.slowDur), [r.slowDur, extra.map(h => h.walkDur)]);
  ok("each its own way in: walks and pecks begun at many different points", new Set(extra.map(h => h.walkBegin)).size >= 20 && new Set(extra.map(h => h.peckBegin)).size >= 8,
     [new Set(extra.map(h => h.walkBegin)).size, new Set(extra.map(h => h.peckBegin)).size]);
  ok("the mixing board names the hens wandering with 30, not with 2", !/🐔/.test(r.wander[0] || "") && /🐔/.test(r.wander[1] || ""), r.wander);
  ok("no hen past the first two stands or walks on the trough, its buckets, the hay heap, the ladder or a side door", r.onThings.length === 0, r.onThings);
  ok("none in front of the stalls' doors (each 0.1 or more toward us)", r.stallZ <= -0.1, r.stallZ);
  ok("none where the friend arrives", r.onFriend.length === 0, r.onFriend);
  ok("all inside the picture", r.off.length === 0, r.off);
  ok("no two on one spot, none much over another (at most 60% of a hen's box)", r.near > 10 && r.worst < 0.6, { near: r.near, worst: r.worst });
  console.log(`(recorded) frames a second standing in the stable: 2 hens ${r.rates[0]}, 30 hens ${r.rates[1]}`);
  console.log(`(recorded) the room drawn afresh: 2 hens ${r.draws[0]} ms, 30 hens ${r.draws[1]} ms`);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
