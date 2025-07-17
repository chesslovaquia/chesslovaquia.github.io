#!/bin/sh
set -eu

find public/ -type f -name '*.js' | sort -u | while read -r filename; do
	echo "  nodejs -c ${filename}"
	nodejs -c "${filename}"
done

exit 0
