#!/usr/bin/env python3
"""^du_report(15)'s page, from its data (data/report.json, data/pictures.json) and its pictures (pictures/, made by
drivers/pictures.mjs); the two mock-ups (mockups/) shown in frames, as they are. The page's frame as ^du_report(5)'s to (10)'s.
  node drivers/pictures.mjs && python3 drivers/build.py   (from 015/)"""
import json, html, os, re
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
PICS = json.load(open(os.path.join(HERE, "data", "pictures.json"), encoding="utf-8"))
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
TITLE = "Seen Before It Was Built"
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", f"<title>{TITLE}</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(15)")
assert TITLE in HEAD and "^du_report(15)" in TAIL
S, G, M, H, C = D["sources"], D["game"], D["mockups"], D["heat"], D["checks"]
for f in ("mockups/dragon-fire.html", "mockups/horse-armour.html"):
    assert os.path.exists(os.path.join(HERE, f)), f
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"[Tt]ickets? (\d+)( and (\d+))?", lambda m: m.group(0).split(" ")[0] + " " + ref(int(m.group(1)), "ticket") + ((" and " + ref(int(m.group(3)), "ticket")) if m.group(3) else ""), s)
    return s
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'
def pic(rel): return next(p for p in PICS["pictures"] if p["file"] == rel)
def img(rel, alt, cls=""):
    p = pic(rel); w, h = re.search(r'width="(\d+)" height="(\d+)"', open(os.path.join(HERE, rel), encoding="utf-8").read(2000)).groups()
    return f'<img{f" class={chr(34)}{cls}{chr(34)}" if cls else ""} loading="lazy" src="{rel}" width="{w}" height="{h}" alt="{E(alt)}">'
FIRES = M["dragon"]["options"]; SETS = M["horse"]["options"]
fname = {k: n for k, n, _ in FIRES}; sname = {k: n for k, n, _ in SETS}
def plain(n): return n.split(" ", 1)[1]   # (a name without its emoji)

# ---- Figure 1: the evening, to scale ----
def timeline():
    T0, PX, X = 17 * 60 + 50, 5, 56
    y = lambda hm: 50 + (int(hm[:2]) * 60 + int(hm[3:]) - T0) * PX
    s = ['<line class="grid" x1="56" y1="44" x2="56" y2="500"/>']
    for m in range(T0, 19 * 60 + 21, 10):
        yy = 50 + (m - T0) * PX; s.append(f'<line class="grid" x1="50" y1="{yy}" x2="56" y2="{yy}"/><text class="tick" x="46" y="{yy + 4}" text-anchor="end">{m // 60}:{m % 60:02d}</text>')
    mark = {"matthew": lambda yy: f'<circle cx="{X}" cy="{yy}" r="4.5" class="mk-m"/>',
            "mockup": lambda yy: f'<rect x="{X - 4}" y="{yy - 4}" width="8" height="8" transform="rotate(45 {X} {yy})" class="mk-p"/>',
            "game": lambda yy: f'<rect x="{X - 4}" y="{yy - 4}" width="8" height="8" class="mk-g"/>'}
    last = 0
    for hm, label, kind in D["timeline"]:
        yy = y(hm); ly = max(yy, last + 17); last = ly
        lead = f'<polyline class="lead" points="{X + 6},{yy} {X + 14},{ly} {X + 18},{ly}"/>' if ly != yy else ""
        s.append(f'<g>{lead}{mark[kind](yy)}<text class="lab" x="{X + 22}" y="{ly + 4}"><tspan font-weight="700">{hm}</tspan> {E(label)}</text><title>{hm} {E(label)}</title></g>')
    s.append(f'<line class="grid" x1="56" y1="500" x2="56" y2="522" stroke-dasharray="3 4"/>')
    for i, (when, label) in enumerate(D["timeline_later"]):
        yy = 540 + i * 20
        s.append(f'<text class="lab" x="{X + 22}" y="{yy + 4}"><tspan font-weight="700">{E(when[5:])}</tspan> {E(label)}</text>')
    legend = (f'<circle cx="62" cy="16" r="4.5" class="mk-m"/><text class="tick" x="72" y="20">Matthew\'s words</text>'
              f'<rect x="178" y="12" width="8" height="8" transform="rotate(45 182 16)" class="mk-p"/><text class="tick" x="192" y="20">a mock-up</text>'
              f'<rect x="270" y="12" width="8" height="8" class="mk-g"/><text class="tick" x="284" y="20">the game</text>')
    return (f'<svg class="chart" viewBox="0 0 500 600" role="img" aria-label="A timeline of 2026-10-20 from 17:50 to 19:20, to scale: Matthew asks at 17:53, '
            f'the dragon mock-up is ready at 18:03 and the horse mock-up at 18:24, he answers at 18:48, and 0.0.392 is released at 19:14">{legend}{"".join(s)}</svg>')

