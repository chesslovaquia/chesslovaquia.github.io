#!/bin/sh
set -eu
SRCD="/opt/clvq/src/base"
test -x "${GOPATH}/bin/clvq" || {
	echo "${GOPATH}/bin/clvq: file not found or not executable" >&2
	exit 9
}
. "${SRCD}/cmd/clvq/clvq.env"
exec "${GOPATH}/bin/clvq" "$@"
