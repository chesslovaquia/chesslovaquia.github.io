#!/bin/sh
set -eu
exec docker run -it --rm -u devel \
	--name clvq-site \
	--hostname clvq.local \
	-v "${PWD}:/opt/clvq/site" \
	--workdir /opt/clvq/site \
	-p 127.0.0.1:8045:8045 \
	clvq/site
