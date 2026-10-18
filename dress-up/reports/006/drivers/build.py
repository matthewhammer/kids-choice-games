#!/usr/bin/env python3
"""^du_report(6)'s page, from its data (data/report.json); the page's frame (its styles, the nav bar, the theme switch,
the What next buttons) as ^du_report(5)'s.
  python3 drivers/build.py   (from 006/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>Then and Now</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(6)")
assert "Then and Now" in HEAD and "^du_report(6)" in TAIL
S = D["sources"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):   # ("ticket 99" in the data: a ^ticket(N) link)
    return re.sub(r"ticket (\d+)", lambda m: ref(int(m.group(1)), "ticket"), E(s))
def src(keys): return " ".join(f'<a href="{E(S[k][1])}">[{i}]</a>' for k in keys for i in [list(S).index(k) + 1])
G = D["game"]
engines = "".join(f"<tr><td><b>{E(n)}</b><br><span class=\"muted\">{E(w)}</span></td><td>{E(what)}</td><td>{E(play)}</td><td>{E(tools)}</td><td>{src(ks)}</td></tr>" for n, w, what, play, tools, ks in D["engines"])
rows = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{tix(c)}</td><td class=\"tag\">{E(t)}</td></tr>" for a, b, c, t in D["rows"])
new = "".join(f"<li><b>{E(a)}</b> {tix(b)}</li>" for a, b in D["new"])
hugo = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{E(c)}</td></tr>" for a, b, c in D["hugo"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
unknown = "".join(f"<li>{E(u)}</li>" for u in D["unknown"])
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
same = sum(1 for r in D["rows"] if r[3].startswith("same"))
# Figure 2: the layers, then and now (drawn here; colours from the page's own)
FIG2 = '''<svg class="chart" viewBox="0 0 760 300" role="img" aria-label="The layers behind a picture: Sierra's and Dress Up's">
<style>.l{fill:var(--paper);stroke:var(--line);stroke-width:2}.t{font:600 14px system-ui;fill:var(--ink)}.s{font:12px system-ui;fill:var(--muted)}.b{fill:var(--soft);opacity:.55}.c{stroke:var(--bad);stroke-width:3;fill:none}.o{fill:var(--accent);opacity:.35}.f{fill:var(--alt)}</style>
<text class="t" x="20" y="22">Sierra (AGI, SCI): one picture, two hidden screens</text>
<g transform="translate(20 36)"><rect class="l" width="220" height="130" rx="6"/><text class="s" x="10" y="20">what you see: drawn by commands</text><path d="M20 110 L80 60 L140 110 Z M150 110 h50 v-40 h-50 z" fill="var(--muted)" opacity=".5"/></g>
<g transform="translate(260 36)"><rect class="l" width="220" height="130" rx="6"/><text class="s" x="10" y="20">priority: 12 bands, nearer lower</text>''' + "".join(f'<rect class="b" x="0" y="{30 + i * 8}" width="220" height="7" opacity="{0.15 + i * 0.07:.2f}"/>' for i in range(12)) + '''</g>
<g transform="translate(500 36)"><rect class="l" width="220" height="130" rx="6"/><text class="s" x="10" y="20">control: where one may walk</text><path class="c" d="M15 95 H205 M15 95 L60 125 M205 95 L170 125"/><text class="s" x="40" y="80">walls and lines</text></g>
<text class="t" x="20" y="196">Dress Up: one drawing, and what is in it</text>
<g transform="translate(20 208)"><rect class="l" width="220" height="80" rx="6"/><text class="s" x="10" y="20">the drawing: SVG written as code</text><path d="M20 70 L70 35 L120 70 Z M140 70 h50 v-28 h-50 z" fill="var(--muted)" opacity=".5"/></g>
<g transform="translate(260 208)"><rect class="l" width="220" height="80" rx="6"/><text class="s" x="10" y="20">objects, each with its depth</text><rect class="o" x="30" y="40" width="40" height="30" rx="4"/><rect class="o" x="110" y="32" width="50" height="38" rx="4"/><circle class="f" cx="92" cy="58" r="8"/><text class="s" x="80" y="78">friend between</text></g>
<g transform="translate(500 208)"><rect class="l" width="220" height="80" rx="6"/><text class="s" x="10" y="20">collision boxes, back line</text><path class="c" d="M15 42 H205" stroke-dasharray="6 4"/><rect class="c" x="40" y="48" width="40" height="22"/><rect class="c" x="130" y="50" width="50" height="20"/></g>
</svg>'''
body = f'''<main>
<p class="series">Dress Up reports · {ref(6)} · {D["date"]} · about Messed Up Dress Up, a game made with M and N · after {ref(5)}</p>
<h1>Then and now</h1>
<p class="sub">{E(D["question"])} The game at {G["version"]}; written from the sources listed at the end, and from the game's code and history (^ticket(295)).</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>The machinery is the same, found again.</b> A picture with invisible layers behind it: one saying what stands in front of what (Sierra's priority screen, in 12 bands; our objects, each with a depth) and one saying where one may walk (Sierra's control lines and control image, SCUMM's walk boxes; our collision boxes and back line). We came to each piece from M's and N's requests, not from the old engines.</li>
<li><b>Our pictures are drawings in code, as AGI's were, not paintings scanned in as SCI1's were from 1990.</b> So every part of a picture can be a setting and an object: placed, hidden, found by 🔬 Inspection.</li>
<li><b>Their editors stood beside a compiled game; ours are the game.</b> SCUMM's FLEM placed objects in rooms and MMUCUS spared scripters a rebuild; 🏞️ Background and 🗺️ World design change the picture the player is in, and a release is live in a minute: {G["versions"]} versions since {G["first"]}.</li>
<li><b>Of their eleven hard problems we meet {same} again.</b> Memory and disks have become the browser's painting on slow computers; ports to the Amiga and the Mac have become differences between browsers (today's trap doors swung in Chrome and not in Firefox).</li>
<li><b>New to our time:</b> the designers are the players, the programmer works from their words in minutes, the game is its own editor, nothing is installed, and the game is a prototype for Hazel's livelits.</li>
<li><b>Against Hugo's House of Horrors (1990):</b> on par in the feel of moving through drawn places, ahead in making your own; behind in everything that made it a game: a goal, things to carry, puzzles, people who talk. What next is about that.</li>
</ol></div>

<div class="headline editor"><b>Editor's note</b> ({E(D['editor_note'][0])}, {E(D['editor_note'][1])}): "{E(D['editor_note'][2])}"</div>

<h2 id="pictures">The same layers, then and now</h2>
<div class="pair"><figure><img src="pictures/trap-room.svg" alt="The trap room as drawn"><figcaption>The trap room, as the game draws it.</figcaption></figure>
<figure><img src="pictures/trap-room-boxes.svg" alt="The trap room with its collision boxes"><figcaption>The same, with 🔬 Inspection's collision boxes: our control screen.</figcaption></figure></div>
<p class="muted">Figure 1. Messed Up Dress Up {G["pictures"]["version"]}, from the picture archive's run of {G["pictures"]["run"]} (pictures since then add moss, boulder levers and lids). For Sierra's own visible and priority screens, see the AGI Wiki's pictures {src(["agi-priority", "agi-visual"])}: they are not ours to copy.</p>
{FIG2}
<p class="muted">Figure 2. The layers behind a picture: Sierra's, as the AGI and SCI documentation describes them {src(["agi-pic", "sci-pics"])}, and Dress Up's. Drawn for this report.</p>

<h2 id="engines">The engines and their editors</h2>
<div class="scroll"><table><tr><th>engine</th><th>what it drew, and how</th><th>how you played</th><th>its tools</th><th>sources</th></tr>{engines}</table></div>
<p class="muted">{E(D["footnotes"])}</p>

<h2 id="same">The same problems, then and now</h2>
<p>What made these games hard to make, from the sources, and what we meet now. The last column says whether the problem came back.</p>
<div class="scroll"><table><tr><th>problem</th><th>then</th><th>now, in Messed Up Dress Up</th><th></th></tr>{rows}</table></div>

<h2 id="new">What is new now</h2>
<ul>{new}</ul>

<h2 id="hugo">Hugo, and "on par"</h2>
<p>Matthew remembers playing Hugo in the mid 1990s: most likely Hugo's House of Horrors (1990) or a sequel {src(["hugo", "hugo-scummvm", "hugo-pcg"])}. His sense: "it feels like we are on par with that game play experience already".</p>
<div class="scroll"><table><tr><th></th><th>Hugo's House of Horrors (1990)</th><th>Messed Up Dress Up ({G["version"]})</th></tr>{hugo}</table></div>
<p>On par in the feel of being somewhere drawn and moving through it, and past it in making your own. Behind it in what made it a game.</p>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="unknown">What the sources did not say</h2>
<ul>{unknown}</ul>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from web sources (below), the game's code and its VERSIONS.md, and the dashboard's tickets. Nothing measured: this report compares designs. The pictures of Dress Up are the picture archive's; no picture of another game is copied here, only linked. The data is in <a href="data/report.json">data/report.json</a> and in this page; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(D, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = '<style>.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.pair img{width:100%;border:1px solid var(--line);border-radius:6px;background:var(--paper)}.muted{color:var(--muted)}td.tag{white-space:nowrap;color:var(--muted)}table{border-collapse:collapse;width:100%}td,th{border-top:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}.scroll{overflow-x:auto}figure{margin:0}figcaption{color:var(--muted);font-size:.9em}.sources li{max-width:none}</style>\n'
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
out = out.replace("(^ticket(295))", "(" + ref(295, "ticket") + ")")
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
