# host targets

.PHONY: docker
docker:
	./docker/build.sh

.PHONY: clean
clean:
	@rm -rf public resources .hugo_build.lock

.PHONY: distclean
distclean: clean
	@rm -rf node_modules

# container targets

.PHONY: all
all: build

.PHONY: build
build:
	hugo/mkdeps.sh
	hugo/build.sh

.PHONY: check
check:
	shellcheck ./*.sh docker/*.sh hugo/*.sh ts/*.sh
	ts/check.sh
	npm audit

.PHONY: vendor
vendor:
	./vendor.sh

.PHONY: upgrade
upgrade:
	ts/upgrade.sh
