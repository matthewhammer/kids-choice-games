#!/usr/bin/env python3
"""Before a release: the page's inline <script>, checked by node --check (a
duplicate const once broke the whole page).   check_script.py <page.html>"""
import os, re, subprocess, sys, tempfile
html = open(sys.argv[1], encoding="utf-8").read()
blocks = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
bad = 0
for i, js in enumerate(blocks):
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(js)
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    os.unlink(f.name)
    print(f"script {i + 1} of {len(blocks)}: {len(js.splitlines())} lines, " + ("ok" if r.returncode == 0 else "FAILS\n" + r.stderr))
    bad += r.returncode != 0
sys.exit(1 if bad or not blocks else 0)
