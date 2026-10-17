"""(ticket 164) Compare stillpic164.mjs's shots: <kind>-live.png (the scene
itself) with <kind>-pic.png (the still picture on). Prints, per place, the
share of pixels that differ by more than 48 in any channel, and the mean
difference; writes <kind>-diff.png (differing pixels in red) for any over 0.5%.
    python3 stillpic_diff.py <out dir>
"""
import sys, glob, os
from PIL import Image, ImageChops

d = sys.argv[1]
for live in sorted(glob.glob(os.path.join(d, "*-live.png"))):
    kind = os.path.basename(live)[:-len("-live.png")]
    pic = os.path.join(d, kind + "-pic.png")
    if not os.path.exists(pic):
        continue
    a, b = Image.open(live).convert("RGB"), Image.open(pic).convert("RGB")
    if a.size != b.size:
        print(f"{kind:14} SIZE {a.size} vs {b.size}")
        continue
    diff = ImageChops.difference(a, b)
    px = list(diff.getdata())
    big = sum(1 for p in px if max(p) > 48)
    mean = sum(sum(p) for p in px) / (3 * len(px))
    share = 100 * big / len(px)
    flag = "DIFF" if share > 0.5 else "ok  "
    print(f"{flag} {kind:14} {share:6.2f}% of pixels differ, mean {mean:5.2f}")
    if share > 0.5:
        mask = Image.new("RGB", a.size, (0, 0, 0))
        mask.putdata([(255, 0, 0) if max(p) > 48 else (q[0] // 3, q[1] // 3, q[2] // 3) for p, q in zip(px, a.getdata())])
        mask.save(os.path.join(d, kind + "-diff.png"))
