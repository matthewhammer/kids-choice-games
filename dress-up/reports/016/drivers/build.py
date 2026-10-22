#!/usr/bin/env python3
"""^du_report(16)'s page, from its data: data/report.json (the words), data/whitespace.json and data/counts.json (made by
drivers/gather.py from the GitHub runs of knoll521.mjs). Every figure is drawn here from those numbers. The page's frame is ^du_report(5)'s.
  python3 drivers/gather.py <R16> && python3 drivers/build.py   (from 016/)
Until the final run (out3) is gathered, the page says "work in progress"."""
import json, html, os, re, statistics
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda f: json.load(open(os.path.join(HERE, "data", f), encoding="utf-8"))
D, W, CNT = rd("report.json"), rd("whitespace.json"), rd("counts.json")
P5 = open(os.path.join(HERE, "..", "005", "index.html"), encoding="utf-8").read()
E = html.escape
TITLE = D["title"]
HEAD = P5[:P5.index("<main")].replace("<title>Always Be Knolling</title>", f"<title>{TITLE}</title>")
TAIL = P5[P5.rindex("<script>"):].replace("^du_report(5)", "^du_report(16)")
assert TITLE in HEAD and "^du_report(16)" in TAIL

RUN = W["runs"][-1]; C = RUN["cases"]; LAB = RUN["labels"]
FINAL = RUN["name"] == "out3"
COMMITS = sorted((l for l in C if l.startswith("c")), key=lambda l: int(l[1:]))
AFTER = COMMITS[-1]
ORDER = ["v204", "main"] + COMMITS
VER = {"v204": "0.0.204", "main": LAB["main"].get("version") or "main"}
def lname(l): return {"v204": "0.0.204", "main": f"main ({VER['main']})"}.get(l, l)
SCREENS = [s["id"] for s in RUN["screens"]]
SCR = {s["id"]: s for s in RUN["screens"]}
def sname(s):
    t = s.replace("ipad-820x1180", "iPad portrait 820×1180").replace("ipad-1180x820", "iPad landscape 1180×820").replace("phone-390x844", "phone 390×844")
    return re.sub(r"^(\d+)x(\d+)(@(\d+))?$", lambda m: f"{m.group(1)}×{m.group(2)}" + (f" at {m.group(4)}%" if m.group(3) else ""), t)
def cases(l, scr=None, mode=None, tab=None):
    return [c for c in C.get(l, []) if (scr is None or c["screen"] == scr) and (mode is None or c["mode"] == mode) and (tab is None or c["tab"] == tab) and c["between"] is not None]
def mean(l, scr, mode, key="between", tabs=None):
    v = [c[key] for c in cases(l, scr, mode) if c.get(key) is not None and (tabs is None or c["tab"] in tabs)]
    return statistics.mean(v) if v else None
def one(l, scr, mode, tab):
    x = cases(l, scr, mode, tab); return x[0] if x else None
pc = lambda v: "–" if v is None else f"{100 * v:.1f}%"
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def tix(s):
    s = E(s)
    s = re.sub(r"\^du_report\((\d+)\)", lambda m: ref(int(m.group(1))), s)
    s = re.sub(r"\b([Tt]ickets?) (\d+)", lambda m: m.group(1) + " " + ref(int(m.group(2)), "ticket"), s)
    return s
S = D["sources"]
def src(k): return f'<a href="#src-{k}">[{list(S).index(k) + 1}]</a>'

REF = [("1920x1080", "fs", "full screen, 1920×1080"), ("1920x1080", "side", "side panel, 1920×1080"),
       ("1366x768", "side", "side panel, 1366×768"), ("ipad-820x1180", "fs", "iPad portrait, full screen")]
HL = {(s, m): {l: mean(l, s, m) for l in ("v204", "main", AFTER)} for s, m, _ in REF}
FS204 = sorted({c["tab"] for c in cases("v204", mode="fs")})          # the tabs 0.0.204 had a full screen for
LIKE = {l: mean(l, "1920x1080", "fs", tabs=FS204) for l in ("v204", "main", AFTER)}
NOISE = RUN["noise"]; NOISE_ALL = [r["noise"] for r in W["runs"]]
JOBS = RUN["jobs"]
NCASES = sum(len(cases(l)) for l in C)

# ---- Figure 1: the headline bars, 3 builds x 4 screens ----
CLS = {"v204": "b0", "main": "b1", AFTER: "b2"}
def legend(y=16, labs=("v204", "main", AFTER), x=10):
    s = []
    for l in labs:
        s.append(f'<rect class="{CLS.get(l, "b1")}" x="{x}" y="{y - 9}" width="12" height="12" rx="2"/><text class="tick" x="{x + 17}" y="{y + 1}">{E(lname(l) if l != AFTER else "after: " + l)}</text>')
        x += 40 + 7 * len(lname(l) if l != AFTER else "after: " + l)
    return "".join(s)
