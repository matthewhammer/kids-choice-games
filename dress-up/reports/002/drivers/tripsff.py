#!/usr/bin/env python3
"""Trips' frames in headless Firefox (Matthew, 2026-10-16: pauses on 0.0.90
clicking a castle door, and going into a pit by a click and by walking into
it, in Firefox on his laptop). As trips_perf.mjs: a fresh page per trip, at
his laptop's size (1203x802 at 1.875x), each frame's gap and which of the
game's functions ran in it (wrapped), the functions' totals. Headless
Firefox does not paint as a window does: this sees script, style and
layout, not painting. Run it pinned: taskset -c 0-3 nice -n 10.
  tripsff.py <url> [trip,...]    env: W H DPR CHOPPY=1 GAP=34"""
import sys, os, time, json, subprocess, urllib.request
url = sys.argv[1]; only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
W, H, DPR, GAP = int(os.environ.get("W", 1203)), int(os.environ.get("H", 802)), os.environ.get("DPR", "1.875"), float(os.environ.get("GAP", 34))
TRIPS = {
  "gate": ('Object.assign(state.background, { kind: "castle", castle: "N" }); [state.background.figX, state.background.figY] = ARRIVE.castle || [0, 0];',
           '[...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.dataset.to === "castleroom")', None),
  "hallway": ('Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "hallway", figX: 0, figY: 40 });',
              '[...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.querySelector("[data-leaf]"))', None),
  "pitclick": ('Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "trap", figX: 250, figY: 40 });',
               'bgShown.node.querySelector(".portal[data-pit]")', None),
  "pitwalk": ('Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "trap" }); changed(); { const [cx, cy, rx, ry] = bgShown.node.querySelector(".portal[data-pit]").dataset.pit.split(" ").map(Number); state.background.figX = Math.round(cx); state.background.figY = Math.round(cy + 2.2 * ry - SCENE.ground); }',
              None, 12),
}
INSTRUMENT = """
  window.__T = { t0: performance.now(), frames: [], calls: [], marks: [] };
  const wrap = name => { const f = window[name]; if (typeof f !== "function") return; window[name] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { __T.calls.push([name, t - __T.t0, performance.now() - t]); } }; };
  for (const n of ["draw", "drawNow", "mountScene", "changed", "persist", "settle", "measureMarks", "sceneObjects", "showObjects", "showEnterGlow", "showHover", "moved", "musicSync", "feedMusic", "fitPic", "renderHud", "backSync", "fallDown", "fallLand", "startJump", "endJump", "stillLayers", "castleWallsOf", "stillPicReset", "showStillPic", "walkInto", "enterScene"]) wrap(n);
  let last = 0; const f = t => { if (last) __T.frames.push([t - __T.t0, t - last, state.background.kind + (state.background.castleRoom ?? ""), state.body.anim, entering ? 1 : 0]); last = t; if (!__T.stop) requestAnimationFrame(f); };
  requestAnimationFrame(f); return 1;"""
