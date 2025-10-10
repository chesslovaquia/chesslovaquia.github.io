#!/bin/sh
set -eu
HUGO_VERSION=$(cat hugo/VERSION)
HUGO_URL='https://github.com/gohugoio/hugo/releases/download'
ARCH=$(dpkg --print-architecture)
wget -q -O /tmp/hugo.deb \
	"${HUGO_URL}/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-${ARCH}.deb"
dpkg -i /tmp/hugo.deb
rm -f /tmp/hugo.deb
exit 0
