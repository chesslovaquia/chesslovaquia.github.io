#!/bin/sh
set -eu

#
# Lila cleanup.
#

rm -f ./public/lila/COPYING.md \
	./public/lila/LICENSE \
	./public/lila/README.md

#
# Assets URLs.
#

rm -f ./public/sw-assets.json
assets_urls=$(mktemp /tmp/clvq.sw-assets.XXXXXXXX)

echo "[" >"${assets_urls}"

echo "Site files:"
find ./public -type f | sort | while read -r filename; do
	if echo "${filename}" | grep -sq 'lila/public/images/board'; then
		continue
	fi
	echo "  ${filename}"
	url=$(echo "${filename}" | sed 's#^\./public##')
	echo "  \"${url}\"," >>"${assets_urls}"
done

echo '  "/sw-assets.json"' >>"${assets_urls}"
echo ']' >>"${assets_urls}"

mv -f "${assets_urls}" ./public/sw-assets.json

exit 0
