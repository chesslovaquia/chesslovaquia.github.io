#!/bin/sh
set -eu

#
# Lila cleanup.
#

rm -f ./public/lila/COPYING.md \
	./public/lila/LICENSE \
	./public/lila/README.md

#
# Service worker urls.
#

sw_urls=$(mktemp /tmp/clvq.sw_urls.XXXXXXXX)

echo "[" >"${sw_urls}"

echo "Site files:"
find ./public -type f | sort | while read -r filename; do
	echo "  ${filename}"
	url=$(echo "${filename}" | sed 's#^\./public##')
	echo "  \"${url}\"," >>"${sw_urls}"
done

echo "  \"/\"" >>"${sw_urls}"
echo "]" >>"${sw_urls}"

mv -f "${sw_urls}" ./public/sw-urls.json

exit 0
