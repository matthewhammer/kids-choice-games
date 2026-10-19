#!/usr/bin/env python3
"""^du_report(10)'s page, from its data (data/report.json) and its pictures (pictures/v<version>/<pose>.svg, each
version's game drawing each pose through its own Body tab); the page's frame as ^du_report(5)'s to (9)'s.
  python3 drivers/build.py   (from 010/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>Pose by Pose</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(10)")
assert "Pose by Pose" in HEAD and "^du_report(10)" in TAIL
S, G, V = D["sources"], D["game"], D["versions"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"[Tt]ickets? (\d+)( and (\d+))?", lambda m: ("Ticket " if m.group(0)[0] == "T" else "ticket ") + ref(int(m.group(1)), "ticket") + ((" and " + ref(int(m.group(3)), "ticket")) if m.group(3) else ""), s)
    return s
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
head = "<tr><th>pose</th>" + "".join(f"<th>{E(v)}</th>" for _, v in V) + "</tr>"
rows = ""
for key, name, how in D["poses"]:
    cells = ""
    for vk, vn in V:
        st = D["grid"][vk][key]
        if st == "drawn": cells += f'<td><a href="pictures/{vk}/{key}.svg"><img loading="lazy" src="pictures/{vk}/{key}.svg" alt="{E(name)} at {vn}"></a></td>'
        else: cells += f'<td class="none">{"not yet" if st != "missing" else "not drawn"}</td>'
    rows += f'<tr><th class="pose" id="pose-{E(key)}">{E(name)}</th>{cells}</tr>'
gallery = f'<div class="scroll"><table class="gallery"><thead>{head}</thead><tbody>{rows}</tbody></table></div>'
howlist = "".join(f'<li><b><a href="#pose-{E(k)}">{E(n)}</a>:</b> {tix(h)}</li>' for k, n, h in D["poses"])
found = "".join(f"<li><b>{E(a)}.</b> {tix(b)}</li>" for a, b in D["found"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(10)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(9)}</p>
<h1>Pose by pose</h1>
<p class="sub">{E(D["question"])} Fifteen poses (crawling from three sides), each drawn by seven versions of the game, from 0.0.30 to 0.0.303, each version through its own 🧍 Body tab, as a player's tap does. The game at {G["version"]}: {G["parts"]} script parts, {G["lines"]:,} lines.</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>One skeleton, posed by angles, moved by moments, turned by facing.</b> No pose is a picture of its own: every one is the same joints (shoulders, elbows, hands, hips, knees, feet) with angles set (a pose), plus a turn of each joint for this moment of a stride or a stroke (an animation, in time with the music), drawn toward us, in profile, away, or three-quarters.</li>
<li><b>At 0.0.30 the friend could only stand, toward us;</b> by 0.0.60 they turned to the side; by 0.0.90 there were animations (walking, running, crawling, swimming, climbing, crouching) and poses (sitting, cross-legged, dancing, a hug).</li>
<li><b>Crawling changed most, toward us and away:</b> from the side the friend crawled on all fours from the first; toward us or away only since 0.0.256 (ticket 286): the face low and the hands flat on the floor, or the back seen short with the soles up. Lying down and walking on stairs are new since 0.0.250.</li>
<li><b>The picture archive never showed three poses:</b> sitting, cross-legged and dancing were archived standing at every run, because it set the pose alone and a pose's limbs come with the Body tab's tap. Fixed tonight, from the next run.</li>
<li><b>What turns with the body, and what keeps the world's up:</b> a tank on the back turns with the back (it was on the belly crawling toward us); a diving hose keeps rising when the body lies or swims flat.</li>
</ol></div>

<h2 id="gallery">Every pose, seven versions</h2>
<p class="muted">Each picture is the game of that version drawing the default friend in the dressing room, the pose set as its 🧍 Body tab sets it. "Not yet": that version drew the friend standing for it, having no such pose. Tap a picture to see it alone.</p>
{gallery}

<h2 id="how">How each is drawn now</h2>
<ul>{howlist}</ul>

<h2 id="found">Found on the way</h2>
<ul>{found}</ul>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from ticket 356: {tix(D["trigger"])} Each version's game was taken from its release tag {src("versions")} and served on the laptop; in the app's browser each drew the default friend in each pose, the pose set through its own set() (the Body tab's way), and the picture was kept as its SVG (moving parts left out). 0.0.140 was skipped: it shipped unable to load; 0.0.150 stands in. The two rows of crawling toward us and away, and the 0.0.303 column of each, came from 0.0.305, whose drawing of the friend is unchanged since 0.0.303. The archive's own pose pictures {src("archive")} could not serve: they drew three poses standing. How each is drawn comes from the game's code and agent-instructions.md {src("instructions")}. The data is in <a href="data/report.json">data/report.json</a>; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(D, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = ('<style>.muted{color:var(--muted)}table{border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:4px 6px;vertical-align:middle;text-align:center}'
         '.scroll{overflow-x:auto}.gallery img{width:84px;height:110px;object-fit:contain;background:#fffdf8;border-radius:4px}.gallery th.pose,.gallery thead th:first-child{text-align:left;white-space:nowrap;position:sticky;left:0;background:var(--bg);z-index:1}'
         '.gallery td.none{color:var(--muted);font-size:.85em}.sources li{max-width:none}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
