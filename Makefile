.PHONY: devel

devel: docker

.PHONY: docker
docker:
	./docker/build.sh

.PHONY: build
build:
	go install ./cmd/clvq
