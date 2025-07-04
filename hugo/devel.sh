#!/bin/sh
set -eu

HUGO_CLVQ_BUILD=$(date '+%s')
export HUGO_CLVQ_BUILD

hugo/mkdeps.sh

exec hugo server \
	--bind 0.0.0.0 \
	--port 8045 \
	--buildDrafts \
	--gc \
	--noHTTPCache \
	--watch \
	--logLevel debug \
	--renderToMemory \
	--environment devel
