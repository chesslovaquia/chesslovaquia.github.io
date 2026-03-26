#!/bin/sh
set -eu
datadir="${PWD}/docker/data"
install -v -d -m 0750 "${datadir}"
install -v -d -m 0750 "${datadir}/claude"
if ! test -s "${datadir}/claude.json"; then
	touch "${datadir}/claude.json"
fi
exec docker run -it --rm -u devel \
	--hostname clvq.local \
	-e "TERM=${TERM}" \
	-v "${datadir}/claude:/home/devel/.claude" \
	-v "${datadir}/claude.json:/home/devel/.claude.json" \
	-v "${PWD}:/opt/clvq/site" \
	--workdir /opt/clvq/site \
	clvq/site
