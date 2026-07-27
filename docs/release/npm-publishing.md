# npm trusted publishing

Hell UI publishes `hell-ui` from the public `AntonPieper/hell-ui`
GitHub repository with npm trusted publishing. Normal releases must not use a
long-lived publish token.

## npm package settings

Configure these settings on npm for `hell-ui` before the first
automated publish:

1. Open the `hell-ui` package on npm and add a trusted publisher.
2. Provider: GitHub Actions.
3. Organization or user: `AntonPieper`.
4. Repository: `hell-ui`.
5. Workflow filename: `npm-publish.yml`.
6. Environment name: `npm-publish`.
7. Publish command: `pnpm publish`.
8. Under package settings → publishing access, choose **Require two-factor authentication and disallow tokens**.

The package manifest must keep these publish-time fields:

- `repository.url`: `git+https://github.com/AntonPieper/hell-ui.git`.
- `repository.directory`: `packages/angular`.
- `publishConfig.registry`: `https://registry.npmjs.org/`.
- `publishConfig.access`: `public`.
- `publishConfig.provenance`: `true`.

Trusted publishing works only when the npm trusted-publisher record exactly matches the GitHub owner, repository, workflow filename, and environment. Provenance is generated from OIDC for public packages published from a public repository.

## GitHub workflow contract

The single release workflow lives at `.github/workflows/npm-publish.yml` in
this repository; the filename is pinned by the npm trusted-publisher record
above. A tag push runs the publish-last graph once: release gate → GitHub
Packages → every other configured Required Registry → draft and verify the
GitHub prerelease → publish the GitHub prerelease. The `release-gate` job
calls the reusable (`workflow_call`) `.github/workflows/release-gate.yml`
workflow, and the two registry publish jobs — `publish-github-packages` and
`publish-npm` — both download that same run's `release-package` artifact.
Exactly one gate runs per tag, and both registries publish literally the same
audited tarball instead of relying on build determinism across separate runs.

- The shared release gate runs `pnpm release:dry-run` (changelog, lint,
  dead-code, architecture, coverage, library build, package lint/audit,
  API-report checks, and the Default Style Bundle size benchmark — so local
  and tagged release gates cannot drift), checks the entrypoint manifests,
  packs one audited tarball through the same `ci:pack:lib` path CI uses,
  runs every consumer fixture against that exact tarball — re-running the
  size benchmark against the audited artifact, since the `styles-aggregate`
  fixture enforces the accepted budget in
  `tools/consumer-fixtures/style-bundle-budget.json` (see
  [`style-bundle-budget.md`](./style-bundle-budget.md)) — builds the docs,
  and uploads the tarball as the `release-package` artifact.
- The gate builds on the CI Node runtime: the root `.node-version` file is
  the one source of truth that both `ci.yml` and `release-gate.yml` read
  through `setup-node`'s `node-version-file`, so the published tarball is
  built on the exact runtime CI validates and the alignment cannot drift
  through an edit to either workflow alone. The publish-only jobs run Node 24
  for the publish command itself; they never build or run package scripts.
- The release publishes `hell-ui`; the tag must match the package version.
- `publish-github-packages` has `needs: release-gate`, and `publish-npm` has
  `needs: [release-gate, publish-github-packages]`: only a fully gated
  tarball publishes, and GitHub Packages publishes before every other
  configured Required Registry.
- The npm publish job has `permissions.id-token: write` and `permissions.contents: read` so the npm registry can mint the short-lived OIDC credential for `pnpm publish`.
- Normal publish does not set `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Trusted publishing authenticates the publish command directly.
- The publish jobs run on `ubuntu-latest` with Node 24 and the pinned pnpm version so trusted publishing and provenance are available.
- The OIDC-enabled npm publish job does not install dependencies, build, or run package scripts; it only verifies the downloaded artifacts and runs `pnpm publish "$tarball" --access public --provenance --no-git-checks` for the audited package tarball.

`workflow_dispatch` is evidence-only, on the release workflow and on
`release-gate.yml` itself: a dispatched run exercises the full gate, produces
the audited `release-package` artifact, and runs the release-projection plan
against the current commit — it cannot publish a registry package, create a
draft, or publish a GitHub Release. To publish, create a protected tag whose
name matches the package version, for example `v0.2.0`.

The npmjs publish job only runs when the repository variable
`HELL_ENABLE_NPMJS_PUBLISH` is set to `true`. Until the npm trusted-publisher
record above exists, leave the variable unset so tag pushes
still produce dry-run evidence and audited tarballs without a doomed publish
attempt.

## GitHub Packages registry (owner-scope mirror)

Tagged releases also publish an owner-scope mirror of the package to the
GitHub Packages npm registry through the `publish-github-packages` job of the
same release workflow (`.github/workflows/npm-publish.yml`):

- GitHub Packages only hosts npm packages scoped to the owning GitHub
  account, so the unscoped canonical `hell-ui` name can never publish there.
  The mirror publishes as `@antonpieper/hell-ui` instead, which the default
  workflow `GITHUB_TOKEN` can write. The canonical `hell-ui` name remains
  reserved for the npmjs trusted-publishing path above.
- The mirror publish job downloads the same run's `release-package` artifact
  as the npmjs job — one gate run per tag feeds both registries, so the
  mirror never publishes with weaker checks or from a separately built
  tarball. It verifies the tag matches the package version and publishes the
  mirror to `https://npm.pkg.github.com`.