def fig1():
    x0, k, s = 190, 4.2, [legend()]
    for v in (0, 20, 40, 60, 80):
        x = x0 + v * k; s.append(f'<line class="grid" x1="{x}" y1="28" x2="{x}" y2="{36 + len(REF) * 64}"/><text class="tick" x="{x}" y="{50 + len(REF) * 64}" text-anchor="middle">{v}%</text>')
    for i, (scr, m, name) in enumerate(REF):
        y = 36 + i * 64
        s.append(f'<text class="lab" x="{x0 - 8}" y="{y + 26}" text-anchor="end">{E(name)}</text>')
        for j, l in enumerate(("v204", "main", AFTER)):
            v = HL[(scr, m)][l]; yy = y + 4 + j * 18
            if v is None: continue
            note = " (2 tabs)" if l == "v204" and m == "fs" else ""
            s.append(f'<g><rect class="{CLS[l]}" x="{x0}" y="{yy}" width="{100 * v * k:.1f}" height="15" rx="2"/><text class="val1" x="{x0 + 100 * v * k + 5:.1f}" y="{yy + 12}">{pc(v)}{note}</text>'
                     f'<title>{E(name)}, {E(lname(l))}: {pc(v)} of the panel empty between boxes, the mean over {len(cases(l, scr, m))} cases</title></g>')
    return f'<svg class="chart" viewBox="0 0 640 {66 + len(REF) * 64}" role="img" aria-label="Bars: the empty share between boxes for 0.0.204, main and {AFTER} at four screens">{"".join(s)}</svg>'

# ---- Figure 2: every tab, every screen, before -> after ----
TABS = sorted({c["tab"] for c in cases("main")}, key=lambda t: [c["tab"] for c in C["main"]].index(t))
def heat(mode):
    head = "".join(f'<th class="rot"><span>{E(sname(s))}</span></th>' for s in SCREENS)
    rows = []
    for t in TABS:
        cells = []
        for s in SCREENS:
            a, b = one("main", s, mode, t), one(AFTER, s, mode, t)
            if not a or not b: cells.append('<td class="hm na">·</td>'); continue
            d = b["between"] - a["between"]
            col = "good" if d < 0 else "bad"; alpha = min(80, round(abs(d) * 400))
            st = f' style="background:color-mix(in srgb, var(--{col}) {alpha}%, transparent)"' if abs(d) >= 0.005 else ""
            cells.append(f'<td class="hm"{st} title="{E(t)}, {E(sname(s))}: {pc(a["between"])} → {pc(b["between"])}">{100 * a["between"]:.0f}<span class="ar">→</span>{100 * b["between"]:.0f}</td>')
        rows.append(f'<tr><th>{E(t)}</th>{"".join(cells)}</tr>')
    return f'<div class="scroll"><table class="heat"><thead><tr><th></th>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'

# ---- Figure 3 and 8: box maps drawn from the measured rectangles ----
def boxmap(c, title, W0=260, H0=380):
    if not c or not c.get("map"): return f'<div class="map none">{E(title)}: not measured</div>'
    k = min(W0 / c["rw"], H0 / c["rh"]); w, h = c["rw"] * k, c["rh"] * k
    s = [f'<rect class="hole" x="0" y="0" width="{w:.1f}" height="{h:.1f}"/>']
    for x, y, bw, bh, n in c["map"]:
        s.append(f'<g><rect class="bx" x="{x * k:.1f}" y="{y * k:.1f}" width="{bw * k:.1f}" height="{bh * k:.1f}" rx="2"/><title>{E(n)}: {bw}×{bh}</title></g>')
    return (f'<figure class="map"><svg viewBox="-1 -1 {w + 2:.1f} {h + 2:.1f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{E(title)}: {len(c["map"])} boxes, {pc(c["between"])} empty">{"".join(s)}</svg>'
            f'<figcaption>{E(title)}<br><b>{pc(c["between"])}</b> empty · {c["rw"]}×{c["rh"]} px · {c["boxes"]} boxes{f" · {c[chr(116)+"racks"]} columns" if c.get("tracks") else ""}</figcaption></figure>')
F3TABS = ["🧍 Body", "😀 Face", "🎮 Controls", "🖐 Hands", "🏞️ Background · castle"]
def fig3():
    out = []
    for t in F3TABS:
        for m, mn in (("fs", "full screen"), ("side", "side panel")):
            out.append(f'<div class="pair"><h4>{E(t)}, {mn}, 1920×1080</h4><div class="maps">{boxmap(one("main", "1920x1080", m, t), "before: " + lname("main"))}{boxmap(one(AFTER, "1920x1080", m, t), "after: " + AFTER)}</div></div>')
    return "".join(out)
