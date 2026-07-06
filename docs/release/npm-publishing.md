# npm trusted publishing

Hell UI publishes `@hell-ui/angular` and the split `@hell-ui/pdf-viewer`
package from the public `AntonPieper/hell-ui` GitHub repository with npm
trusted publishing. Normal releases must not use a long-lived publish token.

## npm package settings

Configure these settings on npm for both `@hell-ui/angular` and
`@hell-ui/pdf-viewer` before the first automated publish:

1. Open the `@hell-ui/angular` package on npm and add a trusted publisher.
2. Provider: GitHub Actions.
3. Organization or user: `AntonPieper`.
4. Repository: `hell-ui`.
5. Workflow filename: `npm-publish.yml`.
6. Environment name: `npm-publish`.
7. Publish command: `pnpm publish`.
8. Under package settings → publishing access, choose **Require two-factor authentication and disallow tokens**.

Both package manifests must keep these publish-time fields:

- `repository.url`: `git+https://github.com/AntonPieper/hell-ui.git`.
- `repository.directory`: the matching source package directory
  (`packages/angular` or `packages/pdf-viewer`).
- `publishConfig.registry`: `https://registry.npmjs.org/`.
- `publishConfig.access`: `public`.
- `publishConfig.provenance`: `true`.

Trusted publishing works only when the npm trusted-publisher record exactly matches the GitHub owner, repository, workflow filename, and environment. Provenance is generated from OIDC for public packages published from a public repository.

## GitHub workflow contract

The release workflow lives at `.github/workflows/npm-publish.yml` in this repository.

- Tag pushes matching `v*.*.*` run the full release dry-run first.
- The release publishes both `@hell-ui/angular` and `@hell-ui/pdf-viewer`; both packages must share the tagged version.
- The dry-run job uploads `test-results/release-evidence/` as the `release-dry-run-evidence` artifact.
- A separate no-OIDC `build-package` job rebuilds, pack-audits, and uploads both package tarballs as `release-package`.
- The publish job has `needs: [release-dry-run, build-package]`, downloads both artifacts, and refuses to publish without a passing summary exit in the dry-run log.
- The publish job has `permissions.id-token: write` and `permissions.contents: read` so the npm registry can mint the short-lived OIDC credential for `pnpm publish`.
- Normal publish does not set `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Trusted publishing authenticates the publish command directly.
- The job runs on `ubuntu-latest` with Node 24 and the pinned pnpm version so trusted publishing and provenance are available.
- The OIDC-enabled publish job does not install dependencies, build, or run package scripts; it only verifies the downloaded artifacts and runs `pnpm publish "$tarball" --access public --provenance --no-git-checks` for each audited package tarball.

`workflow_dispatch` is evidence-only. To publish, create a protected tag whose name matches the package version, for example `v0.2.0`.

The npmjs publish job only runs when the repository variable
`HELL_ENABLE_NPMJS_PUBLISH` is set to `true`. Until the npm trusted-publisher
records above exist for both packages, leave the variable unset so tag pushes
still produce dry-run evidence and audited tarballs without a doomed publish
attempt.

## GitHub Packages registry (owner-scope mirror)

Tagged releases also publish an owner-scope mirror of both packages to the
GitHub Packages npm registry through
`.github/workflows/github-packages-publish.yml`:

- GitHub Packages scopes npm packages to the owning GitHub account, and the
  `@hell-ui` GitHub username belongs to an unrelated account, so the canonical
  `@hell-ui/*` names can never publish there from this repository. The mirror
  publishes as `@antonpieper/hell-ui-angular` and
  `@antonpieper/hell-ui-pdf-viewer` instead, which the default workflow
  `GITHUB_TOKEN` can write. The canonical `@hell-ui/*` names remain reserved
  for the npmjs trusted-publishing path above.
- Tag pushes matching `v*.*.*` rebuild both packages, re-run the pack audit,
  verify the tag matches both package versions, and publish the mirror to
  `https://npm.pkg.github.com`.
- The pack step rewrites each built `package.json`'s `name` and
  `publishConfig.registry` at publish time only; the source manifests keep the
  `@hell-ui/*` names and `https://registry.npmjs.org/` as required by the CI
  contract. Internal entry points, peer names, and import paths are untouched.
- Consumers install the mirror through npm aliases so `@hell-ui/*` import
  paths and peer resolution keep working:

  ```jsonc
  // package.json dependencies
  "@hell-ui/angular": "npm:@antonpieper/hell-ui-angular@0.2.0",
  "@hell-ui/pdf-viewer": "npm:@antonpieper/hell-ui-pdf-viewer@0.2.0"
  ```

  plus an `.npmrc` entry `@antonpieper:registry=https://npm.pkg.github.com`
  and an authenticated `//npm.pkg.github.com/:_authToken`.

## Release steps

1. Update `packages/angular/package.json` and `packages/pdf-viewer/package.json` versions in a release-prep change.
2. Run `pnpm release:dry-run -- --full` locally or wait for the release workflow dry-run evidence. The required scenario and API report membership is defined in [`docs/release/release-evidence-policy.md`](release-evidence-policy.md).
3. Create and push a protected tag: `git tag v<version>` then `git push origin v<version>`.
4. Approve the `npm-publish` GitHub environment deployment.
5. After publish, verify both npm package pages show provenance and that the GitHub Actions run contains both `release-dry-run-evidence` and `release-package` artifacts.

If future private install dependencies are introduced, use a read-only install token only for the install step. Do not use a publish token for the normal release path.
