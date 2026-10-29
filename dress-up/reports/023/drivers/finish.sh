#!/usr/bin/env bash
# (ticket 639) report 23 from a run of tools/checks/packguide639.mjs, as 018's finish.sh does report 18: the pictures as WebP for the
# web report, the run's texts (the maze's map among them) and facts, and the page built.
#   bash dress-up/reports/023/drivers/finish.sh <artifact dir> <run id> <version>
set -euo pipefail
art="$1"; run="$2"; ver="$3"; R="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$R/pictures" "$R/data"
rm -f "$R/pictures"/*.png "$R/pictures"/*.webp
for f in "$art"/packguide/*.png; do ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 82 "$R/pictures/$(basename "${f%.png}").webp"; done
cp "$art/packguide/texts.json" "$R/data/texts.json"
game=$(git -C "$R" rev-parse --short origin/main)
printf '{"branch": "diag-639", "game": "%s", "version": "%s", "id": "%s", "url": "https://github.com/matthewhammer/kids-choice-games/actions/runs/%s"}\n' "$game" "$ver" "$run" "$run" > "$R/data/run.json"
python3 "$R/drivers/build.py"
du -sh "$R/pictures"
