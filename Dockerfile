FROM debian:trixie-20250317-slim

LABEL maintainer="Jeremías Casteglione <jrmsdev@gmail.com>"
LABEL version="250319"

USER root:root
WORKDIR /root

ENV USER root
ENV HOME /root

ENV DEBIAN_FRONTEND noninteractive

ENV APT_INSTALL bash openssl ca-certificates build-essential golang

RUN apt-get clean \
	&& apt-get update -yy \
	&& apt-get dist-upgrade -yy --purge \
	&& apt-get install -yy --no-install-recommends ${APT_INSTALL} \
	&& apt-get clean \
	&& apt-get autoremove -yy --purge \
	&& rm -rf /var/lib/apt/lists/* \
		/var/cache/apt/archives/*.deb \
		/var/cache/apt/*cache.bin

ARG DEVEL_UID=1000
ARG DEVEL_GID=1000

ENV DEVEL_UID ${DEVEL_UID}
ENV DEVEL_GID ${DEVEL_GID}

RUN groupadd -o -g ${DEVEL_GID} devel \
	&& useradd -o -d /home/devel -m -c 'devel' -g ${DEVEL_GID} -u ${DEVEL_UID} devel \
	&& chmod -v 0750 /home/devel

RUN printf 'umask %s\n' '027' >>/home/devel/.profile
RUN printf "export PS1='%s '\n" '\u@\h:\W\$' >>/home/devel/.profile

RUN install -v -m 0750 -o devel -g devel -d /opt/clvq
RUN install -v -m 0750 -o devel -g devel -d /opt/clvq/src
RUN install -v -m 0750 -o devel -g devel -d /opt/clvq/src/base

COPY . /opt/clvq/src/base

ENV SRCD /opt/clvq/src/base

RUN chown -R devel:devel ${SRCD}

RUN install -v -m 0755 ${SRCD}/cmd/clvq/clvq.sh /usr/local/bin/clvq

USER devel:devel
WORKDIR /home/devel

ENV USER devel
ENV HOME /home/devel

ENV GOPATH /opt/clvq

RUN go version

WORKDIR ${SRCD}
RUN go install ./cmd/clvq

WORKDIR ${SRCD}
CMD /bin/bash -i -l