# ---- Figure 4: the heat's reach ----
def heatchart():
    side = H["mockup_side"]; s = []
    x0, k = 128, 0.44
    for v in (0, 200, 400, 600):
        x = x0 + v * k; s.append(f'<line class="grid" x1="{x:.0f}" y1="34" x2="{x:.0f}" y2="236"/><text class="tick" x="{x:.0f}" y="252" text-anchor="middle">{v}</text>')
    fx = x0 + 460 * k
    s.append(f'<line class="limit" x1="{fx:.0f}" y1="30" x2="{fx:.0f}" y2="236"/><text class="tick" x="{fx:.0f}" y="24" text-anchor="middle">the friend, standing: about 460</text>')
    for i, (key, name, _) in enumerate(FIRES):
        R, a = side[key]; y = 42 + i * 32
        s.append(f'<g><text class="lab" x="{x0 - 8}" y="{y + 14}" text-anchor="end">{E(plain(name))}</text><rect class="b1" x="{x0}" y="{y}" width="{R * k:.1f}" height="20" rx="3"/>'
                 f'<text class="val1" x="{x0 + R * k + 6:.1f}" y="{y + 14}">{R} · ±{a}°</text><title>{E(plain(name))}: its heat reaches {R} from the mouth, {a} degrees each side</title></g>')
    s.append(f'<text class="tick" x="{x0}" y="272">its reach from the mouth, side on (± its half-angle)</text>')
    return (f'<svg class="chart" viewBox="0 0 500 282" role="img" aria-label="Bars: how far each fire\'s heat reaches, side on: roaring flame 600, fireballs 640, '
            f'twisting fire 570, blue-hot jet 660, brick fire 560, fire bubbles 500; the friend standing is about 460">{"".join(s)}</svg>')

# ---- tables and grids ----
said = "".join(f'<tr><td class="n">{E(t[11:])}{"" if t.startswith("2026-10-20") else " on 10-21"}</td><td>{", ".join(ref(int(x), "ticket") for x in str(n).split(", "))}</td><td>“{E(q)}”</td></tr>' for t, n, q in D["asked"])
firecards = "".join(f'<figure class="card">{img(f"pictures/mock/fire-{k}.svg", "The mock-up: the friend in the dragon costume breathing " + plain(n) + ", its heat a dashed cone")}<figcaption><b>{E(n)}</b> {E(b)}</figcaption></figure>' for k, n, b in FIRES)
horsecards = "".join(f'<figure class="card">{img(f"pictures/mock/horse-{k}.svg", "The mock-up: the horse side on in " + plain(n))}<figcaption><b>{E(n)}</b> {E(b)}</figcaption></figure>' for k, n, b in SETS)
VIEWS = (("side", "side on"), ("front", "toward us"), ("away", "away"))
firerows = "".join(f'<tr><th>{E(n)}</th><td>{img(f"pictures/mock/fire-{k}.svg", "The mock-up: " + plain(n))}</td>' + "".join(f'<td>{img(f"pictures/game/fire-{k}-{v}.svg", "The game at 0.0.392: " + plain(n) + ", " + vn)}</td>' for v, vn in VIEWS) + "</tr>" for k, n, _ in FIRES)
shapes = {(p["fire"], p["view"]): p["fire_shapes"] for p in PICS["pictures"] if "fire_shapes" in p}
heatrows = "".join(f'<tr><td>{E(n)}</td><td class="n">{H["game"]["side"][k][0]} · ±{H["game"]["side"][k][1]}°</td><td class="n">{H["game"]["front"][k]}</td><td class="n">{H["game"]["away"][k][0]} · ±{H["game"]["away"][k][1]}°</td>'
                   + "".join(f'<td class="n">{shapes[(k, v)]}</td>' for v, _ in VIEWS) + "</tr>" for k, n, _ in FIRES)
