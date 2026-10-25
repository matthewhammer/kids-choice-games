#!/usr/bin/env python3
"""^du_report(19)'s proof data: data/same.json, from tools/same_friend.mjs's summaries in data/runs/ (the release
against itself, the noise; the release against each commit of ticket-564-redo; the sensitivity checks against a
copy of the release with one hex digit changed) and the branch's commits (git). The words for each commit are in
data/report.json ("commits"), in order.
  python3 drivers/gather.py   (from dress-up/reports/019/, in the worktree with the branch checked out)"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNS = os.path.join(HERE, "data", "runs")
rd = lambda f: json.load(open(os.path.join(RUNS, f), encoding="utf-8"))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
git = lambda *a: subprocess.run(["git", *a], cwd=HERE, capture_output=True, text=True, check=True).stdout
BASE = git("rev-parse", "fad0545").strip()
shas = [l.split()[0] for l in git("log", "--reverse", "--format=%H %s", f"{BASE}..HEAD").splitlines() if "(ticket 564)" in l]
keep = lambda s: {k: v for k, v in s.items() if k not in ("old", "new")}
commits = []
for i, (sha, words) in enumerate(zip(shas, D["commits"]), 1):
    st = git("show", "--shortstat", "--format=", sha).strip()
    files = [l for l in git("show", "--name-only", "--format=", sha).splitlines() if l]
    commits.append(dict(words, sha=sha, subject=git("show", "-s", "--format=%s", sha).strip(), files=files,
                        stat=re.sub(r"(\d+) files? changed", r"\1 files changed", st), summary=keep(rd(f"c{i}.json"))))
sens = None
if os.path.exists(os.path.join(RUNS, "sens-ruby.json")):
    a, b = rd("sens-ruby.json"), rd("sens-robin.json")
    sens = {"ruby": keep(a), "robin": keep(b),
            "words": f"Yes. Against a copy of the release with the ruby's colour changed in its last hex digit (`#d0103a` to `#d0103b`), "
                     f"the ruby's {a['cases']:,} cases gave {a['differ']:,} different and {a['identical']:,} identical: the {a['identical']:,} are the views from behind, "
                     f"where the gem is not drawn (the clasp is). With Robin Hood's hose one digit browner (`#5a3d22` to `#5a3d23`), all {b['cases']:,} of Robin's cases differed."}
out = {"base": BASE, "noise": keep(rd("noise.json")), "commits": commits, "sensitivity": sens,
       "tool": "tools/same_friend.mjs", "where": "node 22.23 on the Ubuntu laptop (Intel i7, 13th generation; Ubuntu 24.04), one job at a time, under nice"}
json.dump(out, open(os.path.join(HERE, "data", "same.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote data/same.json:", len(commits), "commits;", ", ".join(f"{c['sha'][:7]} {c['summary']['identical']}/{c['summary']['cases']}" for c in commits))
