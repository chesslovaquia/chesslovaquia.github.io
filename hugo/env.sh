#!/bin/sh
set -eu

HUGO_CLVQ_VERSION=$(cat ./VERSION)
export HUGO_CLVQ_VERSION

HUGO_CLVQ_BUILD=$(date '+%s')
export HUGO_CLVQ_BUILD
