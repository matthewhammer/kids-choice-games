// (ticket 247, Matthew: "let's also enhance the picture we see out the doors of the tree house that are for bridges, so
// they resemble the target of the bridge, somehow") In every tree house room, six houses and five bridges: through each
// door to a rope bridge, the house it leads to, drawn as it looks outside (its walls' color, its animal's head), inside
// the doorway; the door's first shape still its opening (walkInto measures it); and changing that house's animal changes
// the view. Prints each door's view. Exits 1 on a failure.
//   node doorview247.mjs <devtools port> <url>
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
// (in the page: each bridge door's view in the room now, against the house it leads to)
const VIEWS = `const P = pic.getScreenCTM().inverse(), box = el => { const r = el.getBoundingClientRect(), a = new DOMPoint(r.left, r.top).matrixTransform(P), b = new DOMPoint(r.right, r.bottom).matrixTransform(P); return [a.x, a.y, b.x, b.y].map(Math.round); };
  const B = state.background, hs = treeHouses(B, B.houses, 1);
  return [...bgShown.node.querySelectorAll('.portal[data-to="treeroom"][data-door]')].map(d => { const to = +d.dataset.house, v = d.querySelector("[data-view]"), h = hs.find(u => u.i === to - 1);
    const first = d.querySelector("path, rect"), fb = first ? box(first) : [0, 0, 0, 0], walls = v && v.querySelector("g[color]"), house = walls && walls.parentNode;
    const hb = house ? box(house) : null, m = h && / d="([^"]+)"/.exec(h.look.head), head = !!(m && v && v.innerHTML.includes('d="' + m[1] + '"'));
    return { to, view: v ? +v.dataset.view : null, animal: h && h.animal, walls: walls && walls.getAttribute("color"), want: h && h.look.walls, head, door: fb, house: hb,
      inside: !!hb && hb[0] >= fb[0] - 2 && hb[2] <= fb[2] + 2 && hb[1] >= fb[1] - 2 && hb[3] <= fb[3] + 2 }; });`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const rooms = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = [];
    state.music.mute = true; state.world.at = null;
    for (let i = 1; i <= 6; i++) { Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 5, inside: i, figX: 0, figY: 60, things: [] }); changed(); await w(400);
      out.push({ room: i, doors: (() => { ${VIEWS} })() }); }
    return JSON.stringify(out); })()`));
  const doors = rooms.flatMap(r => r.doors.map(d => ({ room: r.room, ...d })));
  for (const d of doors) console.log(`  room ${d.room}'s door to ${d.to}: the view ${d.view === null ? "none" : `of house ${d.view}, ${d.animal}, walls ${d.walls} (want ${d.want}), head ${d.head ? "theirs" : "not theirs"}, ${d.inside ? "inside" : "OUTSIDE"} the doorway ${JSON.stringify(d.door)}`}`);
  ok("ten bridge doors across the six rooms (each bridge has a door at each end)", doors.length === 10, doors.length);
  ok("through each, the house it leads to: its walls' color and its animal's head", doors.every(d => d.view === d.to && d.walls === d.want && d.head), doors.filter(d => !(d.view === d.to && d.walls === d.want && d.head)));
  ok("each house drawn inside its doorway", doors.every(d => d.inside), doors.filter(d => !d.inside));
  ok("each door's first shape still its opening, with a box on the screen (walkInto measures it)", doors.every(d => d.door[2] - d.door[0] > 10 && d.door[3] - d.door[1] > 40), doors.map(d => d.door));
  // house 2 turned into the cat: room 1's door to it shows the cat
  const cat = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    Object.assign(B, { kind: "treeroom", inside: 1, house2: "cat" }); changed(); await w(400);
    const r = (() => { ${VIEWS} })().find(d => d.to === 2); delete B.house2; changed(); return JSON.stringify(r || null); })()`));
  console.log(`  house 2 made the cat: room 1's door to it: ${JSON.stringify(cat)}`);
  ok("house 2's animal changed to the cat: the view through room 1's door to it changes with it", !!cat && cat.animal === "cat" && cat.walls === cat.want && cat.head, cat);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
