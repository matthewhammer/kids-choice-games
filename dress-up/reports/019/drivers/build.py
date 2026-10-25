#!/usr/bin/env python3
"""^du_report(19)'s page, from its data: data/report.json (the words, the seventeen scenarios, the steps) and data/same.json
(the proof: tools/same_friend.mjs's summaries, the release against each commit of the branch, the noise floor and the
sensitivity check). Every figure is drawn here from those numbers. Each function or table the words name, written {fn:name},
is looked up in the branch's own parts when the page is built, so its file and line are those of the code beside it.
The page's frame is ^du_report(5)'s, as ^du_report(16)'s is.
  python3 drivers/build.py   (from dress-up/reports/019/)
The pictures are made by drivers/demo564.mjs (a demonstration, not the game)."""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(HERE, "..", "..", "js")
rd = lambda f: json.load(open(os.path.join(HERE, "data", f), encoding="utf-8"))
D, SAME = rd("report.json"), rd("same.json")
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
TITLE = D["title"]
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", f"<title>{TITLE}</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(19)")
assert TITLE in HEAD and "^du_report(19)" in TAIL

# ---- where each named function or table is, in the branch's parts ----
DEF = {}
for f in sorted(os.listdir(JS)):
    if not f.endswith(".js"): continue
    for n, line in enumerate(open(os.path.join(JS, f), encoding="utf-8"), 1):
        m = re.match(r"(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=)", line)
        if m:
            name = m.group(1) or m.group(2)
            DEF.setdefault(name, (f, n))
