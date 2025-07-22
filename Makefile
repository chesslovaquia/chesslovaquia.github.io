# host targets

.PHONY: docker
docker:
	docker/build.sh

.PHONY: clean
clean:
	@rm -rf public resources .hugo_build.lock

.PHONY: distclean
distclean: clean
	@rm -rf node_modules

# container targets

.PHONY: all
all: build
	@echo "node `node --version`"

.PHONY: build
build:
	hugo/mkdeps.sh
	hugo/build.sh
	hugo/post-build.sh

.PHONY: check
check: all
	shellcheck ./*.sh docker/*.sh hugo/*.sh ts/*.sh
	ts/check.sh
	ts/build-check.sh
	hugo/check-build.sh

.PHONY: vendor
vendor:
	./vendor.sh

.PHONY: upgrade
upgrade:
	ts/upgrade.sh
	npm audit
