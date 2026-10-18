// (ticket 275) Save's .json is a full snapshot: the picture file { app,
// version, state } and "extra" (when it was saved, the game's version), in
// that order; dropping "extra" (pictureFile) leaves exactly the picture file;
// and Load reads a snapshot, and an older file with a top-level "saved", the
// same: only the settings. Exits 1 on a failure or page error.
//   node save275.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const f = JSON.parse(await ev(`JSON.stringify(snapshotFile(new Date("2026-10-18T15:45:00Z")))`));
  say(JSON.stringify(Object.keys(f)) === '["app","version","extra","state"]', `a snapshot's keys, in order: ${Object.keys(f).join(", ")}`);
  say(f.extra && f.extra.saved === "2026-10-18T15:45:00.000Z" && f.extra.game === await ev("VERSION.number"), `extra: ${JSON.stringify(f.extra)}`);
  const p = JSON.parse(await ev(`JSON.stringify(pictureFile(snapshotFile()))`));
  say(JSON.stringify(Object.keys(p)) === '["app","version","state"]', `its picture file's keys: ${Object.keys(p).join(", ")}`);
  // (Load, as a player does it: a file given to the 📂 Load input)
  const load = async file => JSON.parse(await ev(`(async () => {
    const input = document.getElementById("load-file"), dt = new DataTransfer();
    dt.items.add(new File([${JSON.stringify(JSON.stringify(file))}], "friend.json", { type: "application/json" }));
    input.files = dt.files; input.dispatchEvent(new Event("change")); await new Promise(r => setTimeout(r, 400));
    return JSON.stringify({ kind: state.background.kind, color: state.face.color }); })()`));
  const s0 = JSON.parse(await ev(`JSON.stringify(state)`));
  const snap = { ...f, state: { ...s0, background: { ...s0.background, kind: "lake" }, face: { ...s0.face, color: "#123456" } } };
  const a = await load(snap);
  say(a.kind === "lake" && a.color === "#123456", `Load reads a snapshot's settings: ${JSON.stringify(a)}`);
  await ev(`state.background.kind = "none"; changed(); 1`);
  const old = { app: "dress-up", version: 1, saved: "2026-10-17T10:00:00.000Z", state: { ...snap.state, background: { ...snap.state.background, kind: "forest" } } };
  const b = await load(old);
  say(b.kind === "forest", `Load reads a file from before 0.0.203 (a top-level saved): ${JSON.stringify(b)}`);
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
