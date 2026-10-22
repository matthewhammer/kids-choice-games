// ^du_report(13), the score try re-timed on Hazel's JS library, before and after the performance PRs (see ^report(25)).
//   node --stack-size=8000 score_libs.mjs <hazel-lib.js> <label>
// Runs each of data/zero.hz, score760.hz and score.hz through Hazel.run (parse, statics, evaluation) in one node
// process: one first run, then up to 15 more within ~4 s, and writes data/times_<label>.json.
import fs from "node:fs"; import vm from "node:vm"; import { createRequire } from "node:module";
import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
globalThis.require = createRequire(import.meta.url);
vm.runInThisContext(fs.readFileSync(process.argv[2], "utf8"), { filename: "hazel-lib.js" });
const H = globalThis.Hazel;
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * a.length)];
const out = {};
for (const f of ["zero.hz", "score760.hz", "score.hz"]) {
  const src = fs.readFileSync(path.join(HERE, "..", "data", f), "utf8");
  let t0 = performance.now(); const r = H.run(src); const first = performance.now() - t0;
  if (r.errors && r.errors.length) { console.error(f, r.errors); process.exit(1); }
  const ts = []; const tAll = performance.now();
  for (let i = 0; i < 15 && performance.now() - tAll < 4000; i++) { t0 = performance.now(); H.run(src); ts.push(performance.now() - t0); }
  out[f] = { value: r.value, first_ms: +first.toFixed(1), p50_ms: +q(ts, .5).toFixed(1), reps: ts.length };
  console.log(f, JSON.stringify(out[f]));
}
fs.writeFileSync(path.join(HERE, "..", "data", `times_${process.argv[3] || "run"}.json`), JSON.stringify(out, null, 1));
