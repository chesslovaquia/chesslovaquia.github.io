# host targets

.PHONY: docker
docker:
	./docker/build.sh

.PHONY: clean
clean:
	rm -rf public resources

# container targets

.PHONY: all
all: build

.PHONY: build
build:
	./hugo/build.sh
