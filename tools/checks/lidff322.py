#!/usr/bin/env python3
"""(ticket 322, Matthew on 0.0.232: "i turned down the speed and they still seem immediate to me, on my reliable computer",
in Firefox) In headless Firefox, as tools/leakff.py drives it: N's trap room, the music on, every speed at its slowest
(25: the boulder's fall about 5 s), the left boulder lever pulled, then the left lever; screenshots about every half
second while each moves (out/lidff322/*.png, in the firefox artifact), and every frame's boulder drop, handle angle and
lid fold, as the page has them. Says whether the page moved them, and leaves the pictures to say whether Firefox
painted them. Exits 1 if the page never moved them.
  lidff322.py <url>"""
import sys, os, time, json, subprocess, urllib.request, base64
url = sys.argv[1]
OUT = os.path.join("out", "lidff322"); os.makedirs(OUT, exist_ok=True)
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
caps = {"capabilities": {"alwaysMatch": {"browserName": "firefox", "moz:firefoxOptions": {"args": ["-headless", "-width", "1200", "-height", "800"],
        "prefs": {"layout.css.devPixelsPerPx": "1", "media.autoplay.default": 0}}}}}
sid = req("POST", "/session", caps)["value"]["sessionId"]
_js = lambda s, a=[]: req("POST", f"/session/{sid}/execute/sync", {"script": s, "args": a}).get("value")
def js(code):
    wrapped = "try { window.__r = JSON.stringify((() => { " + code + " })()); } catch (e) { window.__r = JSON.stringify({ error: String(e) }); }"
    r = _js("window.__r = undefined; const s = document.createElement('script'); s.textContent = arguments[0]; document.head.append(s); s.remove(); return window.__r;", [wrapped])
    try: return json.loads(r) if isinstance(r, str) else r
    except Exception: return r
def shot(name):
    v = req("GET", f"/session/{sid}/screenshot").get("value")
    if v: open(os.path.join(OUT, name + ".png"), "wb").write(base64.b64decode(v))
bad = 0
try:
    req("POST", f"/session/{sid}/url", {"url": url}); time.sleep(6)
    print("  page:", js('return { version: VERSION.number, ua: navigator.userAgent.slice(-40) };'))
    print("  setup:", js('''const B = state.background; state.music.mute = false; state.world.at = null; climb = null;
      for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
      Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: 0, figY: 110, things: [], castleLeverL_3N: false, castleLeverR_3N: false,
        castleLeverSpeed3N: 25, castleBoulderSpeed3N: 25, castleLidSpeed3N: 25 }); changed();
      window.__rec = []; window.__mounts = 0; const m0 = mountScene; mountScene = function (...a) { window.__mounts++; return m0.apply(this, a); };
      const tick = () => { const g = bgShown.node && bgShown.node.querySelector('[data-boulder="0"]'), arm = bgShown.node && bgShown.node.querySelector('[data-lever="BL"] .lever-arm'), arm2 = bgShown.node && bgShown.node.querySelector('[data-lever="L"] .lever-arm'), lid = bgShown.node && bgShown.node.querySelector('.pit-lid[data-pit-i="0"]');
        const num = (el, at, re) => { const m = el && re.exec(el.getAttribute(at) || ""); return m ? +(+m[1]).toFixed(2) : null; };
        __rec.push({ t: Math.round(performance.now()), y: num(g, "transform", /translate\\(0 (-?[\\d.]+)/), a: num(arm, "transform", /rotate\\((-?[\\d.]+)/), a2: num(arm2, "transform", /rotate\\((-?[\\d.]+)/), s: num(lid, "transform", /matrix\\(1 0 0 ([\\d.]+)/), m: __mounts, playing: !!playing });
        requestAnimationFrame(tick); }; requestAnimationFrame(tick); return { scene: !!bgShown.node, sceneryStill: sceneryStill(), slowFlag, choppy, perf: JSON.stringify(PERF).slice(0, 200) };'''))
    time.sleep(1.5)
    for lever, label in (("BL", "boulder"), ("L", "lid")):
        t0 = js("return Math.round(performance.now());")
        js(f'roomLeverPull("{lever}"); return 1;')
        for i in range(12):
            shot(f"{label}-{i:02d}"); time.sleep(0.45)
        R = js(f"return __rec.filter(f => f.t >= {t0});") or []
        ys = [f["y"] for f in R if f.get("y") is not None]; arms = [f["a" if lever == "BL" else "a2"] for f in R if f.get("a" if lever == "BL" else "a2") is not None]; ss = [f["s"] for f in R if f.get("s") is not None]
        mid_y = sum(1 for y in ys if -500 < y < -5); mid_a = sum(1 for a in arms if abs(abs(a) - 31) > 1.5); mid_s = sum(1 for s in ss if 0.02 < s < 0.98)
        print(f"  {label}: {len(R)} frames over {(R[-1]['t'] - R[0]['t']) if R else 0} ms; boulder mid-fall on {mid_y}, handle mid-swing on {mid_a}, lid mid-swing on {mid_s}; rebuilds {(R[-1]['m'] - R[0]['m']) if R else 0}; music {'playing' if R and R[-1]['playing'] else 'not playing'}")
        print("    drops:", " ".join(str(round(y)) for y in ys[::8][:20]), "| handle:", " ".join(str(round(a)) for a in arms[::8][:20]), "| lid:", " ".join(f"{s:.2f}" for s in ss[::8][:20]))
        moved = (mid_y if lever == "BL" else mid_s) >= 5 and mid_a >= 5
        print(("ok  " if moved else "FAIL") + f" the page moved the {label} and its handle frame by frame (whether Firefox painted it: the screenshots)")
        bad += 0 if moved else 1
        time.sleep(1.0)
    print("  screenshots:", sorted(os.listdir(OUT)))
except Exception as e:
    print("stopped:", str(e)[:300]); bad += 1
finally:
    try: req("DELETE", f"/session/{sid}")
    except Exception: pass
    gd.terminate()
print(f"{bad} failed" if bad else "all ok")
sys.exit(1 if bad else 0)
