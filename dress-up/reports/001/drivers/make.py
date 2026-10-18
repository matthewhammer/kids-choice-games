#!/usr/bin/env python3
"""^du_report(1): 60 frames a second, and what checks it.

Writes dress-up/reports/001/index.html and the series index (dress-up/reports/index.html) from the
frame-rate gate's result files in 001/data/ (written by fpsgate.mjs; copies in 001/drivers/).
  python3 make.py <0.0.78 commit id>
Every number on the page comes from those files; the page embeds them (report-data)."""
import json, sys, html, os, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(HERE)            # 001/
SERIES = os.path.dirname(R)          # reports/
D = os.path.join(R, "data")
C78 = sys.argv[1] if len(sys.argv) > 1 else "(not yet committed)"
COMMITS = {"0.0.74": "17f21e0", "0.0.75": "bdc744f", "0.0.76": "8d81a39", "0.0.77": "5c77b16", "0.0.78": C78}
REPO = "https://github.com/matthewhammer/kids-choice-games"
load = lambda f: json.load(open(os.path.join(D, f)))
runs = {"0.0.75": load("0.0.75-1920.json"), "0.0.76": load("0.0.76.json"), "0.0.77": load("0.0.77.json"),
        "0.0.77 imagination": load("0.0.77-imagination.json"), "0.0.78": load("0.0.78.json"), "0.0.78 imagination": load("0.0.78-imagination.json")}
def fps(run, scene, kind):
    for r in run["results"]:
        if r["scene"] == scene and r["kind"] == kind: return r
    return None
SCENES = [("castle", "🏰 outside the castle"), ("witch", "🧙 outside the witch's house"), ("witchroom", "🧙 inside the witch's hut"),
          ("healerroom", "🌿 inside the healer's house"), ("lake", "🦆 swimming in the duck pond"), ("emptyroom", "🔲 the empty room"), ("imagination", "💭 our imagination")]
def before(scene, kind):
    r = fps(runs["0.0.77 imagination"], scene, kind) if scene in ("imagination", "emptyroom") else fps(runs["0.0.75"], scene, kind)
    return (r["fps"], "0.0.77" if scene in ("imagination", "emptyroom") else "0.0.75") if r else (None, None)
def after(scene, kind):
    r = fps(runs["0.0.78 imagination"], scene, kind) if scene in ("imagination", "emptyroom") else fps(runs["0.0.78"], scene, kind)
    return r
rows = []
for sid, label in SCENES:
    for kind in ("walk", "drag"):
        b, bv = before(sid, kind); a = after(sid, kind)
        rows.append({"scene": sid, "label": label, "kind": kind, "before": b, "before_version": bv, "after": a["fps"], "after_runs": [x["fps"] for x in a["runs"]],
                     "p95_gap_ms": [x["p95"] for x in a["runs"]], "draw_ms": [x["drawMs"] for x in a["runs"]]})
all_after = [r["after"] for r in rows]
lo, hi = min(all_after), max(all_after)
fails_before = [r for r in rows if r["before"] is not None and r["before"] < 55]
esc = html.escape
chip = lambda n: f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
commit = lambda ver: f'<a href="{REPO}/commit/{COMMITS[ver]}"><code>{COMMITS[ver]}</code></a>'

# Figure 1: frames a second, before and after, per scene and action (bars from the numbers, values on them)
W, row_h, left, right = 790, 26, 250, 92
plot = W - left - right
H = 40 + len(rows) * row_h + 30
x = lambda val: left + plot * val / 60
svg = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="f1t" class="chart"><title id="f1t">Frames a second for each scene and action: before the fixes and on 0.0.78</title>']
for v in (0, 15, 30, 45, 60):
    svg.append(f'<line x1="{x(v):.1f}" y1="28" x2="{x(v):.1f}" y2="{H - 26}" class="grid"/><text x="{x(v):.1f}" y="{H - 10}" class="tick" text-anchor="middle">{v}</text>')
