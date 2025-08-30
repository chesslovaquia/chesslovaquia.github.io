#!/bin/sh
set -eu

. hugo/env.sh

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
