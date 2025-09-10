#!/bin/sh
set -eu
nodejs hugo/getLatestVersion.js >hugo/VERSION
echo "Hugo version: $(cat hugo/VERSION)"
exit 0
