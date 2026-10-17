// (0.0.109) Every control's setting is its own, and of its own kind. The
// tree room's toy slider and the list of things put in a place were both
// "things": the defaults' second key won, the tree rooms drew one toy, and
// the things palette was hidden everywhere but there. This walks every
// tab's controls (groups, and controls of another part, too) and checks: a
// key is shared only by controls of one kind of value (a slider and nudge
// buttons may move one number; a slider and a things list may not share a
// name); a slider's default is a number; a toggle's a true or false; a
// things list's a list. Exits 1 on a failure.
//   node settings109.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(() => {
    const uses = {}, kinds = { range: "number", toggle: "boolean", things: "list" }, wrong = [];
    const VALUE = { range: "number", nudge: "number", master: "number", every: "number", turn: "number", place: "number", toggle: "boolean", things: "list" };
    const walk = (part, cs) => { for (const c of cs || []) {
      if (!Array.isArray(c) || typeof c[0] !== "string" || typeof c[1] !== "string") continue;
      if (c[0] === "group") { walk(part, c[3]); continue; }
      if (c[0] === "of") { walk(c[1], [c[2]]); continue; }   // (a control of another part: ["of", part, control, when])
      const k = part + "." + c[1]; (uses[k] = uses[k] || new Map()).set(c[0], VALUE[c[0]] || c[0]);
      const want = kinds[c[0]], d = DEFAULTS[part] ? DEFAULTS[part][c[1]] : undefined;
      if (want && d !== undefined && (want === "list" ? !Array.isArray(d) : typeof d !== want)) wrong.push(k + " (" + c[0] + "): default " + JSON.stringify(d));
    } };
    for (const t of TABS) walk(t[1], t[2]);
    const shared = Object.entries(uses).filter(([, m]) => new Set(m.values()).size > 1).map(([k, m]) => k + ": " + [...m.keys()].join(", "));
    return JSON.stringify({ controls: Object.keys(uses).length, shared, wrong });
  })()`));
  ok(`every setting shared only by controls of one kind of value (${r.controls} settings)`, r.controls > 100 && r.shared.length === 0, r.shared);
  ok("every slider's default a number, every toggle's true or false, the things a list", r.wrong.length === 0, r.wrong);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