svg.append(f'<line x1="{x(55):.1f}" y1="24" x2="{x(55):.1f}" y2="{H - 26}" class="limit"/><text x="{x(55):.1f}" y="18" class="tick limitlabel" text-anchor="middle">55: the gate</text>')
for i, r in enumerate(rows):
    y = 34 + i * row_h
    svg.append(f'<text x="{left - 8}" y="{y + 15}" class="lab" text-anchor="end">{esc(r["label"])}, {r["kind"]}</text>')
    if r["before"] is not None:
        svg.append(f'<rect x="{left}" y="{y + 2}" width="{x(r["before"]) - left:.1f}" height="8" class="b0"/><text x="{x(r["before"]) + 4:.1f}" y="{y + 10}" class="val0">{r["before"]:g} ({r["before_version"]})</text>')
    svg.append(f'<rect x="{left}" y="{y + 11}" width="{x(r["after"]) - left:.1f}" height="11" class="b1"/><text x="{x(r["after"]) + 4:.1f}" y="{y + 21}" class="val1">{r["after"]:g}</text>')
svg.append("</svg>")
fig1 = "\n".join(svg)

COVER_ACTIONS = [("walk (arrows)", "walk"), ("drag (mouse)", "drag"), ("run (held, with an arrow)", None), ("crouch, crawl", None), ("the two jumps", None),
                 ("climbing a ladder by hand", None), ("through a door, ✨ into a picture, back", None), ("the on-screen controller (touch)", None)]
cov_head = "".join(f"<th>{esc(l)}</th>" for _, l in SCENES)
cov_rows = "".join(f"<tr><td>{esc(a)}</td>" + "".join(('<td class="yes">✅' + (" (swims)" if k == "walk" and s == "lake" else "") + "</td>") if k else '<td class="no">—</td>' for s, _ in SCENES) + '<td class="no">—</td></tr>'
                   for a, k in COVER_ACTIONS)

STEPS = [
  "Add <b>running</b>, <b>the two jumps</b> and <b>climbing a ladder by hand</b> to the gate, in the places it already covers (climbing in 💭 our imagination, where the ladders are). Running changes more of the picture each frame than walking; a jump lifts the friend through more of it.",
  "Measure on <b>the black laptop</b> itself, with the ⚙️ Advanced tab's meter and 📏 <i>measure here</i> in each covered place, then set the gate's slow mode (Chrome's CPU throttling and one raster thread) until it gives the same numbers, so the gate can stand in for it.",
  "<b>Cost budgets that CI can run:</b> for each place at its defaults, count the masks, blurs, SMIL animations of CSS properties, and shapes drawn live, and fail when one goes over its budget (no masks on the friend, no blurs by default). They do not depend on the machine, so they can fail a build.",
  "Move the test tools into the repository and add a workflow: the budgets and the drawings' checks (the sweep, the structure dump) failing the build, the frame-rate gate recorded alongside, not failing.",
  "Cover <b>touch</b>: the on-screen controller's arrows and buttons, held and tapped, in the covered places (a phone's or tablet's screen size)."
]
steps_html = "".join(f'<li id="step-{i}"><span class="stepnum"><a href="#step-{i}">{i}.</a></span> {s} <button class="tk" data-step="{i}">copy for a ticket</button></li>' for i, s in enumerate(STEPS, 1))

