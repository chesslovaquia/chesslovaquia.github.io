#!/bin/sh
set -eu

find public/ -type f -name '*.html' | sort -u | while read -r filename; do
	echo "  html-validate ${filename}"
	npx html-validate "${filename}"
done

find public/ -type f -name '*.json' | sort -u | while read -r filename; do
	echo "  parse ${filename}"
	node -e "JSON.parse(require('fs').readFileSync('${filename}', 'utf8'))"
done

exit 0