def fig8():
    out = []
    for z in ("1920x1080", "1920x1080@125", "1920x1080@150"):
        out.append(f'<div class="pair"><h4>😀 Face, side panel, {E(sname(z))}</h4><div class="maps">{boxmap(one("main", z, "side", "😀 Face"), "before", 200, 300)}{boxmap(one(AFTER, z, "side", "😀 Face"), "after", 200, 300)}</div></div>')
    return "".join(out)

# ---- the side panel's width per screen, and its columns (the 568 px line) ----
def widths():
    rows = [(s, one("main", s, "side", "😀 Face"), one(AFTER, s, "side", "😀 Face")) for s in SCREENS]
    rows = [r for r in rows if r[1]]
    x0, k, s = 190, 0.32, []
    for v in (0, 400, 800, 1200):
        x = x0 + v * k; s.append(f'<line class="grid" x1="{x}" y1="10" x2="{x}" y2="{20 + len(rows) * 24}"/><text class="tick" x="{x}" y="{34 + len(rows) * 24}" text-anchor="middle">{v} px</text>')
    lx = x0 + 568 * k
    s.append(f'<line class="limit" x1="{lx}" y1="4" x2="{lx}" y2="{20 + len(rows) * 24}"/><text class="tick" x="{lx + 4}" y="{48 + len(rows) * 24}">568 px: two columns from here</text>')
    for i, (scr, a, b) in enumerate(rows):
        y = 14 + i * 24
        s.append(f'<g><text class="lab" x="{x0 - 8}" y="{y + 12}" text-anchor="end">{E(sname(scr))}</text><rect class="b1" x="{x0}" y="{y}" width="{a["rw"] * k:.1f}" height="16" rx="2"/>'
                 f'<text class="val1" x="{x0 + a["rw"] * k + 5:.1f}" y="{y + 12}">{a["rw"]} px · {a.get("tracks") or 1} col · {pc(a["between"])} → {pc(b["between"]) if b else "–"}</text>'
                 f'<title>{E(sname(scr))}: the side panel is {a["rw"]} CSS px wide, 😀 Face in {a.get("tracks") or 1} columns</title></g>')
    return f'<svg class="chart" viewBox="0 0 640 {60 + len(rows) * 24}" role="img" aria-label="Bars: the side panel width per screen, with the 568 px line">{"".join(s)}</svg>'

# ---- Figure 5: what each commit changed ----
F5S = [("1920x1080", "fs"), ("1920x1080", "side"), ("1366x768", "side"), ("ipad-820x1180", "fs")]
def fig5():
    prev, rows = "main", []
    for l in COMMITS:
        ds, reached = [], set()
        for scr, m in F5S:
            a, b = mean(prev, scr, m), mean(l, scr, m)
            ds.append(None if a is None or b is None else b - a)
        for c in cases(l):
            p = one(prev, c["screen"], c["mode"], c["tab"])
            if p and abs(c["between"] - p["between"]) >= 0.005: reached.add(c["tab"])
        rows.append((l, ds, reached)); prev = l
    x0, k, cw, s = 70, 14, 130, []
    for j, (scr, m) in enumerate(F5S):
        cx = x0 + j * cw + cw / 2
        s.append(f'<text class="tick" x="{cx}" y="16" text-anchor="middle">{E(sname(scr))} {"full" if m == "fs" else "side"}</text><line class="grid" x1="{cx}" y1="22" x2="{cx}" y2="{30 + len(rows) * 30}"/>')
    for i, (l, ds, reached) in enumerate(rows):
        y = 30 + i * 30
        s.append(f'<text class="lab" x="{x0 - 8}" y="{y + 14}" text-anchor="end">{l}</text>')
        for j, d in enumerate(ds):
            cx = x0 + j * cw + cw / 2
            if d is None: s.append(f'<text class="tick" x="{cx}" y="{y + 14}" text-anchor="middle">not measured</text>'); continue
            w = max(0.5, abs(100 * d) * k); x = cx - w if d < 0 else cx
            s.append(f'<g><rect class="{"good" if d < 0 else "bad"}" x="{x:.1f}" y="{y + 2}" width="{w:.1f}" height="16" rx="2"/><text class="val1" x="{(x - 4) if d < 0 else (x + w + 4):.1f}" y="{y + 14}" text-anchor="{"end" if d < 0 else "start"}">{100 * d:+.1f}</text>'
                     f'<title>{l}: {100 * d:+.1f} points at {E(sname(scr))}</title></g>')
    tbl = "".join(f'<tr><td><code>{l}</code></td><td><code>{E(LAB.get(l, {}).get("sha", ""))}</code></td><td>{E(LAB.get(l, {}).get("subject", ""))}</td><td class="n">{len(r)}</td><td>{E(", ".join(sorted(r))) or "none"}</td></tr>' for l, _, r in rows)
    svg = f'<svg class="chart" viewBox="0 0 {x0 + 4 * cw + 10} {40 + len(rows) * 30}" role="img" aria-label="Bars: the change in the mean empty share between boxes, commit by commit">{"".join(s)}</svg>'
    return svg, tbl, rows

