#!/bin/sh
set -eu
exec npx vitest run "$@"
