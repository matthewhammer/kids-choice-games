#!/usr/bin/env python3
"""^du_report(7)'s page, from its data (data/report.json); the page's frame (its styles, the nav bar, the theme switch,
the What next buttons) as ^du_report(5)'s and ^du_report(6)'s.
  python3 drivers/build.py   (from 007/)"""
import json, html, os, re
from collections import Counter
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>Stories and Stress</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(7)")
assert "Stories and Stress" in HEAD and "^du_report(7)" in TAIL
S = D["sources"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):   # ("ticket 99" and "^du_report(2)" in the data: links)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: "\0R" + m.group(1) + "\0", E(s))
    s = re.sub(r"ticket (\d+)", lambda m: ref(int(m.group(1)), "ticket"), s)
    return re.sub(r"\0R(\d+)\0", lambda m: ref(int(m.group(1))), s)
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
G, T, K = D["game"], D["tickets"], D["kinds"]
of = lambda w: [t for t in T if w in t[1].split()]
M, N = of("M"), of("N")
cM, cN = Counter(t[4] for t in M), Counter(t[4] for t in N)
story, tool = cM["story"], cM["tool"]
stressN = cN["stress"] + cN["edge"]
pct = lambda a, b: round(100 * a / b)
# Figure 1: each child's requests by kind, stacked bars with their counts
ORDER = ["story", "build", "music", "tool", "device", "fix", "explore", "character", "edge", "stress"]
COL = {"story": "var(--accent)", "build": "var(--alt)", "music": "#c084fc", "tool": "var(--muted)", "device": "#94a3b8", "fix": "#cbd5e1",
       "explore": "#86efac", "character": "#fcd34d", "edge": "var(--bad)", "stress": "#f97316"}
