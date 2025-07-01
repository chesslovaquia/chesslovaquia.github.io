#!/bin/sh
set -eu

rm -rf ./public

hugo/build-deps.sh

hugo \
	--baseURL "${CLVQ_ROOT}" \
	--logLevel warning \
	"$@"

echo "Site files:"
find ./public -type f | sort

exit 0
