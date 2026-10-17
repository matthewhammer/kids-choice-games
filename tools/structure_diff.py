import json, sys
a, b = (json.load(open(f)) for f in sys.argv[1:3])
for k in a:
    same = a[k] == b.get(k)
    print(f"{k}: {'identical' if same else 'DIFFERS'}")
    if not same and isinstance(a[k], list):
        for i, (x, y) in enumerate(zip(a[k], b[k])):
            if x != y: print("  first difference at item", i, json.dumps(x)[:300], "|", json.dumps(y)[:300]); break
