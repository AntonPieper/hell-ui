# The browser job image: the workspace's Node runtime with the locked
# Playwright browsers and nginx added, so a single registry-local image both
# serves the built docs bundle and runs the browser tests. Browser jobs must
# not pull from Docker Hub or mcr.microsoft.com at job time; this derivation,
# built by the pipeline and pushed to the project's container registry, is
# what makes that possible.
#
# The base is the workspace runtime (.node-version major), not Playwright's
# own image: toolchains enforce per-major Node floors at runtime (the Angular
# CLI refused the Playwright base's bundled Node outright), and Playwright's
# installer reproduces everything that base would have given us — the
# browsers for the pinned version plus their system packages — via
# `install --with-deps`.
#
# Built in CI by the e2e-image job (.gitlab/ci/e2e-image.yml), which owns the
# tag contract and the version pins; see README.md next to this file.
FROM node:22

# Browsers land where the jobs expect them; the jobs set the same path.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# The locked @playwright/test version (pnpm-lock.yaml), passed by the build
# job. `--with-deps` apt-installs the browsers' system packages, the same
# set the upstream Playwright image ships.
ARG PLAYWRIGHT_VERSION
RUN test -n "${PLAYWRIGHT_VERSION}" \
  && npx --yes "playwright@${PLAYWRIGHT_VERSION}" install --with-deps chromium firefox webkit \
  && rm -rf /root/.npm /var/lib/apt/lists/*

# nginx serves the docs bundle in-container; curl backs the readiness wait
# the job runs before starting the browsers.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends nginx curl \
  && rm -rf /var/lib/apt/lists/*

# The repository's SPA config, verbatim. The distro default site would win
# the default-server election on :80 and serve its own root instead, so it
# goes; a future package layout without the site fails this build loudly
# rather than shipping two servers.
RUN rm /etc/nginx/sites-enabled/default && mkdir -p /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
