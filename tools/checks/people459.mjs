// (ticket 459, Matthew: "on the people design system: permit '+ from costume' and show a box -- on top of other panels, not
// within them? -- with the costume chips to choose (or cancel at the bottom) --- experimenting with a new UX, instead of a drop
// down, to compare.") In 👥 People: ➕ from a costume opens a box laid over the panel (in the page, not inside the panel),
// holding every costume the 🐯 Costume tab has as a chip, and ✖ cancel last, at its bottom; cancel and Escape close it; a
// chip chosen makes a new person in that costume, named after it ("knight 1"), being dressed, the one before kept; the
// template dropdown is still there beside it. Exits 1 on a failure.
//   node people459.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true; changed(); await w(300);
    tab = TABS.findIndex(t => t[0] === "👥 People"); showTab(); await w(300);
    const btn = () => document.querySelector("#panel .person-from-costume"), box = () => document.querySelector(".person-pick");
    out.button = !!btn(); out.dropdownRow = !!document.querySelector("#panel .person-new-row");
    btn().click(); await w(150);
    const b = box(), pr = document.getElementById("panel").getBoundingClientRect(), br = b && b.getBoundingClientRect();
    out.open = !!b; out.inPanel = !!(b && b.closest("#panel")); out.overPanel = !!br && br.left < pr.right && br.right > pr.left && br.top < innerHeight && br.bottom > 0;
    out.chips = b ? [...b.querySelectorAll(".person-pick-chip")].map(c => c.dataset.kind) : [];
    out.kinds = personCostumes().map(([v]) => v);
    const last = b && [...b.querySelectorAll("button")].pop();
    out.cancelLast = !!last && last.classList.contains("person-pick-cancel");
    last.click(); await w(100); out.afterCancel = !!box();
    btn().click(); await w(100); document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await w(100); out.afterEsc = !!box();
    btn().click(); await w(100); box().querySelector('[data-kind="knight"]').click(); await w(400);
    out.afterPick = { open: !!box(), me: state.person.name, kind: state.costume.kind, away: Object.values(state.peopleAway).map(p => personTitle(p)) };
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify({ ...r, kinds: r.kinds.length, chips: r.chips.length })}`);
  ok("👥 People has ➕ from a costume, and the template row is still there", r.button && r.dropdownRow, r);
  ok("it opens a box laid over the panel, not inside it", r.open && !r.inPanel && r.overPanel, r);
  ok("the box holds every costume the 🐯 Costume tab has, as chips", r.chips.length >= 20 && JSON.stringify(r.chips) === JSON.stringify(r.kinds), [r.chips, r.kinds]);
  ok("✖ cancel is last, at its bottom; cancel and Escape close the box", r.cancelLast && !r.afterCancel && !r.afterEsc, r);
  ok("a chip chosen: the box closes, a new person in that costume named after it is being dressed, the one before kept",
     !r.afterPick.open && r.afterPick.me === "knight 1" && r.afterPick.kind === "knight" && r.afterPick.away.includes("the friend"), r.afterPick);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
