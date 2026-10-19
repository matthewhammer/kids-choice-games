#!/usr/bin/env python3
"""^du_report(9)'s page, from its data (data/report.json); the page's frame as ^du_report(5)'s to (8)'s.
  python3 drivers/build.py   (from 009/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>One Size, Every View</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(9)")
assert "One Size, Every View" in HEAD and "^du_report(9)" in TAIL
S, G = D["sources"], D["game"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    return re.sub(r"ticket (\d+)", lambda m: "ticket " + ref(int(m.group(1)), "ticket"), s)
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
# Figure 1: each door's share for the child (0.5), the default and the adult (1.5), against the crawl line, 0.97
doors = D["doors"]; X0, W, MAXV = 330, 430, 2.6
x = lambda v: X0 + W * min(v, MAXV) / MAXV
rows = ""
for i, (name, where, v) in enumerate(doors):
    y = 14 + i * 26
    rows += (f'<g transform="translate(0 {y})"><text class="t" x="0" y="15">{E(name)}</text>'
             f'<line x1="{x(0.5 * v):.1f}" y1="10" x2="{x(1.5 * v):.1f}" y2="10" stroke="var(--line)" stroke-width="2"/>'
             f'<circle cx="{x(0.5 * v):.1f}" cy="10" r="4" fill="var(--muted)"/><circle cx="{x(v):.1f}" cy="10" r="6" fill="var(--accent)"/>'
             f'<circle cx="{x(1.5 * v):.1f}" cy="10" r="4" fill="none" stroke="var(--bad)" stroke-width="2"/></g>')
h = 30 + 26 * len(doors)
crawl = x(0.97)
FIG1 = (f'<svg class="chart" viewBox="0 0 800 {h + 34}" role="img" aria-label="Each door\'s share of the friend, for a child, the default and an adult, against the crawl line">'
        '<style>.t{font:600 12px system-ui;fill:var(--ink)}.v{font:11px system-ui;fill:var(--muted)}</style>' + rows +
        f'<line x1="{crawl:.1f}" y1="6" x2="{crawl:.1f}" y2="{h}" stroke="var(--bad)" stroke-dasharray="4 3"/><text class="v" x="{crawl + 4:.1f}" y="{h + 28}">0.97: crawl beyond</text>'
        f'<text class="v" x="{X0}" y="{h + 12}">0</text><text class="v" x="{x(1):.1f}" y="{h + 12}">1</text><text class="v" x="{x(2):.1f}" y="{h + 12}">2</text></svg>')
# (the chart as a picture of its own, for the series' card: plain colours, as an image cannot read the page's)
os.makedirs(os.path.join(HERE, "pictures"), exist_ok=True)
plain = FIG1.replace('class="chart" ', 'xmlns="http://www.w3.org/2000/svg" ').replace("var(--ink)", "#1f2937").replace("var(--muted)", "#6b7280").replace("var(--line)", "#d1d5db").replace("var(--accent)", "#7c6cf0").replace("var(--bad)", "#e5484d")
open(os.path.join(HERE, "pictures", "doors.svg"), "w", encoding="utf-8").write(plain.replace("<svg ", '<svg style="background:#ffffff" ', 1))
views = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{E(c)}</td><td>{E(d)}</td></tr>" for a, b, c, d in D["views"])
before = "".join(f"<tr><td><b>{E(a)}</b></td><td class=\"num\">{b:.2f}</td><td class=\"num\">{c:.2f}</td><td>{E(d)}</td></tr>" for a, b, c, d in D["before"])
shapes = "".join(f"<tr><td><b>{E(a)}</b></td><td class=\"num\">{b:.2f}{' · crawls' if b > 0.97 else ''}</td><td class=\"num\">{c:.2f}{' · crawls' if c > 0.97 else ''}</td></tr>" for a, b, c in D["shapes"])
door_rows = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td class=\"num\">{0.5 * v:.2f}</td><td class=\"num\">{v:.2f}</td><td class=\"num\">{1.5 * v:.2f}</td></tr>" for a, b, v in doors)
hard = "".join(f"<li><b>{E(a)}.</b> {E(b)}</li>" for a, b in D["hard"])
choices = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{E(c)}</td></tr>" for a, b, c in D["choices"])
left = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td></tr>" for a, b in D["left"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(9)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(8)}</p>
<h1>One size, every view</h1>
<p class="sub">{E(D["question"])} The game at {G["version"]}: {G["parts"]} script parts, {G["lines"]:,} lines, {G["checks"]} checks. Measured in the game itself, with the default friend, an adult (size 150), a small child (size 50) and a short-legged friend.</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>Inside, the friend's size follows their own body; outside on the tree's porches and bridges, it did not.</b> The bridges set everyone to one height, smaller than inside, and a tree room's door to the next house was too low even for the default friend: so the default crawled through it inside, yet walked in through the same doorway from the porch, small (Matthew's save, legs 140, is the default). Since 0.0.302 both views scale the body the same way, and the door fits the default.</li>
<li><b>One reference body, doors made for it, one rule.</b> The default friend takes 0.68 to 0.91 of every door made for it, inside and out; any friend crawls where their crown would be over 0.97 of the door. So the default and a child walk, an adult crawls, the same both ways.</li>
<li><b>Three doors were too low for the default</b> and were raised: a tree room's door to the next house (1.27 of it), the witch's door out (1.10), the greenhouse's arches (1.04).</li>
<li><b>Left for a decision:</b> the house's front door is five times the friend's height, because the house is drawn without the perspective the friend gets there; and the pictures entered whole (the witch's hut, the tents, the cave) have no door to judge from outside.</li>
<li><b>Why it is hard here:</b> games size doors to one known character; here the player shapes the body, so every door is judged at run time against the body as it is, and every view must scale that body, never replace it with a fixed height.</li>
</ol></div>

<h2 id="views">How each view sizes the friend</h2>
<div class="scroll"><table><thead><tr><th>view</th><th>the rule</th><th>does the body's shape count?</th><th>where</th></tr></thead><tbody>{views}</tbody></table></div>

<h2 id="doors">Every door, for the three reference friends</h2>
{FIG1}
<p class="muted">Figure 1. Each door's share of the friend's height, standing at it: a small child (grey dot, size 50), the default (the filled dot, legs 140, size 100), an adult (red ring, size 150). Beyond the dashed line, 0.97, a friend crawls. The share scales straight with the size slider. Measured in the game at {G["version"]}, every place, castle room and tree room.</p>
<div class="scroll"><table><thead><tr><th>door</th><th>where</th><th class="num">child</th><th class="num">default</th><th class="num">adult</th></tr></thead><tbody>{door_rows}</tbody></table></div>

<h2 id="tree">The tree house, inside and out</h2>
<div class="scroll"><table><thead><tr><th>the same friend</th><th class="num">the room's door, inside</th><th class="num">the cabin's door, outside</th></tr></thead><tbody>{shapes}</tbody></table></div>
<p class="muted">The default friend before and after 0.0.302:</p>
<div class="scroll"><table><thead><tr><th>door</th><th class="num">before</th><th class="num">after</th><th>what changed</th></tr></thead><tbody>{before}</tbody></table></div>

<h2 id="hard">Why a friend the player shapes makes this harder</h2>
<ul>{hard}</ul>

<h2 id="choices">The choices</h2>
<div class="scroll"><table><thead><tr><th>choice</th><th>gives</th><th>costs</th></tr></thead><tbody>{choices}</tbody></table></div>

<h2 id="left">What is left</h2>
<div class="scroll"><table><thead><tr><th>where</th><th>why</th></tr></thead><tbody>{left}</tbody></table></div>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from ticket 352: {tix(D["trigger"])} Every share was measured in the game in the app's browser: for each door with a shape, the friend's crown height at the door's depth (the rule doorTooLow uses {src("doortoolow")}) over the door's opening, in every place, castle room and tree room, with the default body; the adult's and child's shares follow from the size slider, which scales the friend straight. The tree house's pairs were measured with each body and are kept by a check {src("check")}; the fix is in 0.0.302 {src("fix")}. The data is in <a href="data/report.json">data/report.json</a>; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(D, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = '<style>.muted{color:var(--muted)}td.num,th.num{text-align:right}table{border-collapse:collapse;width:100%}td,th{border-top:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}.scroll{overflow-x:auto}.sources li{max-width:none}</style>\n'
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
