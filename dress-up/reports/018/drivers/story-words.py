# (Matthew, 2026-10-24: "let's make a 1 pager for this content [^du_report(18)'s #ch11, the quick card]; the audience are kids 5-8,
# and we want images for each word, maybe simplified. the output should be PDF, so I can print directly"; then "add another PDF to
# download, under item 13 (zine pdfs)") One page of the story words, each with a picture: the friend drawn simply in line art (black
# on white, little ink, to color in), in Andika, a typeface made for children learning to read. WeasyPrint lays it out on Letter,
# no browser needed (pip install --target <dir> weasyprint; Andika, DejaVu Sans Mono and Noto Color Emoji from the system).
#   PYTHONPATH=<dir> python3 dress-up/reports/018/drivers/story-words.py  ->  dress-up/manuals/story-words-one-page.pdf
import os, weasyprint

INK = "#111"
S = f'fill="#fff" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'
L = f'fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'
DOT = f'fill="{INK}" stroke="none"'

def head(cx=50, cy=26, view="front", r=12, sleepy=False):
    """The friend's head: round, with a fringe, as the game draws her (simply)."""
    g = [f'<circle cx="{cx}" cy="{cy}" r="{r}" {S}/>']
    if view == "front":
        g.append(f'<path d="M{cx-r} {cy} Q{cx-r} {cy-r-2} {cx} {cy-r-1} Q{cx+r} {cy-r-2} {cx+r} {cy} Q{cx+5} {cy-7} {cx} {cy-6} Q{cx-6} {cy-7} {cx-r} {cy} Z" fill="{INK}"/>')
        if sleepy:
            g.append(f'<path d="M{cx-6} {cy+1} q2 2 4 0 M{cx+2} {cy+1} q2 2 4 0" {L} stroke-width="1.6"/>')
        else:
            g.append(f'<circle cx="{cx-4.5}" cy="{cy+1}" r="1.7" {DOT}/><circle cx="{cx+4.5}" cy="{cy+1}" r="1.7" {DOT}/>')
        g.append(f'<path d="M{cx-4} {cy+6} Q{cx} {cy+9} {cx+4} {cy+6}" {L} stroke-width="1.8"/>')
    elif view in ("left", "right"):
        k = -1 if view == "left" else 1
        g.append(f'<path d="M{cx-k*r} {cy+4} Q{cx-k*(r+2)} {cy-r} {cx} {cy-r-1} Q{cx+k*r} {cy-r} {cx+k*(r-1)} {cy-3} Q{cx} {cy-6} {cx-k*2} {cy+2} Q{cx-k*6} {cy+6} {cx-k*r} {cy+4} Z" fill="{INK}"/>')
        g.append(f'<circle cx="{cx+k*5}" cy="{cy+1}" r="1.7" {DOT}/>')
        g.append(f'<path d="M{cx+k*r} {cy+1} l{k*3} 3 l{-k*3} 1" {L} stroke-width="1.8"/>')
        g.append(f'<path d="M{cx+k*3} {cy+7} q{k*3} 1 {k*5} -1" {L} stroke-width="1.6"/>')
    else:  # back: all hair
        g.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}"/>')
    return "".join(g)

