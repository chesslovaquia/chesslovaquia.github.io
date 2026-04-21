#!/bin/sh
set -eu
_USER=$(id -un)
exec docker run -it --rm -u "${_USER}" \
	--name clvq-vite \
	--hostname vite.clvq.local \
	-v "${PWD}:/opt/clvq/site" \
	--workdir /opt/clvq/site \
	--entrypoint /usr/bin/npm \
	-p 127.0.0.1:5173:5173 \
	clvq/site run dev -- --host 0.0.0.0 --port 5173