armourrows = "".join(f'<tr><th>{E(n)}</th><td>{img(f"pictures/mock/horse-{k}.svg", "The mock-up: " + plain(n) + ", side on")}</td><td>{img(f"pictures/game/horse-{k}-side.svg", "The game at 0.0.392: " + plain(n) + ", side on, ridden")}</td>'
                     f'<td>{img(f"pictures/archive/horseArmour--{k}.svg", "The game at 0.0.392: " + plain(n) + ", facing us, led", "ground")}</td></tr>' for k, n, _ in SETS)
STATUS = {"same": "as mocked up", "more": "more in the game", "changed": "changed", "not yet": "not yet", "page only": "the page's own"}
diffrows = "".join(f'<tr><td class="part">{E(a)}</td><td>{E(b)}</td><td>{E(c)}</td><td><span class="st st-{st.replace(" ", "-")}">{STATUS[st]}</span></td></tr>' for a, b, c, st in D["differences"])
counts = {s: sum(1 for r in D["differences"] if r[3] == s) for s in STATUS}
checkrows = "".join(f'<tr><td><code>{E(n)}</code></td><td>{E(w)}</td>' + "".join(f'<td class="n">{r[v][0]} ok, {r[v][1]} FAIL</td>' for v in ("0.0.392", "0.0.397")) + "</tr>" for n, w, r in C["ticket_checks"])
okall = sum(r["0.0.392"][0] for _, _, r in C["ticket_checks"])
okparts = " + ".join(str(r["0.0.392"][0]) for _, _, r in C["ticket_checks"])
otherfails = "".join(f'<li><code>{E(n)}</code> ({k} FAIL {"line" if k == 1 else "lines"}): {E(w)}; mended in the check alone ({E(fx)}).</li>' for n, k, w, fx in C["other_fails_0_0_392"])
choicerows = "".join(f'<tr><td>{E(a)}</td><td>{E(b)}</td><td>{E(c)}</td><td>{E(d)}</td></tr>' for a, b, c, d in D["choice"]["in_the_game"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
kpis = "".join(f'<div class="kpi"><div class="v">{E(v)}</div><div class="l">{E(l)}</div></div>' for v, l in D["kpis"])
GH = "https://github.com/matthewhammer/kids-choice-games/tree/main/dress-up/reports/015/"
def frame(key, label):
    m = M[key]
    return (f'<div class="frame"><iframe class="mock" src="{m["file"]}" title="{E(label)}" loading="lazy"></iframe></div>'
            f'<p class="note"><a href="{m["file"]}">Open the {E(label)} on a page of its own</a>: <code>{m["file"]}</code>, {m["bytes"]:,} bytes, the file Matthew looked at, unchanged. '
            f'Everything on it runs in the browser; nothing is sent anywhere.</p>')

body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(15)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(D["after"])}</p>
<h1>Seen before it was built</h1>
<p class="sub">{E(D["question"])} From {tix("tickets 499 and 498")}: Matthew looked at both mock-ups on 2026-10-21, said “looks good” of each, and asked for them to be published as a report. Here they are, to play with, beside what went out in {G["version"]} (commit <code>{G["commit"]}</code>, released {G["released"]}).</p>

<div class="headline" id="answers">
<p><b>Short answers.</b></p>
<ol>
<li><b>Two mock-ups, ready 10 and 31 minutes after he asked.</b> At 17:53 Matthew asked for a dragon costume ({tix("ticket 499")}) and for horse pieces for the knight ({tix("ticket 498")}), from Lego castles and knights. By 18:03 a page showed the friend in a dragon suit breathing six kinds of fire; by 18:24 a page showed the game's horse in six sets of armour. Each starts from the game's own drawing (the friend in the wolf suit; the horse side on), so what he saw was, side on, what the game would draw.</li>
<li><b>He did not pick: all of it went out, for M and N to choose.</b> At 18:48: “{E(D["choice"]["words"])}” {G["version"]}, released at 19:14, 81 minutes after the first ask and 26 after his answer, has the costume, all six fires and all six armour sets, each a choice in the game.</li>
<li><b>The mock-ups' drawings became the game's.</b> Side on, the game's fires are the mock-up's shapes with the same timings, and their heat is the same six cones, 500 to 660 long (the friend standing is about 460) and 6 to 16 degrees each side, popping the bubbles it reaches, as Matthew asked at 17:58. The game then draws each piece again from the other sides, where each mock-up drew one: each fire toward us and away, the armour from the front and behind, led and ridden.</li>
<li><b>Two proposals are not built yet:</b> fire from things in a scene (a torch, a campfire, a cannon, a placed dragon), and armour pieces placed on their own (a chanfron on a stand). Smaller differences: a tap gives no puff of its own, and the plume swings with the horse's stride instead of swaying all the time.</li>
<li><b>Checked, not yet timed.</b> The three tickets' checks (<code>armour498</code>, <code>dragon499</code>, <code>fire499</code>) passed all {okall} of their lines ({okparts}) in {G["version"]}'s run on GitHub and again in 0.0.397's. No frame-rate case yet breathes fire or rides the armoured horse.</li>
</ol>
</div>

<div class="kpis">{kpis}</div>
<div class="pics">
<figure>{img("pictures/mock/fire-roar.svg", "The dragon mock-up: the friend in the dragon costume breathing a roaring flame, its heat a dashed cone")}<figcaption>The dragon mock-up's 🔥 roaring flame, drawn by the mock-up's own code; the dashed cone is its heat.</figcaption></figure>
<figure>{img("pictures/archive/kind--dragon.svg", "The game at 0.0.392: the friend in the dragon costume, facing us, wings flapping", "ground")}<figcaption>The dragon costume in the game at {G["version"]}, facing us, its wings flapping: the picture archive's own picture.</figcaption></figure>
<figure>{img("pictures/archive/horseArmour--half.svg", "The game at 0.0.392: the horse in the half caparison, facing us, led by the friend", "ground")}<figcaption>🦁 The half caparison in the game, facing us and led; the friend is not a knight, so the cloth takes the halter's brown.</figcaption></figure>
</div>

<h2 id="asked">What was asked, and when</h2>
<p>{ref(499, "ticket")} began as a costume and grew into an action: wings and a tail, then breath, then fire that beats bubbles. The mock-up was asked for at 17:54, and the heat and the spikes came while it was being drawn. For {ref(498, "ticket")} Matthew asked for horse pieces, “not just saddles”; its first step was to be a list of the pieces, and the mock-up drew them on the game's own horse instead. Each mock-up ended with a question for him (in the tickets' notes): which fires to build first, and is the costume right as drawn; which sets, and should they take the knight's colours. His answer at 18:48 covered both, and the hens of {ref(506, "ticket")}.</p>
<figure id="fig-1">{timeline()}<figcaption>Figure 1. The evening of 2026-10-20, to scale (Mountain time). Matthew's words from the tickets' logs; the mock-ups from the tickets' notes and the files' times; the building, review and release from the commits in {G["version"]}. Below the dashes, what followed (not to scale).</figcaption></figure>
<div class="scroll"><table class="said"><thead><tr><th>when</th><th>ticket</th><th>Matthew's words</th></tr></thead><tbody>{said}</tbody></table></div>
<p class="note">{tix(D["asked_note"])}</p>

