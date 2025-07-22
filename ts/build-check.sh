#!/bin/sh
set -eu

find public/ -type f -name '*.js' | sort -u | while read -r filename; do
	echo "  node --check ${filename}"
	node --check "${filename}"
done

exit 0
