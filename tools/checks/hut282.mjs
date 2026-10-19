// (ticket 282, for M: "maybe the exterior should have the option of rendering a single cylinder + dome hut, or a
// cluster of them forming a bigger structure"; "rotational symmetry when there are 3 huts (put into a triad formation),
// or two huts side by side for two, and more rotational symmetry for 4+"; the optional "hut center", larger, "not
// counted in the number of rooms, which go from 1--6") Outside, for 1 to 6 huts, with the hut center and without: as
// many huts drawn as rooms, and one more, bigger, with it; two side by side; three or more round the middle, equally
// far from it and equally far apart; every hut inside the picture; every door the way in (the living room, or the hut
// center with one). Inside the hut center: its doors to the bedroom, the living room and the potion room, its way out
// toward us, its two logs to sit on; the living room's way toward us into it, with one, and out, without. Exits 1 on a
// failure or page error.
//   node hut282.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`state.music.mute = true; state.world.at = null; state.background.things = []; 1`);
  for (const center of [false, true]) for (let rooms = 1; rooms <= 6; rooms++) {
    const r = JSON.parse(await ev(`(async () => { Object.assign(state.background, { kind: "hut", hutRooms: ${rooms}, hutCenter: ${center} }); changed(); await new Promise(r => setTimeout(r, 400));
      const pic = document.getElementById("pic"), box = pic.getBoundingClientRect(), us = [...pic.querySelectorAll('[data-obj="hut"] use')];
      const at = us.map(u => { const m = /translate\\(([-\\d.]+) ([-\\d.]+)\\) scale\\(([-\\d.]+)/.exec(u.getAttribute("transform")); return { x: +m[1], y: +m[2], s: +m[3] }; });
      const bs = us.map(u => u.getBoundingClientRect()), b = { left: Math.min(...bs.map(x => x.left)), right: Math.max(...bs.map(x => x.right)), top: Math.min(...bs.map(x => x.top)) };   // (the huts, not their smoke)
      return JSON.stringify({ at, to: [...new Set([...pic.querySelectorAll('[data-obj="hut"] .portal')].map(p => p.dataset.to))],
        inside: b.left >= box.left - 1 && b.right <= box.right + 1 && b.top >= box.top - 1 }); })()`));
    const ring = r.at.filter(h => h.s === 1), mid = r.at.filter(h => h.s > 1), tilt = 0.4;
    // (seen from above: y is how far back, drawn tilt as far up)
    const plan = ring.map(h => ({ x: h.x, z: -h.y / tilt })), d = plan.map(p => Math.hypot(p.x, p.z)), ang = plan.map(p => Math.atan2(p.z, p.x)).sort((a, b) => a - b);
    const gaps = ang.map((a, i) => ((i + 1 < ang.length ? ang[i + 1] : ang[0] + 2 * Math.PI) - a)), even = (a, b) => Math.abs(a - b) < 1;
    const shape = rooms === 1 ? (center ? d[0] > 100 : d[0] < 1) : rooms === 2 && !center ? Math.abs(plan[0].z - plan[1].z) < 0.5 && Math.abs(plan[0].x + plan[1].x) < 0.5 && Math.abs(plan[0].x) > 30
      : d.every(x => even(x, d[0])) && gaps.every(g => Math.abs(g - 2 * Math.PI / rooms) < 0.01);
    say(ring.length === rooms && mid.length === (center ? 1 : 0) && shape && r.inside && r.to.length === 1 && r.to[0] === (center ? "hutcenter" : "hutroom"),
      `${rooms} hut${rooms > 1 ? "s" : ""}${center ? " and the hut center" : ""}: ${ring.length} drawn${mid.length ? " and one bigger" : ""}, ${rooms === 1 ? "alone" : rooms === 2 && !center ? "side by side" : "round the middle, evenly"}` +
      `${r.inside ? ", inside the picture" : ", NOT inside the picture"}; the doors lead to ${r.to.join(", ")}`);
  }
  const c = JSON.parse(await ev(`(async () => { Object.assign(state.background, { kind: "hutcenter", hutCenter: true }); changed(); await new Promise(r => setTimeout(r, 500));
    const pic = document.getElementById("pic"), B = state.background;
    const out = { to: [...new Set([...pic.querySelectorAll(".portal")].map(p => p.dataset.to).filter(Boolean))], seats: seatsHere(B).map(s => s.name), bytes: pic.innerHTML.length };
    B.kind = "hutroom"; out.livingWith = insideWays(B).map(w => w.to); B.hutCenter = false; out.livingWithout = insideWays(B).map(w => w.to); return JSON.stringify(out); })()`));
  say(c.bytes > 20000 && ["hutbed", "hutroom", "hutpotion", "hut"].every(t => c.to.includes(t)), `the hut center: drawn (${c.bytes} bytes), its doorways lead to ${c.to.join(", ")}`);
  say(c.seats.length === 2, `the hut center: logs to sit on (${c.seats.join("; ")})`);
  say(c.livingWith.join() === "hutcenter" && c.livingWithout.join() === "hut", `the living room's way toward us: ${c.livingWith.join()} with the hut center, ${c.livingWithout.join()} without`);
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
