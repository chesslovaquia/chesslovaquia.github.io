# host targets

.PHONY: docker
docker:
	./docker/build.sh

# container targets

.PHONY: build
build:
	./hugo/build.sh
