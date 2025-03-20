#!/bin/sh
set -eu
exec docker run -it --rm -u devel \
	--name clvq \
	--hostname clvq.local \
	-v ${PWD}:/home/devel/src \
	--workdir /home/devel/src \
	-p 127.0.0.1:8044:8044 \
	chesslovaquia/devel
