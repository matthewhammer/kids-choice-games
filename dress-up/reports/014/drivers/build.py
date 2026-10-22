#!/usr/bin/env python3
"""^du_report(14)'s page, from its data: data/report.json (the text and tables) and data/pose-notes.json (the log, entry by
entry); its pictures in pictures/ (the game's own drawings, 0.0.342 and 0.0.343); the page's frame as ^du_report(5)'s to (13)'s.
  python3 drivers/build.py   (from 014/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda n: json.load(open(os.path.join(HERE, "data", n), encoding="utf-8"))
D, LOG = J("report.json"), J("pose-notes.json")
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", f"<title>{D['title']}</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(14)")
assert D["title"] in HEAD and "^du_report(14)" in TAIL
S = D["sources"]
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"\^ticket\((\d+)\)", lambda m: ref(int(m.group(1)), "ticket"), s)
    s = re.sub(r"\b([Tt])ickets? (\d+)", lambda m: m.group(0).replace(m.group(2), ref(int(m.group(2)), "ticket")), s)
    return s
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
def table(head, rows, left=1):
    th = "".join(f'<th{" class=\"l\"" if i < left else ""}>{E(h)}</th>' for i, h in enumerate(head))
    tr = "".join("<tr>" + "".join(f'<td{" class=\"l\"" if i < left else ""}>{c if isinstance(c, (int, float)) else tix(str(c))}</td>' for i, c in enumerate(r)) + "</tr>" for r in rows)
    return f'<div class="scroll"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'
short = "".join(f"<li><b>{E(a)}</b> {tix(b)}</li>" for a, b in D["short"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
KIND = {"finding": "found", "rule": "a rule", "next": "next"}
log = "".join(f'<li><span class="tag {e["kind"]}">{KIND.get(e["kind"], e["kind"])}</span> {ref(e["ticket"], "ticket")} {tix(e["text"])}'
              + (f' <span class="muted">({tix(e["source"])})</span>' if e.get("source") else "") + "</li>" for e in LOG["entries"])
rules = [e for e in LOG["entries"] if e["kind"] == "rule"]
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(14)} · {D["date"]} · <span class="wip" style="color:#b45309;font-weight:600">work in progress</span> · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(13)}</p>
<h1>{E(D["h1"])}</h1>
<p class="sub">{E(D["question"])} From two tickets of 2026-10-19, ticket 412 (lying down along the tent's sleeping bags) and ticket 414 (elbows and knees), and Matthew's calls on them, logged as they came (ticket 422). Pictures are the game's own drawings, on 0.0.342 and 0.0.343.</p>
<div class="headline"><b>Short answers.</b><ol>{short}</ol></div>

<h2 id="views">The views we have</h2>
<p>The friend is one drawing with a few ways of facing: toward us, to either side (profile), or away from us (from behind, the face hidden by hair). Two more poses are the same drawings moved: crawling toward or away from us squashes the front or back view, and crawling in profile or lying level turns the profile about the hips. Where the drawing branches on the way the friend faces, counted in the code of 0.0.337 (uses of <code>dir</code>, the side they face; <code>away</code>, from behind; <code>squash</code>, crawling toward or away):</p>
{table(["file", "lines", "dir", "away", "squash"], D["views"])}
<p>So a new angle is not one function but a drawing of every part for it: the head and face, each hair style, the shirt, the pants and each costume, the hands and the feet.</p>

<h2 id="lying">A view of its own: lying along a side wall</h2>
<p>The orange tent's two sleeping bags run along its side walls, from the open end near us to the pillow at the far wall, at about 45 degrees on the screen. To lie on one, the friend's body has to follow that slant in the tent's perspective. Eight tries, each with what Matthew said:</p>
{table(["try", "what it drew", "Matthew", "released"], D["tries"], left=3)}
<figure><img src="pictures/lie-along.svg" alt="The friend lying face up on the red sleeping bag, feet toward us pointing up, head on the pillow by the far wall, the hair round the far side of the head" style="width:100%;max-width:420px"><figcaption>0.0.342: the friend on the red bag. The body is volumes laid on the bag in its own perspective (each point placed by how far along the bag it is, how far across and how high), drawn far to near and the wall's side first: the hair on the pillow and round the head's far side, the head, the neck, the arm by the wall, the body (its top and its side toward the room), the arm by the room, the legs, the feet pointing up. Mirrored for the purple bag by the right wall.</figcaption></figure>

<h2 id="joints">Elbows and knees in three dimensions</h2>
<p>Until 0.0.343 a limb bent only in the picture: facing us, an elbow's bend swung the forearm out to the side. Now a forearm or a shin can turn out of the picture: curled toward the front of the body (a knee's toward the back), then swung about the bone above it, and drawn as it then points, so a forearm pointing at us is seen short. Four sliders in 🦒 Neck, arms &amp; legs: 🏋️ elbows curl, 🫖 elbows swing, 🦶 knees curl, ↔️ knees swing.</p>
<figure><img src="pictures/joints.svg" alt="Four friends facing us: standing; elbows curled 90 degrees and swung in, the hands in front of the belly; elbows curled 140, the hands by the shoulders; knees curled 90, kneeling" style="width:100%;max-width:640px"><figcaption>0.0.343, facing us. A curl of 90 degrees shows the forearm 3 units long against 48 straight; with the knees curled 90 the friend kneels, the shoes drawn under the legs.</figcaption></figure>

<h2 id="layering">Layering by depth</h2>
<p>Matthew, on the first try at lying: "we need the back leg to obscure the front leg; the torso obscures the back arm, etc". The rules found so far:</p>
<ul>{"".join(f"<li>{tix(e['text'])}</li>" for e in rules)}</ul>

<h2 id="audit">Every animation's bends</h2>
<p>Each animation's own elbow and knee bends, in degrees, sampled at 8 points of its cycle on 0.0.342 with the new sliders at 0:</p>
{table(["animation", "seen", "elbows", "knees"], D["audit"], left=2)}
<p>Re-adjusted: the crouch facing us, whose bend in the picture put its elbows out to the sides; it now curls the forearms toward us. Left as they are, for Matthew to judge: climbing facing us, and each animation with the new sliders set (with the knees curled 70 degrees, walking is on the knees, as it was with the old knee bend).</p>

<h2 id="log">The log</h2>
<p>Every entry, as logged ({len(LOG["entries"])}; {src("log")}).</p>
<ul class="log">{log}</ul>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from the log kept during tickets 412 and 414 at his ask ("start to log details for a report about posing our body --- we want notes for further poses, if possible"). The tries and fixes were looked at in the desktop app's own browser (no test browser on the laptop), drawn large by copying the friend's drawing into a page of its own; the audit sampled each animation's joint angles in the same browser; the checks that guard them (tools/checks/lie412.mjs, joints414.mjs) run on GitHub's computers after each release. The pictures are the game's own drawings, copied from that browser. Versions {src("versions")}; tickets {src("tickets")}.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps({"report": D, "log": LOG}, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = ('<style>.muted{color:var(--muted)}table{border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:4px 6px;vertical-align:top;text-align:right}'
         'td.l,th.l{text-align:left}.scroll{overflow-x:auto}figure{margin:1em 0}figcaption{font-size:.9em;color:var(--muted)}'
         '.log li{margin:.3em 0}.tag{display:inline-block;font-size:.75em;padding:0 6px;border-radius:8px;border:1px solid var(--line)}.tag.rule{font-weight:bold}.sources li{max-width:none}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
