// (ticket 252, Matthew: "for each tree-house trap door (defined by two houses, stacked) we get to choose the opening:
// triangle, square (current image), circle (like the pits in the castle). Same for the pits") A tree house's trapdoor:
// its hole and its lid drawn in the shape chosen, and the same in the ceiling of the room below; the setting shown in
// both rooms. The trap room's pits: drawn in their shapes, a fall following the shape (a point inside a square's corner
// falls, one outside a triangle's side does not); a dungeon's ceiling hole the shape of the pit above it. Exits 1 on a failure.
//   node openings252.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 800)}`); if (!cond) bad++; };
// (a path's shape, by its commands: an arc is a circle; three lines a triangle; four a square)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const kindOf = d => !d ? null : /A/.test(d) ? "circle" : (d.match(/L/g) || []).length === 2 ? "triangle" : (d.match(/L/g) || []).length === 3 ? "square" : "?";`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const tree = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null;
    Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, figX: 0, figY: 60, things: [] });
    let i = 0; for (let h = 1; h <= 6 && !i; h++) if (houseLinks(B, h - 1).some(L => L.way === "down" && L.to >= 0)) i = h;
    const below = houseLinks(B, i - 1).find(L => L.way === "down").to + 1, out = { i, below, shapes: {} };
    for (const sh of ["square", "circle", "triangle"]) {
      B["hatchShape" + i] = sh; B.inside = i; changed(); await w(400);
      const hole = bgShown.node.querySelector("[data-hole]"), hatch = bgShown.node.querySelector('[data-obj="hatch"]'), lid = hatch && hatch.querySelector("polygon, ellipse");
      const lidKind = !lid ? null : lid.tagName === "ellipse" ? "circle" : (lid.getAttribute("points").match(/-?[\\d.]+/g) || []).length / 2 === 3 ? "triangle" : "square";   // (its points' numbers, in pairs)
      const shownHere = SHOWN_WHEN["background.hatchShape" + i](B);
      B.inside = below; changed(); await w(400);
      const up = bgShown.node.querySelector('[data-obj="ladder up"] path[fill="#2a1a0e"]');
      out.shapes[sh] = { hole: kindOf(hole && hole.getAttribute("d")), lid: lidKind, below: kindOf(up && up.getAttribute("d")), shownHere, shownBelow: SHOWN_WHEN["background.hatchShape" + i](B), shownElse: [1, 2, 3, 4, 5, 6].filter(h => h !== i && h !== below).some(h => { B.inside = h; return SHOWN_WHEN["background.hatchShape" + i](B); }) };
    }
    B["hatchShape" + i] = "square"; return JSON.stringify(out); })()`));
  for (const sh of ["square", "circle", "triangle"]) {
    const r = tree.shapes[sh];
    ok(`a tree house's trapdoor, ${sh}: its hole and lid ${sh}, and the ceiling of the room below (house ${tree.below}) too`, r.hole === sh && r.lid === sh && r.below === sh, r);
  }
  ok("its setting shown in its own house and the house below, nowhere else", Object.values(tree.shapes).every(r => r.shownHere && r.shownBelow && !r.shownElse), tree.shapes);
  const pits = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: 0, figY: 60, things: [], castlePit1_3N: "square", castlePit2_3N: "triangle" }); changed(); await w(500);
    const P = pitsHere(), drawn = [...bgShown.node.querySelectorAll(".portal[data-pit]")].map(el => ({ shape: el.dataset.shape, hole: kindOf(el.querySelector('path[fill^="url"]')?.getAttribute("d")) }));
    const at = (q, u, v) => overPit(q, q.cx + u * PIT_EDGE * q.rx, q.cy + v * PIT_EDGE * q.ry);
    const falls = { squareCorner: at(P[0], 0.75, 0.75), squareOut: at(P[0], 1.05, 0), triangleIn: at(P[1], 0.2, 0.5), triangleSide: at(P[1], 0.6, -0.5) };
    const dun = {}; for (const r of [4, 5]) { B.castleRoom = r; changed(); await w(400); const hole = bgShown.node.querySelector('[data-obj="ladder"] path[fill="#fff3c4"]'); dun[r] = kindOf(hole && hole.getAttribute("d")); }
    B.castleRoom = 3; const shownTrap = SHOWN_WHEN["background.castlePit1_3N"](B) && SHOWN_WHEN["background.castleRoomBox3N"](B); B.castleRoom = 1; const shownKing = SHOWN_WHEN["background.castlePit1_3N"](B) && SHOWN_WHEN["background.castleRoomBox3N"](B);
    Object.assign(B, { castlePit1_3N: "circle", castlePit2_3N: "circle" }); changed();
    return JSON.stringify({ drawn, falls, dun, shownTrap, shownKing }); })()`));
  ok("the trap room's pits drawn square and triangle, as set", pits.drawn.length === 2 && pits.drawn[0].shape === "square" && pits.drawn[0].hole === "square" && pits.drawn[1].shape === "triangle" && pits.drawn[1].hole === "triangle", pits.drawn);
  ok("a fall follows the shape: inside a square's corner falls, past its side not; inside the triangle falls, beside its point not", pits.falls.squareCorner && !pits.falls.squareOut && pits.falls.triangleIn && !pits.falls.triangleSide, pits.falls);
  ok("each dungeon's ceiling hole the shape of the pit above it (4 under the first, 5 under the second)", pits.dun[4] === "square" && pits.dun[5] === "triangle", pits.dun);
  ok("the pits' setting shown in the trap room, not the king's room", pits.shownTrap && !pits.shownKing, pits);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
