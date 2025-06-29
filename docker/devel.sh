#!/bin/sh
set -eu
exec docker run -it --rm -u devel \
	--name clvq-play \
	--hostname clvq.local \
	-v "${PWD}:/opt/clvq/play" \
	--workdir /opt/clvq/play \
	clvq/play
