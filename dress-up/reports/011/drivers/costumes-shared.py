import re, sys
exec(open("count.py").read().split("out = {}")[0])
pats = {
 "animal machinery (hood*/tailSvg/furDefs/stripes/armWing/falconWings/falconTail/suitHands/ANIMALS/costumeOn/lookOf)": r'hoodBack|hoodFront|hoodSide|hoodGeom|hoodEllipse|tailSvg|furDefs|wrapStripes|limbStripes|torsoStripes|legStripes|armWing|falconWings|falconTail|ANIMALS|suitHands|costumeOn|lookOf|BIRD_SUIT|FELINE|CLAWED',
 "costume controls/visibility (\"costume.<key>\" rules or the Costume tab rows)": r'"costume\.[A-Za-z_]+"|\["(color|toggle|range|choice)", "(fur|marks|belly|eyes|accent|spot|furPattern|witch|web|trim|cat|broom|boot|wing|fairy|tunic|wreath|ghost|scuba|diver|hose|leaks|snorkel|mask|tank)',
 "DEFAULTS.costume": r'^\s*costume: \{ kind:|witchColor: "#6a2c91"|scubaColor: "#1f2937"|wingStyle: "butterfly"|leaks: 0, snorkel',
}
for name, p in pats.items():
    rx = re.compile(p); n = 0
    for sha, subj, msg, lines in commits:
        if sha in SPLIT: continue
        if any(rx.search(l) for l in lines): n += 1
    print(n, name)
