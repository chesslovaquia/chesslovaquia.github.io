#!/bin/sh
set -eu

#
# Build with each inactive theme to verify it still works.
# The active theme (hugo.toml) is already built and validated
# by the normal pipeline — this script only checks that the
# other themes produce a successful Hugo build (no broken
# templates, missing partials, or config errors).
#

. hugo/env.sh

THEMES="clvq"

for theme in ${THEMES}; do
	outdir=$(mktemp -d /tmp/clvq.theme-check.XXXXXXXX)
	echo "Theme '${theme}': building to ${outdir}"

	hugo \
		--baseURL "${CLVQ_ROOT}" \
		--theme "${theme}" \
		--destination "${outdir}" \
		--logLevel warning \
		--environment production \
		--ignoreCache

	rm -rf "${outdir}"
	echo "Theme '${theme}': OK"
done

exit 0
