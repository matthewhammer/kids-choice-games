#!/usr/bin/env python3
"""^du_report(16)'s data, from the GitHub runs of tools/checks/knoll521.mjs (FULL=1, 3 jobs each), downloaded to R16/out, R16/out2, R16/out3
(whichever exist; the last one present is "the run" the page is drawn from, the earlier ones are kept as summaries and for the noise floor).
  python3 drivers/gather.py [R16]   (from 016/; R16 defaults to $R16)
Writes data/whitespace.json, data/counts.json, and copies the first-window screenshots the page shows into pictures/shots/."""
import json, os, re, glob, shutil, statistics, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R16 = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("R16", "")
assert R16 and os.path.isdir(R16), "give the folder holding out/, out2/, out3/"
REPO = os.path.expanduser("~/kids-choice-games")
RUNS = [r for r in ("out", "out2", "out3") if glob.glob(os.path.join(R16, r, "knoll521-job*", "knoll521", "*.json"))]
SHOW = {"🧍 Body", "😀 Face", "🎮 Controls", "🖐 Hands", "🏞️ Background · castle"}   # the box maps kept (Figures 3 and 8)
MAPSCREENS = {"1920x1080", "1920x1080@125", "1920x1080@150"}

def env(path):
    L = open(path, encoding="utf-8").read().splitlines()
    e = {"job": int(L[0].split()[1]), "main": L[1], "head": L[2], "base": L[3]}
    for l in L[4:]:
        if '"Browser"' in l: e["chrome"] = l.split('"')[3]
        elif l.startswith("Model name"): e["cpu"] = l.split(":", 1)[1].strip()
        elif ".ttf" in l or ".otf" in l: e.setdefault("fonts", []).append(l.split(": ", 1)[1].replace('"', ""))
        elif l.startswith("v204="): e["builds"] = [x.split("=")[0] for x in l.split()]
    return e

def git(*a):
    try: return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True, check=True).stdout.strip()
    except Exception: return ""

def slim(c):
    b, i, v = c.get("between") or {}, c.get("inside") or {}, c.get("view") or {}
    p = v.get("picture") or {}
    g = (b.get("grids") or [])
    return {"screen": c["screen"], "mode": c["mode"], "tab": c["tab"], "version": c.get("version"), "w": c["w"], "h": c["h"],
            "rw": c["region"]["w"], "rh": c["region"]["h"], "between": b.get("share"), "emptyPx": b.get("emptyPx"), "boxes": b.get("boxes"),
            "tracks": g[0]["tracks"] if g else None, "usedFirstRow": g[0]["usedFirstRow"] if g else None,
            "holes": [[h["x"], h["y"], h["w"], h["h"], h["above"]] for h in (b.get("holes") or [])],
            "inside": i.get("share"), "labelLines": i.get("labelLines"), "labelFit": i.get("labelFit"), "orphans": i.get("orphans"), "tall": i.get("tall"),
            "window": v.get("share"), "pic": [p.get("w"), p.get("h"), p.get("drawnW"), p.get("drawnH"), p.get("letterbox")] if p else None,
            "underCard": v.get("underCard"), "windows": c.get("windows"), "tabStrip": c.get("tabStrip"),
            "map": c["map"] if (c["tab"] in SHOW and c["screen"] in MAPSCREENS) else None}

