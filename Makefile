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

.PHONY: ci-deps
ci-deps:
	ts/ci-deps.sh

.PHONY: all
all: deps build

.PHONY: deps
deps:
	ts/mkdeps.sh

.PHONY: build
build:
	hugo/build.sh
	hugo/post-build.sh

.PHONY: check
check: build
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
	./vendor/w3css.sh
	./vendor/fontawesome.sh

.PHONY: upgrade
upgrade:
	hugo/upgrade.sh
	ts/upgrade.sh