def body(arms, legs, cx=50, top=40, bottom=70, extra=""):
    """Shirt, arms (two polylines from the shoulders) and legs (two polylines from the hips), with shoes."""
    g = []
    for pts in legs:
        g.append(f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" {L} stroke-width="3.2"/>')
        (x, y) = pts[-1]; (px, py) = pts[-2]
        k = 1 if x >= px else -1
        g.append(f'<ellipse cx="{x + k*2}" cy="{y + 1}" rx="5" ry="3" {DOT}/>')
    g.append(f'<path d="M{cx-9} {top} L{cx+9} {top} L{cx+12} {bottom} L{cx-12} {bottom} Z" {S}/>')
    for pts in arms:
        g.append(f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" {L} stroke-width="3"/>')
        (x, y) = pts[-1]
        g.append(f'<circle cx="{x}" cy="{y}" r="2.6" {S} stroke-width="1.8"/>')
    return "".join(g) + extra

def friend(pose, view="front"):
    """The friend in a pose, in a 100 x 110 box."""
    if pose == "stand":
        return body([[(41, 44), (35, 70)], [(59, 44), (65, 70)]], [[(45, 70), (44, 100)], [(55, 70), (56, 100)]]) + head()
    if pose == "walk":
        return (body([[(41, 44), (33, 62)], [(59, 44), (66, 64)]], [[(46, 70), (36, 98)], [(54, 70), (62, 99)]])
                + head(view="right"))
    if pose == "dance":
        return (body([[(41, 44), (30, 32), (28, 18)], [(59, 44), (70, 32), (74, 18)]], [[(46, 70), (40, 99)], [(54, 70), (70, 88), (78, 96)]])
                + head() + f'<path d="M14 40 q4 -3 0 -7 M86 40 q-4 -3 0 -7 M10 60 q5 -3 0 -7" {L} stroke-width="1.8"/>'
                + f'<path d="M84 16 l2 -6 l2 6 m-4 -2 h4" {L} stroke-width="1.6"/>')
    if pose == "sit":
        return (f'<rect x="28" y="76" width="44" height="26" rx="3" {S}/>'
                + body([[(41, 50), (34, 74)], [(59, 50), (66, 74)]], [[(45, 76), (36, 84), (36, 104)], [(55, 76), (64, 84), (64, 104)]], top=46, bottom=76)
                + head(cy=32))
    if pose == "lie":
        return (f'<rect x="2" y="80" width="96" height="10" rx="5" {S}/>'
                + f'<g transform="rotate(-90 50 66)">'
                + body([[(41, 44), (36, 70)], [(59, 44), (64, 70)]], [[(45, 70), (45, 100)], [(55, 70), (55, 100)]]) + head(sleepy=True)
                + '</g>' + f'<text x="80" y="38" font-family="Andika" font-size="13" font-weight="700" fill="{INK}">z z</text>')
    if pose == "meditate":
        return (body([[(41, 46), (32, 66), (34, 80)], [(59, 46), (68, 66), (66, 80)]], [], top=42, bottom=74)
                + f'<path d="M24 86 Q38 72 50 80 Q62 72 76 86 Q50 96 24 86 Z" {S} stroke-width="3"/>'
                + head(cy=28, sleepy=True) + f'<path d="M50 6 v-4 M40 9 l-2 -3 M60 9 l2 -3" {L} stroke-width="1.6"/>')
    if pose == "hug":
        heart = f'<path d="M50 70 C40 62 38 54 44 51 C47 49 50 52 50 54 C50 52 53 49 56 51 C62 54 60 62 50 70 Z" {S} stroke-width="2"/>'
        return (body([], [[(45, 70), (44, 100)], [(55, 70), (56, 100)]]) + heart
                + f'<path d="M41 45 Q30 58 44 64 Q50 66 56 64 Q70 58 59 45" {L} stroke-width="3"/>' + head())
    raise ValueError(pose)

def svg(inner, w=100, h=110, cls="pic", vb=None):
    return f'<svg class="{cls}" viewBox="{vb or f"0 0 {w} {h}"}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'

def floor():
    """walk X Z: the floor seen from the front, 0 to 100 across, far 0 to near 100, the friend at 30 80."""
    fl = f'<path d="M70 20 L250 20 L300 120 L20 120 Z" {S} stroke-width="2"/>'
    grid = "".join(f'<path d="M{70 + 180*t/4:.1f} 20 L{20 + 280*t/4:.1f} 120" {L} stroke-width="0.7" stroke-dasharray="3 3"/>' for t in (1, 2, 3))
    grid += "".join(f'<path d="M{70 - 50*t/4:.1f} {20 + 100*t/4:.1f} L{250 + 50*t/4:.1f} {20 + 100*t/4:.1f}" {L} stroke-width="0.7" stroke-dasharray="3 3"/>' for t in (1, 2, 3))
    X, Z = 0.3, 0.8
    fx, fy = 70 - 50*Z + (180 + 100*Z) * X, 20 + 100*Z
    star = f'<path d="M{fx+14} {fy-4} l2.4 5 5.4 0.8 -4 3.8 1 5.4 -4.8 -2.6 -4.8 2.6 1 -5.4 -4 -3.8 5.4 -0.8 z" fill="{INK}"/>'
    who = f'<g transform="translate({fx-22} {fy-47}) scale(0.44)">{friend("walk")}</g>'
    labels = (f'<text x="20" y="140" font-family="Andika" font-size="13" fill="{INK}">⬅ 0</text>'
              f'<text x="270" y="140" font-family="Andika" font-size="13" fill="{INK}">100 ➡</text>'
              f'<text x="128" y="140" font-family="Andika" font-size="12" fill="{INK}">1st number: across</text>'
              f'<text x="256" y="16" font-family="Andika" font-size="12" fill="{INK}">0 far</text>'
              f'<text x="304" y="112" font-family="Andika" font-size="12" fill="{INK}">100 near</text>'
              f'<text x="304" y="66" font-family="Andika" font-size="12" fill="{INK}">2nd number:</text>'
              f'<text x="304" y="80" font-family="Andika" font-size="12" fill="{INK}">toward you</text>'
              f'<path d="M283 26 L310 96" {L} stroke-width="1.4"/><path d="M304 88 l6 8 l1 -10" {L} stroke-width="1.4"/>'
              f'<path d="M40 128 H278" {L} stroke-width="1.4"/><path d="M270 124 l8 4 l-8 4" {L} stroke-width="1.4"/>')
    return svg(fl + grid + star + who + labels, vb="0 0 380 146", cls="floor")

def hourglass():
    return svg(f'<path d="M30 12 H70 M30 98 H70" {L} stroke-width="4"/>'
               f'<path d="M34 14 Q34 46 50 55 Q66 46 66 14 Z M34 96 Q34 64 50 55 Q66 64 66 96 Z" {S}/>'
               f'<path d="M42 30 Q50 40 58 30 Z M38 94 Q50 74 62 94 Z" fill="{INK}"/><path d="M50 55 V80" {L} stroke-width="1.4" stroke-dasharray="2 3"/>')

def lever():
    plate = lambda x, up: (f'<rect x="{x-10}" y="40" width="20" height="40" rx="3" {S}/><rect x="{x-3}" y="48" width="6" height="24" rx="3" {L} stroke-width="1.6"/>'
                           f'<path d="M{x} 60 L{x + (14 if up else 14)} {28 if up else 92}" {L} stroke-width="3.4"/><circle cx="{x + 14}" cy="{28 if up else 92}" r="6" {S}/>'
                           f'<circle cx="{x}" cy="60" r="2.4" {DOT}/>')
    return svg(plate(26, True) + plate(70, False)
               + f'<text x="21" y="116" font-family="Andika" font-size="15" font-weight="700" fill="{INK}">L</text>'
               + f'<text x="65" y="116" font-family="Andika" font-size="15" font-weight="700" fill="{INK}">R</text>', vb="0 0 100 120")

def bubble():
    return svg(f'<path d="M10 18 Q10 8 22 8 H86 Q96 8 96 18 V52 Q96 62 86 62 H40 L24 80 L28 62 H22 Q10 62 10 52 Z" {S}/>'
               f'<text x="53" y="42" text-anchor="middle" font-family="Andika" font-size="17" font-weight="700" fill="{INK}">Hi there!</text>'
               f'<g transform="translate(-4 52) scale(0.5)">{friend("stand")}</g>', vb="0 0 104 110")

def loop():
    return svg(f'<path d="M67 21 A34 34 0 1 1 33 21" {L} stroke-width="5"/><path d="M40 17 L30 30 L24 17 Z" fill="{INK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
               f'<text x="50" y="58" text-anchor="middle" font-family="Andika" font-size="15" font-weight="700" fill="{INK}">again!</text>')

def note():
    return svg(f'<path d="M16 12 H84 V74 L66 92 H16 Z" {S}/><path d="M84 74 H66 V92" {S}/>'
               f'<text x="26" y="40" font-family="DejaVu Sans Mono" font-size="20" font-weight="700" fill="{INK}">#</text>'
               f'<path d="M44 34 H74 M26 52 H74 M26 66 H58" {L} stroke-width="2" stroke-dasharray="1 5"/>')

def buttons():
    b = lambda x, inner: f'<rect x="{x}" y="22" width="40" height="40" rx="9" {S}/>{inner}'
    play = b(4, f'<path d="M18 32 L36 42 L18 52 Z" fill="{INK}"/>')
    stop = b(52, f'<rect x="63" y="33" width="18" height="18" rx="2" fill="{INK}"/>')
    clap = (f'<rect x="100" y="34" width="40" height="28" rx="3" {S}/><path d="M100 26 L138 18 L140 26 L102 34 Z" {S}/>'
            f'<path d="M110 24 l4 8 M122 21 l4 8 M132 19 l4 8" {L} stroke-width="2"/>')
    lab = lambda x, t: f'<text x="{x}" y="80" text-anchor="middle" font-family="Andika" font-size="12" fill="{INK}">{t}</text>'
    return svg(play + stop + clap + lab(24, "play") + lab(72, "stop") + lab(120, "here"), vb="0 0 146 88", cls="wide")

def paths():
    feet = "".join(f'<ellipse cx="{x}" cy="{y}" rx="3" ry="4.5" transform="rotate({a} {x} {y})" {DOT}/>'
                   for x, y, a in [(26, 92, 70), (40, 98, 80), (58, 100, 90), (76, 98, 100), (92, 92, 115), (104, 82, 135)])
    return svg(f'<ellipse cx="66" cy="78" rx="50" ry="26" {L} stroke-width="1.6" stroke-dasharray="4 4"/>' + feet
               + f'<g transform="translate(44 6) scale(0.62)">{friend("walk")}</g>'
               + f'<path d="M112 60 q8 -6 4 -14" {L} stroke-width="2"/><path d="M110 46 l6 0 l0 6" {L} stroke-width="2"/>', vb="0 0 132 110")

def faces():
    return svg("".join(f'<g transform="translate({i*52} 0)">{head(26, 26, v, 14)}'
                       f'<text x="26" y="62" text-anchor="middle" font-family="Andika" font-size="12" fill="{INK}">{v}</text></g>'
                       for i, v in enumerate(["left", "front", "right", "back"])), vb="0 0 208 68", cls="faces")

def poses():
    return svg("".join(f'<g transform="translate({i*100} 0)">{friend(p)}'
                       f'<text x="50" y="124" text-anchor="middle" font-family="Andika" font-size="14" fill="{INK}">{p}</text></g>'
                       for i, p in enumerate(["stand", "sit", "lie", "meditate", "hug", "dance"])), vb="0 -4 600 134", cls="poses")

def card(word, example, words, pic, cls=""):
    return (f'<section class="card {cls}"><div class="pic-box">{pic}</div><div class="say">'
            f'<h2>{word}</h2><code>{example}</code><p>{words}</p></div></section>')

cards = [
    card("walk", "walk 30 80", "Go to a spot on the floor. The <b>1st number</b> goes across, from 0 (left) to 100 (right). "
         "The <b>2nd number</b> comes toward you, from 0 (far) to 100 (near).", floor(), "full walk"),
    card("pose", "pose dance", "Make a shape with your body!", poses(), "full pose"),
    card("face", "face left", "Turn to look left, front, right or back.", faces(), "half wide-pic"),
    card("wait", "wait 2", "Stand still for 2 seconds. Count: one… two…", hourglass(), "half"),
    card("pull", "pull L", "Pull a lever! <b>L</b>, <b>R</b>, <b>BL</b>, <b>BR</b>, <b>H</b>, or the lever’s number.", lever(), "half"),
    card("say", "say Hi there!", "Your words pop up in a bubble.", bubble(), "half"),
    card("loop", "loop", "Go back to the top, and do it all again!", loop(), "half"),
    card("#", "# my idea", "A note just for you. The friend skips it.", note(), "half"),
    card("buttons", "▶ ⏹ 🎬", "<b>play</b> starts your story, <b>stop</b> stops it, and 🎬 plays it each time you come here.", buttons(), "half wide-pic"),
    card("🚶 paths", "walk · wait · pose · face", "Other people can walk too! Give them these words. They go round and round.", paths(), "half"),
]

page = f"""<!doctype html><html><head><meta charset="utf-8"><title>Story words</title><style>
@page {{ size: letter; margin: 0.34in 0.42in 0.3in; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Andika, "Comic Neue", sans-serif; color: {INK}; margin: 0; }}
header {{ display: flex; align-items: baseline; gap: 0.18in; margin-bottom: 0.08in; }}
h1 {{ font-size: 27pt; margin: 0; letter-spacing: 0.5px; }}
header p {{ font-size: 13pt; margin: 0; }}
.src {{ font-size: 7pt; margin-left: auto; text-align: right; line-height: 1.25; align-self: flex-end; }}
.grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.075in; }}
.card {{ border: 2pt solid {INK}; border-radius: 12pt; padding: 0.04in 0.1in; display: flex; gap: 0.1in; align-items: center; break-inside: avoid; }}
.full {{ grid-column: 1 / 3; }}
.pic-box {{ flex: none; }}
.pic {{ width: 0.9in; height: 0.98in; display: block; }}
.wide {{ width: 1.75in; height: auto; display: block; }}
.floor {{ width: 3.75in; height: auto; display: block; }}
.poses {{ width: 4.5in; height: auto; display: block; }}
.faces {{ width: 1.9in; height: auto; display: block; }}
.pose {{ flex-direction: column; align-items: stretch; }}
.pose .say {{ display: flex; align-items: baseline; gap: 0.14in; order: -1; }}
.pose .pic-box {{ align-self: center; }}
h2 {{ font-size: 20pt; margin: 0; line-height: 1.05; }}
code {{ font-family: "DejaVu Sans Mono", monospace; font-size: 12.5pt; font-weight: bold; border: 1.4pt dashed {INK}; border-radius: 6pt;
       padding: 1pt 5pt; display: inline-block; margin: 2pt 0 3pt; white-space: nowrap; }}
.card p {{ font-size: 11pt; line-height: 1.22; margin: 0; }}
.pose p {{ margin: 0; }}
.try {{ margin-top: 0.075in; border: 2pt solid {INK}; border-radius: 12pt; padding: 0.06in 0.14in; display: flex; gap: 0.25in; align-items: center; }}
.try h2 {{ font-size: 19pt; }}
.try pre {{ font-family: "DejaVu Sans Mono", monospace; font-size: 11.5pt; font-weight: bold; margin: 0; line-height: 1.3; }}
.try p {{ font-size: 12pt; margin: 0; }}
footer {{ font-size: 7.5pt; margin-top: 0.05in; text-align: right; }}
</style></head><body>
<header><h1>Story words</h1><p>Type them in the 🎬 story box, one on each line.</p></header>
<div class="grid">{"".join(cards)}</div>
<section class="try"><div><h2>Try this!</h2><p>Type it, then press ▶.</p></div>
<pre>say Let’s dance!
walk 20 70
pose dance</pre><pre>wait 2
walk 80 70
loop</pre><span class="src">Messed Up Dress Up<br>from ^du_report(18),<br>“The quick card”</span></section>
</body></html>"""

here = os.path.dirname(os.path.abspath(__file__))
doc = weasyprint.HTML(string=page, base_url=here).render()
assert len(doc.pages) == 1, f"{len(doc.pages)} pages: it must fit on one"
out = os.path.join(here, "..", "..", "..", "manuals", "story-words-one-page.pdf")
doc.write_pdf(out)
print("one page:", os.path.normpath(out))
