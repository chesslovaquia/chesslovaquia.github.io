#!/bin/sh
set -eu

# Check https://fontawesome.com/download

fa_version='7.0.1'
fa_url="https://use.fontawesome.com/releases/v7.0.1/fontawesome-free-${fa_version}-web.zip"

fa_src="vendor/tmp/fontawesome-free-${fa_version}-web"
fa_theme_dst='themes/clvq/assets/fontawesome'
fa_static_dst='static/fontawesome'

mkdir -vp vendor/tmp

echo "wget ${fa_url}"
wget -q -c -O vendor/tmp/fontawesome.zip "${fa_url}"

rm -rf "${fa_src}"

cd vendor/tmp
unzip -qq fontawesome.zip
cd ../..

rm -rf "${fa_theme_dst}"
mkdir -vp "${fa_theme_dst}/css"

cp -va "${fa_src}/css/fontawesome.css" "${fa_theme_dst}/css"
cp -va "${fa_src}/css/solid.css" "${fa_theme_dst}/css"

rm -rf "${fa_static_dst}"
mkdir -vp "${fa_static_dst}/webfonts"

cp -va "${fa_src}/webfonts/fa-solid-900.woff2" "${fa_static_dst}/webfonts"

exit 0
