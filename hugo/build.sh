#!/bin/sh
set -eu

rm -rf ./public

hugo \
	--environment production \
	--baseURL http://localhost:8000/ \
	--logLevel warning

echo "Site files:"
find ./public -type f | sort

exit 0
