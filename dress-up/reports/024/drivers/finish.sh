#!/usr/bin/env bash
# (ticket 661) report 24 from a run of drivers/shots024.mjs (on a diag branch), as 023's finish.sh does report 23: the pictures as WebP for the
# web report, the run's texts and facts, and the page built.
#   bash dress-up/reports/024/drivers/finish.sh <artifact dir> <run id> <version> [<game commit>]
set -euo pipefail
art="$1"; run="$2"; ver="$3"; R="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$R/pictures" "$R/data"
rm -f "$R/pictures"/*.png "$R/pictures"/*.webp
for f in "$art"/guide024/*.png; do ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 82 "$R/pictures/$(basename "${f%.png}").webp"; done
cp "$art/guide024/texts.json" "$R/data/texts.json"
game=$(git -C "$R" rev-parse --short "${4:-origin/main}")   # (the game the pictures are of: the diag branch's base)
printf '{"branch": "diag-661", "game": "%s", "version": "%s", "id": "%s", "url": "https://github.com/matthewhammer/kids-choice-games/actions/runs/%s"}\n' "$game" "$ver" "$run" "$run" > "$R/data/run.json"
python3 "$R/drivers/build.py"
du -sh "$R/pictures"
