#!/usr/bin/env python3
"""^du_report(13)'s page: reads 013/data/report.json and writes 013/index.html, with report 12's styles.
  python3 dress-up/reports/013/drivers/build.py   (from the repository's root)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(HERE, "data", "report.json")))
src12 = open(os.path.join(HERE, "..", "012", "index.html"), encoding="utf-8").read()
style = re.search(r"<style>.*?</style>", src12, re.S).group(0)   # the series' first style block
head = src12[:src12.find("<meta name=\"viewport\"")]               # nav and theme lines, as report 12 has them
esc = html.escape
li = lambda xs: "".join(f"  <li>{x}</li>\n" for x in xs)
def table(hdr, rows, num=()):
    th = "".join(f"<th>{h}</th>" for h in hdr)
    tr = "\n".join("  <tr>" + "".join(f'<td{" class=\"n\"" if i in num else ""}>{c}</td>' for i, c in enumerate(r)) + "</tr>" for r in rows)
    return f'<div class="scroll"><table>\n  <tr>{th}</tr>\n{tr}\n</table></div>'
d, m, mn = J["drawing"], J["music"], J["menus"]
pics = "\n".join(f'<figure><img src="pictures/{p["file"]}" alt="{esc(p["caption"])}" style="width:100%;border-radius:10px;border:1px solid var(--line)"><figcaption>{p["caption"]}</figcaption></figure>' for p in J["pictures"])
data_js = json.dumps(J, ensure_ascii=False).replace("</", "<\\/")
page = f"""{head}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(J["page_title"])}</title>
{style}
</head>
<body>
<main>
<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../013/"><code><b>^du_report(</b>13<b>)</b></code></a> · {J["date"]} · about Hazel</p>
<h1>{J["title"]}</h1>
<p class="sub">{J["sub"]}</p>
<div class="headline">
<p><b>Short answers.</b></p>
<ol>
{li(J["answers"])}</ol>
</div>
<div class="shots">
{pics}
</div>

<h2 id="drawing">1. Which parts of the drawing are hardest for Hazel</h2>
<p>{d["intro"]}</p>
{table(["What the drawing uses", "Count"], d["features"], num=(1,))}
<h3>What the drawing rests on at run time</h3>
{table(["What", "What needs it"], d["runtime"])}
<h3>The five hardest, ranked</h3>
{table(["", "Feature", "Why it is hard for Hazel", "The most plausible route"], d["hardest"])}
<h3 id="numbers">Tried in Hazel: the numbers in a picture</h3>
{table(["x", "Hazel: to_fixed(x, 1)", "The game: f1(x)"], d["try_rows"], num=(0, 1, 2))}
<p class="note">{d["try_note"]}</p>

<h2 id="music">2. Can we do music in Hazel?</h2>
{table(["Part of the music code", "Lines", "What"], m["split"], num=(1,))}
<h3>Hazel's options</h3>
{table(["Option", "Possible?", "How"], m["options"])}
<h3 id="score">Tried in Hazel: a tune's score</h3>
{table(["Program", "Wall time, three runs (s)", "Its work (s)"], m["try_rows"])}
<p class="note">{m["try_note"]}</p>

<h2 id="menus">3. The menus, knolled, in Hazel</h2>
<p>The nine rules of Always Be Knolling (<a href="../005/"><code><b>^du_report(</b>5<b>)</b></code></a>), and how Hazel's livelits measure up today:</p>
{table(["Rule", "Hazel today"], mn["rules"])}
<h3>The options</h3>
{table(["Option", "What it gives, and what it costs"], mn["options"])}
<p><b>The plan:</b> {mn["plan"]}</p>

<h2 id="stages">4. The advanced features, staged as challenges for Hazel</h2>
{table(["Stage", "", "Features", "What Hazel needs"], J["stages"])}

<h2 id="next">What next</h2>
<ol class="steps">
{li(J["next"])}</ol>

<h2 id="method">How this was put together</h2>
<ul>
{li(J["method"])}  <li><b>The data:</b> in this page's report-data element and in <code>013/data/</code> (report.json, and the two Hazel programs tried); the page is made by <code>013/drivers/build.py</code>.</li>
</ul>
</main>
<script type="application/json" id="report-data">{data_js}</script>
</body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(page)
print("wrote 013/index.html")
