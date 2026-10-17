#!/usr/bin/env python3
"""Before a release: the page's script checked by node --check (a duplicate
const once broke the whole page). Since ticket 178 the script is in parts,
<script src="js/NN-name.js?v=X.Y.Z"> in index.html: they are checked joined
in the page's order, as one script, so a const declared in two parts is
caught as before; and every part, and style.css, must carry the page's own
version (VERSION.number), or a cached old part could meet a newer page.

  check_script.py <page.html>"""
import os, re, subprocess, sys, tempfile
page = sys.argv[1]
base = os.path.dirname(os.path.abspath(page))
html = open(page, encoding="utf-8").read()
inline = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
srcs = re.findall(r'<script[^>]*\bsrc="([^"]+)"', html)
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
elif parts:
    print("no VERSION found in the script"); bad += 1
sys.exit(1 if bad or not (parts or inline) else 0)
