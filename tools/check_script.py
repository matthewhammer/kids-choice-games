#!/usr/bin/env python3
"""Before a release: the page's script checked by node --check (a duplicate
const once broke the whole page). Since ticket 178 the script is in parts,
<script src="js/NN-name.js?v=X.Y.Z"> in index.html: they are checked joined
in the page's order, as one script, so a const declared in two parts is
caught as before; and every part, and style.css, must carry the page's own
version (VERSION.number), or a cached old part could meet a newer page.
version.json beside the page must name the same number.

  check_script.py <page.html>"""
import json, os, re, subprocess, sys, tempfile
page = sys.argv[1]
base = os.path.dirname(os.path.abspath(page))
html = open(page, encoding="utf-8").read()
inline = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
srcs = [s for s in re.findall(r'<script[^>]*\bsrc="([^"]+)"', html) if not s.startswith(("http://", "https://"))]   # (ticket 296: the nav bar's script is not a part of the game)
parts = []
for s in srcs:
    path = os.path.join(base, s.split("?")[0])
    parts.append((s, open(path, encoding="utf-8").read()))
js = "\n;\n".join([t for _, t in parts] + inline)
version = re.search(r'const VERSION = \{ number: "([0-9.]+)"', js)
bad = 0
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
    f.write(js)
r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
os.unlink(f.name)
print(f"script: {len(parts)} parts and {len(inline)} inline, {len(js.splitlines())} lines joined, " + ("ok" if r.returncode == 0 else "FAILS\n" + r.stderr))
bad += r.returncode != 0
# (strict mode is per file: each part declares it, as the page's one script did)
for s, t in parts:
    if not t.startswith('"use strict";'):
        print(f"{s}: does not start with \"use strict\";"); bad += 1
if version:
    v = version.group(1)
    for ref in srcs + re.findall(r'<link[^>]*\bhref="([^"]+\.css[^"]*)"', html):
        if not ref.endswith("?v=" + v):
            print(f"{ref}: not ?v={v}, the page's version"); bad += 1
    # (0.0.219 went out with an empty version.json: every open copy's update check read nothing)
    vj = os.path.join(base, "version.json")
    if os.path.exists(vj):
        try:
            n = json.load(open(vj, encoding="utf-8")).get("number")
        except ValueError as e:
            n = None; print(f"version.json: not JSON ({e})"); bad += 1
        else:
            if n != v:
                print(f"version.json: number {n!r}, not {v}, the page's version"); bad += 1
elif parts:
    print("no VERSION found in the script"); bad += 1
sys.exit(1 if bad or not (parts or inline) else 0)
