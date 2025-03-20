#!/bin/sh
set -eu
test -x "${GOPATH}/bin/clvq" || {
	echo "${GOPATH}/bin/clvq: file not found or not executable" >&2
	exit 9
}
exec "${GOPATH}/bin/clvq"
