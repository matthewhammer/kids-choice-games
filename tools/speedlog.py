#!/usr/bin/env python3
"""(ticket 166) The speed lines sent from the game's 📮 buttons, read back
from the Fumola canister's log: <canister>/s/<space>/log, entries
{key, value}, the key "speed|trip <version> <when>".

  speedlog.py <log url> [--since YYYY-MM-DD]"""
import json, sys, urllib.request
url = sys.argv[1]
since = sys.argv[sys.argv.index("--since") + 1] if "--since" in sys.argv else ""
with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "speedlog"}), timeout=30) as r:
    entries = json.loads(r.read().decode())
# (the canister answers a list of entries; each a {key, value} or a [key, value])
for e in entries:
    key, value = (e.get("key"), e.get("value")) if isinstance(e, dict) else (e[0], e[1])
    when = key.split(" ")[-1] if key else ""
    if when >= since:
        print(key); print("  " + value)
