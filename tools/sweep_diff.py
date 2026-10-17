import json, sys
a, b = (json.load(open(f)) for f in sys.argv[1:3])
diff = [k for k in sorted(set(a) | set(b)) if a.get(k) != b.get(k)]
print(f"{len(a)} vs {len(b)} pictures; {len(diff)} differ" + (": " + ", ".join(diff) if diff else ": all identical"))
