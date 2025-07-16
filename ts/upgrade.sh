#!/bin/sh
set -eu
npx ncu
npx ncu -u
exec npm install
