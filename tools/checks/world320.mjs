// (ticket 320, Matthew: "world design +/- row -- toggle for left/top edge, which is not the default") In 🗺️ World design, with the friend
// in the default world's clearing and one square waiting to be put back: ↖️ off by default, the size buttons at the right and bottom;
// on, a column added at the left and a row at the top move every square over, its neighbours the same, the start, the friend's square
// and the waiting square's place with it, the friend still in the clearing; a column and a row taken away there again give the world
// as it was; one taken away while that edge holds a square is refused. Exits 1 on a failure.
//   node world320.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true; changed(); await w(200);
    const W = () => state.world, shape = () => { const X = W(); return { cols: X.cols, rows: X.rows, start: X.start, at: X.at, applied: X.applied || null, bg: state.background.kind,
      kinds: worldKeys(X).map(k => k + "=" + X.cells[k].kind).join(" "), un: (X.unreachable || []).map(u => u.from).join(),
      meets: worldKeys(X).map(k => (X.cells[k].ways || []).map(d => { const m = worldMeets(X, k, d); return m ? X.cells[m].kind : "-"; }).join("")).join("|") }; };
    const start = W().start; worldEnter(start, "W"); await w(500); worldRemove("0,0"); await w(100);
    tab = TABS.findIndex(t => t[1] === "world"); showTab(); await w(400);
    const P = document.getElementById("panel"), btn = t => [...P.querySelectorAll("button[data-size]")].find(b => b.dataset.size === t), chip = [...P.querySelectorAll("button.flip")].find(b => /left and top/.test(b.textContent));
    const out = { chip: chip ? chip.getAttribute("aria-pressed") : null, wordsOff: [...P.querySelectorAll("button[data-size]")].map(b => b.textContent), s0: shape() };
    chip.click(); await w(100); out.wordsOn = [...P.querySelectorAll("button[data-size]")].map(b => b.textContent);
    btn("＋ column").click(); await w(200); btn("＋ row").click(); await w(300); out.s1 = shape();
    out.s1keys = Object.keys(W().cells).every(k => { const [c, r] = k.split(",").map(Number); return c >= 1 && r >= 1; });
    btn("－ column").click(); await w(200); btn("－ row").click(); await w(300); out.s2 = shape();
    btn("－ column").click(); await w(200); out.s3 = shape();
    chip.click(); await w(100);
    state = clone(DEFAULTS); changed(); return JSON.stringify(out); })()`));
  const { s0, s1, s2, s3 } = r;
  const shifted = k => k && k.split(",").map(Number).map(v => v + 1).join(",");
  console.log("  s0 " + JSON.stringify({ ...s0, kinds: undefined, meets: undefined }) + "\n  s1 " + JSON.stringify({ ...s1, kinds: undefined, meets: undefined }));
  ok("↖️ off by default; the buttons at the right and bottom", r.chip === "false" && r.wordsOff.join() === "＋ column,－ column,＋ row,－ row", [r.chip, r.wordsOff]);
  ok("↖️ on: the buttons say the left and the top", r.wordsOn.every(t => /at the (left|top)$/.test(t)), r.wordsOn);
  ok("＋ column at the left and ＋ row at the top: one bigger each way", s1.cols === s0.cols + 1 && s1.rows === s0.rows + 1, [s0.cols, s0.rows, s1.cols, s1.rows]);
  ok("every square moved over (none in the new column or row)", r.s1keys, s1.kinds);
  ok("the same places, each with the same neighbours", s1.kinds.split(" ").map(x => x.split("=")[1]).join() === s0.kinds.split(" ").map(x => x.split("=")[1]).join() && s1.meets === s0.meets, [s0.meets.slice(0, 200), s1.meets.slice(0, 200)]);
  ok("the start, the friend's square and the square shown moved with them; the friend still in the same place", s1.start === shifted(s0.start) && s1.at === shifted(s0.at) && s1.applied === shifted(s0.applied) && s1.bg === s0.bg, [s0, s1].map(s => [s.start, s.at, s.applied, s.bg]));
  ok("the square waiting to be put back: its place moved too", s1.un === shifted(s0.un), [s0.un, s1.un]);
  ok("－ column at the left and － row at the top again: the world as it was", JSON.stringify(s2) === JSON.stringify(s0), [s0, s2]);
  ok("a column taken away at the left while it holds a square: refused", JSON.stringify(s3) === JSON.stringify(s2), s3);
  ok("no error thrown", errs.length === 0, errs);
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
