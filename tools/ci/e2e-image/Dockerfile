# The browser job image: Ubuntu noble with the workspace's Node runtime, the
# locked Playwright browsers, and nginx, so a single registry-local image both
# serves the built docs bundle and runs the browser tests. Browser jobs must
# not pull from Docker Hub or mcr.microsoft.com at job time; this derivation,
# built by the pipeline and pushed to the project's container registry, is
# what makes that possible.
#
# Why this base, and not Playwright's own image or a Node image:
# - Playwright's image ships its own Node major, and toolchains enforce
#   per-major floors at runtime — the Angular CLI refused its bundled Node
#   outright when consumer fixtures built there.
# - A Debian Node image swaps the OS out from under WebKit: Ubuntu noble is
#   the platform Playwright builds and tests its Linux WebKit against, and on
#   bookworm the same suite produced hard WebKit crashes ("browser has been
#   closed") where noble showed none.
# So: the OS Playwright targets, the Node the workspace pins, and Playwright's
# own installer reproducing exactly the browser + system-package set its
# upstream image would have carried.
#
# Built in CI by the e2e-image job (.gitlab/ci/e2e-image.yml), which owns the
# tag contract and the version pins; see README.md next to this file.
FROM ubuntu:noble

ENV DEBIAN_FRONTEND=noninteractive
# Browsers land where the jobs expect them; the jobs set the same path.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# The workspace's Node runtime (.node-version major; exact release pinned
# here — bump it alongside .node-version and on toolchain Node-floor bumps).
# curl stays: it also backs the readiness wait the e2e jobs run.
ARG NODE_VERSION=22.23.2
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates curl xz-utils \
  && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz \
  && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
  && rm /tmp/node.tar.xz \
  && rm -rf /var/lib/apt/lists/* \
  && node --version

# The locked @playwright/test version (pnpm-lock.yaml), passed by the build
# job. `--with-deps` apt-installs the browsers' system packages — the same
# set the upstream Playwright image ships for this OS.
ARG PLAYWRIGHT_VERSION
RUN test -n "${PLAYWRIGHT_VERSION}" \
  && npx --yes "playwright@${PLAYWRIGHT_VERSION}" install --with-deps chromium firefox webkit \
  && rm -rf /root/.npm /var/lib/apt/lists/*

# nginx serves the docs bundle in-container.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends nginx \
  && rm -rf /var/lib/apt/lists/*

# The repository's SPA config, verbatim. The distro default site would win
# the default-server election on :80 and serve its own root instead, so it
# goes; a future package layout without the site fails this build loudly
# rather than shipping two servers.
RUN rm /etc/nginx/sites-enabled/default && mkdir -p /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
