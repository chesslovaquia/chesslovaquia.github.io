# host targets

.PHONY: docker
docker:
	docker/build.sh

.PHONY: clean
clean:
	@rm -rf public resources .hugo_build.lock coverage vendor/tmp

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
	hugo/post-build.sh

.PHONY: check
check: all
	shellcheck ./*.sh docker/*.sh hugo/*.sh ts/*.sh vendor/*.sh
	ts/check.sh
	@echo "node `node --version`"
	ts/build-check.sh
	hugo/check-build.sh

.PHONY: test
test: check
	ts/test.sh

.PHONY: vendor
vendor:
	./vendor/lila.sh
	./vendor/fontawesome.sh

.PHONY: upgrade
upgrade:
	ts/upgrade.sh
