#!/bin/sh
set -eu
SILENT="${VITEST_SILENT:-passed-only}"
SUITE="${1:-}"
exec npx vitest run "${SUITE}" --silent="${SILENT}"