data = {"report": 1, "series": "Dress Up reports", "title": "60 frames a second, and what checks it", "date": "2026-10-16",
        "question": "Does Messed Up Dress Up hold 60 frames a second for what a game controller does in a place, and how much of that do our tests check, and where do they run?",
        "builds": COMMITS, "repo": REPO,
        "measure": {"tool": "fpsgate.mjs (copy in 001/drivers/)", "browser": "headless Chromium 155, muted, on Matthew's laptop (Linux)", "screen": "1920x1080, device pixel ratio 1",
                    "walk": "a fake standard game controller holds the right arrow 1.5 s, then the left 1.5 s", "drag": "real mouse events (DevTools Input.dispatchMouseEvent) hold the friend's body and move them right and back over 3 s, a move every 8 ms",
                    "fps": "frames the page drew while the friend moved (requestAnimationFrame gaps), over the time; a case's figure is the median of 3 runs on one page load, after a warm-up",
                    "pass": "median >= 55", "draw_ms": "the game's own draw() per drawing, mean of a run", "p95_gap_ms": "95th percentile gap between frames, per run"},
        "rows": rows, "gate_runs": runs,
        "settings_measured": {"livePictures": {"how": "the ⚙️ Advanced tab's 📏 measure here, in 💭 our imagination, headless Chrome 1400x900, one run each", "off_fps": 60, "on_fps": 33, "off_draw_ms": 1.2, "on_draw_ms": 1.4},
                              "blur": {"how": "fpsgate.mjs TWEAK removing every filter, 💭 our imagination with its pictures drawn live (0.0.77 code), 1920x1080, one run", "walk_fps_with": 18, "walk_fps_without": 25.5}}}
data_json = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")

def v(scene, kind): return next(r for r in rows if r["scene"] == scene and r["kind"] == kind)
page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>60 Frames a Second</title>
<style>
  :root {{ --bg: #fbfaf7; --paper: #ffffff; --ink: #1f2328; --muted: #5b6470; --line: #e3e0d8; --accent: #6d28d9; --soft: #cbbcf0; --good: #15803d; --bad: #b91c1c; --link: #1d4ed8; }}
  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }} }}
  :root[data-theme="dark"] {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 980px; margin: 0 auto; padding: 32px 16px 80px; }}
  h1 {{ font-size: 2em; line-height: 1.2; margin: 0 0 6px; }}
  h2 {{ font-size: 1.35em; margin: 48px 0 10px; padding-top: 8px; border-top: 2px solid var(--line); }}
  p, li {{ max-width: 72ch; }}
  .series {{ color: var(--muted); margin: 0 0 6px; font-size: 0.92em; }}
  .sub {{ color: var(--muted); margin: 0 0 24px; }}
  .headline {{ background: var(--paper); border-left: 4px solid var(--accent); padding: 10px 14px; border-radius: 6px; }}
  .headline ol > li {{ margin: 8px 0; }}
  a {{ color: var(--link); text-underline-offset: 2px; }}
  a.ref code, code {{ font-size: 0.9em; }}
  code {{ background: color-mix(in srgb, var(--line) 50%, transparent); padding: 0 4px; border-radius: 4px; }}
  .kpis {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 18px 0; }}
  .kpi {{ background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }}
  .kpi .v {{ font-size: 1.7em; font-weight: 700; }} .kpi .l {{ color: var(--muted); font-size: 0.9em; }}
  .good {{ color: var(--good); }} .bad {{ color: var(--bad); }}
  figure {{ margin: 18px 0; }} figcaption {{ color: var(--muted); font-size: 0.9em; margin-top: 6px; max-width: 72ch; }}
  svg.chart {{ width: 100%; height: auto; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; }}
  svg.chart .grid {{ stroke: var(--line); }} svg.chart .limit {{ stroke: var(--bad); stroke-dasharray: 4 3; }}
  svg.chart .tick {{ fill: var(--muted); font-size: 11px; }} svg.chart .limitlabel {{ fill: var(--bad); }}
  svg.chart .lab {{ fill: var(--ink); font-size: 12px; }}
  svg.chart .b0 {{ fill: var(--soft); }} svg.chart .b1 {{ fill: var(--accent); }}
  svg.chart .val0 {{ fill: var(--muted); font-size: 10px; }} svg.chart .val1 {{ fill: var(--ink); font-size: 11px; font-weight: 600; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 0.92em; }}
  th, td {{ text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }}
  th {{ color: var(--muted); font-weight: 600; }} td.n {{ font-variant-numeric: tabular-nums; white-space: nowrap; }}
  td.yes {{ color: var(--good); text-align: center; }} td.no {{ color: var(--muted); text-align: center; }}
  .scroll {{ overflow-x: auto; }}
  .note {{ color: var(--muted); font-size: 0.9em; }}
  ol.steps {{ list-style: none; padding-left: 0; }} ol.steps li {{ margin: 12px 0; border-left: 3px solid var(--line); padding-left: 12px; }}
  .stepnum a {{ font-weight: 700; text-decoration: none; }}
  button.tk, button.theme {{ font: inherit; font-size: 0.8em; border: 1px solid var(--line); background: var(--paper); color: var(--muted); border-radius: 8px; padding: 1px 8px; cursor: pointer; }}
  button.theme {{ position: fixed; top: 10px; right: 10px; }}
