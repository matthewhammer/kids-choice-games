#!/usr/bin/env bash
# (ticket 692) report 25 from a run of drivers/shots025.mjs (on a diag branch), as 024's finish.sh does report 24: the pictures as WebP for
# the web report, the run's texts and facts, and the page built.
#   bash dress-up/reports/025/drivers/finish.sh <artifact dir> <run id> <version> [<game commit>]
set -euo pipefail
art="$1"; run="$2"; ver="$3"; R="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$R/pictures" "$R/data"
rm -f "$R/pictures"/*.png "$R/pictures"/*.webp
for f in "$art"/guide025/*.png; do ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 80 "$R/pictures/$(basename "${f%.png}").webp"; done
cp "$art/guide025/texts.json" "$R/data/texts.json"
game=$(git -C "$R" rev-parse --short "${4:-origin/main}")   # (the game the pictures are of: the diag branch's base)
printf '{"branch": "diag-692", "game": "%s", "version": "%s", "id": "%s", "url": "https://github.com/matthewhammer/kids-choice-games/actions/runs/%s"}\n' "$game" "$ver" "$run" "$run" > "$R/data/run.json"
python3 "$R/drivers/build.py"
du -sh "$R/pictures"