<h2 id="dragon">The dragon and its fires: the mock-up</h2>
<p>For {ref(499, "ticket")}, ready at 18:03. The page draws the friend as the game draws them in the wolf suit, standing and facing right, recoloured, with the dragon's pieces added: horns, spines down the hood, teeth along the hood's opening, a slit eye on the hood, scales, a plated belly, claws, bat wings that flap, and a long tail with its spines standing up and a spade at its end. Pick a fire beside the picture or a card under it; hold “🔥 hold to breathe fire” (or F, once the frame has been clicked); untick “keep breathing” to see it stop. Bubbles drift in from the right, and the heat pops them. At the bottom, the page's own proposal: how it could go into the game.</p>
{frame("dragon", "dragon mock-up")}
<figure id="fig-2">{img("pictures/mock/dragon-pieces.svg", "The mock-up's big picture: the friend in the dragon costume with its pieces named (horns, spines, wings, tail and its spade, teeth on the hood, belly plates, claws), breathing a roaring flame on a dusk sky")}<figcaption>Figure 2. The costume, its pieces named, as the mock-up's big picture draws it: the roaring flame on, the dusk sky. Drawn by the mock-up's own code; it moves in a browser (the wings sweep 1.7 s each way).</figcaption></figure>
<figure id="fig-3"><div class="cards">{firecards}</div><figcaption>Figure 3. The six fires, as the mock-up's cards draw them, each with its heat, the dashed cone. Each fire is a fixed set of shapes, each moved by an animation of its own; the words are the mock-up's.</figcaption></figure>
<h3 id="heat">Heat that reaches past the flames</h3>
<p>Matthew at 17:58: “{E(D["asked"][5][2])}” In the mock-up each fire has a heat: a cone from the mouth, longer than its flames, shown as a dashed, shimmering edge (Figure 3). While the fire is on, any bubble whose edge is inside the cone pops, and the page counts them. The blue-hot jet reaches farthest and narrowest, the fire bubbles least far and widest; every one reaches past the friend's own height.</p>
<figure id="fig-4">{heatchart()}<figcaption>Figure 4. How far each fire's heat reaches from the mouth, side on, and its half-angle: the mock-up's numbers (HEAT), which the game keeps unchanged ({src("code")}). The dashed line is the friend's height standing, from the top of the hood to the soles, in the same units. All six values are in the table under Figure 7.</figcaption></figure>

