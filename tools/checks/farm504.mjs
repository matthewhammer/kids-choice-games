// (ticket 504, for M; Matthew: "More animals as placeable objects with animation: * cows (4 poses) * pigs (4 poses)", and
// "chickens -- already in stable 30 in stable.") The 🐄 farm animals: a cow, a pig and a chicken, in a group of their own;
// each pose of each drawn and moving, each pose its own drawing and each coat its own colours; sized against the friend
// at their depth (a cow to about their chest, horns and all a little over; a pig to the knee and a bit; a chicken
// shin-high); in the way, as a bench is; timed by the music's LFOs, two of a kind with different seeds each its own way
// in (never in step); mirrored, the same size facing the other way; and the stable's own hens still there, as they were.
// Exits 1 on a failure.
//   node farm504.mjs <devtools port> <url>
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
    const kinds = { cow: [COW_POSES, COW_COATS], pig: [PIG_POSES, PIG_COATS], chicken: [HEN_POSES, HEN_COATS] };
    const group = Object.keys(kinds).map(k => THING_KINDS[k] && THING_KINDS[k].group), groupNamed = THING_GROUPS.some(([g]) => g === "animals");
    const params = Object.keys(kinds).map(k => thingParams(k).filter(([p]) => p === "pose" || p === "coat").map(([p, , how, opts]) => [p, how, opts.length]));
    // (every pose of every animal, its coats in turn, all at the friend's depth, so each is sized as the friend is there)
    Object.assign(B, { kind: "forest", figX: -360, figY: 40, seat: null, things: [] }); changed(); await w(600);
    const z = SCENE.ground + B.figY, T = [];
    Object.entries(kinds).forEach(([kind, [poses, coats]], a) => poses.forEach(([pose], j) =>
      T.push({ kind, x: -220 + j * 170, z: z + a * 4, seed: 700 + a * 10 + j, size: 100, mirror: false, ...structuredClone(THING_DEFAULTS[kind]), pose, coat: coats[j][0] })));
    B.things = T; changed(); await w(900);
    const crown = youHeights(true).crown;
    const els = [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]], b = el.getBBox();
      return { kind: t.kind, pose: t.pose, w: Math.round(b.width), up: Math.round(t.z - b.y), anims: el.querySelectorAll("animate, animateTransform").length }; });
    const solids = solidsHere().map(o => o.name).filter(s => /^(cow|pig|chicken) \\d/.test(s));
    // (each pose its own drawing, each coat its own colours: the same seed, the animations left out)
    const still = s => s.replace(/<animate\\w*[^>]*\\/>/g, "");
    const draw = (kind, pose, coat, seed, mirror = false) => thingSvg(B, { kind, x: 0, z, seed, size: 100, mirror, pose, coat }, 0);
    const poseKinds = Object.entries(kinds).map(([kind, [poses, coats]]) => [kind, new Set(poses.map(([p]) => still(draw(kind, p, coats[0][0], 5)))).size, poses.length]);
    const coatKinds = Object.entries(kinds).map(([kind, [poses, coats]]) => [kind, new Set(coats.map(([c]) => still(draw(kind, poses[0][0], c, 5)))).size, coats.length]);
    // (with the music's LFOs: the same pose with two seeds, each its own way into its animations)
    const begins = s => [...s.matchAll(/begin="([^"]+)"/g)].map(m => m[1]).join();
    const apart = Object.entries(kinds).map(([kind, [poses]]) => poses.map(([p]) => begins(draw(kind, p, "", 11)) !== begins(draw(kind, p, "", 12)) && begins(draw(kind, p, "", 11)) !== ""));
    // (mirrored: the same size, facing our left)
    B.things = [{ kind: "cow", x: -100, z, seed: 9, size: 100, mirror: false, pose: "stand", coat: "holstein" }, { kind: "cow", x: 200, z, seed: 9, size: 100, mirror: true, pose: "stand", coat: "holstein" }];
    changed(); await w(600);
    const mir = [...bgShown.node.querySelectorAll(".thing")].map(el => { const b = el.getBBox(); return [Math.round(b.width), Math.round(b.height), /scale\\(-/.test(el.innerHTML)]; });
    // (the stable's own two hens, untouched)
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "stable", castleRoom: 6, figX: 0, figY: -92, things: [] }); changed(); await w(800);
    const hens = [...bgShown.node.querySelectorAll('[data-obj^="hen"]')].map(el => el.dataset.obj);
    return JSON.stringify({ group, groupNamed, params, crown, els, solids, poseKinds, coatKinds, apart, mir, hens, lfo: ["cow", "pig", "chicken"].map(k => LFO_THINGS.has(k)) }); })()`));
  const E = r.els, of = k => E.filter(e => e.kind === k), standUp = k => (of(k).find(e => e.pose === "stand") || {}).up / r.crown;
  ok("the cow, the pig and the chicken are 🐄 farm animals, a group of their own", r.group.every(g => g === "animals") && r.groupNamed, r.group);
  ok("each has a pose and a coat to choose, four of each", r.params.every(p => p.length === 2 && p.every(([, how, k]) => how === "choice" && k === 4)), r.params);
  ok("every pose of every animal is drawn and moves", E.length === 12 && E.every(e => e.w > 15 && e.up > 15 && e.anims >= 1), E);
  ok("each pose is its own drawing", r.poseKinds.every(([, k, of]) => k === of), r.poseKinds);
  ok("each coat its own colours", r.coatKinds.every(([, k, of]) => k === of), r.coatKinds);
  ok("a standing cow is about as tall as the friend's chest (its horns a little over)", standUp("cow") > 0.5 && standUp("cow") < 0.8, { cow: standUp("cow"), crown: r.crown });
  ok("a standing pig comes to the knee and a bit", standUp("pig") > 0.15 && standUp("pig") < 0.3, { pig: standUp("pig"), crown: r.crown });
  ok("a standing chicken is shin-high", standUp("chicken") > 0.08 && standUp("chicken") < 0.2, { chicken: standUp("chicken"), crown: r.crown });
  ok("each one stands in the way, as a bench does", r.solids.length === 12, r.solids);
  ok("their drawings follow the LFOs (in LFO_THINGS)", r.lfo.every(Boolean), r.lfo);
  ok("two of a kind with different seeds move each its own way in, in every pose", r.apart.every(a => a.every(Boolean)), r.apart);
  ok("mirrored, a cow is the same size facing the other way", r.mir.length === 2 && Math.abs(r.mir[0][0] - r.mir[1][0]) <= 1 && Math.abs(r.mir[0][1] - r.mir[1][1]) <= 1 && !r.mir[0][2] && r.mir[1][2], r.mir);
  ok("the stable's own two hens are still there", r.hens.length === 2, r.hens);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
