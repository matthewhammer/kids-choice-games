// (ticket 293) The king's room's thrones: two to start (a king's and a queen's, in the castle's themes A and B), up to
// six across the dais, side by side within the back wall, each a seat; a throne with a cat has the cat on its seat, and
// shows the cat's own settings (the cat room's) only while it has one. Exits 1 on a failure.
//   node throne293.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; B.kind = "castleroom"; B.castle = "N"; B.castleRoom = castleOf(B).rooms.indexOf("king") + 1; changed(); await w(500);
    const look = () => { const ts = [...document.querySelectorAll('[data-obj^="throne "]')], P = document.getElementById("pic").getBoundingClientRect();
      const boxes = ts.map(t => { const b = t.getBoundingClientRect(); return [Math.round(b.left - P.left), Math.round(b.right - P.left)]; });
      const velvet = ts.map(t => [...t.querySelectorAll("path")][1]?.getAttribute("fill"));
      return { n: ts.length, boxes, velvet, cats: ts.map(t => !!t.querySelector('[fill="#f4a0b0"]')), seats: seatsHere(B).map(s => s.name), w: Math.round(P.width) }; };
    const two = look();
    B.castleThronesN = 6; for (let j = 1; j <= 6; j++) B["castleThrone" + j + "CatN"] = j === 1 || j === 4 ? "cat" : "none"; B.castleThrone4PoseN = "sleep"; changed(); await w(500);
    const six = look();
    const S = SHOWN_WHEN, shown = { cat1: !!S["background.castleThrone1FurN"](B), cat2: !!S["background.castleThrone2FurN"](B), box6: !!S["background.castleThroneBox6N"](B) };
    B.castleThronesN = 2; for (let j = 1; j <= 6; j++) B["castleThrone" + j + "CatN"] = "none"; changed();
    return JSON.stringify({ two, six, shown, K: castleOf(B).thrones.length }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("two thrones to start, in the two themes (different velvets)", r.two.n === 2 && r.two.velvet[0] !== r.two.velvet[1], r.two);
  ok("six across the dais when asked for, side by side, none overlapping another", r.six.n === 6 && r.six.boxes.every((b, i) => i === 0 || b[0] >= r.six.boxes[i - 1][1] - 2), r.six.boxes);
  ok("all six within the picture", r.six.boxes.every(b => b[0] >= 0 && b[1] <= r.six.w), r.six);
  ok("each throne a seat of its own", r.six.seats.filter(s => /^throne [1-6]$/.test(s)).length === 6, r.six.seats);
  ok("a throne with a cat has its cat on it, the others none", r.six.cats.join() === [true, false, false, true, false, false].join(), r.six.cats);
  ok("a throne's cat's settings show only while it has a cat; the sixth throne's box shows with six", r.shown.cat1 && !r.shown.cat2 && r.shown.box6, r.shown);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
