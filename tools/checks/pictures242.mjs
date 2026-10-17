// (ticket 242, Matthew: "let's not place any pictures in the tree house behind any ladders, or other furniture. For
// ladders esp, we can easily click on the picture when we meant the ladder, or vice versa -- best just to separate them
// on the screen more") In every tree house room, at the tree's most (6 houses, 6 ladders, 6 bridges), each picture on
// the wall clear of what stands in front of it (the furniture, the trunk, the side doors), and farther still from a
// ladder or a hatch; measured from the drawing. Prints each room's pictures. Exits 1 on a failure.
//   node pictures242.mjs <devtools port> <url>
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
    const P = () => pic.getScreenCTM().inverse(), k = (SCENE.bottom - SCENE.top) / 700;
    const box = node => { const q = boxThrough(node.getBBox(), P().multiply(node.getScreenCTM())); return [q.x, q.y, q.x + q.width, q.y + q.height]; };
    const gap = (a, b) => Math.max(a[0] - b[2], b[0] - a[2], a[1] - b[3], b[1] - a[3]);   // (how far apart two boxes are; under 0, overlapping)
    for (let i = 1; i <= 6; i++) {
      Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: i, figX: 0, figY: 60, things: [] }); changed(); await w(500); changed(); await w(400);
      const pics = [...bgShown.node.querySelectorAll(".portal")].filter(p => p.querySelector(":scope > svg, :scope > image") && !p.closest("[data-obj]")).map(box);
      // (each piece by itself: an object's own box can span the room, as the side doors' does)
      const stand = bgShown.objs.filter(o => o.name === "hatch" || o.name === "ladder up" || o.name === "side doors" || STANDING.has(objBase(o.name)))
        .flatMap(o => [...o.node.querySelectorAll("rect, path, polygon, polyline, line, ellipse, circle, use, image, text")].map(sh => { try { return { name: o.name, r: box(sh), ladder: o.name === "hatch" || o.name === "ladder up" }; } catch (e) { return null; } })
        .filter(x => x && x.r[2] > x.r[0] && x.r[3] > x.r[1]));
      const near = [];
      for (const p of pics) for (const s of stand) { const d = gap(p, s.r) / k; if (d < (s.ladder ? 30 : 0) && !near.some(x => x.with === s.name)) near.push({ pic: p.map(Math.round), with: s.name, apart: Math.round(d) }); }
      out.push({ room: i, style: B["room" + i] || HOUSE_ROOMS[i - 1], pics: pics.length, near });
    }
    return JSON.stringify(out); })()`));
  for (const r of rooms) console.log(`  room ${r.room} (${r.style}): ${r.pics} picture${r.pics === 1 ? "" : "s"}${r.near.length ? ", too near: " + r.near.map(x => x.with + " " + x.apart).join(", ") : ""}`);
  ok("every tree house room: each picture clear of its furniture, trunk and side doors, and well apart from its ladders and hatch", rooms.every(r => !r.near.length), rooms.filter(r => r.near.length));
  ok("pictures still hang: at least one in most rooms", rooms.filter(r => r.pics > 0).length >= 4, rooms.map(r => r.pics));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
