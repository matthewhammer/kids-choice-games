// (ticket 361, Matthew: "On each instrument, permit a 'dup' chip, that duplicates the instrument in the mix. The default is to
// name the new one 'X dup'") On couch-cushion rave A's board: ⧉ dup on its first channel adds "X dup", a part of its own with
// the same notes, starting from the original's settings; a second is "X dup 2"; each has a ✖ that takes it away; saved in
// the tune's mix. Exits 1 on a failure.
//   node dup361.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), id = "cushionsA";
    state.music.track = id; state.music.mute = true; if (state.music.mix) delete state.music.mix[id]; changed(); await w(300);
    const tab = [...document.querySelectorAll("button")].find(b => /Music/.test(b.textContent)); if (tab) tab.click(); await w(500);
    const s0 = songOf(id), first = s0.T.parts[0], notes0 = s0.events.filter(e => e.part === 0).length;
    const dupBtn = () => [...document.querySelectorAll(".strip")].find(st => st.querySelector(".strip-name").textContent.includes(partName(first.name)) && !/dup/.test(st.querySelector(".strip-name").textContent)).querySelector("button[title^='a copy']");
    dupBtn().click(); await w(300); dupBtn().click(); await w(300);
    const s1 = songOf(id), dups = s1.T.parts.filter(q => q.dupOf).map(q => q.name), i1 = s1.T.parts.findIndex(q => q.name === first.name + " dup");
    const notes1 = s1.events.filter(e => e.part === i1).length, same = JSON.stringify(mixOf(id)[first.name + " dup·" + first.inst] || {}) === JSON.stringify((({ mute, solo, ...r }) => r)(mixOf(id)[channelKey(first)] || {}));
    const xs = [...document.querySelectorAll("button[title='take this copy away']")].length;
    [...document.querySelectorAll("button[title='take this copy away']")][1].click(); await w(300);
    const left = (state.music.mix[id].dups || []).map(d => d.name);
    return JSON.stringify({ dups, notes0, notes1, same, xs, left, first: first.name }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("two dups, named X dup and X dup 2", r.dups.join() === [r.first + " dup", r.first + " dup 2"].join(), r.dups);
  ok("a dup plays the same notes", r.notes1 === r.notes0 && r.notes0 > 0, [r.notes0, r.notes1]);
  ok("a dup starts from its original's settings", r.same, r.same);
  ok("each dup has a ✖, and it takes that one away (saved in the mix)", r.xs === 2 && r.left.length === 1, [r.xs, r.left]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
