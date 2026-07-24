# Release Preparation

Release Preparation is the maintainer transaction that turns all reviewed
pending Change Fragments into one version candidate. The decision record is
`docs/adr/0003-changie-release-notes.md`; the fragment authoring guide is
[`change-fragments.md`](./change-fragments.md).

## Command

```bash
pnpm release:prepare            # automatic version selection
pnpm release:prepare 0.3.0-beta.1   # explicit version
```

One run performs the whole artifact transaction:

1. consumes every pending fragment under `.changes/unreleased/` into exactly
   one new Released Version Notes record `.changes/<version>.md`;
2. updates the published package manifest
   (`packages/angular/package.json`) to exactly the same version;
3. regenerates the root `CHANGELOG.md` from the committed Changie records;
   and
4. proves the narrow changelog contract, including that regenerating the
   aggregate again reproduces it byte-for-byte.

It never commits, tags, pushes, or publishes. Changie's `batch` and `merge`
primitives stay private behind this command; do not call them directly.

## Version selection

Automatic selection is defined for plain pre-1.0 versions and follows the
accepted compatibility policy (see [`semver-policy.md`](./semver-policy.md)):

- any pending `Breaking` or `Added` fragment selects the next minor version;
- only `Changed`, `Fixed`, or `Security` fragments select the next patch.

Automatic selection never infers a Release Stage Promotion: the major digit is
never bumped, so `1.0.0` cannot be selected automatically. Pass an explicit
version for prereleases (`0.3.0-beta.1`), for releases after a prerelease, and
for deliberate release-management decisions such as the `1.0.0` promotion. An
explicit version must be valid SemVer and advance the latest released version.

## The allowed candidate

A Release Preparation candidate is valid only when its changes are limited to:

- the published package manifest version;
- one new Released Version Notes record;
- the consumed pending fragments; and
- the generated `CHANGELOG.md`.

The transaction enforces this before and after generating: it refuses to start
over a working tree with other changes, and it fails when the finished
candidate contains anything else. Source, documentation, configuration,
lockfile, migration-guard, and cleanup changes must land first in
independently classified pull requests.

## Failure behavior

A failed run never commits anything and never silently rolls back partially
generated output — a consumed fragment set, a batched record, or an updated
manifest stays in place for inspection. Review `git status`, then discard the
partial candidate explicitly with `git restore` (and delete the new record
file) before retrying.

## Review evidence and next steps

Each following step stays an explicit maintainer action; the preparation
command automates none of them.

1. Review the candidate: the new `.changes/<version>.md` must read as concise
   consumer outcomes, newest release first in `CHANGELOG.md`.
2. Run `pnpm release:dry-run` for release evidence. It validates the prepared
   candidate — including the changelog contract — without publishing.
3. Commit the candidate on a `release-preparation` pull request that contains
   only the allowed artifact set above.
4. After merge, tag the release commit (`git tag v<version>`, then
   `git push origin v<version>`) to trigger the gated publication workflow —
   see [`npm-publishing.md`](./npm-publishing.md).
