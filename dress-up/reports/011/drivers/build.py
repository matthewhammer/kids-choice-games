#!/usr/bin/env python3
"""^du_report(11)'s page, from its data (data/report.json, data/cast.json, data/tally.json, data/costumes.json) and its
pictures (pictures/cast/<id>.svg, each person made with the friend's own settings in the game; pictures/throne-room.svg and
pictures/beach.svg, people put in a place); the page's frame as ^du_report(5)'s to (10)'s.
  python3 drivers/build.py   (from 011/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda n: json.load(open(os.path.join(HERE, "data", n), encoding="utf-8"))
D, C, T = J("report.json"), J("cast.json"), J("tally.json")
K = J("costumes.json") if os.path.exists(os.path.join(HERE, "data", "costumes.json")) else None
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", "<title>A Cast of Friends</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(11)")
assert "A Cast of Friends" in HEAD and "^du_report(11)" in TAIL
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"\b([Tt])ickets? (\d+)", lambda m: ("Ticket " if m.group(1) == "T" else "ticket ") + ref(int(m.group(2)), "ticket"), s)
    return s
cast, places = C["cast"], C["places"]
n = len(cast)

# (1) costumes, from the code
if K:
    rows = "".join(f'<tr><td class="l">{E(k["label"])}</td><td>{E(k.get("firstVersion") or "?")}</td><td>{k.get("commits", "?")}</td><td>{k.get("linesNow", "?")}</td><td class="l">{E(", ".join(k.get("parts", [])))}</td></tr>' for k in K["kinds"])
    costumes = f'''<p>{tix(K["intro"])}</p>
<div class="scroll"><table class="kinds"><thead><tr><th class="l">costume</th><th>first in</th><th>commits</th><th>its own lines today</th><th class="l">what it does</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="muted">{tix(K["counting"])}</p>
<h3>What a new one touches today</h3><ol>{"".join(f"<li>{tix(s)}</li>" for s in K["steps"])}</ol>
<h3>What would make the next one cheaper</h3><p>{tix(K["cheaper"])}</p>'''
else:
    costumes = '<p class="muted">(being written)</p>'

# (2) the cast, by place
def card(m):
    lacks = "".join(f"<li>{E(x)}</li>" for x in m["lacks"]) or '<li class="ok">nothing: the game has it all</li>'
    return f'''<figure class="person" id="cast-{E(m["id"])}"><a href="pictures/cast/{E(m["id"])}.svg"><img loading="lazy" src="pictures/cast/{E(m["id"])}.svg" alt="{E(m["name"])}, made in the game"></a>
<figcaption><b>{E(m["name"])}</b><span class="like">{E(m["like"])}</span><ul class="lacks">{lacks}</ul></figcaption></figure>'''
gallery = "".join(f'<h3>{E(label)}</h3><div class="cast">{"".join(card(m) for m in cast if m["place"] == key)}</div>' for key, label in places)
tally = "".join(f'<tr><td class="l">{E(lab)}</td><td>{k}</td><td class="l muted">{E(", ".join(w))}</td></tr>' for lab, k, w in T["tally"])
complete = ", ".join(T["complete"])

# (3) people in a place
M = D["measured"]
walk = "".join(f"<tr><td class=\"l\">{E(a)}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in M["walkDraw"])
people = "".join(f"<li><b>{E(a)}.</b> {tix(b)}</li>" for a, b in D["people"])
found = "".join(f"<li><b>{E(a)}.</b> {tix(b)}</li>" for a, b in D["found"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(11)} · {D["date"]} · <span class="wip" style="color:#b45309;font-weight:600">work in progress</span> · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(10)}</p>
<h1>A cast of friends</h1>
<p class="sub">{E(D["question"])}</p>
<div class="headline"><b>Short answers.</b>
<ol>
<li><b>Most of a cast can be made today.</b> {n} people of such games, by place (a castle, a village, magic folk, the wilds, the sea and its pirates, a haunted house), each made with the friend's own settings and nothing else: {len(T["complete"])} need nothing more ({E(complete)}); the rest lack a piece or two, and the same few pieces again and again.</li>
<li><b>Three pieces would finish most of them:</b> something held (8 of {n}: a staff, a sceptre, a hammer), a hat or a crown (8), and a beard (5).</li>
<li><b>People can stand in places now, by hand:</b> the king's room with the king and queen sat on their thrones and two guards, and the beach with its pirates, were made in the game, each person drawn where they stand and sorted among the place's things. What is missing is a person as a thing of the place, so a kid can put one there.</li>
<li><b>On the black laptop, standing people are nearly free and walking ones are not:</b> a person walking is drawn again every frame (1.7 to 2.8 ms on the Ubuntu laptop, 6 to 10 ms on the slow tier), so one at a time, unless their walk is drawn once and shown in turn.</li>
<li><b>A costume today is code in several places;</b> as one record each (its clothes, head, back, what it holds), the next costume costs its drawings and little else.</li>
</ol></div>

<h2 id="costumes">How a costume is made today</h2>
{costumes}

<h2 id="cast">The cast, made with the friend's own settings</h2>
<p class="muted">Each person is a friend made in the game (0.0.305) through its own settings, as a kid's taps make one: the skin, the face, the hair, the shirt and pants or a costume, the hands and feet. Under each, what they still lack. The dressing room frames each one to fit, so a fairy's wide wings make her look smaller here; in a place everyone is at one scale. Tap a picture to see it alone.</p>
{gallery}
<h3 id="tally">What they lack, most often</h3>
<div class="scroll"><table><thead><tr><th class="l">piece</th><th>people</th><th class="l">who</th></tr></thead><tbody>{tally}</tbody></table></div>

<h2 id="places">People in a place</h2>
<div class="two"><figure><a href="pictures/throne-room.svg"><img src="pictures/throne-room.svg" alt="The king's room of N's castle: the king and queen sat on the two thrones, a guard either side, the friend in front"></a><figcaption>The king's room: the king and queen sat on its thrones (its seats), a guard by each suit of armour.</figcaption></figure>
<figure><a href="pictures/beach.svg"><img src="pictures/beach.svg" alt="The beach: the pirate captain and a pirate facing each other, the friend, the ghost pirate and the voodoo lady"></a><figcaption>The beach: the captain and a pirate face each other; the ghost pirate and the voodoo lady behind the friend, a sandcastle in front of her.</figcaption></figure></div>
<p class="muted">Made in the game: each person drawn by the game at their spot in the place (so at its depth and size there, and sat on a seat as the friend sits), their drawing kept, and all put into one scene at their depths. By hand, with a script; the steps below make it a thing a kid does.</p>
<ul>{people}</ul>
<h3>A person's drawing, measured</h3>
<div class="scroll"><table><thead><tr><th class="l">person</th><th>ms a drawing, walking</th><th>shapes</th><th>KB</th></tr></thead><tbody>{walk}</tbody></table></div>
<p class="muted">On the {E(M["laptop"])}: the median of 24 drawings of each walking (a stride's moment each, so nothing of theirs cached); the same person put in as a still copy took {M["stillInsert"][0]} to {M["stillInsert"][1]} ms. {E(M["slowTier"])}.</p>

<h2 id="found">Found on the way</h2>
<ul>{found}</ul>

<h2 id="next">What to build first, in small steps</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from ticket 357: {tix(D["trigger"])} The cast is in <a href="data/cast.json">data/cast.json</a>: each person's settings, applied in the app's browser through the game's own set() (every setting took), and the friend's picture kept as SVG (moving parts left out). The two places were made the same way, each person drawn at their spot, then put together. The costumes' inventory comes from reading the code and its history ({"data/costumes.json" if K else "being written"}). The drawing times were measured in the app's browser on the Ubuntu laptop; the slow tier's from ticket 340's runs on GitHub. The page is built by <code>drivers/build.py</code>.</p>
<script type="application/json" id="report-data">{json.dumps({"report": D, "cast": C, "tally": T, "costumes": K}, ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
'''
extra = ('<style>.muted{color:var(--muted)}table{border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:4px 6px;vertical-align:top;text-align:right}'
         'td.l,th.l{text-align:left}.scroll{overflow-x:auto}.cast{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}'
         '.person{margin:0}.person img{width:100%;height:170px;object-fit:contain;background:#fffdf8;border-radius:6px}.person figcaption{font-size:.9em}'
         '.person .like{display:block;color:var(--muted);font-size:.9em}.lacks{margin:4px 0 0;padding-left:1.1em}.lacks li{max-width:none}.lacks .ok{list-style:none;margin-left:-1.1em;color:var(--good)}'
         '.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.two figure{margin:0}.two img{width:100%;border-radius:8px}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
