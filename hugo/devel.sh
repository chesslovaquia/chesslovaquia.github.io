#!/bin/sh
set -eu

HUGO_CLVQ_BUILD=$(date '+%Y%m%d%Z%H%M%S')
export HUGO_CLVQ_BUILD

hugo/build-deps.sh

exec hugo server \
	--bind 0.0.0.0 \
	--port 8045 \
	--buildDrafts \
	--gc \
	--noHTTPCache \
	--watch \
	--logLevel debug \
	--renderToMemory
