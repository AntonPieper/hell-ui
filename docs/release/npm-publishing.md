# npm trusted publishing

Hell UI publishes `@hell-ui/angular` from the public `AntonPieper/hell-ui`
GitHub repository with npm trusted publishing. Normal releases must not use a
long-lived publish token.

## npm package settings

Configure these settings on npm for `@hell-ui/angular` before the first
automated publish:

1. Open the `@hell-ui/angular` package on npm and add a trusted publisher.
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

The release workflow lives at `.github/workflows/npm-publish.yml` in this repository.

- Tag pushes matching `v*.*.*` run `pnpm release:dry-run` first, then the
  consumer fixtures and docs build. The shared dry-run owns changelog,
  lint, dead-code, architecture, coverage, library build, package lint/audit,
  and API-report checks so local and tagged release gates cannot drift.
- The release publishes `@hell-ui/angular`; the tag must match the package version.
- A separate no-OIDC `build-package` job rebuilds, pack-audits, and uploads the package tarball as `release-package`.
- The publish job has `needs: [release-gate, build-package]`, so it only runs when every gate passed.
- The publish job has `permissions.id-token: write` and `permissions.contents: read` so the npm registry can mint the short-lived OIDC credential for `pnpm publish`.
- Normal publish does not set `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Trusted publishing authenticates the publish command directly.
- The job runs on `ubuntu-latest` with Node 24 and the pinned pnpm version so trusted publishing and provenance are available.
- The OIDC-enabled publish job does not install dependencies, build, or run package scripts; it only verifies the downloaded artifacts and runs `pnpm publish "$tarball" --access public --provenance --no-git-checks` for the audited package tarball.

`workflow_dispatch` is evidence-only. To publish, create a protected tag whose name matches the package version, for example `v0.2.0`.

The npmjs publish job only runs when the repository variable
`HELL_ENABLE_NPMJS_PUBLISH` is set to `true`. Until the npm trusted-publisher
record above exists, leave the variable unset so tag pushes
still produce dry-run evidence and audited tarballs without a doomed publish
attempt.

## GitHub Packages registry (owner-scope mirror)

Tagged releases also publish an owner-scope mirror of the package to the
GitHub Packages npm registry through
`.github/workflows/github-packages-publish.yml`:

- GitHub Packages scopes npm packages to the owning GitHub account, and the
  `@hell-ui` GitHub username belongs to an unrelated account, so the canonical
  `@hell-ui/*` names can never publish there from this repository. The mirror
  publishes as `@antonpieper/hell-ui-angular` instead, which the default
  workflow `GITHUB_TOKEN` can write. The canonical `@hell-ui/*` names remain
  reserved for the npmjs trusted-publishing path above.
- Tag pushes matching `v*.*.*` rebuild the package, re-run the pack audit,
  verify the tag matches the package version, and publish the mirror to
  `https://npm.pkg.github.com`.
- The pack step rewrites the built `package.json`'s `name` and
  `publishConfig.registry` at publish time only; the source manifests keep the
  `@hell-ui/*` names and `https://registry.npmjs.org/` as required by the CI
  contract. Internal entry points, peer names, and import paths are untouched.
- Consumers install the mirror through npm aliases so `@hell-ui/*` import
  paths and peer resolution keep working:

  ```jsonc
  // package.json dependencies
  "@hell-ui/angular": "npm:@antonpieper/hell-ui-angular@0.2.0"
  ```

  plus an `.npmrc` entry `@antonpieper:registry=https://npm.pkg.github.com`
  and an authenticated `//npm.pkg.github.com/:_authToken`.

## Release steps

1. Update the `packages/angular/package.json` version in a release-prep change.
2. Run `pnpm release:dry-run` locally, or rely on the release workflow's gate job. API report membership is derived from the entrypoint manifest in [`tools/check-api-reports.mjs`](../../tools/check-api-reports.mjs); all consumer fixtures run in the gate.
3. Create and push a protected tag: `git tag v<version>` then `git push origin v<version>`.
4. Approve the `npm-publish` GitHub environment deployment.
5. After publish, verify the npm package page shows provenance and that the GitHub Actions run contains the `release-package` artifact.

If future private install dependencies are introduced, use a read-only install token only for the install step. Do not use a publish token for the normal release path.
