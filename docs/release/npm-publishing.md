# npm trusted publishing

Hell UI publishes `@hell-ui/angular` from the public `AntonPieper/hell-ui` GitHub repository with npm trusted publishing. Normal releases must not use a long-lived publish token.

## npm package settings

Configure these settings on npm before the first automated publish:

1. Open the `@hell-ui/angular` package on npm and add a trusted publisher.
2. Provider: GitHub Actions.
3. Organization or user: `AntonPieper`.
4. Repository: `hell-ui`.
5. Workflow filename: `npm-publish.yml`.
6. Environment name: `npm-publish`.
7. Allowed action: `npm publish`.
8. Under package settings → publishing access, choose **Require two-factor authentication and disallow tokens**.

The package manifest must keep these publish-time fields:

- `repository.url`: `git+https://github.com/AntonPieper/hell-ui.git`.
- `repository.directory`: `projects/hell`.
- `publishConfig.registry`: `https://registry.npmjs.org/`.
- `publishConfig.access`: `public`.
- `publishConfig.provenance`: `true`.

Trusted publishing works only when the npm trusted-publisher record exactly matches the GitHub owner, repository, workflow filename, and environment. Provenance is generated from OIDC for public packages published from a public repository.

## GitHub workflow contract

The release workflow lives at `.github/workflows/npm-publish.yml` in this repository.

- Tag pushes matching `v*.*.*` run the full release dry-run first.
- The dry-run job uploads `test-results/release-evidence/` as the `release-dry-run-evidence` artifact.
- A separate no-OIDC `build-package` job rebuilds, pack-audits, and uploads one package tarball as `release-package`.
- The publish job has `needs: [release-dry-run, build-package]`, downloads both artifacts, and refuses to publish without a passing summary exit in the dry-run log.
- The publish job has `permissions.id-token: write` and `permissions.contents: read` so npm can mint the short-lived OIDC credential at `npm publish` time.
- Normal publish does not set `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Trusted publishing authenticates the publish command directly.
- The job runs on `ubuntu-latest` with Node 24 so npm is new enough for trusted publishing and provenance.
- The OIDC-enabled publish job does not install dependencies, build, or run package scripts; it only verifies the downloaded artifacts and runs `npm publish "$HELL_RELEASE_TARBALL" --access public --provenance`.

`workflow_dispatch` is evidence-only. To publish, create a protected tag whose name matches the package version, for example `v0.1.0`.

## Release steps

1. Update `projects/hell/package.json` version in a release-prep slice.
2. Run `pnpm release:dry-run -- --full` locally or wait for the release workflow dry-run evidence.
3. Create and push a protected tag: `git tag v<version>` then `git push origin v<version>`.
4. Approve the `npm-publish` GitHub environment deployment.
5. After publish, verify the npm package page shows provenance and that the GitHub Actions run contains both `release-dry-run-evidence` and `release-package` artifacts.

If future private install dependencies are introduced, use a read-only install token only for the install step. Do not use a publish token for the normal release path.
