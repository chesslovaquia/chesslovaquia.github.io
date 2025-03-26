#!/bin/sh
set -eux
. ./cmd/clvq/clvq.env
exec python3 ./.github/cleanenv.py make all
