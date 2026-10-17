#!/usr/bin/env python3
"""(ticket 167) In Firefox: the duck pond swum by the default friend (a fake
controller, right and left, after a warm-up), with each of the game's tabs
open in turn, then on the 🧍 Body tab with a tune playing; the page loaded
afresh each time. Which of these, if any, costs Firefox its frames after a
session of changes (58.5 -> 50.8, the rounds ending on ⚙️ Advanced with a
tune started)? A diagnostic: it never fails.   tabsff167.py <url>"""
import sys, os, time, json, subprocess, urllib.request
url = sys.argv[1]
W, H, DPR = 1203, 802, "1.875"
base = "http://127.0.0.1:4834"
GD = os.path.join(os.environ["GECKOWEBDRIVER"], "geckodriver") if os.environ.get("GECKOWEBDRIVER") else "geckodriver"
gd = subprocess.Popen([GD, "--port", "4834"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
def case(setup):
    req("POST", f"/session/{sid}/url", {"url": url}); time.sleep(4)
    js('window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; '
       'Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); '
       'state.background.kind = "lake"; choppy = false; slowFlag = false; PERF.slowMoving = true; ' + setup + '; changed(); '
       'window.__F = { gaps: [], last: 0, on: false }; const f = t => { if (__F.on) { if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; } requestAnimationFrame(f); }; requestAnimationFrame(f); return 1;')
    time.sleep(0.8)
    def swim(on):
        for b in (15, 14):
            js(f"__pad.buttons[{b}].pressed = true; __F.on = {str(on).lower()}; return 1;"); time.sleep(2.0); js("__pad.buttons.forEach(x => x.pressed = false); return 1;")
    swim(False); js("__F.gaps = []; __F.last = 0; choppy = false; return 1;"); swim(True)
    return js("__F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0); return { fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), late: Math.round(100 * g.filter(x => x > 25).length / Math.max(1, g.length)), tab: TABS[tab][0], music: playing ? playing.id + ' (' + (audio ? audio.state : '') + ')' : 'none' };")
try:
    print(f"Firefox ({_js('return navigator.userAgent;').split(' ')[-1]}), the duck pond, the default friend swimming (a fresh page each):")
    n = 16
    for i in range(n):
        r = case(f"tab = {i}; showTab()")
        print(f"  {str(r.get('fps')).rjust(5)} fps ({r.get('late')}% late)  {r.get('tab')}")
    r = case("tab = 0; showTab(); heard = true; state.music.mute = false; paused = null; musicSync()")
    print(f"  {str(r.get('fps')).rjust(5)} fps ({r.get('late')}% late)  {r.get('tab')}, with a tune playing: {r.get('music')}")
finally:
    try: req("DELETE", f"/session/{sid}")
    except Exception: pass
    if gd.poll() is None: gd.kill()