base = "http://127.0.0.1:4832"
gd = subprocess.Popen(["geckodriver", "--port", "4832"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
def req(m, p, b=None):
    r = urllib.request.Request(base + p, data=json.dumps(b).encode() if b is not None else None, method=m, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=120) as f: return json.loads(f.read().decode())
    except urllib.error.HTTPError as e: return json.loads(e.read().decode())
for _ in range(40):
    time.sleep(0.5)
    try: urllib.request.urlopen(base + "/status", timeout=2); break
    except Exception: pass
caps = {"capabilities": {"alwaysMatch": {"browserName": "firefox", "moz:firefoxOptions": {
    "args": ["-headless", "-width", str(W), "-height", str(H)],
    "prefs": {"layout.css.devPixelsPerPx": DPR, "media.autoplay.default": 0, "media.autoplay.blocking_policy": 0}}}}}
sid = req("POST", "/session", caps)["value"]["sessionId"]
_js = lambda s, a=[]: req("POST", f"/session/{sid}/execute/sync", {"script": s, "args": a}).get("value")
# (the page's own let and const are out of reach of WebDriver's scripts in Firefox: each piece runs in the
# page, from a <script> of its own, and leaves its answer, as JSON, in window.__r)
def js(code):
    wrapped = "try { window.__r = JSON.stringify((() => { " + code + " })()); } catch (e) { window.__r = JSON.stringify({ error: String(e) }); }"
    r = _js("window.__r = undefined; const s = document.createElement('script'); s.textContent = arguments[0]; document.head.append(s); s.remove(); return window.__r;", [wrapped])
    try: return json.loads(r) if isinstance(r, str) else r
    except Exception: return r
try:
    req("POST", f"/session/{sid}/window/rect", {"width": W, "height": H})
    for name, (setup, target, pad) in TRIPS.items():
        if only and name not in only: continue
        req("POST", f"/session/{sid}/url", {"url": url + ("&" if "?" in url else "?") + "r=" + str(time.time())})
        time.sleep(4)
        ua = js("return navigator.userAgent.match(/Firefox\\/\\d+/)[0] + ' ' + innerWidth + 'x' + innerHeight + '@' + devicePixelRatio")
        js(f'localStorage.removeItem("dress-up-choppy"); localStorage.removeItem("dress-up-slow"); choppy = {"true" if os.environ.get("CHOPPY") else "false"}; slowFlag = false; state.music.mute = true; state.body.anim = "none"; changed(); return 1;')
        if pad is not None or os.environ.get("MOVEAFTER"):
            js('window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1;')
        js(setup + " changed(); return 1;"); time.sleep(1.5)
        r = js(INSTRUMENT)
        if r != 1: print("   instrument:", str(r)[:300])
        time.sleep(0.3)
        kind0 = js('return state.background.kind + (state.background.castleRoom ?? "");')
        # (TIMER=1: the game's own ⏱️ timer armed too, its line printed after)
        if os.environ.get("TIMER"): js("window.__trip = ''; tripArm(t => { window.__trip = t; }); return 1;")
        r = js(f'__T.marks.push(["press", performance.now() - __T.t0]); __pad.buttons[{pad}].pressed = true; return 1;') if pad is not None else \
            js(f'__T.marks.push(["click", performance.now() - __T.t0]); enterScene({target}); return 1;')
        if r != 1: print("   trigger:", str(r)[:300])
        arrived = 0
        for i in range(80):
            time.sleep(0.1)
            k = js('return state.background.kind + (state.background.castleRoom ?? "") + (entering ? "*" : "") + ":" + state.body.anim;')
            if not isinstance(k, str): print("   poll:", str(k)[:300]); break
            if not arrived and "*" not in k and not k.startswith(kind0 + ":"): arrived = i
            if arrived and i - arrived > 15: break
        if pad is not None: js("__pad.buttons.forEach(b => b.pressed = false); return 1;")
        if os.environ.get("MOVEAFTER"):
            js('__T.marks.push(["move", performance.now() - __T.t0]); __pad.buttons[15].pressed = true; return 1;'); time.sleep(1.5)
            js('__pad.buttons.forEach(b => b.pressed = false); __pad.buttons[14].pressed = true; return 1;'); time.sleep(1.5)
            js('__pad.buttons.forEach(b => b.pressed = false); __T.marks.push(["still", performance.now() - __T.t0]); return 1;'); time.sleep(1.0)
        D = js("__T.stop = true; return __T;")
        fr = D["frames"]; gaps = [f for f in fr if f[1] > GAP]; tot = sum(f[1] for f in fr) or 1
        by = {}
        for n, t, ms in D["calls"]:
            b = by.setdefault(n, [0, 0.0, 0.0]); b[0] += 1; b[1] += ms; b[2] = max(b[2], ms)
        print(f"\n== {name} ({ua}): {tot / 1000:.1f} s, {len(fr)} frames, {round(1000 * len(fr) / tot)} fps; frames over {GAP:.0f} ms: {len(gaps)}", flush=True)
        print("   marks", [[m, round(t)] for m, t in D["marks"]])
        for g in gaps:
            end, start = g[0], g[0] - g[1]
            inside = [f"{n} {ms:.1f}" for n, t, ms in D["calls"] if start - 1 <= t < end and ms > 1]
            print(f"   gap {g[1]:4.0f} ms at {start:6.0f} ({g[2]} {g[3]}{' entering' if g[4] else ''}): " + (", ".join(inside[:8]) or "(no game function over 1 ms: the browser)"))
        if os.environ.get("TIMER"):
            for _ in range(30):
                t = js("return window.__trip;")
                if t and "DATA" in t: break
                time.sleep(0.2)
            print("   ⏱️ line:", (t or "")[:900])
        print("   functions (calls, total ms, max ms):", " · ".join(f"{n} {c}/{s:.0f}/{m:.1f}" for n, (c, s, m) in sorted(by.items(), key=lambda kv: -kv[1][1])[:12]), flush=True)
finally:
    try: req("DELETE", f"/session/{sid}")
    except Exception: pass
    subprocess.run(["snap", "run", "--shell", "firefox", "-c", f"kill {gd.pid}"], capture_output=True)
