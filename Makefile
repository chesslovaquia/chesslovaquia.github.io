# host targets

.PHONY: devel

devel: docker

.PHONY: docker
docker:
	./docker/build.sh

# container targets

.PHONY: fmt
fmt:
	@gofmt -l -s -w .

.PHONY: all
all: build wasm html

.PHONY: build
build:
	go install ./cmd/clvq

.PHONY: wasm
wasm:
	@install -v -m 0750 -d "static/`go env GOVERSION`"
	@rm -vf "static/`go env GOVERSION`/wasm_exec.js"
	@install -v -m 0640 -t "static/`go env GOVERSION`" \
		"`go env GOROOT`/lib/wasm/wasm_exec.js"

.PHONY: html
html:
	./tpl/build.sh

.PHONY: upgrade
upgrade:
	@go version
	go get go@latest
	go get -u all
	go mod tidy -v
#	go mod vendor

.PHONY: vendor
vendor:
	./vendor/w3css.sh 4
	./vendor/w3css.sh 5