MISSING = []
def fn(name):
    if name not in DEF:
        MISSING.append(name); return f"<code>{E(name)}</code>"
    f, n = DEF[name]
    return f'<code>{E(name)}</code> <a class="loc" href="../../js/{f}" title="dress-up/js/{f}, line {n}">{f[:2]}:{n}</a>'
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    """the words, escaped, with {fn:name} looked up, ^du_report(N) and ticket N linked, `code` as code, **bold** as bold"""
    s = E(s)
    s = re.sub(r"\{fn:([A-Za-z_$][\w$]*)\}", lambda m: fn(m.group(1)), s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    # (a ticket said once: "ticket 562" is ^ticket(562), linked; "tickets 557 and 560", each one)
    s = re.sub(r"\btickets (\d+)((?:,? (?:and )?\d+)+)", lambda m: "tickets " + ref(int(m.group(1)), "ticket") +
               re.sub(r"(\d+)", lambda k: ref(int(k.group(1)), "ticket"), m.group(2)), s)
    s = re.sub(r"\b[Tt]icket (\d+)", lambda m: ref(int(m.group(1)), "ticket"), s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    return s

# ---- the proof's numbers ----
NOISE = SAME["noise"]; COMMITS = SAME["commits"]; SENS = SAME.get("sensitivity")
ALLSAME = all(c["summary"]["differ"] == 0 and c["summary"]["threwOnOneSide"] == 0 and c["summary"]["sameStructure"] for c in COMMITS)
NCASES = COMMITS[-1]["summary"]["cases"] if COMMITS else 0
MB = lambda c: c["summary"]["charsCompared"] / 1e6
VERD = {"ready": ("ready", "good"), "small": ("needs a small change", "alt"), "reorg": ("needs a re-org", "bad")}
SC = D["scenarios"]
count = {v: sum(1 for s in SC if s["verdict"] == v) for v in VERD}
count_before = {v: sum(1 for s in SC if s.get("before", s["verdict"]) == v) for v in VERD}

# ---- Figure 2: the scenarios by verdict, before ticket 564's re-orgs and after ----
def fig_verdicts():
    x0, k, s = 150, 26, []
    rows = [("before (0.0.428)", count_before), ("after (this branch)", count)]
    for i, (name, cnt) in enumerate(rows):
        y = 26 + i * 44; x = x0
        s.append(f'<text class="lab" x="{x0 - 8}" y="{y + 17}" text-anchor="end">{E(name)}</text>')
        for v in ("ready", "small", "reorg"):
            n = cnt[v]
            if not n: continue
            s.append(f'<g><rect class="v-{VERD[v][1]}" x="{x}" y="{y}" width="{n * k - 2}" height="26" rx="3"/>'
                     f'<text class="valw" x="{x + (n * k - 2) / 2}" y="{y + 17}" text-anchor="middle">{n}</text><title>{E(name)}: {n} {E(VERD[v][0])}</title></g>')
            x += n * k
    lx = x0
    for v in ("ready", "small", "reorg"):
        s.append(f'<rect class="v-{VERD[v][1]}" x="{lx}" y="{26 + 2 * 44 + 4}" width="12" height="12" rx="2"/><text class="tick" x="{lx + 17}" y="{26 + 2 * 44 + 14}">{E(VERD[v][0])}</text>')
        lx += 40 + 7 * len(VERD[v][0])
    return f'<svg class="chart" viewBox="0 0 640 {26 + 2 * 44 + 26}" role="img" aria-label="The seventeen scenarios by verdict, before and after">{"".join(s)}</svg>'

# ---- Figure 3: the proof, per commit: cases drawn on both, identical ----
def fig_proof():
    rows = [("the release against itself (noise)", NOISE)] + [(f'{c["sha"][:7]} {c["short"]}', c["summary"]) for c in COMMITS]
    x0, W, s = 260, 330, []
    for i, (name, sm) in enumerate(rows):
        y = 18 + i * 34; frac = sm["identical"] / sm["cases"] if sm["cases"] else 0
        s.append(f'<text class="lab" x="{x0 - 8}" y="{y + 15}" text-anchor="end">{E(name)}</text>'
                 f'<g><rect class="b1" x="{x0}" y="{y}" width="{W * frac:.1f}" height="20" rx="3"/>'
                 f'<text class="valw" x="{x0 + 8}" y="{y + 15}">{sm["identical"]:,} of {sm["cases"]:,} identical</text>'
                 f'<title>{E(name)}: {sm["identical"]:,} identical, {sm["differ"]} differ, {sm["threwOnOneSide"]} threw on one side, structure {"identical" if sm["sameStructure"] else "differs"}; {sm["charsCompared"] / 1e6:.1f} MB compared</title></g>'
                 f'<text class="tick" x="{x0 + W + 6}" y="{y + 15}">{sm["charsCompared"] / 1e6:.0f} MB</text>')
    return f'<svg class="chart" viewBox="0 0 640 {28 + len(rows) * 34}" role="img" aria-label="Cases drawn on both pages and identical, per commit">{"".join(s)}</svg>'

# ---- the words ----
def chip(v): return f'<span class="st st-{VERD[v][1]}">{E(VERD[v][0])}</span>'
def pic(p): return (f'<figure class="pic"><img src="pictures/{E(p["file"])}" alt="{E(p["alt"])}" loading="lazy">'
                    f'<figcaption>{"<b>A demonstration, not the game.</b> " if p.get("demo") else ""}{tix(p["caption"])}</figcaption></figure>')
sc_rows = "".join(f'<tr><td><a href="#{s["id"]}">{s["id"].upper()}</a></td><td>{E(s["title"])}{" <span class=muted>(Matthew)</span>" if s.get("his") else ""}</td><td>{chip(s["verdict"])}</td><td>{tix(s["touches"])}</td></tr>' for s in SC)
def scard(s):
    before = f' <span class="muted">(before this ticket: {E(VERD[s["before"]][0])})</span>' if s.get("before") and s["before"] != s["verdict"] else ""
    pics = "".join(pic(p) for p in s.get("pictures", []))
    done = f'<p><b>Done in this ticket:</b> {tix(s["done"])}</p>' if s.get("done") else ""
    return (f'<section class="scen" id="{s["id"]}"><h3><a href="#{s["id"]}">{s["id"].upper()}</a>. {E(s["title"])}</h3>'
            f'<p class="verdict">{chip(s["verdict"])}{before}{" · Matthew&#x27;s scenario" if s.get("his") else ""}</p>'
            f'<p><b>Today:</b> {tix(s["today"])}</p><p><b>What would make it easy:</b> {tix(s["easy"])}</p>{done}{pics}</section>')
scards = "".join(scard(s) for s in SC)
def commit_block(c, i):
    sm = c["summary"]
    moved = "".join(f"<li>{tix(m)}</li>" for m in c["moved"])
    return (f'<section class="commit" id="commit-{i}"><h3>{i}. {E(c["title"])} <code>{c["sha"][:10]}</code></h3>'
            f'<p>{tix(c["why"])}</p><ul>{moved}</ul>'
            f'<p class="proof"><b>The proof:</b> {sm["cases"]:,} drawings of the friend made by the release (0.0.428, <code>{SAME["base"][:7]}</code>) and by this commit, '
            f'{sm["identical"]:,} identical byte for byte ({sm["charsCompared"] / 1e6:.1f} MB each side), {sm["differ"]} different, {sm["threwOnOneSide"]} that failed on one side only; '
            f'the defaults, the tabs\' rows and the show-when rules {"identical" if sm["sameStructure"] else "DIFFERENT"}. {tix(c.get("proofNote", ""))} '
            f'{c["stat"]}.</p></section>')
commits = "".join(commit_block(c, i) for i, c in enumerate(COMMITS, 1))
dot = lambda t: t if t.rstrip().endswith((".", "?", "!")) else t.rstrip() + "."   # (each step and point ends a sentence)
improve = "".join(f'<li id="improve-{i}"><b>{E(a)}.</b> {tix(dot(b))}</li>' for i, (a, b) in enumerate(D["improve"], 1))
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(dot(b))} <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
answers = "".join(f"<li>{tix(a)}</li>" for a in D["answers"])
kpis = "".join(f'<div class="kpi"><div class="v">{v}</div><div class="l">{E(l)}</div></div>' for v, l in (
    (f'{count["ready"]} · {count["small"]} · {count["reorg"]}', "of the 17 scenarios: ready · a small change · a re-org"),
    (f'{len(COMMITS)}', "re-organisations done, each its own commit (the first with the tool that proves them)"),
    (f'{NCASES:,}', "drawings of the friend compared byte for byte, per commit"),
    ("0" if ALLSAME else "!", "drawings changed by the re-organising" if ALLSAME else "drawings changed: see each commit")))
proofcases = "".join(f"<li>{tix(x)}</li>" for x in D["proof"]["cases"])
sens = (f'<p><b>Would it notice?</b> {tix(SENS["words"])}</p>' if SENS else "")
pics_top = "".join(pic(p) for p in D["top_pictures"])
how = "".join(f"<p>{tix(x)}</p>" for x in D["how"])
asked = "".join(f'<li>{E(a["at"])}: “{E(a["words"])}”</li>' for a in D["asked"])

body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(19)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(18)}</p>
<h1>{E(TITLE)}</h1>
<p class="reading">About READMIN minutes to read (READWORDS words, not counting tables and figures).</p>
<p class="sub">{tix(D["question"])} From {ref(564, "ticket")}. Matthew's words:</p>
<ul class="asked">{asked}</ul>
<div class="headline" id="answers">
<p><b>Short answers.</b></p>
<ol>{answers}</ol>
</div>
<div class="kpis">{kpis}</div>
{pics_top}

