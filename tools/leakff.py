#!/usr/bin/env python3
"""(ticket 167) leak167.mjs in headless Firefox: Matthew's saved friend loaded
through the game's 📂 Load (the file input, by WebDriver), the friend swum
right and left with a fake controller: frames and drawings; fresh, after a
session of changes (every place walked a moment, trips through the gate, a
pit and up a ladder, sliders, the tabs), and after a reload. Page code runs
from an added <script> (WebDriver can't reach the page's lets). Pinned:
taskset -c 0-3 nice -n 10 on the laptop. A friend file of "-" uses the default
friend in the duck pond instead (as CI does: a saved friend stays off the
public repository). geckodriver from $GECKOWEBDRIVER (GitHub's runners) or the PATH.
  leakff.py <url> <friend.json | -> [rounds]   env: W H DPR LOG CONTROL CLEAR"""
import sys, os, time, json, subprocess, urllib.request
url, friend = sys.argv[1], sys.argv[2]; rounds = int(sys.argv[3]) if len(sys.argv) > 3 else 1
W, H, DPR = int(os.environ.get("W", 1203)), int(os.environ.get("H", 802)), os.environ.get("DPR", "1.875")
base = "http://127.0.0.1:4833"
GD = os.path.join(os.environ["GECKOWEBDRIVER"], "geckodriver") if os.environ.get("GECKOWEBDRIVER") else "geckodriver"
gd = subprocess.Popen([GD, "--port", "4833"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
def req(m, p, b=None):
    r = urllib.request.Request(base + p, data=json.dumps(b).encode() if b is not None else None, method=m, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=180) as f: return json.loads(f.read().decode())
    except urllib.error.HTTPError as e: return json.loads(e.read().decode())
for _ in range(40):
    time.sleep(0.5)
    try: urllib.request.urlopen(base + "/status", timeout=2); break
    except Exception: pass
caps = {"capabilities": {"alwaysMatch": {"browserName": "firefox", "moz:firefoxOptions": {"args": ["-headless", "-width", str(W), "-height", str(H)],
        "prefs": {"layout.css.devPixelsPerPx": DPR, "media.autoplay.default": 0}}}}}
sid = req("POST", "/session", caps)["value"]["sessionId"]
_js = lambda s, a=[]: req("POST", f"/session/{sid}/execute/sync", {"script": s, "args": a}).get("value")
def js(code):
    wrapped = "try { window.__r = JSON.stringify((() => { " + code + " })()); } catch (e) { window.__r = JSON.stringify({ error: String(e) }); }"
    r = _js("window.__r = undefined; const s = document.createElement('script'); s.textContent = arguments[0]; document.head.append(s); s.remove(); return window.__r;", [wrapped])
    try: return json.loads(r) if isinstance(r, str) else r
    except Exception: return r
WHO = "the default friend" if friend == "-" else "his friend"
def load_friend():
    if friend == "-":
        js('state = clone(DEFAULTS); state.background.kind = "lake"; changed(); return 1;'); time.sleep(1.5); return
    el = req("POST", f"/session/{sid}/element", {"using": "css selector", "value": "#load-file"})["value"]
    eid = list(el.values())[0]
    req("POST", f"/session/{sid}/element/{eid}/value", {"text": friend})
    time.sleep(1.5)
def pad():
    js('if (!window.__pad) { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); } return 1;')
def heat():
    # (the laptop's CPU package temperature, and the clock of the 4 threads the browser is pinned to)
    t = "?"
    for z in sorted(os.listdir("/sys/class/thermal")):
        try:
            if open(f"/sys/class/thermal/{z}/type").read().strip() == "x86_pkg_temp": t = int(open(f"/sys/class/thermal/{z}/temp").read()) // 1000
        except Exception: pass
    mhz = []
    for c in range(4):
        try: mhz.append(int(open(f"/sys/devices/system/cpu/cpu{c}/cpufreq/scaling_cur_freq").read()) // 1000)
        except Exception: pass
    return f"{t}°C, {min(mhz) if mhz else '?'}-{max(mhz) if mhz else '?'} MHz"
LOG = os.environ.get("LOG")
def out(line):
    # (each line synced to disk as it comes: the laptop can freeze mid-run, and /tmp does not survive it)
    print(line, flush=True)
    if LOG:
        with open(LOG, "a") as f: f.write(line + "\n"); f.flush(); os.fsync(f.fileno())
def measure(label):
    pad(); time.sleep(0.5)
    # (never held still: the moving-scenery switch on, so a measure is always of the pond as it is; and a warm-up swim first)
    js("choppy = false; slowFlag = false; PERF.slowMoving = true; changed(); return 1;")
    for b in (15, 14, 15, 14, 15): js(f"__pad.buttons[{b}].pressed = true; return 1;"); time.sleep(2.0); js("__pad.buttons.forEach(x => x.pressed = false); return 1;")
    js("window.__F = { gaps: [], last: 0, on: true, d: movedDraws, ms: movedMs }; const f = t => { if (!__F.on) return; if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1;")
    for b in (15, 14):
        js(f"__pad.buttons[{b}].pressed = true; return 1;"); time.sleep(2.0); js("__pad.buttons.forEach(x => x.pressed = false); return 1;")
    F = js("__F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b), dn = movedDraws - __F.d; return { fps: +(1000 * g.length / s).toFixed(1), p95: Math.round(q[Math.floor(0.95 * (q.length - 1))]), worst: Math.round(q[q.length - 1]), late: Math.round(100 * g.filter(x => x > 25).length / g.length), drawMs: dn ? +((movedMs - __F.ms) / dn).toFixed(2) : null };")
    P = js('return { kind: state.background.kind, elements: document.getElementsByTagName("*").length, smil: document.querySelectorAll("animate, animateTransform, animateMotion, set").length, anims: document.getAnimations().length, choppy, still: sceneryStill(), caches: [PARTS.size, READS.size, TRIMMED.size, STILLS.size, SCENE_PARTS.size, bgShown.kept.size].join("/"), music: playing ? playing.id : null, audio: audio ? audio.state : null };')
    out(f"{label:26} [{heat()}] {F.get('fps')} fps (p95 {F.get('p95')} ms, worst {F.get('worst')}, {F.get('late')}% late), draw {F.get('drawMs')} ms · elements {P.get('elements')} · smil {P.get('smil')} · anims {P.get('anims')} · {P.get('kind')}{' CHOPPY' if P.get('choppy') else ''} · caches {P.get('caches')} · music {P.get('music')} ({P.get('audio')})")
def churn():
    kinds = js('return PLACES.filter(([k]) => k !== "none").map(([k]) => k);')
    for k in kinds:
        js(f'Object.assign(state.background, {{ kind: {json.dumps(k)} }}); changed(); __pad.buttons[15].pressed = true; return 1;'); time.sleep(0.5); js("__pad.buttons.forEach(x => x.pressed = false); return 1;"); time.sleep(0.15)
    js('Object.assign(state.background, { kind: "castle", castle: "N" }); changed(); return 1;'); time.sleep(0.4)
    js('enterScene([...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.dataset.to === "castleroom")); return 1;'); time.sleep(5)
    js('Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3 }); changed(); return 1;'); time.sleep(0.4)
    js('enterScene(bgShown.node.querySelector(".portal[data-pit]")); return 1;'); time.sleep(6.5)
    js('climbLadder(bgShown.node.querySelector("[data-ladder]")); return 1;'); time.sleep(9)
    for i in range(60): js(f'state.background.kind = "lake"; state.background.ducks = {1 + i % 13}; state.body.arms = {30 + i}; state.face.smile = {i % 50}; changed(); return 1;')
    js('const bs = [...document.querySelectorAll("#tabs button")]; let i = 0; const f = () => { if (i < bs.length) { bs[i++].click(); setTimeout(f, 120); } }; f(); return 1;'); time.sleep(4)
try:
    req("POST", f"/session/{sid}/window/rect", {"width": W, "height": H})
    req("POST", f"/session/{sid}/url", {"url": url}); time.sleep(4)
    js('localStorage.removeItem("dress-up-choppy"); choppy = false; slowFlag = false; return 1;')
    load_friend(); measure(f"fresh, {WHO} loaded")
    for r in range(1, rounds + 1):
        if os.environ.get("CONTROL"):
            # (the control: as long as a round of changes takes, only swimming in the same pond)
            t0 = time.time()
            while time.time() - t0 < 50:
                for b in (15, 14): js(f"__pad.buttons[{b}].pressed = true; return 1;"); time.sleep(2.0); js("__pad.buttons.forEach(x => x.pressed = false); return 1;")
            load_friend(); measure(f"after swimming, round {r}")
        else:
            churn(); load_friend(); measure(f"after changes, round {r}")
    if os.environ.get("CLEAR"):
        # (ticket 167, after the 20:47 crash) without a reload: the game's own caches emptied, as a ⚙️ switch does; then the music paused
        js("PARTS.clear(); READS.clear(); TRIMMED.clear(); STILLS.clear(); SCENE_PARTS.clear(); bgShown.text = null; bgShown.kept = new Map(); changed(); return 1;")
        measure("caches emptied, no reload")
        js("if (audio) audio.suspend(); return 1;"); time.sleep(0.5)
        measure("music paused too")
    req("POST", f"/session/{sid}/refresh", {}); time.sleep(4); load_friend(); measure("after a reload")
    time.sleep(15); measure("15 s after the reload")
finally:
    try: req("DELETE", f"/session/{sid}")
    except Exception: pass
    # (snap's confinement refuses a plain kill on the laptop; elsewhere it is an ordinary process)
    try: subprocess.run(["snap", "run", "--shell", "firefox", "-c", f"kill {gd.pid}"], capture_output=True)
    except FileNotFoundError: pass
    if gd.poll() is None: gd.kill()
