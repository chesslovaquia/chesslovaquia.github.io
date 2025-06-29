#!/bin/sh
set -eu
exec docker run -it --rm -u devel \
	--name clvq-play \
	--hostname clvq.local \
	-v "${PWD}:/opt/clvq/play" \
	--workdir /opt/clvq/play \
	-p 127.0.0.1:8045:8045 \
	clvq/play
