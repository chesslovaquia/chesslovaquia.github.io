#!/bin/sh
set -eu

find public/ -type f -name '*.html' | sort -u | while read -r filename; do
	echo "  html-validate ${filename}"
	npx html-validate "${filename}"
done

exit 0
