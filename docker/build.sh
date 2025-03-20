#!/bin/sh
set -eu

_UID=$(id -u)
_GID=$(id -g)

rm -rf ./docker/build

install -v -m 0750 -d ./docker/build
install -v -m 0640 -t ./docker/build ./go.mod ./chesslovaquia.go

install -v -m 0750 -d ./docker/build/cmd

install -v -m 0750 -d ./docker/build/cmd/clvq
install -v -m 0640 -t ./docker/build/cmd/clvq ./cmd/clvq/clvq*.*

exec docker build --rm \
	--build-arg "DEVEL_UID=${_UID}" \
	--build-arg "DEVEL_GID=${_GID}" \
	-t chesslovaquia/devel ./docker
