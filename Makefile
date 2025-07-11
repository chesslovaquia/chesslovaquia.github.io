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
	hugo/mkdeps.sh
	hugo/build.sh

.PHONY: check
check:
	shellcheck hugo/*.sh
	ts/check.sh
	npm audit

.PHONY: vendor
vendor:
	./vendor.sh
