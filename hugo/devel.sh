#!/bin/sh
exec hugo server \
	--bind 0.0.0.0 \
	--port 8045 \
	--buildDrafts \
	--gc \
	--noHTTPCache \
	--watch \
	--environment devel \
	--logLevel debug \
	--renderToMemory
