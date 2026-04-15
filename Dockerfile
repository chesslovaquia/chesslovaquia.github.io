FROM debian:forky-20260406-slim

LABEL maintainer="Jeremías Casteglione <jrmsdev@gmail.com>"
LABEL version="260407"

ENV CLVQ_UPGRADE=260407

USER root:root
WORKDIR /root

ENV USER=root
ENV HOME=/root

ENV DEBIAN_FRONTEND=noninteractive

ENV APT_INSTALL='bash openssl ca-certificates media-types less wget python3 npm make shellcheck zip unzip git'

RUN apt-get clean \
	&& apt-get update -yy \
	&& apt-get dist-upgrade -yy --purge \
	&& apt-get install -yy --no-install-recommends ${APT_INSTALL} \
	&& apt-get clean \
	&& apt-get autoremove -yy --purge \
	&& rm -rf /var/lib/apt/lists/* \
		/var/cache/apt/archives/*.deb \
		/var/cache/apt/*cache.bin

RUN mkdir -vp ./hugo
COPY ./hugo/install.sh ./hugo/install.sh
COPY ./hugo/VERSION ./hugo/VERSION
RUN /bin/sh ./hugo/install.sh

ARG DEVEL_UID=1000
ARG DEVEL_GID=1000

ENV DEVEL_UID=${DEVEL_UID}
ENV DEVEL_GID=${DEVEL_GID}

RUN groupadd -o -g ${DEVEL_GID} devel \
	&& useradd -o -d /home/devel -m -c 'devel' -g ${DEVEL_GID} -u ${DEVEL_UID} devel \
	&& chmod -v 0750 /home/devel

RUN printf 'umask %s\n' '027' >>/home/devel/.profile

COPY ./docker/user-login.sh /usr/local/bin/user-login.sh
RUN chmod -v 0755 /usr/local/bin/user-login.sh

RUN install -v -m 0750 -o devel -g devel -d /opt/clvq
RUN install -v -m 0750 -o devel -g devel -d /opt/clvq/site

#RUN ln -vsf /home/devel/.local/bin/uvx /usr/local/bin/uvx \
#	&& ln -vsf /home/devel/.local/bin/uv /usr/local/bin/uv

RUN ln -vsf /home/devel/.local/npm/node_modules/.bin/claude /usr/local/bin/claude

USER devel:devel
WORKDIR /home/devel

ENV USER=devel
ENV HOME=/home/devel

RUN npm version
RUN npx --version
RUN hugo version

#RUN wget -q -O - https://astral.sh/uv/install.sh | sh
#RUN .local/bin/uv --version

ENV CLVQ_CLAUDE_UPGRADE=2.1.109

RUN install -v -d -m 0750 ${HOME}/.local/npm \
	&& cd ${HOME}/.local/npm \
	&& npm install @anthropic-ai/claude-code
RUN /usr/local/bin/claude --version

ENV CLVQ_ROOT=http://localhost:8000
ENTRYPOINT ["/usr/local/bin/user-login.sh"]
