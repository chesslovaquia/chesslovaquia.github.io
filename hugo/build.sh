#!/bin/sh
set -eu

HUGO_CLVQ_BUILD=$(date '+%s')
export HUGO_CLVQ_BUILD

rm -rf ./public

hugo \
	--baseURL "${CLVQ_ROOT}" \
	--logLevel warning \
	--environment production \
	--ignoreCache \
	"$@"

exit 0