- The publish job rewrites only the audited tarball's `package.json` `name`
  and `publishConfig.registry` before republishing it, so both registries
  ship byte-identical package content aside from that metadata rewrite; the
  source manifests keep the `hell-ui` name and
  `https://registry.npmjs.org/` as required by the CI contract. Internal
  entry points, peer names, and import paths are untouched.
- Before publishing, the job uploads the rewritten mirror tarball as the
  `release-package-github-mirror` artifact with a 7-day retention, so every
  mirror publish (including a failed attempt) leaves a short-lived forensic
  record of the exact bytes outside the registry itself.
- Consumers install the mirror through an npm alias so `hell-ui` import
  paths and peer resolution keep working:

  ```jsonc
  // package.json dependencies
  "hell-ui": "npm:@antonpieper/hell-ui@<version>"
  ```

  plus an `.npmrc` entry `@antonpieper:registry=https://npm.pkg.github.com`
  and an authenticated `//npm.pkg.github.com/:_authToken`.

## GitHub Release projection (publish-last)

The GitHub Release for a tag is a Release Projection of the tagged Released
Version Notes (`.changes/<version>.md`), never a separately authored copy.
The `draft-github-release` and `publish-github-release` jobs of the release
workflow drive it through the fixture-tested policy in
[`tools/release-projection.mjs`](../../tools/release-projection.mjs), which
`pnpm test:changelog` proves from captured-metadata fixtures plus a static
workflow contract — no test publishes anything.

- **Required Registry barrier.** The draft job runs after every registry job
  (`!cancelled()`) and first evaluates the actual job results: a skipped,
  cancelled, or failed Required Registry fails the barrier before any GitHub
  release is touched. GitHub Packages is always required; npmjs joins the
  barrier exactly when `HELL_ENABLE_NPMJS_PUBLISH` is `true`, and a disabled
  optional registry never blocks. Future private registries join the same
  barrier by being listed as required entries in the draft job.
- **Exact projection.** The draft is created with the tag name as its title
  and the exact tagged `.changes/<version>.md` bytes as its body. Draft
  verification then checks the tag, title, tagged commit, byte-for-byte body,
  prerelease classification, absence of custom assets, and that the
  repository's native immutable-releases policy is enabled. Every `0.x.y`
  version and every SemVer prerelease suffix is classified as a GitHub
  prerelease until an explicit stable Release Stage Promotion.
- **Publish last.** `publish-github-release` runs only after the draft job —
  and therefore the barrier and every draft verification — succeeded. It
  re-verifies the draft, publishes it, and verifies the published release is
  exact and immutable. No package tarball, checksum, or other custom asset is
  ever attached; registries remain the package-distribution surface, and no
  changelog copy is added to npm packages or the docs site.
- **Idempotent reruns.** A rerun adopts an existing draft or published
  release only when it matches the expected projection exactly; any mismatch
  fails visibly, and automation never edits a release to make verification
  pass. The tagged Released Version Notes stay authoritative — if they are
  wrong, publish a corrective patch release instead of editing the GitHub
  Release.

The repository's native immutable-releases setting must be enabled (draft
verification requires proof via `GET /repos/{owner}/{repo}/immutable-releases`)
so published release tags and assets are locked and attested.

## Release steps

1. Run `pnpm release:prepare [version]` to assemble the pending Change
   Fragments into the version candidate — it updates the
   `packages/angular/package.json` version, creates the Released Version
   Notes record, and regenerates `CHANGELOG.md` (see
   [`release-preparation.md`](./release-preparation.md)). Land the candidate
   through a release-preparation pull request.
2. Run `pnpm release:dry-run` locally, or rely on the release workflow's gate job. API report membership is derived from the entrypoint manifest in [`tools/check-api-reports.mjs`](../../tools/check-api-reports.mjs); all consumer fixtures run in the gate.
3. Create and push a protected tag: `git tag v<version>` then `git push origin v<version>`.
4. Approve the `npm-publish` GitHub environment deployment.
5. After publish, verify the npm package page shows provenance and that the single release run contains both the `release-package` artifact and the `release-package-github-mirror` artifact.
6. Verify the run ended with the published GitHub prerelease whose body is
   the exact tagged `.changes/<version>.md` — the workflow drafts, verifies,
   and publishes it last, after every Required Registry succeeded (see the
   projection section above).

If future private install dependencies are introduced, use a read-only install token only for the install step. Do not use a publish token for the normal release path.