<h2 id="armour">The horse's armour: the mock-up</h2>
<p>For {ref(498, "ticket")}, ready at 18:24. The page draws the game's own horse as 0.0.390 drew it, side on and ridden with its saddle on, and dresses it in six sets in the knight's arms (two colours, a layout and an emblem, as 🐯 Costume's knight has them), so a knight and their horse match. Pick a set; change the arms and the horse's coat beside it.</p>
{frame("horse", "horse armour mock-up")}
<figure id="fig-5"><div class="cards">{horsecards}</div><figcaption>Figure 5. The six sets, as the mock-up's cards draw them, in the arms it starts with (quartered blue and white, a falcon) on a white horse. Drawn by the mock-up's own code; the plumes sway in a browser. {E(M["horse"]["key_note"])}</figcaption></figure>

<h2 id="shipped">What went out in {G["version"]}</h2>
<p>After Matthew's answer at 18:48, the four things he released (the armour, the dragon, the fire and the stable's hens of {ref(506, "ticket")}) were built in parallel, each reviewed and fixed, then merged and released together as {G["version"]} at 19:14 (<code>{G["commit"]}</code>) {src("release")}. Its entry in the game's list of versions {src("versions")}: “{E(G["versions_md"])}” Nothing of the dragon, the fire or the armour has changed since, to 0.0.397.</p>

<h3 id="shipped-dragon">The dragon costume</h3>
<p>🐯 Costume has a 🐉 dragon after the deer, with the mock-up's pieces and its four colours to start with, each with 6 to 8 swatches and “any color”. It is drawn facing us, from behind and from the side; standing, sitting, lying, crawling and swimming. Its wings flap with their own slow beat or with an LFO from the mixing board, stay open, or fold.</p>
<figure id="fig-6"><div class="pics four">
<div>{img("pictures/mock/dragon-pieces.svg", "The mock-up's dragon, side on")}<p class="note">the mock-up, side on</p></div>
<div>{img("pictures/archive/kind--dragon.svg", "The game's dragon facing us, wings flapping", "ground")}<p class="note">the game, wings flapping</p></div>
<div>{img("pictures/archive/dragonWingsHow--open.svg", "The game's dragon facing us, wings open and still", "ground")}<p class="note">🦇 open and still</p></div>
<div>{img("pictures/archive/dragonWingsHow--folded.svg", "The game's dragon facing us, wings folded", "ground")}<p class="note">🌂 folded</p></div>
</div><figcaption>Figure 6. The mock-up's dragon and the game's at {G["version"]}: the picture archive's run of {G["version"]} (tag <code>run-2026-10-20</code>), the game's own pictures of the costume {src("archive")}. The flapping wings move in a browser.</figcaption></figure>

