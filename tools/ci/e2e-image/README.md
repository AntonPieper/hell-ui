# The browser job image

Browser jobs must pull only from the project's own container registry — never
Docker Hub or `mcr.microsoft.com` at job time. This directory derives the one
image those jobs run: the workspace's Node runtime with the locked Playwright
browsers installed and nginx added, so the same container serves the built
docs bundle and runs the tests against it.

## Image contract

- **Name**: `e2e`, under the project's container-registry path — in CI,
  `$CI_REGISTRY_IMAGE/e2e`. The registry path itself is shown on the
  project's Container Registry page and is deliberately never written in this
  repository.
- **Tag**: `v<playwright>-node<major>[-rN]`, e.g. `v1.59.1-node22-r2` —
  the workspace's locked `@playwright/test` version (`pnpm-lock.yaml`) plus
  the Node major from `.node-version`, with an optional revision suffix for
  derivation changes that move neither pin. The tag says exactly which
  Playwright the browsers belong to and which Node runtime jobs get. The
  authoritative value is `E2E_IMAGE_TAG` in `.gitlab/ci/e2e-image.yml`.
- **Base**: `ubuntu:noble` with the workspace's pinned Node installed on
  top — neither Playwright's own image (its bundled Node major fails
  toolchain floors: the Angular CLI refused it outright) nor a Node image
  (Debian under WebKit produced hard browser crashes; noble is the platform
  Playwright builds and tests Linux WebKit against). Playwright's installer
  reproduces everything the upstream image provided: `install --with-deps`
  fetches the browsers for the pinned version and apt-installs the same
  system packages.
- **Contents on top**: `nginx` and `curl`. The repository's
  [`nginx-spa.conf`](../nginx-spa.conf) is copied verbatim to
  `/etc/nginx/conf.d/default.conf`, the distro default site is removed so the
  SPA server is the only one on port 80, and the docs root
  `/usr/share/nginx/html` starts empty — a job copies the built docs bundle
  there before starting nginx. Browsers live at `/ms-playwright`
  (`PLAYWRIGHT_BROWSERS_PATH`, baked into the image and repeated by the
  jobs).
- **Platform**: `linux/amd64`, the runner architecture — built on the runner
  itself, so there is no cross-architecture emulation anywhere in the path.

## How it is built — in the pipeline, never on a workstation

The `e2e-image` job (`.gitlab/ci/e2e-image.yml`) builds and pushes the image
with dind + BuildKit — the instance's established pattern — using the
CI-provided registry credentials. It instantiates only when the derivation's
inputs change (this directory, `nginx-spa.conf`, or the pins in
`.gitlab/ci/e2e-image.yml`); the browser jobs order themselves behind it with
an optional `needs`, so a pipeline that rebuilds the image tests against the
fresh tag and every other pipeline just pulls.

Tags are immutable: the build job refuses to touch a tag that already exists
in the registry. A derivation change therefore always travels with an
`E2E_IMAGE_TAG` bump in the same commit — forget it and the job says
"tag exists, not overwriting" instead of silently replacing bits under a
name other pipelines trust. Superseded tags are garbage-collected by the
project's registry cleanup policy (newest kept unconditionally, older tags
deleted 90 days after push), so rollback stays possible for a quarter and
dead tags stop costing storage.

The Playwright pin (`E2E_PLAYWRIGHT_VERSION`) is written out explicitly next
to the tag rather than parsed from `pnpm-lock.yaml`. Validation happens
loudly at point of use: Playwright refuses to run against browsers installed
for a different version, so a pin that drifts from the lockfile fails the
first e2e shard with an exact message naming both versions.

## When to bump

| Change | What to do |
| --- | --- |
| `@playwright/test` bump in the lockfile | Set `E2E_PLAYWRIGHT_VERSION` and `E2E_IMAGE_TAG` to the new version in the same MR. |
| Node major bump (`.node-version`) | Update the Dockerfile base and the `-node<major>` tag segment in the same MR. |
| Any other derivation edit | Bump the `-rN` suffix in the same MR. |

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
