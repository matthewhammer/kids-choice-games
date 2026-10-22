// (ticket 531) The diag-531 artifacts summed up: for each job's out/ folder (or one folder of every job's, each in its own subfolder),
// its CPU, and per event and mode the probe's numbers (input to frame p50 and p95, the event's own ms p50, dropped frames in a burst),
// then across jobs, grouped by CPU: the median of each, and the noise floor, the difference between a job's two js runs (and its two
// hazel runs), against which a Hazel cost is claimed only when it is larger.
//   node tools/hazellogic531-sum.mjs <dir> [dir ...]
import fs from "node:fs"; import path from "node:path";
const dirs = process.argv.slice(2).flatMap(d => fs.existsSync(path.join(d, "probe")) ? [d] : fs.readdirSync(d).map(s => path.join(d, s)).filter(s => fs.existsSync(path.join(s, "probe"))));
const med = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return s.length ? +(s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2).toFixed(3) : null; };
const jobs = dirs.map(d => {
  const cpu = (fs.existsSync(path.join(d, "cpu.txt")) ? fs.readFileSync(path.join(d, "cpu.txt"), "utf8") : "cpu=?").replace(/^cpu=/, "").trim();
  const runs = fs.readdirSync(path.join(d, "probe")).filter(f => f.endsWith(".json")).sort().map(f => JSON.parse(fs.readFileSync(path.join(d, "probe", f), "utf8")).summary).filter(Boolean);
  return { dir: d, cpu, runs };
});
const rows = [];
for (const J of jobs) {
  console.log(`\n${J.dir}: ${J.cpu}`);
  for (const r of J.runs) {
    console.log(`  ${r.mode.padEnd(5)} load ${r.loadMs} ms${r.cold && r.cold.compileMs != null ? `, library ${Math.round(r.cold.libWaitMs)} ms, first compile ${Math.round(r.cold.compileMs)} ms` : ""}, heap ${r.heapAfter ? (r.heapAfter.used / 1e6).toFixed(1) : "?"} MB${r.stopped ? ", STOPPED " + r.stopped : ""}`);
    for (const [tag, E] of Object.entries(r.events || {})) {
      console.log(`    ${tag.padEnd(12)} to frame p50 ${E.toFrame.p50} p95 ${E.toFrame.p95} max ${E.toFrame.max}; event p50 ${E.event.p50} p95 ${E.event.p95}; dropped ${E.dropped}/20`);
      // (a hazel run whose compile was not ready, or whose pulls did not all go through Hazel, measured the JS: flagged, left out)
      if (r.mode === "hazel" && (!r.cold || r.cold.ready !== true || E.hazelCalls !== E.pulls)) { console.log(`      LEFT OUT: not all Hazel (ready ${r.cold && r.cold.ready}, ${E.hazelCalls}/${E.pulls} pulls through Hazel)`); continue; }
      rows.push({ cpu: J.cpu, job: J.dir, mode: r.mode, tag, frame: E.toFrame.p50, frame95: E.toFrame.p95, event: E.event.p50, dropped: E.dropped });
    }
  }
}
console.log("\nacross jobs, by CPU (medians; noise: a job's two runs of one mode, apart)");
for (const cpu of [...new Set(rows.map(r => r.cpu))]) {
  const R = rows.filter(r => r.cpu === cpu);
  console.log(`\n${cpu} (${new Set(R.map(r => r.job)).size} jobs)`);
  for (const tag of [...new Set(R.map(r => r.tag))]) {
    const of = (m, k) => med(R.filter(r => r.tag === tag && r.mode === m).map(r => r[k]));
    const noise = m => med([...new Set(R.map(r => r.job))].map(j => { const a = R.filter(r => r.job === j && r.tag === tag && r.mode === m).map(r => r.frame); return a.length >= 2 ? Math.abs(a[0] - a[1]) : null; }));
    const d = of("hazel", "frame") != null && of("js", "frame") != null ? +(of("hazel", "frame") - of("js", "frame")).toFixed(3) : null, nf = Math.max(noise("js") ?? 0, noise("hazel") ?? 0);
    console.log(`  ${tag.padEnd(12)} to frame p50: js ${of("js", "frame")} hazel ${of("hazel", "frame")} main ${of("main", "frame")} | hazel - js ${d} (noise ${nf}${d != null && Math.abs(d) > nf ? ", ABOVE it" : ", within it"}) | event p50: js ${of("js", "event")} hazel ${of("hazel", "event")} | dropped: js ${of("js", "dropped")} hazel ${of("hazel", "dropped")}`);
  }
}
