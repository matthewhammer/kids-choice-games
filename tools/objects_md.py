#!/usr/bin/env python3
"""(tickets 99 and 180) OBJECTS.md, the formal list of what stands in each
place, with pictures: from objects180.mjs's objects.json (made on GitHub's
Chrome) and its pictures, copied to dress-up/objects/. Each place keeps the
notes written under its heading in the OBJECTS.md it replaces.

  objects_md.py <objects.json> <OBJECTS.md>"""
import json, re, sys

src, out = sys.argv[1:3]
data = json.load(open(src))
version, places = data["version"], data["places"]

# the notes under each heading of the OBJECTS.md being replaced: the lines
# between the heading and its table (or the next heading), pictures left out
notes = {}
try:
    old = open(out).read().split("\n")
    head = None
    for line in old:
        if line.startswith("## "):
            head = line[3:].strip(); notes[head] = []; continue
        if head is None: continue
        if line.startswith("<img"): continue   # (a picture: made again)
        if line.startswith("|"): head = None; continue   # (the table: made again; the notes end there)
        if line.startswith("Nothing stands here: the friend is in front of everything."): continue
        notes[head].append(line)
except FileNotFoundError:
    pass

esc = lambda s: s.replace("|", "\\|").replace("<", "&lt;")
lines = [
    "# Dress Up: what stands in each place",
    "",
    f"The formal list of every place's objects (ticket 99), as of {version}, at the default settings, each with its picture (ticket 180). A slider that adds things (more toys, more ducks, more chairs) adds objects.",
    "",
    "- **Depth** is the y where a thing stands on the ground, in the stage's units: the ground line is at 320, and the friend's feet can be anywhere from about 11 (far) to 406 (near).",
    "- The friend is drawn behind every object deeper than their feet, and in front of the rest. **front** means in front of everything: the friend is always under it (darkness, light, steam, the sign toward us).",
    "- Flat things on the ground and the backdrop (sky, far hills, back walls and what hangs on them) are not objects. What is drawn into a place but is not an object, the audit of ticket 284, is [BAKED-IN.md](BAKED-IN.md); since 0.0.208 every object here can be placed in any place (📦 from the places).",
    "- In the game each place shows this list in its background tab, with an 👁️ chip per object to hide or show it.",
    "- **The pictures:** each place as it starts, the friend hidden and its animations held still; each object clipped from that picture by its box on the screen, so what stands near it shows too. Drawn by GitHub's headless Chrome.",
    "",
    "Made by `tools/checks/objects180.mjs` (on GitHub's computers: push a branch carrying it) and `tools/objects_md.py`. Make it again after changing what stands in a place.",
    "",
]
for r in places:
    label = r["label"]
    lines.append(f"## {label}")
    lines.append("")
    kept = [l for l in notes.get(label, [])]
    while kept and not kept[0].strip(): kept.pop(0)
    while kept and not kept[-1].strip(): kept.pop()
    if kept:
        lines += kept + [""]
    lines.append(f'<img src="objects/{r["picture"]}" alt="{esc(label)}, as it starts" width="480">')
    lines.append("")
    if not r["objects"]:
        if not any("Nothing stands here" in l for l in kept):
            lines.append("Nothing stands here: the friend is in front of everything.")
            lines.append("")
        continue
    lines.append("| depth | object | picture |")
    lines.append("|---:|---|---|")
    for o in r["objects"]:
        pic = f'<img src="objects/{o["picture"]}" alt="{esc(o["name"])}" height="72">' if o.get("picture") else ""
        lines.append(f"| {o['z']} | {esc(o['name'])} | {pic} |")
    lines.append("")
open(out, "w").write("\n".join(lines))
print(len(places), "places,", sum(len(r["objects"]) for r in places), "objects,",
      sum(1 for r in places for o in r["objects"] if o.get("picture")), "pictures;", sum(1 for r in places if any(l.strip() for l in notes.get(r["label"], []))), "places kept their notes")
