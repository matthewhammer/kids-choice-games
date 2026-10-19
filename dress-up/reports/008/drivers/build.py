#!/usr/bin/env python3
"""^du_report(8)'s page, from its data (data/report.json); the page's frame as ^du_report(5)'s, (6)'s and (7)'s.
  python3 drivers/build.py   (from 008/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>Piece by Piece</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(8)")
assert "Piece by Piece" in HEAD and "^du_report(8)" in TAIL
S, G = D["sources"], D["game"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    if kind == "report": return f'<a class="ref" href="https://matthewhammer.org/hazel/performance-analysis/{n:03d}/"><code><b>^report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"\^report\((\d+)\)", lambda m: ref(int(m.group(1)), "report"), s)
    s = re.sub(r"tickets? (\d+)( and (\d+))?", lambda m: "ticket " + ref(int(m.group(1)), "ticket") + ((" and " + ref(int(m.group(3)), "ticket")) if m.group(3) else ""), s)
    s = re.sub(r"PR #(\d+)", lambda m: f'<a href="https://github.com/hazelgrove/hazel/pull/{m.group(1)}">hazelgrove/hazel#{m.group(1)}</a>', s)
    return s
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
inv = D["inventory"]
COL = {"pure": "var(--accent)", "runtime": "var(--bad)", "tool": "var(--muted)"}
tot = sum(r[2] for r in inv); pure = sum(r[2] for r in inv if r[5] == "pure")
mx = max(r[2] for r in inv)
bars = "".join(f'<g transform="translate(0 {12 + i * 30})"><text class="t" x="0" y="17">{E(r[0])}</text>'
               f'<rect x="230" y="2" width="{max(2, 460 * r[2] / mx):.1f}" height="20" rx="3" fill="{COL[r[5]]}"/>'
               f'<text class="v" x="{236 + 460 * r[2] / mx:.1f}" y="17">{r[2]:,} lines · {E(r[5])}</text></g>' for i, r in enumerate(inv) if r[2])
FIG1 = (f'<svg class="chart" viewBox="0 0 800 {20 + 30 * sum(1 for r in inv if r[2])}" role="img" aria-label="The game\'s code by part, pure or runtime">'
        '<style>.t{font:600 13px system-ui;fill:var(--ink)}.v{font:12px system-ui;fill:var(--muted)}</style>' + bars + '</svg>')
inv_rows = "".join(f"<tr><td><b>{E(a)}</b><br><span class=\"muted\">{E(parts)}</span></td><td class=\"num\">{n:,}</td><td>{E(what)}</td><td>{E(on)}</td><td class=\"tag\">{E(k)}</td></tr>" for a, parts, n, what, on, k in inv)
has = "".join(f"<li><b>{E(a)}:</b> {tix(b)}</li>" for a, b in D["has"])
lacks = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{E(c)}</td></tr>" for a, b, c in D["lacks"])
sched = lambda rows: "".join(f"<tr><td class=\"tag\">week {E(w)}</td><td>{tix(what)}</td><td>{E(oracle)}</td><td>{E(left)}</td></tr>" for w, what, oracle, left in rows)
risks = "".join(f"<tr><td><b>{E(a)}</b></td><td>{E(b)}</td><td>{tix(c)}</td></tr>" for a, b, c in D["risks"])
decide = "".join(f"<li><b>{E(a)}:</b> {E(b)}.</li>" for a, b in D["decide"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(8)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(7)}</p>
<h1>Piece by piece</h1>
<p class="sub">{E(D["question"])} The game at {G["version"]}: {G["parts"]} script parts, {G["lines"]:,} lines, {G["versions"]} versions since {G["first"]}, {G["checks"]} checks. A plan, not a measurement: every number about Hazel here is from earlier measurements, cited.</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>In two months, what the game draws; not the game.</b> About {round(100 * pure / tot)}% of the code is pure: settings in, a picture out (the friend, the poses, the places). That ports piece by piece, and each piece can be checked exactly: the picture archive holds the game's own SVG for every place, costume and pose, with the settings that made it, so a Hazel piece is done when the same settings give the same SVG.</li>
<li><b>In three months, also the rules: what is in the way, planned walks, the tunes as data, the world designer and the first settings as livelit GUIs.</b> The frame loop, the controllers and the sound would still be JS.</li>
<li><b>The runtime waits on Hazel, not on time.</b> A frame at 60 a second has 16 ms; a livelit release is 0.13 to 0.5 s today (from 4.6 s at the start of the month). Hazel lacks a clock, a sound binding and a way to measure a drawn picture. So the plan keeps JS as the engine and makes Hazel the source of the pictures, as a livelit's view is.</li>
<li><b>Measure before believing either schedule:</b> port the face alone (431 lines) and time it, in week 1.</li>
<li><b>Decide first what "ported" means</b>: the same picture from the same settings (checkable now), or the whole game running in Hazel (not reachable in three months).</li>
</ol></div>

<h2 id="inventory">What the game is made of</h2>
{FIG1}
<p class="muted">Figure 1. The game's code by part, in lines (wc -l of js/, version {G["version"]}), coloured by kind: pure (settings to picture), runtime (frames, input, sound, measuring the drawn picture), tool (the settings' controls and the archives).</p>
<div class="scroll"><table><thead><tr><th>part</th><th class="num">lines</th><th>what it is</th><th>what it rests on</th><th>kind</th></tr></thead><tbody>{inv_rows}</tbody></table></div>
<figure class="one"><img src="pictures/castle.svg" alt="The friend on the castle's drawbridge, as the game draws it"><figcaption>The oracle: the castle with the friend, the picture archive's SVG, drawn by the game from its settings file beside it. A Hazel piece is done when it draws this, byte for byte.</figcaption></figure>

<h2 id="hazel">What Hazel has, and lacks</h2>
<ul>{has}</ul>
<div class="scroll"><table><thead><tr><th>lacks</th><th>why the game needs it</th><th>what to do</th></tr></thead><tbody>{lacks}</tbody></table></div>

<h2 id="two">Two months</h2>
<div class="scroll"><table><thead><tr><th></th><th>what moves</th><th>the oracle</th><th>still JS at the end</th></tr></thead><tbody>{sched(D["two"])}</tbody></table></div>

<h2 id="three">Three months</h2>
<div class="scroll"><table><thead><tr><th></th><th>what moves</th><th>the oracle</th><th>still JS at the end</th></tr></thead><tbody>{sched(D["three"])}</tbody></table></div>

<h2 id="risks">Risks</h2>
<div class="scroll"><table><thead><tr><th>risk</th><th>why</th><th>what to do</th></tr></thead><tbody>{risks}</tbody></table></div>

<h2 id="decide">What to decide first</h2>
<ul>{decide}</ul>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from the game's code (line counts, and where it measures the DOM or runs per frame), its VERSIONS.md and checks, the picture archive's folders, and what earlier work recorded about Hazel's livelits and their speed (the Hazel performance analysis series {src("perf")}; the livelits paper {src("livelits")}). Nothing new was measured; the schedules are estimates, and an earlier note found estimates here running about five times high, so week 1's measurement matters. The data is in <a href="data/report.json">data/report.json</a> and in this page; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(D, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = '<style>.muted{color:var(--muted)}td.tag{white-space:nowrap;color:var(--muted)}td.num,th.num{text-align:right}table{border-collapse:collapse;width:100%}td,th{border-top:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}.scroll{overflow-x:auto}figure.one{margin:16px 0}figure.one img{width:100%;max-width:640px;border:1px solid var(--line);border-radius:6px}figcaption{color:var(--muted);font-size:.9em}.sources li{max-width:none}</style>\n'
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