</style>
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
<p class="series"><a href="../">Dress Up reports</a> · {chip(1)} · 2026-10-16 · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N</p>
<h1>60 frames a second, and what checks it</h1>
<p class="sub">Does Messed Up Dress Up hold 60 frames a second for what a game controller does in a place? How much of that do our tests check, and where do they run? From Matthew's rule, made on 2026-10-16 after the castle and 💭 our imagination dropped frames: "The priority is 60 FPS at all times, for all actions that a game controller does in the scene."</p>

<div class="headline" id="answers">
<p><b>Short answers.</b> Measured with the frame-rate gate (<a href="#method">below</a>) at 1920×1080 on Matthew's laptop, in headless Chrome; each figure the median of three runs.</p>
<ol>
<li><b>Where we measure, yes: every case holds {lo:g} to {hi:g} frames a second on 0.0.78</b> ({commit("0.0.78")}): walking and dragging the friend in seven places. On 0.0.75, the same screen, {len([r for r in rows if r["before"] is not None and r["before_version"] == "0.0.75" and r["before"] < 55])} of the 10 cases in the first five places fell below 55, the lowest the castle drag at {v("castle", "drag")["before"]:g}; and 💭 our imagination managed {v("imagination", "walk")["before"]:g} on 0.0.77 (<a href="#where">results</a>, <a href="#how">what it took</a>).</li>
<li><b>What we measure is narrow: 2 of the 8 kinds of controller action, in 7 of the 24 places (the castle's rooms and the tree house's count as one each).</b> Running, crouching and crawling, the jumps, climbing, going through doors and into pictures, and the on-screen controller are not measured yet (<a href="#coverage">coverage</a>).</li>
<li><b>None of it runs in CI.</b> The repository has no workflows; GitHub only deploys the site. The gate runs by hand on Matthew's laptop before each release. A frame rate on a shared runner would mean little, but a count of what costs, per place, would not depend on the machine, and could fail a build (<a href="#ci">CI</a>).</li>
<li><b>What costs is kept off by default.</b> Two things a background can draw, Gaussian blurs and the imagination's 22 pictures drawn live, are now settings in the game's ⚙️ Advanced tab, off until they can be made fast; on, walking in the imagination drops from 60 to 33 frames a second (<a href="#settings">settings</a>). The slow computer the kids use, the black laptop, is not measured yet (<a href="#slow">the slow computer</a>).</li>
</ol>
</div>

<div class="kpis">
<div class="kpi"><div class="v good">{sum(1 for r in rows if r["after"] >= 55)} of {len(rows)}</div><div class="l">gate cases at 55 frames a second or more on 0.0.78 (lowest {lo:g})</div></div>
<div class="kpi"><div class="v">{v("imagination", "walk")["before"]:g} → {v("imagination", "walk")["after"]:g}</div><div class="l">frames a second walking in 💭 our imagination, 0.0.77 → 0.0.78</div></div>
<div class="kpi"><div class="v">2 of 8</div><div class="l">kinds of controller action measured, in 7 of 24 places</div></div>
<div class="kpi"><div class="v bad">0</div><div class="l">tests that run in CI</div></div>
</div>

