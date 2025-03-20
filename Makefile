.PHONY: devel

devel: docker

.PHONY: docker
docker:
	./docker/build.sh
