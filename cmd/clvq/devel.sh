#!/bin/sh
set -eu
exec go run ./cmd/clvq "$@"