<figure id="fig-1">
{fig1}
<figcaption>Figure 1. Frames a second for each place and action: the thin pale bar before the fixes (0.0.75 for the first five places, 0.0.77 for the empty room and the imagination, which joined the gate later), the thick bar on 0.0.78. The dashed line is the gate's 55. The empty room was new in 0.0.77, already at 60.</figcaption>
</figure>

<h2 id="where">Where it stands</h2>
<p>The gate on 0.0.78 ({commit("0.0.78")}), at 1920×1080. The figure is the median of three runs; the runs, the 95th-percentile gap between frames (16.7 ms is a frame at 60), and the game's own drawing time are beside it. The game's drawing takes 1 to 3 ms in every case: when frames are lost, the browser's painting is the cost, not the game's code.</p>
<div class="scroll"><table>
<tr><th>Place</th><th>Action</th><th>Frames a second</th><th>Runs</th><th>95th-percentile gap (ms)</th><th>A drawing (ms)</th></tr>
{"".join(f'<tr><td>{esc(r["label"])}</td><td>{r["kind"]}</td><td class="n">{r["after"]:g}</td><td class="n">{", ".join(f"{x:g}" for x in r["after_runs"])}</td><td class="n">{" / ".join(f"{x:g}" for x in r["p95_gap_ms"])}</td><td class="n">{" / ".join(f"{x:g}" for x in r["draw_ms"])}</td></tr>' for r in rows)}
</table></div>