# ---- Figure 6: the game's drawing in full screen ----
def fig6():
    rows = [(s, one("main", s, "fs", "😀 Face"), one(AFTER, s, "fs", "😀 Face")) for s in SCREENS]
    rows = [r for r in rows if r[1] and r[2] and r[1]["pic"]]
    x0, k, s = 190, 0.2, [legend(16, ("main", AFTER))]
    for i, (scr, a, b) in enumerate(rows):
        y = 34 + i * 44
        s.append(f'<text class="lab" x="{x0 - 8}" y="{y + 20}" text-anchor="end">{E(sname(scr))}</text>')
        for j, (l, c) in enumerate((("main", a), (AFTER, b))):
            pw, ph, dw, dh, lb = c["pic"]; area = (dw * dh) ** 0.5; yy = y + j * 19
            s.append(f'<g><rect class="{CLS[l]}" x="{x0}" y="{yy}" width="{dw * k:.1f}" height="15" rx="2"/><text class="val1" x="{x0 + dw * k + 5:.1f}" y="{yy + 12}">{dw}×{dh} drawn in {pw}×{ph} · letterbox {lb:,} px² · under the card {c["underCard"] or 0:,} px²</text>'
                     f'<title>{E(sname(scr))}, {E(lname(l))}: the drawing {dw}×{dh} in an element {pw}×{ph}</title></g>')
    return f'<svg class="chart" viewBox="0 0 900 {44 + len(rows) * 44}" role="img" aria-label="Bars: the width of the game\'s drawing in 😀 Face\'s full screen, per screen, before and after">{"".join(s)}</svg>'

# ---- Figure 7: inside the boxes ----
F7 = [("labelLines", "labels on a line of their own"), ("labelFit", "of them, chips that would fit beside"), ("orphans", "chip rows ending in a single chip"), ("tall", "rows of 12+ chips on 3+ lines")]
def fig7():
    head = "".join(f'<th>{E(sname(s))} {"full" if m == "fs" else "side"}</th>' for s, m in F5S)
    rows = []
    for key, name in F7:
        cells = []
        for s, m in F5S:
            a = sum(c[key] or 0 for c in cases("main", s, m)); b = sum(c[key] or 0 for c in cases(AFTER, s, m))
            cells.append(f'<td class="n">{a} → {b}</td>')
        rows.append(f'<tr><th>{E(name)}</th>{"".join(cells)}</tr>')
    ins = "".join(f'<td class="n">{pc(mean("main", s, m, "inside"))} → {pc(mean(AFTER, s, m, "inside"))}</td>' for s, m in F5S)
    rows.insert(0, f'<tr><th>empty inside boxes (mean)</th>{ins}</tr>')
    return f'<div class="scroll"><table class="nums"><thead><tr><th>summed over every tab and place, {E(lname("main"))} → {AFTER}</th>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'

# ---- Figure 4: first-window screenshots ----
SH = os.path.join(HERE, "pictures", "shots")
def shot(tag, name, alt):
    f = f"{tag}-{name}.webp"
    if not os.path.exists(os.path.join(SH, f)): return f'<div class="map none">{E(alt)}: no picture</div>'
    return f'<figure class="shot"><img loading="lazy" src="pictures/shots/{f}" alt="{E(alt)}"><figcaption>{E(alt)}</figcaption></figure>'
def fig4():
    out = []
    for name, what in (("1920x1080-fs-Face", "😀 Face, full screen, 1920×1080"), ("1920x1080-fs-Controls", "🎮 Controls, full screen, 1920×1080"),
                       ("1366x768-side-Body", "🧍 Body, side panel, 1366×768"), ("ipad-820x1180-fs-Face", "😀 Face, full screen, iPad portrait")):
        row = (shot("v204", name, "0.0.204") if name.startswith("1366") else "") + shot("before", name, "before: " + lname("main")) + shot("after", name, "after: " + AFTER)
        out.append(f'<div class="pair"><h4>{E(what)}</h4><div class="shots">{row}</div></div>')
    return "".join(out)

# ---- the counts, 0.0.204 and 0.0.398 ----
c204, c398 = CNT["0.0.204"], CNT["0.0.398"]
tot = lambda c, k: sum(t[k] or 0 for t in c["tabs"])
t204 = {t["name"]: t for t in c204["tabs"]}
countrows = "".join(f'<tr><td>{E(t["name"])}</td><td class="n">{t204[t["name"]]["declared"] if t["name"] in t204 else "–"} → {t["declared"]}</td><td class="n">{t204[t["name"]]["groups"] if t["name"] in t204 else "–"} → {t["groups"]}</td><td class="n">{t204[t["name"]]["shown"] if t["name"] in t204 else "–"} → {t["shown"]}</td><td class="n">{len(c398["tabBoxes"].get(t["name"], [])) or "–"}</td></tr>' for t in c398["tabs"])
nboxes = sum(len(v) for v in c398["tabBoxes"].values())
bg204 = [p for p in c204["perPlace"]]; bg398 = [p for p in c398["perPlace"]]