<h3 id="shipped-fire">Breathing fire</h3>
<p>🔥 Breathing fire is held, as 🫧 blowing bubbles is: 🔥 on the game controller (the right trigger), on the screen's controller, or F. Anyone can, whatever they wear. 🎮 Controls has a group, “🔥 breathing fire”: its fire (the six), from where (the 👄 mouth, the 🫲 left hand or the 🫱 right hand), how big (50 to 200) and whether its heat shows. The fire is drawn in a picture of its own laid over the scene, built once and then only moved; every shape in it is moved by a CSS animation, so the page does no work a frame for the flames. While it is held, the game works out each frame which bubbles are in its heat, and pops them: bubble space's and the smaller ones they throw, the bubble room's (at most 10 a frame), the bubble makers', the friend's blown ones and a diving suit's leaks. Let go, it fades in 0.2 s and nothing runs for it.</p>
<p>Side on, the six fires are the mock-up's: the same shapes, moved by the same keyframes. Toward us and away, each is a drawing of its own, not the side-on fire turned (Matthew's rule for a new angle): toward us it comes out of an open “O” mouth at us, its heat a disc; away it rises past the head.</p>
<figure id="fig-7"><div class="scroll"><table class="gallery fires"><thead><tr><th>fire</th><th>the mock-up</th><th>the game: side on</th><th>toward us</th><th>away</th></tr></thead><tbody>{firerows}</tbody></table></div>
<figcaption>Figure 7. Each fire as the mock-up drew it (with the dragon) and as the game at {G["version"]} draws it: the fire alone, its heat shown, from the mouth (the friend left out), on the mock-up's dusk sky. Drawn by each one's own code (How this was put together); they move in a browser.</figcaption></figure>
<div class="scroll"><table class="nums"><thead><tr><th rowspan="2">fire</th><th colspan="3">its heat (reach · half-angle; toward us, a disc's radius)</th><th colspan="3">shapes in the fire</th></tr><tr><th>side on</th><th>toward us</th><th>away</th><th>side on</th><th>toward us</th><th>away</th></tr></thead><tbody>{heatrows}</tbody></table></div>
<p class="note">The heat in the friend's units, from the game's FIRE_HEAT at {G["version"]} {src("code")} (side on, the mock-up's HEAT, number for number). Shapes: the paths, circles, ellipses and other shapes each fire is drawn with, its heat and the mouth left out, counted in the pictures above (data/pictures.json).</p>

<h3 id="shipped-armour">The horse's armour</h3>
<p>🧍 Body's 🐴 the horse has “🛡️ its armour”: none (to start with) or one of the six, under the mock-up's names. Each set is drawn side on, from the front and from behind, each a drawing of its own, led and ridden. The cloth and the plume take the knight's arms while the friend is a knight (the middle column below, in the mock-up's arms); otherwise the halter's colour and a lighter shade of it, quartered, with no emblem (the right column, where the friend is not a knight). The plumes and the parade's ribbons swing with the stride, as the tail does, and hang still while the horse stands.</p>
<figure id="fig-8"><div class="scroll"><table class="gallery horses"><thead><tr><th>set</th><th>the mock-up</th><th>the game: side on, ridden</th><th>facing us, led</th></tr></thead><tbody>{armourrows}</tbody></table></div>
<figcaption>Figure 8. Each set as the mock-up drew it and as the game at {G["version"]} draws it: side on and ridden in the mock-up's arms (the game's horseSvg, run under node), and facing us, led (the picture archive's run of {G["version"]}). Side on they are the same drawing, but for the tail, which the game draws over the cloth, and the tournament's head, where the game draws the bridle over the cloth so the rein has its ring.</figcaption></figure>

<h3 id="checks">Checked</h3>
<p>Each ticket has a check that drives the released game in Chrome on GitHub's computers and prints a line, ok or FAIL, for each thing it checks. Counted in the logs of {G["version"]}'s run {src("run392")} and 0.0.397's {src("run397")}:</p>
<div class="scroll"><table class="nums"><thead><tr><th>check</th><th>what it checks</th><th>{G["version"]}</th><th>0.0.397</th></tr></thead><tbody>{checkrows}</tbody></table></div>
<p>The game's record of its runs {src("speed")} marks {G["version"]} broken, by three other tickets' checks, each mended in the check alone; from 0.0.394 every version is ok:</p>
<ul>{otherfails}</ul>
<p>In the same run the frame-rate gate passed: all 14 of its cases at 55 frames a second or more, its slow scenes all 10, the slow-laptop tier (the Ubuntu laptop, Intel i7) both, and all 56 places with the on-screen controller at 58 or more. {E(C["not_measured"])}</p>

<h2 id="differs">Where the game differs from the mock-ups</h2>
<p>Each thing the mock-ups offered, on the page or in their proposals, against the game at {G["version"]}: {counts["same"]} as mocked up, {counts["more"]} with more in the game, {counts["changed"]} changed, {counts["not yet"]} not yet built, and {counts["page only"]} that were the page's own, for looking.</p>
<div class="scroll"><table class="diff"><thead><tr><th></th><th>the mock-up</th><th>the game, {G["version"]}</th><th></th></tr></thead><tbody>{diffrows}</tbody></table></div>

<h2 id="choice">The kids' choice</h2>
<p>Matthew did not choose between the fires or the sets. At 18:48: “{E(D["choice"]["words"])}” So {G["version"]} offers every one, each a choice where a player finds it:</p>
<div class="scroll"><table class="nums"><thead><tr><th>the choice</th><th>where</th><th>how many</th><th>to start with</th></tr></thead><tbody>{choicerows}</tbody></table></div>
<p>{E(D["choice"]["picked"])} Step 4 below.</p>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="method">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from {tix("ticket 519")}. {tix(D["trigger"])} The two mock-ups were made by Claude on 2026-10-20 for {tix("tickets 499 and 498")} (the dragon's file saved at 17:59, the horse's at 18:24), and are published here as they were: their SHA-256 begin <code>{M["dragon"]["sha256"][:16]}</code> and <code>{M["horse"]["sha256"][:16]}</code> {src("mockups")}. This page only sizes each frame to its page, passes the theme switch on to it, and opens the mock-ups' links to other sites in a new tab.</p>
<p>Every picture was drawn by code, none by hand, by <code>drivers/pictures.mjs</code>. The mock-ups' pictures by each page's own script, run under node with a stand-in page, its <code>scene()</code> called with the page's own starting values, and its animations put inside the picture. The game's by the game at its release tag <code>{G["tag"]}</code>: its 26 script parts loaded under node, as the game's load check loads them, then <code>horseSvg()</code> and <code>fireSvg()</code>, with the fire's animations from its style sheet. The archive's are the picture archive's run of {G["version"]}, made on GitHub at 19:35 that evening, copied as they are {src("archive")}. Each was looked at as a still on the laptop (librsvg, through ffmpeg, which draws no animation: in such a still the mock-ups' flames, which take their colours from their animations, are black blobs at the mouth); in a browser they move. Pictures shown with &lt;img&gt; keep the light colours they were drawn in, on either theme.</p>
<p>The times are from the tickets' logs and the release's commits {src("release")}; the check counts are the ok and FAIL lines in the two runs' logs; what shipped, and how, is read from the code at the tag {src("code")} and the list of versions {src("versions")}. The data is in <a href="data/report.json">data/report.json</a> and <a href="data/pictures.json">data/pictures.json</a> (every picture: what it shows, where it came from, its bytes and shapes), and embedded in this page; on GitHub, the folders <a href="{GH}data">data</a>, <a href="{GH}drivers">drivers</a>, <a href="{GH}pictures">pictures</a> and <a href="{GH}mockups">mockups</a>. The page is built by <code>drivers/build.py</code>.</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(dict(D, pictures=PICS), ensure_ascii=False).replace("</", "<\\/")}</script>
</main>
<script>
// (the mock-ups in their frames: each frame as tall as its page, so nothing scrolls inside it; and the page's theme switch passed
// on, with the page's own dark colours also under data-theme="dark", since the mock-ups have them only for a dark system;
// and their links to other sites opened in a new tab, not in the frame)
(() => {{
  const fit = f => {{ try {{ const b = f.contentDocument.body; if (b) f.style.height = Math.ceil(b.getBoundingClientRect().height) + "px"; }} catch (e) {{}} }};
  const theme = f => {{ try {{
    const d = f.contentDocument, t = document.documentElement.getAttribute("data-theme");
    if (!d || !d.head) return;
    if (t) d.documentElement.setAttribute("data-theme", t); else d.documentElement.removeAttribute("data-theme");
    if (!d.getElementById("dark-too")) for (const sh of d.styleSheets) for (const r of sh.cssRules)
      if (r.media && /prefers-color-scheme:\\s*dark/.test(r.media.mediaText)) for (const q of r.cssRules) {{
        const s = d.createElement("style"); s.id = "dark-too"; s.textContent = ':root[data-theme="dark"] {{ ' + q.style.cssText + ' }}'; d.head.appendChild(s); }}
  }} catch (e) {{}} }};
  for (const f of document.querySelectorAll("iframe.mock")) {{
    const go = () => {{ theme(f); fit(f); try {{ new ResizeObserver(() => fit(f)).observe(f.contentDocument.body); }} catch (e) {{}}
      try {{ for (const a of f.contentDocument.querySelectorAll('a[href^="http"]')) {{ a.target = "_blank"; a.rel = "noopener"; }} }} catch (e) {{}} }};
    f.addEventListener("load", go);
    try {{ if (f.contentDocument && f.contentDocument.readyState === "complete" && f.contentDocument.body && f.contentDocument.body.children.length) go(); }} catch (e) {{}}
  }}
  new MutationObserver(() => document.querySelectorAll("iframe.mock").forEach(theme)).observe(document.documentElement, {{ attributes: true, attributeFilter: ["data-theme"] }});
}})();
</script>
'''
extra = ('<style>.muted{color:var(--muted)}'
         '.pics{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:12px;margin:18px 0}.pics figure{margin:0}'
         '.pics img{width:100%;height:220px;object-fit:contain;border-radius:10px;border:1px solid var(--line);display:block}'
         '.pics.four{grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr))}.pics.four .note{margin:4px 0 0}'
         'img.ground{background:#fffdf8}'
         '.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:12px}.cards figure.card{margin:0;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden}'
         '.cards img{width:100%;height:auto;display:block}.cards figcaption{padding:8px 10px 10px;margin:0;color:var(--muted)}.cards figcaption b{display:block;color:var(--ink)}'
         '#fig-2 img{width:100%;height:auto;border-radius:10px;border:1px solid var(--line);display:block}'
         '.frame{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--paper);margin:14px 0 6px}'
         '.frame iframe{display:block;width:100%;height:1400px;border:0}'
         '.gallery td,.gallery th{vertical-align:middle}.gallery img{display:block;height:auto;border-radius:6px;border:1px solid var(--line)}'
         '.fires img{width:auto;height:96px}.horses img{width:auto;height:150px}.gallery th:first-child{white-space:nowrap}'
         'table.said td:first-child,table.said td:nth-child(2){white-space:nowrap}'
         'table.diff td.part{white-space:nowrap}.st{display:inline-block;font-size:.78em;border:1.5px solid var(--line);border-radius:999px;padding:0 8px;white-space:nowrap}'
         '.st-same{border-color:var(--good)}.st-more{border-color:var(--accent)}.st-changed{border-color:var(--alt)}.st-not-yet{border-color:var(--bad)}.st-page-only{border-style:dashed}'
         'svg.chart .mk-m{fill:var(--accent)}svg.chart .mk-p{fill:var(--alt)}svg.chart .mk-g{fill:var(--ink)}svg.chart .lead{fill:none;stroke:var(--muted);stroke-width:1}'
         'svg.chart .limit{stroke:var(--bad);stroke-dasharray:4 3}#fig-1 svg.chart,#fig-4 svg.chart{max-width:640px}.sources li{max-width:none}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")