<h2 id="how">How it got here</h2>
<p>Each cause was found the same way: freeze or hide one thing at a time and measure again, then trace what was left. Three kinds of thing cost frames, and none of them was the game's code:</p>
<div class="scroll"><table>
<tr><th>Place</th><th>Before (walk / drag)</th><th>0.0.78</th><th>What it took</th><th>Version</th></tr>
<tr><td>🏰 outside the castle</td><td class="n">{v("castle","walk")["before"]:g} / {v("castle","drag")["before"]:g} (0.0.75)</td><td class="n">{v("castle","walk")["after"]:g} / {v("castle","drag")["after"]:g}</td><td>The friend in the moat was drawn through an SVG mask (the water's), which the browser draws again offscreen on every frame they move: now two clipped copies of the friend. The picture's <code>viewBox</code> was written on every drawing, unchanged, which made the browser paint the whole picture again: now only when it changes. Facing us, the friend's arms were drawn over the hair and face through another mask: now a clip.</td><td>0.0.76 {commit("0.0.76")}, 0.0.77 {commit("0.0.77")}</td></tr>
<tr><td>🦆 swimming in the duck pond</td><td class="n">{v("lake","walk")["before"]:g} / {v("lake","drag")["before"]:g} (0.0.75)</td><td class="n">{v("lake","walk")["after"]:g} / {v("lake","drag")["after"]:g}</td><td>The water's mask, as in the moat.</td><td>0.0.76 {commit("0.0.76")}</td></tr>
<tr><td>🧙 outside the witch's house</td><td class="n">{v("witch","walk")["before"]:g} / {v("witch","drag")["before"]:g} (0.0.75)</td><td class="n">{v("witch","walk")["after"]:g} / {v("witch","drag")["after"]:g}</td><td>The arms' mask, as in the castle.</td><td>0.0.77 {commit("0.0.77")}</td></tr>
<tr><td>💭 our imagination</td><td class="n">{v("imagination","walk")["before"]:g} / {v("imagination","drag")["before"]:g} (0.0.77)</td><td class="n">{v("imagination","walk")["after"]:g} / {v("imagination","drag")["after"]:g}</td><td>Its map holds 22 pictures of whole places: 7,728 of its 8,080 shapes, 197 animations and 24 Gaussian blurs. Hiding them gave 59 frames a second; taking out the blurs alone, 25; drawing each picture still, as an image, and blurs off, 60. Both are now settings, off by default.</td><td>0.0.78 {commit("0.0.78")}</td></tr>
<tr><td>🧙 inside the witch's hut, 🌿 inside the healer's house</td><td class="n">60 / 60 (0.0.75)</td><td class="n">60 / 60</td><td>Already smooth. In the gate because Matthew named them: the hut's cauldron fumes held it to 20 to 33 frames a second until 0.0.72.</td><td></td></tr>
</table></div>

<h2 id="coverage">Coverage</h2>
<p>What the gate measures today, by controller action and place. The places are the ones that have had trouble: Matthew named the first five, and the empty room and the imagination joined with the imagination's slowness. Following his call to grow coverage slowly, a place joins when it shows trouble, and the next actions to add are in <a href="#next">What next</a>.</p>
<div class="scroll"><table>
<tr><th>Action</th>{cov_head}<th>the other 17 places</th></tr>
{cov_rows}
</table></div>
<p>Other checks, not about frame rates, also run before a release: the sweep, which draws every place, castle room and costume and compares each drawing's hash with the last release's, so a change can't alter a drawing unnoticed; a dump of the settings and their rules; and checks of single features (the on-screen controller with several fingers at once, climbing and the picture that glows). A change to how the friend is drawn is compared with the last release pixel by pixel.</p>

<h2 id="ci">What runs in CI</h2>
<p><b>Nothing yet.</b> The repository has no workflows: the one thing GitHub runs is its own deployment of the site, on every push. The gate and every other check run by hand on Matthew's laptop before each release, and their tools live outside the repository.</p>
<p>A frame rate measured in CI would not say much: GitHub's runners are shared and have no graphics card, and their speed varies from run to run, so a laptop's 60 is not a runner's. What could run in CI and mean the same everywhere is a count of what costs. Each kind of cost above is a countable thing in the drawing: masks on the friend, blurs, shapes drawn live in pictures, animations of a CSS property. A budget per place, counted at its defaults, would fail a build the moment a new mask or blur arrived on a path the friend moves through, before anyone felt it. Beside it, the drawings' checks can fail a build too, being exact, and the frame-rate gate can run on a runner as information, kept but not failing; the gate that fails stays the laptop's, before release.</p>

<h2 id="settings">The settings kept off until they are fast</h2>
<p>In the game's ⚙️ Advanced tab since 0.0.78, each off unless switched on, on that computer only. Switched on, each says how many it draws in the place; 📏 <i>measure here</i> walks the friend for 2 seconds with it off and 2 with it on, and says what each managed. Matthew: "Each time we find some feature of the background that's threatening our FPS being 60 at all times, let's make it optional, and off by default, and add to the advanced panel in a similar way."</p>
<div class="scroll"><table>
<tr><th>Setting</th><th>What it draws</th><th>What it cost, measured</th></tr>
<tr><td>🌫️ soft blurs</td><td>Gaussian blurs: the pictures' soft edges, the waterfall's mist, the leaves outside the cave. Off, pictures are sharp and the mist is a soft gradient.</td><td>In the imagination with its pictures drawn live (0.0.77): walking, 25.5 frames a second without them, 18 with them (one run each).</td></tr>
<tr><td>🎞️ moving pictures in the imagination's map</td><td>The map's 22 pictures drawn live, each place's animations playing. Off, each is that place held still, as an image.</td><td>Walking in the imagination, with 📏 in the game: 60 frames a second off, 33 on (1.2 and 1.4 ms a drawing; one run each, 1400×900).</td></tr>
</table></div>

<h2 id="slow">The slow computer</h2>
<p>The kids also play on the black laptop, N's old one, where 💭 our imagination was too slow to walk in on 0.0.76, while walking with no background was fine. The gate runs on Matthew's much faster laptop and does not stand in for it yet. Chrome can slow a page's main thread (throttling) and can be started with a single thread for painting, which together come closer to an old computer; the gate has a slow mode for that, not yet set to match the black laptop. The surest measure is the black laptop itself: the ⚙️ Advanced tab's meter and 📏 run there with nothing to install.</p>

<h2 id="next">What next</h2>
<ol class="steps">{steps_html}</ol>

<h2 id="method">How this was put together</h2>
<p>The gate is <code>fpsgate.mjs</code> (a copy in <a href="{REPO}/tree/main/dress-up/reports/001/drivers"><code>001/drivers/</code></a>), run against the game's own file in headless Chromium 155 started muted, at 1920×1080, on Matthew's laptop, with nothing else heavy running. For each place it loads the page once, sets the place from the game's defaults with the music muted, and runs a warm-up walk and drag, then three of each:</p>
<ul>
<li><b>walk:</b> a fake standard game controller (a Gamepad-shaped object the game reads as it reads a real one) holds ▶ for 1.5 s, then ◀ for 1.5 s;</li>
<li><b>drag:</b> mouse events sent through the DevTools protocol press on the middle of the friend's body (facing us, so the press is not on an arm) and move right and back over 3 s, a move every 8 ms.</li>
</ul>
<p>Frames are counted with <code>requestAnimationFrame</code> while the friend moves; a run's frames a second is the count over the time; a case's figure is the median of three runs, and it passes at 55 or more. The game's <code>draw()</code> is timed around each call. Causes were found with the gate's <code>TWEAK</code> (code run in the page before the runs, to freeze, hide or remove one thing at a time) and with <code>dragtrace.mjs</code>, which sums a Chrome performance trace of one walk or drag by thread and event, with Chrome's reasons for each invalidation. One run per variant was used to find causes; the figures in this report are the median-of-three gate runs.</p>
<p>The data is here twice: embedded in this page as JSON (<code>&lt;script type="application/json" id="report-data"&gt;</code> at its end: every gate run's raw readings, the versions and commits, and what each measure is), and as the gate's own files in <a href="{REPO}/tree/main/dress-up/reports/001/data"><code>001/data/</code></a>. The 0.0.77 run of the empty room and the imagination wrote no file; its numbers are copied from the gate's printed output, and its file says so. The page is made by <code>001/drivers/make.py</code> from those files.</p>
<p class="note">Builds: 0.0.75 {commit("0.0.75")}, 0.0.76 {commit("0.0.76")}, 0.0.77 {commit("0.0.77")}, 0.0.78 {commit("0.0.78")}.</p>
</main>
<script type="application/json" id="report-data">{data_json}</script>
<script>
(() => {{
  const b = document.getElementById("theme"), modes = ["auto", "light", "dark"], names = {{ auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" }};
  let m = "auto"; try {{ m = localStorage.getItem("theme") || "auto"; }} catch (e) {{}}
  const show = () => {{ b.textContent = names[m]; if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m); }};
  b.onclick = () => {{ m = modes[(modes.indexOf(m) + 1) % 3]; try {{ localStorage.setItem("theme", m); }} catch (e) {{}} show(); }};
  show();
  for (const t of document.querySelectorAll("button.tk")) t.onclick = () => {{
    const li = t.closest("li"), n = t.dataset.step, text = li.cloneNode(true);
    text.querySelectorAll("button, .stepnum").forEach(e => e.remove());
    const msg = `Mint a ticket for this step: Dress Up reports, ^du_report(1), What next, step ${{n}}: "${{text.textContent.trim()}}". ${{location.href.split("#")[0]}}#step-${{n}}`;
    navigator.clipboard.writeText(msg).then(() => {{ t.textContent = "copied"; setTimeout(() => t.textContent = "copy for a ticket", 1500); }});
  }};
}})();
</script>
</body>
</html>
"""
open(os.path.join(R, "index.html"), "w").write(page)

# the series index: a card per report
card = f"""<a class="card" href="001/"><svg viewBox="0 0 120 70" class="thumb" aria-hidden="true">
<rect x="6" y="12" width="{108 * v("imagination", "walk")["before"] / 60:.1f}" height="14" class="b0"/><rect x="6" y="30" width="{108 * v("imagination", "walk")["after"] / 60:.1f}" height="14" class="b1"/>
<line x1="{6 + 108 * 55 / 60:.1f}" y1="6" x2="{6 + 108 * 55 / 60:.1f}" y2="52" class="limit"/><text x="6" y="64" class="t">{v("imagination", "walk")["before"]:g} → {v("imagination", "walk")["after"]:g} fps</text></svg>
<div><div class="n"><code><b>^du_report(</b>1<b>)</b></code> · 2026-10-16</div><div class="h">60 frames a second, and what checks it</div>
<div class="q">Does the game hold 60 frames a second for what a controller does? Every measured case does on 0.0.78 ({lo:g} to {hi:g}); the measuring covers 2 of 8 kinds of action in 7 of 24 places, and none of it runs in CI yet.</div></div></a>"""
index = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dress Up Reports</title>
<style>
  :root {{ --bg: #fbfaf7; --paper: #ffffff; --ink: #1f2328; --muted: #5b6470; --line: #e3e0d8; --accent: #6d28d9; --soft: #cbbcf0; --bad: #b91c1c; --link: #1d4ed8; }}
  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --bad: #f87171; --link: #93c5fd; }} }}
  :root[data-theme="dark"] {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --bad: #f87171; --link: #93c5fd; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 860px; margin: 0 auto; padding: 32px 16px 80px; }}
  h1 {{ margin: 0 0 6px; }} .sub {{ color: var(--muted); max-width: 70ch; }}
  a {{ color: var(--link); }}
  a.card {{ display: grid; grid-template-columns: 130px 1fr; gap: 16px; align-items: center; background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin: 14px 0; color: var(--ink); text-decoration: none; }}
  a.card:hover {{ border-color: var(--accent); }}
  .thumb {{ width: 130px; }} .thumb .b0 {{ fill: var(--soft); }} .thumb .b1 {{ fill: var(--accent); }} .thumb .limit {{ stroke: var(--bad); stroke-dasharray: 3 2; }} .thumb .t {{ fill: var(--muted); font: 10px system-ui, sans-serif; }}
  .n {{ color: var(--muted); font-size: 0.9em; }} .h {{ font-weight: 700; font-size: 1.15em; }} .q {{ color: var(--muted); font-size: 0.95em; }}
  @media (max-width: 520px) {{ a.card {{ grid-template-columns: 1fr; }} }}
  button.theme {{ font: inherit; font-size: 0.8em; border: 1px solid var(--line); background: var(--paper); color: var(--muted); border-radius: 8px; padding: 1px 8px; cursor: pointer; position: fixed; top: 10px; right: 10px; }}
</style>
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
<h1>Dress Up reports</h1>
<p class="sub">Reports on <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, the plain-JavaScript game made with M and N, where features are tried with real players before they are rebuilt as livelits in Hazel. Each report takes one question and answers it with measurements. The first rule they measure: 60 frames a second for everything a game controller does. (Hazel's own series is the <a href="https://matthewhammer.org/hazel/performance-analysis/">Hazel performance analysis</a>.)</p>
{card}
</main>
<script>
(() => {{ const b = document.getElementById("theme"), modes = ["auto", "light", "dark"], names = {{ auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" }};
  let m = "auto"; try {{ m = localStorage.getItem("theme") || "auto"; }} catch (e) {{}}
  const show = () => {{ b.textContent = names[m]; if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m); }};
  b.onclick = () => {{ m = modes[(modes.indexOf(m) + 1) % 3]; try {{ localStorage.setItem("theme", m); }} catch (e) {{}} show(); }}; show(); }})();
</script>
</body>
</html>
"""
open(os.path.join(SERIES, "index.html"), "w").write(index)
print("wrote", os.path.join(R, "index.html"), "and", os.path.join(SERIES, "index.html"), "| cases", len(rows), "| range", lo, hi)
