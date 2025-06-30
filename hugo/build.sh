#!/bin/sh
set -eu

hugo \
	--environment production \
	--baseURL http://localhost:8000/ \
	--logLevel warning

find ./public -type f | sort

exit 0
