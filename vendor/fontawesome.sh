#!/bin/sh
set -eu

fa_version='7.0.1'
fa_url="https://use.fontawesome.com/releases/v7.0.1/fontawesome-free-${fa_version}-web.zip"

fa_src="vendor/tmp/fontawesome-free-${fa_version}-web"
fa_dst='static/fontawesome'

mkdir -vp vendor/tmp

echo "wget ${fa_url}"
wget -q -c -O vendor/tmp/fontawesome.zip "${fa_url}"

rm -rf "${fa_src}"

cd vendor/tmp
unzip -qq fontawesome.zip
cd ../..

rm -rf "${fa_dst}"

mkdir -vp "${fa_dst}/css"
mkdir -vp "${fa_dst}/webfonts"

cp -va "${fa_src}/css/fontawesome.min.css" "${fa_dst}/css"
cp -va "${fa_src}/css/solid.min.css" "${fa_dst}/css"

cp -va "${fa_src}/webfonts/fa-solid-900.woff2" "${fa_dst}/webfonts"

exit 0
