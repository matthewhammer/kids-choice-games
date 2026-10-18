// (ticket 244, Matthew: "Each tree house in the complex has a sign saying its number and type. Below that, on that sign,
// let's include a graphic that serves as a map for the person in the room -- it looks like the treehouse, but in a few
// dark colors (not colorful) ... The sign indicates, with a bright white circle, which of the 6 possible houses in the
// map graphic is the current house") In every tree house room, at six houses and at four: the sign's map, inside the
// sign and the sign inside the picture, a numbered house for each house in the tree, drawn in dark colors only, and a
// white ring round this house's number, no other's. Prints each room's sign. Exits 1 on a failure.
//   node signmap244.mjs <devtools port> <url>
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
  const rooms = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = [];
    state.music.mute = true; state.world.at = null;
    const P = () => pic.getScreenCTM().inverse();
    const box = node => { const q = boxThrough(node.getBBox(), P().multiply(node.getScreenCTM())); return [q.x, q.y, q.x + q.width, q.y + q.height].map(Math.round); };
    const within = (a, b, slack = 1) => a[0] >= b[0] - slack && a[1] >= b[1] - slack && a[2] <= b[2] + slack && a[3] <= b[3] + slack;
    // (how dark a color is: its brightness, 0 to 255; a named or unset one counted as not dark)
    const lum = col => { const m = /^#([0-9a-f]{6})/i.exec(col || ""); if (!m) return 999; const v = parseInt(m[1], 16); return 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255); };
    for (const houses of [6, 4]) for (let i = 1; i <= houses; i++) {
      Object.assign(B, { kind: "treeroom", houses, ladders: houses, bridges: houses === 6 ? 5 : 3, inside: i, figX: 0, figY: 60, things: [] }); changed(); await w(500);
      const sign = bgShown.node.querySelector('[data-obj="house sign"]'), map = sign && sign.querySelector(".tree-map");
      if (!map) { out.push({ houses, room: i, none: true }); continue; }
      // (the map as far as its clip shows it: the trunk goes on up, cut off)
      const cr = map.querySelector("clipPath rect"), cut = boxThrough({ x: +cr.getAttribute("x"), y: +cr.getAttribute("y"), width: +cr.getAttribute("width"), height: +cr.getAttribute("height") }, P().multiply(map.getScreenCTM()));
      const all = box(map), board = box(sign.querySelector(":scope rect"));
      const mapBox = [Math.max(all[0], cut.x), Math.max(all[1], cut.y), Math.min(all[2], cut.x + cut.width), Math.min(all[3], cut.y + cut.height)].map(Math.round);
      const nums = [...map.querySelectorAll("text")].map(t => ({ n: +t.textContent, r: box(t) }));
      const rings = [...map.querySelectorAll("circle[data-here]")], white = rings.find(c => c.getAttribute("stroke") === "#ffffff");
      const ring = white && box(white), mine = nums.find(t => t.n === i);
      // (a number ringed: its middle well inside the ring)
      const mid = r => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], ringed = ring ? nums.filter(t => { const [ax, ay] = mid(t.r), [cx, cy] = mid(ring); return Math.hypot(ax - cx, ay - cy) < 0.8 * (ring[2] - ring[0]) / 2; }).map(t => t.n) : [];
      // (every other piece of the map, dark: its fills and strokes)
      const colors = new Set(); for (const el of map.querySelectorAll("*")) { if (el.closest("defs") || el.tagName === "text" || el === white || el.tagName === "g") continue;
        for (const a of ["fill", "stroke"]) { const v = el.getAttribute(a); if (v && v !== "none") colors.add(v); } }
      const light = [...colors].filter(c => lum(c) > 80);
      const S = [SCENE.left, SCENE.top, -SCENE.left, SCENE.bottom];
      out.push({ houses, room: i, board, mapBox, nums: nums.map(t => t.n).sort(), ring, ringed, mine: !!mine, colors: [...colors], light,
        inBoard: within(mapBox, board, 2), inPic: within(board, S, 0) });
    }
    return JSON.stringify(out); })()`));
  for (const r of rooms) console.log(`  ${r.houses} houses, room ${r.room}: ${r.none ? "no map" : `sign ${JSON.stringify(r.board)}, map ${JSON.stringify(r.mapBox)}, houses ${r.nums.join("")}, ringed ${r.ringed.join("") || "none"}, colors ${r.colors.join(" ")}`}`);
  ok("every room's sign has its map", rooms.every(r => !r.none), rooms.filter(r => r.none));
  const has = rooms.filter(r => !r.none);
  ok("the map a numbered house for each house in the tree, no more", has.every(r => r.nums.join() === [...Array(r.houses)].map((_, j) => j + 1).join()), has.map(r => [r.houses, r.room, r.nums]));
  ok("a white ring round this house's number, and no other's", has.every(r => r.ring && r.ringed.length === 1 && r.ringed[0] === r.room), has.map(r => [r.houses, r.room, r.ringed]));
  ok("the map drawn in dark colors only (its numbers and ring apart)", has.every(r => !r.light.length && r.colors.length >= 3 && r.colors.length <= 6), has.map(r => r.colors));
  ok("the map on the sign, and the sign inside the picture", has.every(r => r.inBoard && r.inPic), has.filter(r => !r.inBoard || !r.inPic));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
