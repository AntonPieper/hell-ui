# Release immutability and projection drift

The GitHub Release for a version is a Release Projection: a byte-for-byte
publication of the tagged Released Version Notes record
`.changes/<version>.md`, never a separately authored source. The decision
record is `docs/adr/0003-changie-release-notes.md`, and the projection itself
is decided by [`tools/release-projection.mjs`](../../tools/release-projection.mjs)
— the same module the release workflow drafts from
([`npm-publishing.md`](./npm-publishing.md)). This page covers the two
mechanisms that keep a published projection trustworthy — the native
immutable-release policy and the read-only drift check — and what a
maintainer may do when they fire.

## What GitHub immutability does and does not protect

GitHub's native immutable-release policy must be enabled for this repository
(repository settings → immutable releases). Once a release is published
under the policy:

- its **tag** can no longer be deleted or moved;
- its **assets** can no longer be added, modified, or deleted; and
- GitHub produces a signed **attestation** for the release.

The policy does **not** lock the release **title or note text** — GitHub
keeps those editable forever. The tagged Released Version Notes record
therefore remains the authoritative source even after publication, and the
drift check below watches the mutable projection against it.

Verify the policy read-only at any time:

```bash
gh api repos/AntonPieper/hell-ui/immutable-releases
# expected: {"enabled":true,...}
```

## Publication refuses a disabled policy

The release workflow (`.github/workflows/npm-publish.yml`) runs a
`release-immutability` gate on every real tag push. It captures the
repository's immutable-releases policy and decides through
`node tools/release-projection.mjs policy`, the same seam draft verification
uses: only `enabled: true` opens the gate, and disabled, missing, or
unreadable evidence refuses. Both registry publish jobs require the gate, so
no package publishes — and no Release Projection follows — while release tags
and assets would remain unlocked. Draft verification proves the policy a
second time before the release is published.

## Read-only drift detection

`.github/workflows/release-drift.yml` runs whenever a published release is
edited. It checks out the release tag, re-reads the release and the commit
its tag resolves to through the API, and compares:

- the release **tag** (a `v<version>` SemVer tag),
- the **title** (`v<version>`),
- the **tagged commit** (the tag must still resolve to the commit the record
  was read from),
- the **target** (`target_commitish`): the draft job posts the tagged commit
  SHA and GitHub returns what it was sent, so a release naming a *different*
  commit is drift. A target that is a branch name rather than a commit —
  which releases created by hand, or before this tooling existed, carry — is
  tolerated so those releases do not report drift forever; the checks above
  still hold them to the tagged record byte-for-byte,
- the **prerelease classification** (every `0.x.y` version and every SemVer
  prerelease suffix stays a GitHub prerelease until an explicit stable
  Release Stage Promotion),
- the **body bytes** against `.changes/<version>.md` at the tag (the record's
  exact bytes, as the draft job publishes them), and
- the **custom assets** (there must be none; registries are the
  package-distribution surface)

and requires the release to be published and immutable. This is literally the
published-phase verification the release workflow runs, applied to a live
release, so an edited projection and a freshly drafted one are compared
against the same bytes by construction. An exact release passes; any mismatch
fails the run with the first differing line as visible evidence.

Detection is strictly read-only. The workflow holds `contents: read` only, so
it cannot edit release metadata, notes, tags, or assets, and it holds no
permission capable of automatic repair. A rerun of the drift check — or any
unrelated release edit — can never publish a registry package or create
another release: registry publication is triggered only by tag pushes, never
by release events. `pnpm test:changelog` proves these workflow contracts
statically ([`tools/check-release-workflow.mjs`](../../tools/check-release-workflow.mjs))
and drives the drift policy through captured fixtures
([`tools/release-projection-fixtures.mjs`](../../tools/release-projection-fixtures.mjs)).

**Coverage limit.** GitHub runs a workflow file as it exists at the commit the
release tag points at, so the drift check only covers releases whose tag
carries this tooling. A release created against a tag older than
`release-drift.yml` gets no drift run at all; verify such a release by hand
against `.changes/<version>.md` at its tag.

## Recovering from drift

Automation never rewrites a published release. When the drift check fails,
a maintainer decides between exactly two recoveries:

### The projection drifted accidentally

If the tagged Released Version Notes are correct and someone edited the
GitHub release, restore the projection to the **exact tagged bytes** — no
rewording, no additions. Write the record straight to a file and hand that
file to `gh`, so the restored body is the record byte-for-byte, trailing
newline included, exactly as the draft job publishes it:

```bash
version=0.3.0   # the drifted release
git fetch origin "refs/tags/v${version}:refs/tags/v${version}"
git show "v${version}:.changes/${version}.md" > "/tmp/notes-${version}.md"
gh release edit "v${version}" --title "v${version}" --notes-file "/tmp/notes-${version}.md"
```

The edit fires the drift check again, which now proves the restoration is
exact.

### The tagged notes themselves are wrong

If the error lives in the tagged record, the locked history is not revised:
leave the release matching its tagged bytes and publish a **corrective patch
release** — author the correcting Change Fragments, run
`pnpm release:prepare`, and release as usual (see
[`release-preparation.md`](./release-preparation.md)). Never hand-edit a
published projection into saying something its tagged source does not.
