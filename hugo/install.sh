#!/bin/sh
set -eu
HUGO_VERSION=0.147.9
wget -q -O /tmp/hugo.deb \
	https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb
dpkg -i /tmp/hugo.deb
rm -f /tmp/hugo.deb
exit 0
