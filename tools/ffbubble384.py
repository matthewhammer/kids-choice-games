#!/usr/bin/env python3
"""(ticket 384, ^du_report(12)'s next step 5: "the room with 4 makers, at full speed and on the slow tier, in Chrome and Firefox, each
release") The bubble room in headless Firefox, at Matthew's screen size (1250x830 at 1.6 device pixels a CSS pixel, his 160% zoom),
each case in a fresh Firefox: the empty room (the control), and the bubble room with four bubble makers, its foam still as it starts
(the frame-rate gate's bubbleroom4). Frames counted standing, 3 s, twice. Recorded, not a verdict: exits 0.
  ffbubble384.py <url>   env: GECKOWEBDRIVER (the runner's geckodriver folder)"""
import sys, os, time, json, subprocess, urllib.request
url = sys.argv[1]
W, H, DPR = 1250, 830, "1.6"
base = "http://127.0.0.1:4836"
GD = os.path.join(os.environ["GECKOWEBDRIVER"], "geckodriver") if os.environ.get("GECKOWEBDRIVER") else "geckodriver"
def req(m, p, b=None):
    r = urllib.request.Request(base + p, data=json.dumps(b).encode() if b is not None else None, method=m, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=180) as f: return json.loads(f.read().decode())
    except urllib.error.HTTPError as e: return json.loads(e.read().decode())
MAKERS = ('state.background.things = [-330, -250, 170, 250].map((x, i) => ({ kind: "bubblemaker", x, z: SCENE.ground + 30, seed: 501 + i, size: 100,'
          ' ...structuredClone(THING_DEFAULTS.bubblemaker || {}) }));')
CASES = [("the empty room (control)", 'state.background.kind = "emptyroom";'),
         ("the bubble room, 4 bubble makers", 'state.background.kind = "bubbleroom"; ' + MAKERS)]
rows = []
for name, setup in CASES:
    gd = subprocess.Popen([GD, "--port", "4836"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(40):
            time.sleep(0.5)
            try: urllib.request.urlopen(base + "/status", timeout=2); break
            except Exception: pass
        caps = {"capabilities": {"alwaysMatch": {"browserName": "firefox", "moz:firefoxOptions": {"args": ["-headless", "-width", str(W), "-height", str(H)], "prefs": {"layout.css.devPixelsPerPx": DPR, "media.volume_scale": "0.0"}}}}}
        sid = req("POST", "/session", caps)["value"]["sessionId"]
        _js = lambda s, a=[]: req("POST", f"/session/{sid}/execute/sync", {"script": s, "args": a}).get("value")
        def js(code):
            wrapped = "try { window.__r = JSON.stringify((() => { " + code + " })()); } catch (e) { window.__r = JSON.stringify({ error: String(e) }); }"
            r = _js("window.__r = undefined; const s = document.createElement('script'); s.textContent = arguments[0]; document.head.append(s); s.remove(); return window.__r;", [wrapped])
            try: return json.loads(r) if isinstance(r, str) else r
            except Exception: return r
        req("POST", f"/session/{sid}/url", {"url": url}); time.sleep(4)
        r = js('localStorage.removeItem("dress-up-slow"); slowFlag = false; choppy = false; state = clone(DEFAULTS); state.music.mute = true; state.world.at = null;'
               ' state.background.figX = 0; state.background.figY = 60; ' + setup + ' changed(); return { kind: state.background.kind, things: (state.background.things || []).length };')
        time.sleep(3)
        runs = []
        for i in range(2):
            js("window.__F = { gaps: [], last: 0, on: true }; const f = t => { if (!__F.on) return; if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1;")
            time.sleep(3)
            runs.append(js("__F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b); return { fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), p95: Math.round(q[Math.floor(0.95 * (q.length - 1))] || 0) };"))
        P = js('return { flying: typeof makerSim !== "undefined" ? makerSim.list.length : null, still: sceneryStill(), foam: state.background.foamMove ?? 0 };')
        fps = [x.get("fps") for x in runs if isinstance(x, dict)]
        print(f"{name:36} {' / '.join(str(x) for x in fps):>12} fps  p95 {'/'.join(str(x.get('p95')) for x in runs if isinstance(x, dict))} ms  {json.dumps(P)}  {json.dumps(r)}", flush=True)
        rows.append({"case": name, "runs": runs, "page": P})
        req("DELETE", f"/session/{sid}")
    except Exception as e:
        print(f"{name:36} could not run: {str(e)[:200]}", flush=True)
    finally:
        gd.terminate()
        try: gd.wait(10)
        except Exception: gd.kill()
os.makedirs("out", exist_ok=True)
json.dump({"url": url, "size": [W, H, DPR], "rows": rows}, open("out/ffbubble384.json", "w"), indent=1)
print("recorded (a measurement, not a verdict)")
sys.exit(0)
