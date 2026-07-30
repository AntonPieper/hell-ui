# The e2e job image

Browser jobs must pull only from the project's own container registry — never
Docker Hub or `mcr.microsoft.com` at job time. This directory derives the one
image those jobs run: the pinned Playwright browser image with nginx added, so
the same container serves the built docs bundle and runs the tests against it.

## Image contract

- **Name**: `e2e`, under the project's container-registry path — in CI,
  `$CI_REGISTRY_IMAGE/e2e`. The registry path itself is shown on the
  project's Container Registry page and is deliberately never written in this
  repository.
- **Tag**: the Playwright base tag, e.g. `v1.59.1-noble` — always the
  workspace's locked `@playwright/test` version (`pnpm-lock.yaml`) plus the
  base image's OS suffix. The tag says exactly which Playwright the browsers
  inside it belong to.
- **Contents**: the base plus `nginx` and `curl`. The repository's
  [`nginx-spa.conf`](../nginx-spa.conf) is copied verbatim to
  `/etc/nginx/conf.d/default.conf`, the distro default site is removed so the
  SPA server is the only one on port 80, and the docs root
  `/usr/share/nginx/html` starts empty — a job copies the built docs bundle
  there before starting nginx. Because the config is the same file the
  standalone nginx container mounted, its serving behavior is byte-identical
  by construction.
- **Platform**: `linux/amd64`, the runner architecture.

## Running it

The image sets no entrypoint or command of its own: a CI runner injects the
job script, which copies the built docs bundle into `/usr/share/nginx/html`,
starts `nginx` (it daemonizes by default), curl-waits on `http://127.0.0.1/`
until it answers, and runs Playwright against that address — which is why
`curl` is part of the derivation. Locally the same thing is one container:
mount the bundle read-only over the docs root and run
`nginx -g "daemon off;"` as the container command.

## Build and push

Rebuilds are rare and maintainer-run; there is no build job. From the
repository root, with the registry path from the project's Container Registry
page and a `docker login` that can write it:

```bash
REGISTRY_IMAGE=<the project's container-registry path>
PLAYWRIGHT_TAG=v1.59.1-noble  # the locked @playwright/test version + OS suffix
docker buildx build --platform linux/amd64 \
  --file tools/ci/e2e-image/Dockerfile \
  --tag "${REGISTRY_IMAGE}/e2e:${PLAYWRIGHT_TAG}" \
  --push tools/ci
```

## Rebuild rule

The image is rebuilt **only on Playwright bumps**. When the locked
`@playwright/test` version changes, build and push the tag for the new
version as part of the same change that bumps the lockfile, and point the CI
jobs at it — a version bump whose image was never pushed fails its first
pipeline at pull time, which is the desired loud failure. Existing tags are
never overwritten or retagged: like the upstream version pin they mirror, a
tag that exists means exactly one thing forever.

Nothing else triggers a rebuild. In particular, docs-bundle changes do not:
the bundle is a pipeline artifact the job copies in at run time, never baked
into the image.

## What "serves the docs bundle" means

The acceptance behavior, with a built docs bundle in
`/usr/share/nginx/html` and nginx running:

| Request | Response |
| --- | --- |
| `/` or any SPA route (`/components/whatever`) | `200`, `index.html` |
| A static-asset path that does not exist (`/missing.js`) | `404`, no SPA fallback |
| An existing `.mjs` file | `200`, `Content-Type: application/javascript` |

These are the semantics of `nginx-spa.conf` and the reason the file is copied
rather than re-expressed: a missing asset must fail the test run as a missing
asset, not dissolve into a soft-200 `index.html`.