runs = []
for r in RUNS:
    jobs, labels, per = [], {}, {}
    for f in sorted(glob.glob(os.path.join(R16, r, "knoll521-job*", "knoll521", "*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        jd = os.path.dirname(os.path.dirname(f))
        e = env(glob.glob(os.path.join(jd, "env-*.txt"))[0])
        txt = open(glob.glob(os.path.join(jd, "knoll521-*.txt"))[0], encoding="utf-8").read()
        e.update(order=d["order"], when=d["when"], selftest=txt.splitlines()[0], fails=txt.count("FAIL"), measured=[x["label"] for x in d["results"]])
        jobs.append(e)
        if not labels:
            screens = d["screens"]
            shas = git("rev-list", "--reverse", f'{e["base"]}..{e["head"]}').split()
            labels["v204"] = {"sha": git("rev-list", "-n1", "dress-up-0.0.204")[:10], "subject": "tag dress-up-0.0.204, the version ^du_report(5) read"}
            labels["main"] = {"sha": e["base"][:10], "subject": git("log", "-1", "--format=%s", e["base"])}
            for k, s in enumerate(shas, 1): labels[f"c{k}"] = {"sha": s[:10], "subject": git("log", "-1", "--format=%s", s)}
        for res in d["results"]:
            per.setdefault(res["label"], {})[e["job"]] = {(c["screen"], c["mode"], c["tab"]): c for c in res["cases"]}
    # the noise floor: every case measured in more than one job, compared job against job
    maxshare = maxpx = 0; compared = 0; differ = {}
    for lab, js in per.items():
        ks = list(js)
        for a in range(len(ks)):
            for b in range(a + 1, len(ks)):
                for key, ca in js[ks[a]].items():
                    cb = js[ks[b]].get(key)
                    if not cb or not ca.get("between") or not cb.get("between"): continue
                    compared += 1
                    if ca["between"]["share"] != cb["between"]["share"]:
                        dk = f"{lab} {key[0]} {key[1]} {key[2]}"; differ.setdefault(dk, set()).update((ca["between"]["share"], cb["between"]["share"]))
                    maxshare = max(maxshare, abs((ca["between"]["share"] or 0) - (cb["between"]["share"] or 0)))
                    maxpx = max(maxpx, abs((ca["between"]["emptyPx"] or 0) - (cb["between"]["emptyPx"] or 0)))
    # the cases: for each build, the job that measured it on the most screens (job 1 first)
    cases = {}
    for lab, js in per.items():
        j = max(js, key=lambda k: (len(js[k]), -k))
        cases[lab] = [slim(c) for c in js[j].values() if "skip" not in c]
        labels.setdefault(lab, {})["skipped"] = sorted({c["skip"] for c in js[j].values() if "skip" in c})
        labels.setdefault(lab, {})["job"] = j
        labels[lab]["version"] = next((c["version"] for c in js[j].values() if c.get("version")), None)
    runs.append({"name": r, "jobs": jobs, "screens": screens, "labels": labels,
                 "noise": {"maxShare": round(maxshare, 4), "maxPx": maxpx, "compared": compared, "differ": {k: sorted(v) for k, v in differ.items()}}, "cases": cases})

# only the last run keeps its cases whole; the earlier ones keep the mean per build, screen and mode
for run in runs[:-1]:
    means = {}
    for lab, cs in run["cases"].items():
        for c in cs:
            if c["between"] is not None: means.setdefault(lab, {}).setdefault(f'{c["screen"]}|{c["mode"]}', []).append(c["between"])
    run["means"] = {lab: {k: round(statistics.mean(v), 4) for k, v in m.items()} for lab, m in means.items()}
    del run["cases"]
out = {"source": "GitHub Actions, workflow knoll521.yml on branch diag-521 (never merged); tools/checks/knoll521.mjs FULL=1", "runs": runs}
json.dump(out, open(os.path.join(HERE, "data", "whitespace.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# the panels counted in node (count_tabs.mjs), 0.0.204 and 0.0.398
SP = os.path.dirname(R16.rstrip("/"))
cnt = {}
for v, f in (("0.0.204", "v204_counts.json"), ("0.0.398", "main_counts.json")):
    d = json.load(open(os.path.join(SP, f), encoding="utf-8"))
    cnt[v] = {"tabs": [{k: t.get(k) for k in ("name", "part", "declared", "groups", "groupsShown", "shown", "chipsDeclared", "chipsShown")} for t in d["tabs"]],
              **{k: v2 for k, v2 in d.items() if k != "tabs"}}
json.dump(cnt, open(os.path.join(HERE, "data", "counts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# the drivers that measured (copied as they ran)
for f in ("r16/knoll521.mjs", "r16/knoll521.yml", "count_tabs.mjs"):
    p = os.path.join(SP, f)
    if os.path.exists(p): shutil.copy(p, os.path.join(HERE, "drivers", os.path.basename(f)))

# the first-window screenshots shown in Figure 4: the run's job 1, before (main) and after (its last build)
last = runs[-1]; after = max((l for l in last["cases"] if l.startswith("c")), key=lambda l: int(l[1:]))
shots = os.path.join(R16, last["name"], "knoll521-job1", "knoll521", "shots")
for f in glob.glob(os.path.join(HERE, "pictures", "shots", "*.webp")): os.remove(f)
for lab, tag in (("v204", "v204"), ("main", "before"), (after, "after")):
    for name in ("1920x1080-fs-Face", "1920x1080-fs-Controls", "1366x768-side-Body", "ipad-820x1180-fs-Face"):
        p = os.path.join(shots, lab, name + ".webp")
        if os.path.exists(p): shutil.copy(p, os.path.join(HERE, "pictures", "shots", f"{tag}-{name}.webp"))
print("runs:", RUNS, "after =", after, "noise:", [r["noise"] for r in runs])
