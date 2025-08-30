#!/bin/sh
set -eu

. hugo/env.sh

rm -rf ./public

hugo \
	--baseURL "${CLVQ_ROOT}" \
	--logLevel warning \
	--environment production \
	--ignoreCache \
	"$@"

exit 0