f5svg, f5tbl, f5rows = fig5()
# the largest moves, commit by commit (every screen and mode), with the panel's length before and after
def moves(n=3):
    out, prev = [], "main"
    for l in COMMITS:
        ds = []
        for c in cases(l):
            p = one(prev, c["screen"], c["mode"], c["tab"])
            if p: ds.append((c["between"] - p["between"], c, p))
        ups = sorted((d for d in ds if d[0] >= 0.05), key=lambda d: -d[0])
        downs = sorted((d for d in ds if d[0] <= -0.05), key=lambda d: d[0])
        f = lambda d: f'{E(d[1]["tab"])} ({E(sname(d[1]["screen"]))}, {"full screen" if d[1]["mode"] == "fs" else "side"}: {pc(d[2]["between"])} → {pc(d[1]["between"])}, {d[2]["rh"]:,} → {d[1]["rh"]:,} px long)'
        if ups or downs:
            out.append(f'<li><code>{l}</code>: {len(downs)} cases fall by 5 points or more{", the most " + "; ".join(f(d) for d in downs[:n]) if downs else ""}; '
                       f'{len(ups)} rise by 5 points or more{", the most " + "; ".join(f(d) for d in ups[:n]) if ups else ""}.</li>')
        prev = l
    return "".join(out)
MOVES = moves()
ST = {"kept": "good", "done": "good", "amended": "alt", "partly": "alt", "not done": "bad"}
r5rules = "".join(f'<tr><td>{E(a)}</td><td><span class="st st-{ST[b]}">{E(b)}</span></td><td>{tix(c)}</td></tr>' for a, b, c in D["report5"]["rules"])
r5steps = "".join(f'<tr><td>{E(a)}</td><td><span class="st st-{ST[b]}">{E(b)}</span></td><td>{tix(c)}</td></tr>' for a, b, c in D["report5"]["steps"])
amend = "".join(f'<li><b>{E(a)}.</b> {tix(b)}</li>' for a, b in D["amend"])
found = "".join(f'<li><b>{E(a)}.</b> {tix(b)}</li>' for a, b in D["found"])
steps = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> <b>{E(a)}:</b> {tix(b)}. <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, (a, b) in enumerate(D["next"], 1))
sources = "".join(f'<li id="src-{k}"><a href="{E(u)}">{E(t)}</a></li>' for k, (t, u) in S.items())
envj = JOBS[0]
noise_txt = (f'In this run ({RUN["name"]}) {NOISE["compared"]:,} cases were measured in two jobs or more; all but {len(NOISE["differ"])} agree to the pixel. '
             f'Those {len(NOISE["differ"])} are the bubble room\'s full screen, where the jobs differ by up to {100 * NOISE["maxShare"]:.2f} points ({NOISE["maxPx"]:,} px²): most likely because its bubbles move. '
             f'Outside the bubble room the noise floor is 0.') if NOISE["differ"] else f'All {NOISE["compared"]:,} cases measured in two jobs or more agree to the pixel: the noise floor is 0.'
def hl(scr, m): return HL[(scr, m)]
h1 = hl("1920x1080", "fs"); h2 = hl("1920x1080", "side"); h3 = hl("1366x768", "side"); h4 = hl("ipad-820x1180", "fs")
wip = "" if FINAL else ' · <b class="wip">work in progress</b>'
wipnote = "" if FINAL else (f'<p class="wipnote"><b>Work in progress.</b> This draft is drawn from the run <code>{RUN["name"]}</code>, whose last build is <code>{AFTER}</code> '
                            f'({E(LAB[AFTER]["subject"])}). The run over the whole branch is on its way; when it is gathered this page is rebuilt from it, numbers and figures alike.</p>')
kpis = "".join(f'<div class="kpi"><div class="v">{v}</div><div class="l">{E(l)}</div></div>' for v, l in (
    (f'{pc(h1["main"])} → {pc(h1[AFTER])}', "empty between boxes, full screen 1920×1080, main → after"),
    (f'{pc(h2["main"])} → {pc(h2[AFTER])}', "the same, side panel 1920×1080"),
    (f'{tot(c204, "declared"):,} → {tot(c398, "declared"):,}', "rows declared, 0.0.204 → 0.0.398"),
    (f'{NCASES:,}', f'cases in this page (builds × screens × tabs × modes; one job per build)')))
GH = "https://github.com/matthewhammer/kids-choice-games/tree/main/dress-up/reports/016/"

