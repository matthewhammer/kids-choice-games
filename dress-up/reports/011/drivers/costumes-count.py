import re, sys, json
data = open(sys.argv[1], encoding="utf-8", errors="replace").read()
chunks = data.split("\x00COMMIT ")[1:]
commits = []
for c in chunks:
    head, _, rest = c.partition("\x01")
    msg, _, diff = rest.partition("\x02")
    sha, _, subj = head.partition(" ")
    lines = [l[1:] for l in diff.split("\n") if (l.startswith("+") or l.startswith("-")) and not l.startswith("+++") and not l.startswith("---")]
    commits.append((sha, subj, msg, lines))
print("commits touching code paths:", len(commits), file=sys.stderr)

# the costume choice list lines name every kind; skip them
choice_line = re.compile(r'\["[a-z]+", "[^"]*"\],\s*\["[a-z]+", "')
ctx = re.compile(r'suit|furPattern|FELINE|CLAWED|tiger|lion|hood|tail|ANIMALS|C\.|costume|claw|paw')
kinds = {
  "tiger": r'\btiger\b', "cat": r'kind [!=]== "cat"|\bcat: ?1\b|^\s*cat:\s*\{\s*suit|\bcat: ?\d', "lion": r'\blion\b', "bear": r'kind [!=]== "bear"|^\s*bear:\s*\{\s*suit',
  "falcon": r'\bfalcon\b|falconHead|falconWings|falconTail', "raccoon": r'\braccoon\b', "bobcat": r'\bbobcat\b', "leopard": r'\bleopard\b',
  "eagle": r'"eagle"|\beagle:|eagleHead', "cheetah": r'\bcheetah\b', "jaguar": r'\bjaguar\b', "falconsuit": r'falconsuit', "eaglesuit": r'eaglesuit',
  "wolf": r'\bwolf\b', "deer": r'kind [!=]== "deer"|^\s*deer:\s*\{|\bdeer\b.*(antler|hoof|suit)|(antler|hoof)',
  "witch": r'witchColor|webColor|webStyle|trimColor|witchCat|witchHat|broomSvg|broomSize|catSize|bootColor|witchboot|stocking|fewWebs|brimRx|(c|C|costume)\.kind [!=]== "witch"|const witch = kind',
  "fairy": r'FAIRY_(WINGS|TUNICS|SHOES|SHOE_COLORS)|fairyWings|fairyHem|fairyOutfit|tunicStyle|tunicColor|wingStyle|wingColor_|wingFlutter|wingLfo|wreath|fairyShoe|"fairy-(slipper|petal|leaf|sparkle|bare)|"fairy-" \+|fTunic|fWing|(c|costume)\.kind [!=]== "fairy"|fairy = kind',
  "ghost": r'\bgh\.(sheet|mouth|eyes)|ghostSvg|ghostRagged|ghostEyes|ghostHideEyes|ghostColor|GHOST_COLORS|kind [!=]== "ghost"',
  "scuba": r'scuba', "diver": r'\bdiver|diverHelmet|diverCorselet',
  "snorkel": r'snorkel', "mask": r'maskSvg|maskColor|WC\.mask\b|costume\.mask\b|"toggle", "mask"', "tank": r'tankSvg|tankStraps|tankColor|WC\.tank\b|costume\.tank\b|"toggle", "tank"',
  "leaks": r'leakPts|leakRun|leakTick|leakSim|\.leaks\b|"leaks"',
}
words = {"tiger": r'\btiger', "cat": r'black cat|\bcat costume|\bcats have claws', "lion": r'\blion', "bear": r'\bbear\b(?! hug)', "falcon": r'\bfalcon|peregrine', "raccoon": r'raccoon',
  "bobcat": r'bobcat', "leopard": r'leopard', "eagle": r'eagle', "cheetah": r'cheetah', "jaguar": r'jaguar', "falconsuit": r'falcon suit|bird suit', "eaglesuit": r'eagle suit|bird suit',
  "wolf": r'\bwolf', "deer": r'\bdeer|antler', "witch": r'\bwitch', "fairy": r'\bfair(y|ies)', "ghost": r'\bghost', "scuba": r'scuba|diving suit', "diver": r'old diving|diving suit|helmet|diver',
  "snorkel": r'snorkel', "mask": r'face mask|\bmask\b', "tank": r'\btank\b', "leaks": r'\bleak'}
SPLIT = {"6a0e8da", "31e9257"}
out = {}
for k, pat in kinds.items():
    rx = re.compile(pat); wx = re.compile(words[k], re.I)
    code = set(); msgs = set()
    for sha, subj, msg, lines in [c for c in commits if c[0] not in SPLIT]:
        hit = False
        for l in lines:
            if choice_line.search(l): continue
            if rx.search(l) and (k not in ("cat", "bear") or ctx.search(l)):
                hit = True; break
        if hit: code.add(sha)
        if wx.search(subj): msgs.add(sha)
    out[k] = {"code": len(code), "subject": len(msgs), "union": len(code | msgs)}
    print(f"{k:11s} code-diff {len(code):4d}  subject {len(msgs):4d}  union {len(code|msgs):4d}")

show = sys.argv[2:] 
for k in show:
    rx = re.compile(kinds[k]); wx = re.compile(words[k], re.I)
    print("==", k)
    for sha, subj, msg, lines in [c for c in commits if c[0] not in SPLIT]:
        n = sum(1 for l in lines if not choice_line.search(l) and rx.search(l) and (k not in ("cat","bear") or ctx.search(l)))
        s = bool(wx.search(subj))
        if n or s: print(f"  {sha} code-lines={n:3d} subj={'Y' if s else '-'} {subj[:110]}")
