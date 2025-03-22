.PHONY: devel

devel: docker

.PHONY: docker
docker:
	./docker/build.sh

.PHONY: build
build:
	go install ./cmd/clvq

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
