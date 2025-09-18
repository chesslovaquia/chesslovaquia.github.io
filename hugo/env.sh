#!/bin/sh
set -eu

HUGO_CLVQ_VERSION="$(cat ./VERSION).$(date '+%y%m%d%H%M')"
export HUGO_CLVQ_VERSION

HUGO_CLVQ_BUILD=$(date '+%s')
export HUGO_CLVQ_BUILD
