#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DOWNLOAD FONTS — saves the brand fonts (Latin subset, WOFF2) into public/fonts
# so videos render OFFLINE and identically on every computer.
# All fonts are licensed under the SIL Open Font License 1.1 (free to bundle).
# Already run once — only re-run if you change fonts:  bash scripts/download-fonts.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/fonts; mkdir -p "$OUT"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CSS_URL="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,600&family=Montserrat:wght@500;600;700;800;900&family=Anton&display=swap"
css="$(curl -fsSL -A "$UA" "$CSS_URL")"
# Walk the CSS: only keep the "/* latin */" blocks, one file per family+style
awk '
  /\/\* latin \*\// { latin=1; next }
  /\/\* /           { latin=0 }
  latin && /font-family/ { gsub(/.*: *'"'"'|'"'"';/, ""); fam=$0 }
  latin && /font-style/  { gsub(/.*: *|;/, ""); sty=$0 }
  latin && /src:/        { match($0, /https:[^)]*/); print fam "|" sty "|" substr($0, RSTART, RLENGTH) }
' <<<"$css" | sort -u -t'|' -k1,2 | while IFS='|' read -r fam sty url; do
  file="$(echo "$fam" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$sty.woff2"
  curl -fsSL "$url" -o "$OUT/$file"
  echo "✓ $OUT/$file ($(du -h "$OUT/$file" | cut -f1))"
done