<h2 id="scenarios">The seventeen scenarios</h2>
<p>{tix(D["scenarios_intro"])}</p>
<figure id="fig-2">{fig_verdicts()}<figcaption>Figure 2. The seventeen scenarios by verdict, as the code stands at the release (0.0.428) and on this branch, read in the code (each scenario says where). Three moved: Matthew's three, the gems.</figcaption></figure>
<div class="scroll"><table class="diff"><thead><tr><th></th><th>scenario</th><th>verdict</th><th>what it touches</th></tr></thead><tbody>{sc_rows}</tbody></table></div>
{scards}

<h2 id="reorg">What we re-organised</h2>
<p>{tix(D["reorg_intro"])}</p>
{commits}
<figure id="fig-3">{fig_proof()}<figcaption>Figure 3. Each commit's proof: drawings of the friend made by the release and by the commit, compared byte for byte by <code>tools/same_friend.mjs</code>; the first bar is the release against itself, the noise floor. One run each, on the laptop, in node.</figcaption></figure>

<h2 id="proof">How the proof works</h2>
<p>{tix(D["proof"]["intro"])}</p>
<ul>{proofcases}</ul>
<p>{tix(D["proof"]["noise"])}</p>
{sens}
<p>{tix(D["proof"]["limits"])}</p>

<h2 id="improve">Other ways to improve</h2>
<p>{tix(D["improve_intro"])}</p>
<ol class="improve">{improve}</ol>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="how">How this was put together</h2>
{how}
<p>The data: <a href="data/report.json">data/report.json</a> (the words, the scenarios, the steps) and <a href="data/same.json">data/same.json</a> (every proof run's summary), both embedded in this page; <code>drivers/build.py</code> draws the page, <code>drivers/demo564.mjs</code> the pictures, <code>tools/same_friend.mjs</code> the proof.</p>
<script type="application/json" id="report-data">{json.dumps(dict(D, same=SAME), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")}</script>
</main>
'''
txt = re.sub(r"<(table|figure|script|svg)\b.*?</\1>", " ", body, flags=re.S)
words = len(re.sub(r"<[^>]+>", " ", txt).split())
body = body.replace("READMIN", str(max(1, round(words / 240)))).replace("READWORDS", f"{words:,}")
extra = ('<style>.muted{color:var(--muted)}.reading{color:var(--muted);margin:-6px 0 10px}.wip{color:#b45309}'
         'ul.asked{color:var(--muted);margin-top:-14px}ul.asked li{margin:4px 0}'
         'svg.chart .valw{fill:#fff;font-size:12px;font-weight:700}svg.chart .v-good{fill:var(--good)}svg.chart .v-alt{fill:var(--alt)}svg.chart .v-bad{fill:var(--bad)}'
         '.st{display:inline-block;font-size:.8em;border:1.5px solid var(--line);border-radius:999px;padding:0 8px;white-space:nowrap}'
         '.st-good{border-color:var(--good)}.st-alt{border-color:var(--alt)}.st-bad{border-color:var(--bad)}'
         'section.scen,section.commit{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:4px 16px 8px;margin:16px 0}'
         'section.scen h3,section.commit h3{margin:12px 0 4px}section.scen h3 a{text-decoration:none}p.verdict{margin:2px 0 8px}'
         'a.loc{font-size:.78em;color:var(--muted);text-decoration:none;font-variant-numeric:tabular-nums}a.loc:hover{text-decoration:underline}'
         'figure.pic{margin:12px 0}figure.pic img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:10px;display:block;background:#f4efe3}'
         '.proof{border-left:3px solid var(--good);padding-left:10px}ol.improve li{margin:10px 0}'
         'table.diff td:first-child{white-space:nowrap}@media (max-width:600px){table.diff td:last-child{font-size:.85em}}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
if MISSING: print("NOT FOUND in the parts:", sorted(set(MISSING)))
print("wrote index.html", len(out), "bytes;", words, "words;", f"{len(SC)} scenarios; proof: {'all identical' if ALLSAME else 'DIFFERENCES'}")
