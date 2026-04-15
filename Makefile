# host targets

.PHONY: docker
docker:
	docker/build.sh

.PHONY: clean
clean:
	@rm -rf dist coverage .vite

.PHONY: distclean
distclean: clean
	@rm -rf node_modules

# container targets

.PHONY: ci-check
ci-check:
	@npm ci
	@npm run check
	@npm run test

.PHONY: check
check:
	@npm run check

.PHONY: test
test:
	@npm run test

.PHONY: build
build:
	@npm run build

.PHONY: dev
dev:
	@npm run dev

.PHONY: upgrade
upgrade:
	@python3 upgrade.py
