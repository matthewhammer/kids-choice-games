// Diagnostic (never merged): what the page holds after zz-access217 ran in this browser
const [dport, url] = process.argv.slice(2);
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable"); await send("Page.navigate", { url }); await new Promise(r => setTimeout(r, 4000));
const r = await send("Runtime.evaluate", { expression: `JSON.stringify({ keys: Object.keys(localStorage), access: state.access, kind: state.background.kind, at: state.world && state.world.at,
  figX: state.background.figX, entering, touch: localStorage.getItem("dress-up-touchpad"), body: [document.body.className], marks: marks.pics.length })`, returnByValue: true });
console.log("probe:", r.result.result.value);
await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(0);
