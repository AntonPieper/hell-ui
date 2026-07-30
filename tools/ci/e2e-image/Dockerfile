# The e2e job image: the pinned Playwright browser image with nginx added, so
# a single registry-local image both serves the built docs bundle and runs the
# browser tests. Jobs must not pull from Docker Hub or mcr.microsoft.com at
# job time; this derivation, pushed to the project's container registry, is
# what makes that possible.
#
# The base tag is the image matching the workspace's locked @playwright/test
# version (pnpm-lock.yaml). Rebuild and push on every Playwright bump — the
# procedure and the tag contract are in README.md next to this file.
FROM mcr.microsoft.com/playwright:v1.59.1-noble

# nginx serves the docs bundle in-container; curl backs the readiness wait the
# job runs before starting the browsers.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends nginx curl \
  && rm -rf /var/lib/apt/lists/*

# The repository's SPA config, verbatim. The distro default site would win the
# default-server election on :80 and serve its own root instead, so it goes;
# a future package layout without the site fails this build loudly rather
# than shipping two servers.
RUN rm /etc/nginx/sites-enabled/default && mkdir -p /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
