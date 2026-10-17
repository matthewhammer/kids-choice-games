#!/usr/bin/env python3
"""(ticket 184) Record a release's after-deploy result in dress-up/speed.json,
which the game reads beside version.json to mark its own version: nothing
when "ok", 🚧🐢 when "slow" (the frame-rate gate failed), 🚧 when "broken"
(one of tools/checks failed). Run by .github/workflows/dress-up-speed.yml.

  speed_record.py <version> <commit> <run url> <checks outcome> <gate outcome> <slow-scenes outcome>

An outcome is GitHub's for its step: success, failure, skipped or cancelled.
Keeps the newest 60 versions."""
import json, os, sys
from datetime import datetime, timezone

version, commit, run, checks, gate, gate_slow = sys.argv[1:7]
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dress-up", "speed.json")
try:
    data = json.load(open(path))
except (FileNotFoundError, ValueError):
    data = {}
failed = [name for name, o in (("the checks", checks), ("the frame-rate gate", gate), ("the frame-rate gate's slow scenes", gate_slow)) if o == "failure"]
result = "broken" if checks == "failure" else "slow" if failed else "ok"
if any(o == "cancelled" for o in (checks, gate, gate_slow)) and result == "ok":
    result = "unknown"
data[version] = {"result": result, "failed": failed, "commit": commit, "run": run,
                 "checked": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")}
key = lambda v: [int(x) for x in v.split(".")]
data = {v: data[v] for v in sorted(data, key=key, reverse=True)[:60]}
with open(path, "w") as f:
    json.dump(data, f, indent=1, ensure_ascii=False); f.write("\n")
print(f"{version}: {result}" + (f" ({', '.join(failed)})" if failed else ""))