def bar(y, label, c, n):
    x, out = 120, [f'<text class="t" x="10" y="{y + 19}">{label}</text>']
    for k in ORDER:
        if not c[k]: continue
        w = 560 * c[k] / 22
        out.append(f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="28" fill="{COL[k]}" rx="3"><title>{E(K[k])}: {c[k]}</title></rect>')
        if w > 18: out.append(f'<text class="v" x="{x + w / 2:.1f}" y="{y + 19}" text-anchor="middle">{c[k]}</text>')
        x += w
    out.append(f'<text class="s" x="{x + 8:.1f}" y="{y + 19}">{n} requests</text>')
    return "".join(out)
legend = "".join(f'<g transform="translate({10 + (i % 5) * 148} {112 + (i // 5) * 22})"><rect width="12" height="12" fill="{COL[k]}" rx="2"/><text class="s" x="18" y="11">{E(k)}</text></g>' for i, k in enumerate(ORDER))
FIG1 = (f'<svg class="chart" viewBox="0 0 760 160" role="img" aria-label="Each child\'s requests by kind">'
        '<style>.t{font:600 14px system-ui;fill:var(--ink)}.s{font:12px system-ui;fill:var(--muted)}.v{font:600 12px system-ui;fill:#fff}</style>'
        + bar(20, "M", cM, len(M)) + bar(62, "N", cN, len(N)) + legend + '</svg>')
# Figure 2: by day, each child's requests
days = ["10-14", "10-15", "10-16", "10-17", "10-18"]
def day_bars():
    out = []
    for i, d in enumerate(days):
        m, n = sum(t[2] == d for t in M), sum(t[2] == d for t in N),
        x = 70 + i * 135
        for j, (v, col, w) in enumerate([(m, "var(--accent)", "M"), (n, "var(--bad)", "N")]):
            h = 14 * v
            out.append(f'<rect x="{x + j * 40}" y="{150 - h}" width="34" height="{h}" fill="{col}" rx="3"/><text class="v2" x="{x + j * 40 + 17}" y="{144 - h}" text-anchor="middle">{v}</text><text class="s" x="{x + j * 40 + 17}" y="166" text-anchor="middle">{w}</text>')
        out.append(f'<text class="t" x="{x + 37}" y="186" text-anchor="middle">Oct {d[3:]}</text>')
    return "".join(out)
FIG2 = ('<svg class="chart" viewBox="0 0 760 196" role="img" aria-label="Requests by day">'
        '<style>.t{font:600 13px system-ui;fill:var(--ink)}.s{font:12px system-ui;fill:var(--muted)}.v2{font:600 12px system-ui;fill:var(--ink)}</style>' + day_bars() + '</svg>')
# Figure 3: what their requests reached (each request counts once per subsystem it named)
reach = {w: Counter(r.strip() for t in L for r in t[5].split(",")) for w, L in (("M", M), ("N", N))}
subs = sorted(set(reach["M"]) | set(reach["N"]), key=lambda s: -(reach["M"][s] + reach["N"][s]))
reach_rows = "".join(f'<tr><td>{E(s)}</td><td class="num">{reach["M"][s] or ""}</td><td class="num">{reach["N"][s] or ""}</td></tr>' for s in subs)
rows = "".join(f'<tr><td>{ref(t[0], "ticket")}</td><td>{E(t[1])}</td><td class="tag">Oct {t[2][3:]}</td><td>{E(t[3])}</td><td class="tag">{E(t[4])}</td><td>{tix(t[6])}</td></tr>'
               for t in sorted(T, key=lambda t: (t[1] != "M N", t[1], t[0])))
excluded = ", ".join(f'{ref(i, "ticket")} ({E(w)})' for i, w in D["excluded"])
steps = D["next"]
steps_html = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(steps, 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
subsM, subsN = len(reach["M"]), len(reach["N"])
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(7)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(6)}</p>
<h1>Stories and stress</h1>
<p class="sub">{E(D["question"])} Read against every ticket on the dashboard that came from either of them, open and closed, up to the game at {G["version"]}.</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>N's half holds.</b> Of N's {len(N)} requests, {stressN} ({pct(stressN, len(N))}%) push the game to a limit: {cN["stress"]} by load (as many cauldrons as he could put in a place, until the black laptop froze; then again past the warnings; a room made of bubbles, 521 animations at first) and {cN["edge"]} by its rules at their edges (falling into the pits, boulders, being hit by one, and asking to pull the lever from where the boulder lands).</li>
<li><b>M's half holds, with a second half of its own.</b> {story} of M's {len(M)} requests ({pct(story, len(M))}%) make room for a story or for something of one's own: her castle, its colours and her letter, a dining room with 4 to 18 places at table, a grass hut and its rooms and a village of them, ears, lichen, and no skeletons. But {tool} more ({pct(tool, len(M))}%) are about the tools themselves (World design's arrows and an "all passageways" button, a dark theme, the version notes and a pop-up for new ones): M is the game's first critic of how it is made.</li>
<li><b>Both reach across the whole system:</b> M's requests named {subsM} parts of it, N's {subsN} (Figure 3). M's spread wider; N's went deeper into a few: performance, the castle's trap room, animation.</li>
<li><b>Each also found faults the other did not:</b> M's iPad lost the levers' touches, and her lever and trap door would not join; N's old laptop could not walk in our imagination, which became the speed gate's slow tier ({ref(2)}).</li>
<li><b>The record cannot say why.</b> It holds what Matthew relayed, in his words; the children's own reasons are not in it. Step 1 of What next asks them.</li>
</ol></div>

<h2 id="kinds">What they asked for</h2>
{FIG1}
<p class="muted">Figure 1. Each request sorted into one kind, by reading its ticket (the table below gives each). The castles, ^ticket(67), are counted for both: each of them has one.</p>
{FIG2}
<p class="muted">Figure 2. Their requests by the day the ticket was made, 14 to 18 October 2026. M's peaked on the 15th (the castle's rooms) and the 18th (the grass hut, music, the version pop-up); N's were steadier, 0 to 4 a day, the cauldrons on the 17th and the boulders on the 18th.</p>

<h2 id="pictures">A room from each</h2>
<div class="pair"><figure><img src="pictures/dining-room.svg" alt="The castle's dining room"><figcaption>M's dining room (^ticket(110)): a long table, places for 4 to 18, candles and chandeliers.</figcaption></figure>
<figure><img src="pictures/trap-room.svg" alt="The castle's trap room"><figcaption>The trap room, where N's pits (^ticket(162)) and boulders (^ticket(323)) are.</figcaption></figure></div>
<p class="muted">Messed Up Dress Up {G["pictures"]["version"]}, from the picture archive's run of {G["pictures"]["run"]}: before the grass hut, the bubble room and the boulder levers, which came later that day.</p>

