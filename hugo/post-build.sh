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

assets_urls=$(mktemp /tmp/clvq.assets.XXXXXXXX)

echo "[" >"${assets_urls}"

echo "Site files:"
find ./public -type f | sort | while read -r filename; do
	echo "  ${filename}"
	url=$(echo "${filename}" | sed 's#^\./public##')
	echo "  \"${url}\"," >>"${assets_urls}"
done

echo "  \"/\"" >>"${assets_urls}"
echo "]" >>"${assets_urls}"

mv -f "${assets_urls}" ./public/assets.json

exit 0
