#!/usr/bin/env python3
"""^du_report(12)'s page, from its data: data/report.json (the text), data/firefox1.json and data/firefox2.json (the two Firefox
rounds), data/measure340b.json (the levers in Chrome, with traces), data/measure340.json (today against 0.0.239); the page's
frame as ^du_report(5)'s to (11)'s.
  python3 drivers/build.py   (from 012/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda n: json.load(open(os.path.join(HERE, "data", n), encoding="utf-8"))
D, F1, F2, B, M = J("report.json"), J("firefox1.json"), J("firefox2.json"), J("measure340b.json"), J("measure340.json")
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>The Foam, Not the Makers</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(12)")
assert "The Foam, Not the Makers" in HEAD and "^du_report(12)" in TAIL
S = D["sources"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"\b([Tt])icket (\d+)", lambda m: ("Ticket " if m.group(1) == "T" else "ticket ") + ref(int(m.group(2)), "ticket"), s)
    return s
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
def fx(rows):   # (Firefox: the first run, then the second; a second run past 60 is headless Firefox unthrottled)
    out = ""
    for r in rows:
        f = [x["fps"] for x in r["runs"]]
        out += f'<tr><td class="l">{E(r["case"].strip())}</td><td><b>{f[0]}</b></td><td class="muted">{f[1] if len(f) > 1 else ""}</td><td>{r["page"]["smil"]}</td><td>{r["page"]["flying"]}</td></tr>'
    return f'<div class="scroll"><table><thead><tr><th class="l">case</th><th>fps, first run</th><th>second</th><th>animations in the picture</th><th>makers\' bubbles in the air</th></tr></thead><tbody>{out}</tbody></table></div>'
# (Chrome: the gate's walk and drag, by makers and levers)
def gate(cpu):
    by = {(r["n"], r["config"]): r for r in B["gate"] if r["cpu"] == cpu}
    ns = sorted({n for n, _ in by}); cf = ["none", "budget", "overlay", "both"]
    head = "".join(f"<th>{c}</th>" for c in cf)
    rows = ""
    for n in ns:
        cell = lambda c, k: (lambda r: f'{r[k]}' if r and r[k] is not None else "")(by.get((n, c)))
        rows += f'<tr><td class="l">{n}</td>' + "".join(f"<td>{cell(c, 'walk')}</td>" for c in cf) + "".join(f"<td>{cell(c, 'drag')}</td>" for c in cf) + "</tr>"
    return f'<div class="scroll"><table><thead><tr><th class="l" rowspan="2">makers</th><th colspan="4">walk, fps</th><th colspan="4">drag, fps</th></tr><tr>{head}{head}</tr></thead><tbody>{rows}</tbody></table></div>'
def chart():   # (the slow tier's walk, none against both, by makers)
    by = {(r["n"], r["config"]): r for r in B["gate"] if r["cpu"] == 4}
    ns = [n for n in sorted({n for n, _ in by}) if n > 0]
    W, H, L, T, Bt = 560, 230, 44, 14, 34; w = (W - L - 10) / len(ns)
    y = lambda v: T + (H - T - Bt) * (1 - v / 60)
    s = f'<svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="The slow tier, walking: frames a second with no lever and with both, by number of makers">'
    for v in (0, 15, 30, 45, 60): s += f'<line x1="{L}" x2="{W - 10}" y1="{y(v):.1f}" y2="{y(v):.1f}" class="grid"/><text x="{L - 6}" y="{y(v) + 4:.1f}" text-anchor="end" class="ax">{v}</text>'
    for i, n in enumerate(ns):
        x0 = L + i * w + w * 0.18
        for j, (c, cls) in enumerate((("none", "bar-old"), ("both", "bar-new"))):
            r = by.get((n, c)); v = r["walk"] if r else 0
            s += f'<rect x="{x0 + j * w * 0.32:.1f}" y="{y(v):.1f}" width="{w * 0.3:.1f}" height="{y(0) - y(v):.1f}" class="{cls}"><title>{n} makers, {c}: {v} fps</title></rect><text x="{x0 + j * w * 0.32 + w * 0.15:.1f}" y="{y(v) - 4:.1f}" text-anchor="middle" class="val">{round(v)}</text>'
        s += f'<text x="{x0 + w * 0.31:.1f}" y="{H - Bt + 16}" text-anchor="middle" class="ax">{n}</text>'
    s += f'<text x="{(W + L) / 2:.0f}" y="{H - 4}" text-anchor="middle" class="ax">bubble makers (the slow tier, the room held still, walking)</text></svg>'
    return s + '<p class="legend"><span class="sw bar-old"></span> no lever (0.0.305) <span class="sw bar-new"></span> both levers (0.0.307). At 1 and 4 makers the runs disagree with each other by as much as the levers do (one maker: 30 without them, 23 with); read 16 and 64.</p>'
def traces():
    rows = ""
    for r in B["standing"]:
        m = r["msPerSecond"]
        rows += f'<tr><td class="l">CPU {r["cpu"]}</td><td>{r["n"]}</td><td class="l">{r["config"]}</td><td>{"still" if r.get("still") else "moving"}</td><td><b>{r["fps"]}</b></td><td>{m["script"]}</td><td>{m["style"] + m["layout"]}</td><td>{m["paint"] + m["prepaint"]}</td><td>{m["raster"]}</td><td>{m["gc"]}</td></tr>'
    return f'<div class="scroll"><table><thead><tr><th class="l">page</th><th>makers</th><th class="l">levers</th><th>foam</th><th>fps</th><th>script</th><th>style and layout</th><th>paint</th><th>raster</th><th>GC</th></tr></thead><tbody>{rows}</tbody></table></div>'
def since239():
    g = {(r["ver"], r["cpu"], r["kind"], r["n"]): r for r in M["gate"]}
    rows = ""
    for cpu in (1, 4):
        for kind in ("walk", "drag"):
            a = [sum(g[(v, cpu, kind, n)]["drawMs"]) / 2 for v in ("today", "0.0.239") for n in (0, 256)]
            per = [(a[1] - a[0]) / 256, (a[3] - a[2]) / 256]
            rows += f'<tr><td class="l">CPU {cpu}, {kind}</td><td>{a[0]:.1f} → {a[1]:.1f}</td><td>{a[2]:.1f} → {a[3]:.1f}</td><td><b>{per[0]:.3f}</b></td><td>{per[1]:.3f}</td><td>{per[0] / per[1]:.1f}×</td></tr>'
    return f'<div class="scroll"><table><thead><tr><th class="l">case</th><th>0.0.303: ms a drawing, 0 → 256 makers</th><th>0.0.239</th><th>ms a maker, 0.0.303</th><th>0.0.239</th><th>ratio</th></tr></thead><tbody>{rows}</tbody></table></div>'
short = "".join(f"<li><b>{E(a)}</b> {tix(b)}</li>" for a, b in D["short"])
found = "".join(f"<li><b>{E(a)}.</b> {tix(b)}</li>" for a, b in D["found"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(12)} · {D["date"]} · <span class="wip" style="color:#b45309;font-weight:600">work in progress</span> · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(11)}</p>
<h1>The foam, not the makers</h1>
<p class="sub">{E(D["question"])} Measured on GitHub's computers in Chrome and in Firefox (no test browser on the laptop), four runs; fixed in 0.0.306 and 0.0.307.</p>
<div class="headline"><b>Short answers.</b><ol>{short}</ol></div>

<h2 id="firefox">What Matthew saw: Firefox, one maker {src("firefox1")}</h2>
<p>A fresh headless Firefox for each case, at his screen's size (1250 by 830 at 1.6 device pixels a CSS pixel: 2000 by 1330, his 160%), in the bubble room as 0.0.305 drew it, the friend a fairy with mask and snorkel as he had them, one maker; then each suspect taken away. Frames counted standing for 3 seconds, twice; the first run is the one to read (a second over 60 is headless Firefox not held to the screen's pace).</p>
{fx(F1["rows"])}
<p class="muted">The two levers named here are 0.0.307's, tried before it: the makers' shared budget, and their bubbles in a picture of their own.</p>

<h2 id="fixed">After the fix: 0.0.306 in Firefox {src("firefox2")}</h2>
{fx(F2["rows"])}
<p>His case, the fairy and one maker: <b>18 frames a second on 0.0.305's moving foam, 60 on 0.0.306's still foam</b>. More makers still cost: 4 makers 49, 16 makers 40 in Firefox, the levers adding a few frames at 4 and none at 16 there.</p>

<h2 id="makers">Many makers, and the two levers {src("measure340b")}</h2>
<p>The frame-rate gate's walk and drag (two runs each, the better one shown) with 0 to 256 makers along the floor, in Chrome, each lever off and on. At full speed the scenery was kept moving (as on a computer never found slow); on the slow tier (the page 4 times slower) the game held the room still, as it does there.</p>
{chart()}
<h3>The slow tier (CPU 4)</h3>
{gate(4)}
<h3>Full speed (CPU 1), the foam moving</h3>
{gate(1)}
<p class="muted">Each number is the better of two runs on one page; the slow tier's first walks were often far slower than its second (5 to 15 against 23 to 57), so differences of a few frames there are within the noise. The large ones (16 and 64 makers, both levers) held in walk and drag alike.</p>

<h2 id="frame">Where a frame's time goes</h2>
<p>Chrome's own trace of the room standing for 3 seconds, the bubbles blowing: milliseconds of each kind of work in a second. "Raster" is the painting threads turning the picture into pixels; the rest is the page's main thread.</p>
{traces()}
<p>With the foam moving, rasterizing is nearly two seconds of work every second, whatever the makers: the whole picture painted again each frame. Held still, it falls to 0.7 s with no makers, and the makers' bubbles in their own picture cut it again (16 makers: 1.3 s to 0.9 s).</p>

<h2 id="since239">Each maker, against 0.0.239 {src("measure340")}</h2>
{since239()}
<p>Drawing time grows with the number of things in a place, and since 0.0.239 it grows about 4 times as fast a maker: placed things became solid (ticket 283), their boxes measured through the screen whenever the scene is built again, and the things' layer is drawn again every frame. Not what made Matthew's room slow, but what limits many things in any place.</p>

<h2 id="taps">What a kid's endless taps meet</h2>
<p>The moving-things guard (tickets 201 and 203): after each moving thing is put in a place, the game counts a second of frames; under 48, every "+" is greyed and the things that move the most are marked, until one is taken away (or, now, the bubble room's foam is stilled). So a kid pressing "+ 🫧 bubble maker" is stopped at a few makers on a slow computer, at more on a fast one, never at a frozen page. Matthew's screenshot was that guard at work, blaming the maker for the foam.</p>

<h2 id="found">Found on the way</h2>
<ul>{found}</ul>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from ticket 340: {tix(D["trigger"])} Every measurement ran on GitHub's computers, from branches made for it and deleted after (measure-340, measure-340b, measure-340c), never merged; nothing ran in a test browser on the laptop. Chrome's frame-rate gate is tools/fpsgate.mjs; the traces are Chrome's own (Tracing, devtools.timeline); Firefox's cases were driven by WebDriver (geckodriver). The data are in <a href="data/">data/</a>; the page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps({"report": D}, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = ('<style>.muted{color:var(--muted)}table{border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:4px 6px;vertical-align:top;text-align:right}'
         'td.l,th.l{text-align:left}.scroll{overflow-x:auto}.chart{width:100%;max-width:640px}.chart .grid{stroke:var(--line);stroke-width:1}'
         '.chart .ax,.chart .val{font-size:11px;fill:var(--muted)}.chart .bar-old,.sw.bar-old{fill:#c2410c;background:#c2410c}.chart .bar-new,.sw.bar-new{fill:#0f766e;background:#0f766e}'
         '.legend{font-size:.9em}.sw{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-1px;margin:0 4px 0 10px}.sources li{max-width:none}</style>\n')
# (the series index's thumbnail: the chart, standing alone, its colours written in)
thumb = chart().split("<p class=")[0].replace('<svg viewBox', '<svg xmlns="http://www.w3.org/2000/svg" viewBox', 1).replace(' class="chart"', '', 1)
thumb = thumb.replace('class="grid"', 'stroke="#d6d3cc"').replace('class="ax"', 'font-size="11" fill="#6b6459"').replace('class="val"', 'font-size="11" fill="#6b6459"').replace('class="bar-old"', 'fill="#c2410c"').replace('class="bar-new"', 'fill="#0f766e"')
os.makedirs(os.path.join(HERE, "pictures"), exist_ok=True); open(os.path.join(HERE, "pictures", "makers.svg"), "w", encoding="utf-8").write(thumb)
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