<h2 id="m">M: stories, and the tools to tell them</h2>
<p>M's requests make places to live and gather in, and make what is hers recognisable: the castle in her colours with her letter readable on its banners (^ticket(72)); a dining room for a whole household (^ticket(110)); a grass hut with a living room, a bedroom and a potion room, made round, then a cluster of huts round a center (^ticket(278), ^ticket(281), ^ticket(282)); ears for the friend (^ticket(125)); lichen to dress rocks and walls (^ticket(319)). And she asked for the scary things to go (^ticket(73)), which became a rule for the whole game: nothing scary unless asked for.</p>
<p>The other strand is the making. She found that World design let a way out point off the map, and asked for those arrows to be disabled (^ticket(189)); she asked for one button to join every pair of neighbouring squares (^ticket(195)); a dark theme (^ticket(194)); and, to follow the work as it happened, the version notes in the game and a pop-up when a new version is out (^ticket(200), ^ticket(302)). These are a designer's requests about her own tools.</p>

<h2 id="n">N: the limits, by load and by rule</h2>
<p>N tests what happens when there is too much, or when the rules are taken literally. On the black laptop he put cauldrons into a place, with their fumes, until the computer ground to a halt (^ticket(201)); given red boxes that marked the costliest things, he ignored them and kept going until it froze again (^ticket(203)), so the game now refuses more until the red box is dealt with. The bubble room he asked for began at 521 animations (^ticket(290)).</p>
<p>The other strand is consequence. He asked to fall into the castle's pits and land in the dungeon below (^ticket(162)), for boulders to fall onto the pits (^ticket(323)), for the friend to burst into bubbles when one lands on them (^ticket(349)), and, once a lever had to be walked to, for a way to pull it from where the boulder falls (^ticket(364)). This is play at the edge of the rules, much as a fuzz test feeds a program what no one expected {src("miller")}.</p>

<h2 id="disagree">Where the record disagrees</h2>
<ul>
<li><b>M is not only a story-teller.</b> A quarter of her requests ({tool} of {len(M)}) improve the tools; on this record she is as much the game's first UX critic as its storyteller.</li>
<li><b>Not all of N's are stress.</b> His first was to explore: inside the tents, the cave behind the waterfall (^ticket(49)); and a visibility panel, to make the friend invisible or a ghost (^ticket(51)), is play with the character rather than a test of the system.</li>
<li><b>Devices shaped both.</b> Two of M's requests come from her iPad (no USB port for the controller, ^ticket(150); touches lost on the levers, ^ticket(350)), and one of N's from his old laptop (^ticket(154)): what they own decided part of what they found.</li>
<li><b>Counting is coarse.</b> One kind per request, sorted by Claude from Matthew's words; a second reader might move a few. The shares above are not sensitive to one or two moves: N's stays above half, M's story share above a third.</li>
</ul>

<h2 id="record">The record</h2>
<div class="scroll"><table><thead><tr><th>ticket</th><th>from</th><th>made</th><th>what was asked</th><th>kind</th><th>what it cost or exposed</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="muted">Left out, though the search found them: {excluded}.</p>
<h3 id="reach">What their requests reached</h3>
<table style="max-width:420px"><thead><tr><th>part of the game</th><th class="num">M</th><th class="num">N</th></tr></thead><tbody>{reach_rows}</tbody></table>
<p class="muted">Figure 3. Each request counted once for each part of the game it named.</p>

<h2 id="related">Related work</h2>
<p>Children have been design partners in making technology for them since Druin's cooperative inquiry {src("druin")}, and informants at chosen stages of a design before that {src("scaife")}. Here they are both at once, with a turnaround of hours: they ask, and the version with their request is live the same afternoon ({ref(6)}). N's way with the game resembles fuzz testing {src("miller")}: inputs no designer would choose, in volume, until something breaks.</p>

<h2 id="next">What next</h2>
<ol class="steps">{steps_html}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from the dashboard's tickets (open and closed; every Dress Up ticket whose text names M or N, read one by one, with the false matches left out as listed), the game's VERSIONS.md, and the sources below. Nothing measured: the counts are of tickets, each sorted into one kind by reading it. The pictures are the picture archive's. The data is in <a href="data/report.json">data/report.json</a> and in this page; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(D, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
body = re.sub(r"\^ticket\((\d+)\)", lambda m: ref(int(m.group(1)), "ticket"), body)
extra = '<style>.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.pair img{width:100%;border:1px solid var(--line);border-radius:6px;background:var(--paper)}.muted{color:var(--muted)}td.tag{white-space:nowrap;color:var(--muted)}td.num,th.num{text-align:right}table{border-collapse:collapse;width:100%}td,th{border-top:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}.scroll{overflow-x:auto}figure{margin:0}figcaption{color:var(--muted);font-size:.9em}.sources li{max-width:none}</style>\n'
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
