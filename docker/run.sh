#!/bin/sh
set -eu
datadir="${PWD}/docker/data"
install -v -d -m 0750 "${datadir}"
install -v -d -m 0750 "${datadir}/claude"
if ! test -s "${datadir}/claude.json"; then
	touch "${datadir}/claude.json"
fi
exec docker run -it --rm -u devel \
	--name clvq-vite \
	--hostname vite.clvq.local \
	-v "${datadir}/claude:/home/devel/.claude" \
	-v "${datadir}/claude.json:/home/devel/.claude.json" \
	-v "${PWD}:/opt/clvq/site" \
	--workdir /opt/clvq/site \
	--entrypoint /usr/bin/npm \
	-p 127.0.0.1:5173:5173 \
	clvq/site run dev -- --host 0.0.0.0 --port 5173
