#!/bin/sh
set -eu
. ./cmd/clvq/clvq.env
exec go run ./cmd/clvq "$@"
