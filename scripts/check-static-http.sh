#!/bin/sh
set -eu
base=${1:-http://127.0.0.1}
headers=$(mktemp)
trap 'rm -f "$headers"' EXIT
check() {
  path=$1 expected=$2 mime=${3:-}
  wget -S -O /dev/null "$base$path" 2> "$headers" || true
  code=$(awk '$1 ~ /^HTTP\/[0-9.]+$/ { code=$2 } END { print code }' "$headers")
  [ "$code" = "$expected" ] || { cat "$headers"; echo "$path: expected $expected, got $code"; exit 1; }
  if [ -n "$mime" ]; then
    grep -i "Content-Type: $mime" "$headers" > /dev/null || { cat "$headers"; exit 1; }
  fi
  echo "OK $path $expected $mime"
}
check / 200 text/html
check /docs/ 200 text/html
check /rikiki/dist/index.js 200 application/javascript
check /rikiki/dist/vendor/marked.js 200 application/javascript
check /rikiki/tokens.css 200 text/css
check /rikiki/docs/llms/rikiki-workflow.md 200 "text/markdown; charset=utf-8"
check /llms.txt 200 "text/plain; charset=utf-8"
check /__release_missing_route__/ 404
check /rikiki/dist/__release_missing__.js 404
