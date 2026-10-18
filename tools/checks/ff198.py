#!/usr/bin/env python3
"""(ticket 198, from ^du_report(3)'s step 3: "Find Firefox's lost frames after a session: a fresh Firefox for each case
(not a reload, which runs at 30 there), and each part of a round on its own: the places, the trips, the sliders, the
tabs") tools/leakff.py once per case, each its own Firefox: the control (only swimming), a whole round of changes, and
each part of a round alone (PART), two rounds each, the duck pond's frames measured fresh and after each round.
Prints each case's numbers and a table. Found (0.0.199): every case with a tune playing lost about 10 frames a second,
the music's clock standing still in Firefox's suspended audio (musicSeconds); fixed. Exits 1 when the music, a tab or
a whole round costs more than 5 frames a second against its own fresh start (or a case could not run).
  ff198.py <url>   env: CASES (a comma list, to run some)"""
import sys, os, re, subprocess, time
url = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
drv = os.path.join(here, "..", "leakff.py")
CASES = [("control", {"CONTROL": "1"}), ("whole round", {}), ("places", {"PART": "places"}), ("trips", {"PART": "trips"}),
         ("sliders", {"PART": "sliders"}), ("tabs", {"PART": "tabs"}), ("tabs-back", {"PART": "tabs-back"}),
         ("music", {"PART": "music"}), ("muted,tab:0", {"PART": "muted,tab:0"}), ("muted", {"PART": "muted"})] + \
        [(f"tab:{i}", {"PART": f"tab:{i}"}) for i in range(19)]
# (a tab case: one round; ROUNDS for the rest)
ROUNDS = os.environ.get("ROUNDS", "2")
# (by default, since the first run (each part of a round) found the tabs: the control, the tabs, the tabs then back to
# the first, and each tab alone)
# (since the second (each tab alone: every tab, even the Body tab already open, lost about 10 frames a second, and in
# each the music had started, on the first click): the music started with no click, and a click with the music muted)
# (since the third (the music started with no click lost them too; muted, no click, nothing lost): with the fix, the
# music's clock read only while the audio runs)
want = [c.strip() for c in os.environ.get("CASES", "").split(",") if c.strip()] or ["control", "music", "tab:0", "tabs", "whole round"]
rows, bad = [], 0
for name, env in CASES:
    if want and name not in want: continue
    t0 = time.time()
    p = subprocess.run([sys.executable, drv, url, "-", "1" if name != "control" else ROUNDS], env={**os.environ, **env, "NORELOAD": "1"}, capture_output=True, text=True, timeout=600)
    print(f"## {name} ({round(time.time() - t0)} s)", flush=True)
    print(p.stdout.rstrip(), flush=True)
    if p.returncode: print(p.stderr[-800:], flush=True)
    fps = [float(m.group(1)) for m in re.finditer(r"\] ([\d.]+) fps", p.stdout)]
    if len(fps) < 2: bad += 1; rows.append((name, None)); continue
    if name.startswith("tab:"):
        tn = re.search(r"TAB (.+)", p.stdout); name = (name + " " + tn.group(1).strip())[:24] if tn else name
    rows.append((name, fps[:3]))
print("\n  case          fresh   round 1  round 2   (fps, the duck pond swum right and left)")
for name, f in rows:
    print(f"  {name:24} " + ("could not run" if not f else "  ".join(f"{x:6.1f}" for x in f) + " " * (9 * (3 - len(f))) + f"   ({f[-1] - f[0]:+.1f})"))
lost = [name for name, f in rows if f and name != "control" and f[-1] - f[0] < -5]
print(f"{'FAIL' if lost else 'ok  '} no case losing more than 5 frames a second after its changes{': ' + ', '.join(lost) if lost else ''}")
bad += len(lost)
print("all ok" if not bad else f"{bad} failed")
sys.exit(1 if bad else 0)