body = f'''<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(16)} · {D["date"]} · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(D["after"])}{wip}</p>
<h1>{E(TITLE)}</h1>
<p class="reading">About READMIN minutes to read (READWORDS words, not counting tables and figures).</p>
<p class="sub">{E(D["question"])} The follow-up to {ref(5)}, “Always Be Knolling”, from {ref(521, "ticket")}. Matthew, {D["asked"]["at"]}: “{E(D["asked"]["words"])}”</p>
{wipnote}
<div class="headline" id="answers">
<p><b>Short answers.</b> Measured in Chrome on GitHub's computers by <code>knoll521</code>, three jobs each measuring the builds side by side ({src("check")}); “empty between boxes” is the share of a panel covered by no box and no loose control or text, the mean over every tab and place measured.</p>
<ol>
<li><b>Full screen is where the space is.</b> At 1920×1080, {lname("main")} leaves {pc(h1["main"])} of the boxes' side of the full screen empty between boxes; after <code>{AFTER}</code>, {pc(h1[AFTER])}. At 0.0.204 only 🎵 Music and 🗺️ World design had a full screen ({pc(h1["v204"])}); on those two alone, main reads {pc(LIKE["main"])} and after {pc(LIKE[AFTER])}.</li>
<li><b>The side panel is less empty than at 0.0.204, and less again after.</b> Side panel 1920×1080: {pc(h2["v204"])} at 0.0.204, {pc(h2["main"])} on main, {pc(h2[AFTER])} after. At 1366×768: {pc(h3["v204"])}, {pc(h3["main"])}, {pc(h3[AFTER])}. iPad portrait full screen: {pc(h4["v204"])}, {pc(h4["main"])}, {pc(h4[AFTER])}.</li>
<li><b>Where it comes from</b> (read in the code, and seen in the box maps of Figure 3): empty columns (a grid of 4 columns holding 1 or 2 boxes), the hole under a short box beside a tall one, and the game's card in full screen, which left its column mostly empty. The side panel sits on the 568 px line between one and two columns at the common laptop zooms (<a href="#zoom">the zoom</a>).</li>
<li><b>Four bugs found on the way</b>, fixed in the branch's second commit (<a href="#found">found</a>); one of the fixes, Background's side panel as a grid, made that panel longer and emptier at every place measured; packing the boxes (c5) then made it shorter than on main (at 1920×1080, 2.92 → 2.65 windows tall), though with gaps between its boxes its empty share stays higher (5.7% → 19.6%) (<a href="#fixes">each commit</a>).</li>
<li><b>The panels grew by half since {ref(5)}:</b> {tot(c204, "declared"):,} → {tot(c398, "declared"):,} rows declared, {tot(c204, "groups")} → {tot(c398, "groups")} groups, {nboxes} boxes planned in TAB_BOXES (none at 0.0.204).</li>
<li><b>The measure repeats.</b> {noise_txt}</li>
</ol>
</div>
<div class="kpis">{kpis}</div>
<figure id="fig-1">{fig1()}<figcaption>Figure 1. Empty between boxes, the mean over every tab and place, at four screens: 0.0.204 ({LAB["v204"]["sha"]}), main ({VER["main"]}, {LAB["main"]["sha"]}) and the branch at <code>{AFTER}</code> ({LAB[AFTER]["sha"]}). One run on GitHub, three jobs that agree (the answers' last point). At 0.0.204 the full screens are Music's and World design's alone.</figcaption></figure>

<h2 id="since">Since report 5</h2>
<p>{ref(5)} read the game at {D["report5"]["version"]} (commit <code>{D["report5"]["commit"]}</code>), published {D["report5"]["published"]}. It measured {E(D["report5"]["measured"])}. It set out nine rules and eight steps; where each stands at main:</p>
<div class="scroll"><table class="diff"><thead><tr><th>report 5's rule</th><th></th><th>now</th></tr></thead><tbody>{r5rules}</tbody></table></div>
<div class="scroll"><table class="diff"><thead><tr><th>report 5's step</th><th></th><th>by</th></tr></thead><tbody>{r5steps}</tbody></table></div>
<p>The panels, counted the way report 5 counted them (TABS walked in node at the defaults {src("counts")}), at 0.0.204 and at 0.0.398: the same walk reproduces report 5's table at 0.0.204, but for the forest, one row more. Background: {len(bg204)} → {len(bg398)} places; a player sees {min(p[2] for p in bg398)} to {max(p[2] for p in bg398)} of its rows in one place (it was {min(p[2] for p in bg204)} to {max(p[2] for p in bg204)}).</p>
<div class="scroll"><table class="nums"><thead><tr><th>tab</th><th>rows declared</th><th>groups</th><th>rows shown at the defaults</th><th>boxes now</th></tr></thead><tbody>{countrows}</tbody></table></div>

<h2 id="method">How the space is measured</h2>
<ul>
<li><b>A box is found by its look,</b> not its class: a border on three sides, or a tint of its own, holding a control or text. So the same check reads 0.0.204, main and the branch.</li>
<li><b>Empty between boxes</b> is the share of the panel's whole length covered by no box (each widened by 4 px, so the 8 px gutter does not count) and by no loose control or text. In full screen only the boxes' side is measured, left of the split. <b>Empty inside boxes</b> is the share of each box's content covered by no control and no line of text (each widened by 3 px).</li>
<li><b>Zoom by the device scale factor,</b> as Chrome's zoom and a 125% or 150% display do: the page is laid out at the screen's size divided by the zoom, so media queries, the 568 px line and the minimum split react as on a zoomed screen. Every case asserts a 16 px root font. Screens are named in device pixels; the widths in this report are CSS pixels.</li>
<li><b>Before and after on one machine.</b> The workflow {src("workflow")} serves every build side by side from git worktrees: 0.0.204 (job 1 only, with the screenshots), main, and every commit of the branch knoll-521 {src("pr")}; each job measures them in a different order. Commits in between are shared out across the jobs, at 4 screens. Before each load the page's saved storage is cleared.</li>
<li><b>A self-test first:</b> a page with a known hole, 300×196 of 600×300 = 32.7%, must read exactly that. Job 1 printed: “{E(envj["selftest"].replace("ok   ", ""))}”.</li>
<li><b>The machine:</b> {E(envj.get("chrome", "Chrome"))}, {E(envj.get("cpu", ""))}, Ubuntu 24.04; fonts {E(", ".join(sorted(set(envj.get("fonts", [])))))}. Not the kids' fonts, so this report compares builds with each other, not with what M and N see.</li>
</ul>

<h2 id="where">Where the space is now</h2>
<p>Figure 2 shows every tab and place at every screen, main → <code>{AFTER}</code>: green where the branch empties less, red where more (a point or more). The three largest holes the check found under each panel are in <a href="data/whitespace.json">the data</a>, with the box above each.</p>
<figure id="fig-2"><h4>Full screen</h4>{heat("fs")}<h4>Side panel</h4>{heat("side")}<figcaption>Figure 2. Empty between boxes, in %, {E(lname("main"))} → {AFTER}, for each tab (rows) and screen (columns); “·” where a case has no full screen. {E(noise_txt)}</figcaption></figure>
<figure id="fig-3">{fig3()}<figcaption>Figure 3. The boxes as measured, drawn to scale from the rectangles the check recorded; red is the panel behind them. Before and after, at 1920×1080. Loose controls and text outside boxes are not drawn, so the red here is a little more than the measure counts.</figcaption></figure>
<figure id="fig-4">{fig4()}<figcaption>Figure 4. The first window, as Chrome on GitHub drew it in job 1 (WebP at CSS pixels; the runner's fonts).</figcaption></figure>

<h2 id="zoom">The side panel and the zoom</h2>
<p>The side panel's boxes go to two columns at 568 px. At the screens measured the side panel is this wide, in CSS pixels (😀 Face, main), and Face's boxes stand in this many columns:</p>
<figure id="fig-8a">{widths()}<figcaption>The side panel's width per screen and Face's columns, main, with its empty share main → {AFTER}.</figcaption></figure>
<figure id="fig-8">{fig8()}<figcaption>Figure 8. 😀 Face in the side panel at 1920×1080, at 100%, 125% and 150%: the same tab on one screen, three zooms.</figcaption></figure>

<h2 id="fs">Full screen: empty columns and the game's card</h2>
<p>In the generic full screen the boxes' grid kept a column per 287 px whether it had boxes for them or not; the game's card on the right kept its picture's element at a fixed size, letterboxed. Figure 6 is the drawing's size in 😀 Face's full screen.</p>
<figure id="fig-6">{fig6()}<figcaption>Figure 6. The game's drawing in 😀 Face's full screen: drawn size in its element, the letterbox around it, and the empty area under the card, main and {AFTER}. The default split itself waits for Matthew (What next, step 1).</figcaption></figure>

<h2 id="inside">Inside the boxes</h2>
<figure id="fig-7">{fig7()}<figcaption>Figure 7. Counts inside the boxes, summed over every tab and place at four screens, main → {AFTER}.</figcaption></figure>

<h2 id="fixes">Each commit, measured</h2>
<p>The branch knoll-521, commit by commit; each bar is the change in the mean empty share between boxes from the commit before (main for the first). The tabs reached are those with a case that moved by half a point or more.</p>
<figure id="fig-5">{f5svg}<figcaption>Figure 5. What each commit changed, in points of empty share; green is less empty.{"" if FINAL else " Commits after " + AFTER + " are not in this run yet."}</figcaption></figure>
<div class="scroll"><table class="diff"><thead><tr><th></th><th>commit</th><th></th><th>tabs</th><th>reached</th></tr></thead><tbody>{f5tbl}</tbody></table></div>
<p>The largest moves, case by case (a tab or place, at one screen, in one mode), against the commit before:</p>
<ul>{MOVES}</ul>
<p>Not every commit empties less everywhere. The commit that gave 🏞️ Background's side panel a grid with gaps (the fourth of the four bugs) made the side panel of every place measured both longer and much emptier, as the list above shows; most likely because, two to a row, a short box stands beside a long one, the hole that packing the boxes is meant to fill.{"" if FINAL else " This run stops before that commit; the final run will say whether it does."}</p>

<h2 id="rules">Report 5's rules, amended</h2>
<ul>{amend}</ul>

<h2 id="found">Found on the way</h2>
<ul>{found}</ul>

<h2 id="next">What next</h2>
<ol class="steps">{steps}</ol>

<h2 id="how">How this was put together</h2>
<p>Written on {D["date"]} by Claude, for Matthew, from {ref(521, "ticket")}. The panels were read in the code at main and counted in node {src("counts")}; the space was measured by <code>knoll521</code> {src("check")} on GitHub, runs {", ".join(f"<code>{r['name']}</code> ({len(r['jobs'])} jobs, builds {', '.join(r['labels'])})" for r in W["runs"])}; this page is drawn from <code>{RUN["name"]}</code>. Nothing was measured on the laptop, and no browser drew this page while it was made: it was built and checked with python (well-formed, every figure drawn, every link a file).</p>
<p>The data: <a href="data/report.json">data/report.json</a>, <a href="data/whitespace.json">data/whitespace.json</a> (every case of the run: its share, holes, boxes, the picture's size; and each earlier run's means and noise), <a href="data/counts.json">data/counts.json</a>, all embedded in this page; on GitHub, <a href="{GH}data">data</a> and <a href="{GH}drivers">drivers</a>. <code>drivers/gather.py</code> reads the runs, <code>drivers/build.py</code> draws the page. The picture at the top of the series index is the castle with the friend, from the picture archive {src("archive")}, the place with the longest Background panel ({max(p[2] for p in bg398)} rows).</p>
<ol class="sources">{sources}</ol>
<script type="application/json" id="report-data">{json.dumps(dict(D, whitespace=W, counts=CNT), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")}</script>
</main>
'''
# the reading time, from the words outside tables, figures and the data
txt = re.sub(r"<(table|figure|script|svg)\b.*?</\1>", " ", body, flags=re.S)
words = len(re.sub(r"<[^>]+>", " ", txt).split())
body = body.replace("READMIN", str(max(1, round(words / 240)))).replace("READWORDS", f"{words:,}")
extra = ('<style>.muted{color:var(--muted)}.reading{color:var(--muted);margin:-6px 0 10px}'
         '.wip{color:var(--bad)}.wipnote{border:1.5px dashed var(--bad);border-radius:10px;padding:8px 12px}'
         'svg.chart .b0{fill:var(--muted)}svg.chart .b2{fill:var(--good)}svg.chart .good{fill:var(--good)}svg.chart .bad{fill:var(--bad)}'
         'svg.chart .limit{stroke:var(--bad);stroke-dasharray:4 3}'
         'table.heat{border-collapse:collapse;font-size:.78em}table.heat td.hm{text-align:center;white-space:nowrap;padding:2px 5px;border:1px solid var(--line)}'
         'table.heat .ar{color:var(--muted);margin:0 1px}table.heat th{text-align:left;white-space:nowrap;font-weight:500}table.heat th.rot{vertical-align:bottom;font-size:.9em}'
         'table.heat td.na{color:var(--muted)}'
         '.pair{margin:10px 0}.pair h4{margin:8px 0 4px}.maps,.shots{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}'
         'figure.map{margin:0}figure.map svg{display:block;max-width:100%;height:auto}figure.map figcaption{font-size:.85em;color:var(--muted)}'
         'svg .hole{fill:color-mix(in srgb, var(--bad) 30%, transparent)}svg .bx{fill:var(--paper);stroke:var(--ink);stroke-width:1}'
         'figure.shot{margin:0;flex:1 1 280px;max-width:100%}figure.shot img{width:100%;height:auto;border:1px solid var(--line);border-radius:8px;display:block}figure.shot figcaption{font-size:.85em;color:var(--muted)}'
         '.st{display:inline-block;font-size:.78em;border:1.5px solid var(--line);border-radius:999px;padding:0 8px;white-space:nowrap}'
         '.st-good{border-color:var(--good)}.st-alt{border-color:var(--alt)}.st-bad{border-color:var(--bad)}.sources li{max-width:none}</style>\n')
out = HEAD.replace("</head>", extra + "</head>") + body + TAIL
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes;", "final" if FINAL else f"work in progress (run {RUN['name']}, after = {AFTER})", f"; {words} words")
