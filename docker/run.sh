#!/bin/sh
set -eu
datadir="${PWD}/docker/data"
install -v -d -m 0750 "${datadir}"
install -v -d -m 0750 "${datadir}/claude"
if ! test -s "${datadir}/claude.json"; then
	touch "${datadir}/claude.json"
fi
exec docker run -it --rm -u devel \
	--name clvq-hugo \
	--hostname hugo.clvq.local \
	-e "TERM=${TERM}" \
	-v "${datadir}/claude:/home/devel/.claude" \
	-v "${datadir}/claude.json:/home/devel/.claude.json" \
	-v "${PWD}:/opt/clvq/site" \
	--workdir /opt/clvq/site \
	--entrypoint /opt/clvq/site/hugo/devel.sh \
	-p 127.0.0.1:8045:8045 \
	clvq/site
