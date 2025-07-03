#!/bin/sh
set -eu

HUGO_CLVQ_BUILD=$(date '+%Y%m%d%Z%H%M%S')
export HUGO_CLVQ_BUILD

rm -rf ./public

hugo \
	--baseURL "${CLVQ_ROOT}" \
	--logLevel warning \
	"$@"

echo "Site files:"
find ./public -type f | sort

exit 0
