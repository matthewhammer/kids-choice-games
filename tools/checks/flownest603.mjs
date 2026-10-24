// (ticket 603, Matthew, 2026-10-24: "I don't understand why the nested if then else uses so many lines, given 77 as the line limit,
// and plenty of space") The script boxes' line wrap (scriptFlow) cuts a long line at its outermost if's then and else only: a
// nested if that fits stays whole on its else's line, and an else if too long for one goes on as a chain, its then and else level
// with the outer ones. Only spaces and line breaks change, in every shipped script, Hazel and Fumola, at any width.
// Exits 1 on a failure.
//   node flownest603.mjs <devtools port> <url>
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
// (the cases, run in the game's page)
const FLOW_CASES = `(() => {
  // (a long comment split in several adds its markers: # # in Hazel, // in Fumola)
  const strip = s => s.replace(/\\s+/g, "").replace(/##|\\/\\//g, "");
  const castle = "  | Auto => (let t = Common.room_at(rooms, Trap) in if ladder && t > 0 && !(t == n) then t else if n == 1 then 0 else 1)";
  const trap = "    let one = fun (i, mine, k) : (Int, Bool, Cmd) -> if !mine then k else if lift then LiftBoulder(i, k) else DropBoulder(i, k) in";
  const fumola = "        if (ex == ?(#ExitLadder) and t > 0 and t != n) { t } else if (n == 1) { 0 } else { 1 } };";
  const texts = { hazel: [SCRIPT_COMMON, SCRIPT_TRAP, SCRIPT_TREE, SCRIPT_SQUARE, SCRIPT_WORLD, SCRIPT_CASTLE],
    fumola: [FUMOLA_COMMON, FUMOLA_TRAP, FUMOLA_TREE, FUMOLA_SQUARE, FUMOLA_WORLD, FUMOLA_CASTLE] };
  const changed = [];
  for (const [lang, ts] of Object.entries(texts)) ts.forEach((t, i) => { for (const cols of [30, 40, 50, 60, 77, 90, 120])
    if (strip(scriptFlow(lang, t, cols)) !== strip(t)) changed.push(lang + " " + i + " @" + cols); });
  return JSON.stringify({ castle: scriptFlow("hazel", castle, 77), trap: scriptFlow("hazel", trap, 40), fumola: scriptFlow("fumola", fumola, 77), changed });
})()`;
try {
  await send("Runtime.enable");
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(FLOW_CASES));
  console.log(r.castle + "\n" + r.trap + "\n" + r.fumola);
  ok("the castle's Auto at 77: the inner if whole on its else's line", r.castle === [
    "  | Auto =>",
    "    (let t = Common.room_at(rooms, Trap) in if ladder && t > 0 && !(t == n)",
    "      then t",
    "      else if n == 1 then 0 else 1)"].join("\n"), r.castle);
  ok("an else if too long for its line (at 40): a chain, its then and else level with the outer ones",
    /\n( +)then k\n\1else if lift\n\1then LiftBoulder\(i, k\)\n\1else DropBoulder\(i, k\) in$/.test(r.trap), r.trap);
  ok("Fumola the same: else if (n == 1) { 0 } else { 1 } on one line at 77", r.fumola.split("\n").pop().trim() === "else if (n == 1) { 0 } else { 1 } };", r.fumola);
  ok("only spaces and line breaks change, every shipped script, Hazel and Fumola, at 30 to 120", !r.changed.length, r.changed);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
