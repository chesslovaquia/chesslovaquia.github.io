#!/bin/sh
set -eu
SUITE="${1:-}"
exec npx vitest run "${SUITE}" --coverage
