// (ticket 365, as ^ticket(289) asks of the background designer: "an fps check on the black laptop's tier") The frame-rate gate
// (tools/fpsgate.mjs, its walk and its drag) in N's castle's king's room at 1600x1000, the page's main thread 2 times slower (the black
// laptop's tier, BLACK=1's CPU), three ways: 🏞️ Background in the side panel (the control), the background designer full screen, and
// the castle designer full screen (its map, every room's box and picture beside the game). Recorded, not a verdict: it exits 0.
//   node castlefs365.mjs <devtools port> <url>
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const [dport, url] = process.argv.slice(2), here = dirname(fileURLToPath(import.meta.url)), gate = join(here, "..", "fpsgate.mjs");
const ROOM = `state.background.kind = "castleroom"; state.background.castle = "N"; state.background.castleRoom = 1; changed(); tab = TABS.findIndex(t => t[1] === "background"); showTab();`;
const runs = [["side panel", ROOM], ["background designer", ROOM + " setBgBig(true);"], ["castle designer", ROOM + " setCastleBig(true);"]];
const out = { url, cpu: 2, rows: [] };
mkdirSync("out/checks", { recursive: true });
for (const [name, tweak] of runs) {
  const file = `out/checks/castlefs365-${name.replace(/ /g, "-")}.json`;
  const r = spawnSync("node", [gate, dport, url, "castle"], { env: { ...process.env, W: "1600", H: "1000", CPU: "2", RETRIES: "0", OUT: file, TWEAK: tweak }, encoding: "utf8", timeout: 300000 });
  let res = null; try { res = JSON.parse(readFileSync(file, "utf8")); } catch (e) { /* (the gate's own output says why) */ }
  const by = k => res && res.results ? res.results.find(x => x.kind === k) : null, w = by("walk"), d = by("drag");
  const row = { name, walk: w ? w.fps : null, drag: d ? d.fps : null, walkRuns: w ? w.runs.map(x => x.fps) : null, dragRuns: d ? d.runs.map(x => x.fps) : null,
                dps: w ? w.runs.map(x => x.dps) : null, drawMs: w ? w.runs.map(x => x.drawMs) : null };
  out.rows.push(row);
  console.log(`${name.padEnd(20)} CPU 2  walk ${String(row.walk).padStart(5)} fps (${(row.walkRuns || []).join(", ")})  drag ${String(row.drag).padStart(5)} fps (${(row.dragRuns || []).join(", ")})  draws/s ${(row.dps || []).join(", ")}` +
              (r.status === null ? "  (timed out)" : "") + (!w && !d ? "  " + String(r.stdout || r.stderr || "").trim().split("\n").slice(-3).join(" | ") : ""));
}
writeFileSync("out/checks/castlefs365.json", JSON.stringify(out, null, 1));
console.log("recorded (a measurement, not a verdict)");
process.exit(0);
