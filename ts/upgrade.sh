#!/bin/sh
set -eu
npx ncu -u
exec npm install
