// (ticket 604, Matthew, 2026-10-24: "limit is huge, and actual screen viewport is huge too"; "it would look better to have the line
// break, if there needs to be one, after the in (following let), not within the if-then-else stuff after the in") Two things:
//   1. the script boxes' line wrap (scriptFlow), in Hazel, cuts a line between a let and its body (after in), a fun and its body
//      (after ->), a case arm and its body (after =>) before anything inside the body, and a case's arms stay level with it;
//   2. the tiles are laid out to the box's width in characters measured in the font and size sent to them (scriptTileCols), not
//      guessed as 0.71 of the size (100 columns used of 116, in a box with room for more).
// Exits 1 on a failure.
//   node flowlet604.mjs <devtools port> <url>
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
const auto = "  | Auto => (let t = Common.room_at(rooms, Trap) in if ladder && t > 0 && !(t == n) then t else if n == 1 then 0 else 1)";
const find = "let find = fun (cs, c, r) : ([Cell], Int, Int) -> case cs | [] => None | x :: rest => if x.col == c && x.row == r then Some(x) else find(rest, c, r) end;";
try {
  await send("Runtime.enable");
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(() => {
    const E = scriptEditorSettings(); Object.assign(E, { size: 12.5, font: "sys", lines: true, wrap: 400 });
    const c = document.createElement("canvas").getContext("2d"); c.font = "12.5px " + SCRIPT_FONTS[0][1];
    const ch = c.measureText("0123456789").width / 10, wide = scriptTileCols({ holder: { clientWidth: 1000 } });
    E.wrap = 77; const capped = scriptTileCols({ holder: { clientWidth: 1000 } });
    return JSON.stringify({ ch, wide, capped,
      auto77: scriptFlow("hazel", ${JSON.stringify(auto)}, 77), auto116: scriptFlow("hazel", ${JSON.stringify(auto)}, 116),
      find77: scriptFlow("hazel", ${JSON.stringify(find)}, 77) });
  })()`));
  console.log(r.auto77 + "\n" + r.auto116 + "\n" + r.find77);
  console.log(`  a character of the sys font at 12.5 px: ${r.ch.toFixed(2)} px; a 1000 px box: ${r.wide} columns (the old guess: 105)`);
  ok("the castle's Auto at 77: cut after the let's in, the if whole on the next line", r.auto77 === [
    "  | Auto =>",
    "    (let t = Common.room_at(rooms, Trap) in",
    "      if ladder && t > 0 && !(t == n) then t else if n == 1 then 0 else 1)"].join("\n"), r.auto77);
  ok("the castle's Auto at 116: the arm's body on one line", r.auto116.split("\n").length === 2, r.auto116);
  ok("a fun cut after its ->, its case's arms level with the case, an arm cut after its => before its if", r.find77 === [
    "let find = fun (cs, c, r) : ([Cell], Int, Int) ->",
    "  case cs",
    "  | [] => None",
    "  | x :: rest =>",
    "    if x.col == c && x.row == r then Some(x) else find(rest, c, r) end;"].join("\n"), r.find77);
  ok("the tiles' columns come from the measured character (a monospace one, 0.5 to 0.7 of the size)",
    r.ch > 0.5 * 12.5 && r.ch < 0.7 * 12.5 && r.wide === Math.floor(1000 / r.ch) - 5 - 2 && r.wide > 105, r);
  ok("and never more than ⚙️'s wrap", r.capped === 77, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
