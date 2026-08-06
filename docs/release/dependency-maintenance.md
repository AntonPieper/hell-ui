# Dependency maintenance

Hell UI carries **no dependency automation** by design. Dependabot and Renovate
were both dropped; this document is where their package rules went, and the
ritual below replaces them.

Nothing bumps a dependency here except a person running the sweep.

## The ritual

Run **monthly, and again before every release**:

```bash
pnpm outdated -r
pnpm audit
```

Then work the results in this order — the order matters, because each step
changes what the next one sees:

1. **Move direct dependencies** to the latest version that works (see
   [Choosing a version](#choosing-a-version)).
2. **Refresh transitive resolutions** inside their existing ranges:
   ```bash
   pnpm update -r --depth Infinity
   ```
   A large share of advisories are stale lockfile entries, not real ceilings —
   the range already admits the patched version and nothing had re-resolved it.
   Run `pnpm install --lockfile-only` twice and confirm the second run is a
   no-op; the first pass can leave stale entries behind.
3. **Collapse duplicates** with `pnpm dedupe`, then check for packages resolved
   at two versions. A duplicate is usually an auto-installed peer that a root
   declaration would satisfy from the copy already in the tree.
4. **Re-derive every override** (see [Overrides](#overrides)).
5. **Re-run the ladder** (see [Validation](#validation)).

### Choosing a version

**Latest means the latest version that actually works.** A version that needs
an override to install or build does not count as working — step down to the
newest one that does, and record why in a comment next to the pin.

Prefer a narrower range over an override. Capping a direct dependency below a
broken release is a version choice; an override rewrites resolution for the
whole tree, including places you did not inspect.

Peer ranges in `packages/angular/package.json` move only when required to admit
the new version. Raising a floor that already admits latest is a breaking
change for adopters and buys nothing.

## Package group rules

### The Angular toolchain moves as one group

`@angular/*`, `@angular/cli`, `@angular/build`, `@angular/compiler-cli` and
`ng-packagr` are bumped together or not at all. A partial bump must never land.

### ng-primitives bumps are approval-gated

`ng-primitives` is an exact-pinned, version-bound seam. Every bump needs
maintainer approval **and** these probes before merge:

1. `docs/adr/ng-primitives-state-adapter.md` — rerun the ADR recheck against the
   upgraded typings before changing the pin.
2. **Breadcrumb ellipsis role/aria-hidden** — `HellBreadcrumbEllipsis` in
   `packages/angular/breadcrumbs/breadcrumbs.ts`, a local override of an
   upstream defect. Re-probe by deleting it and running its guard tests, not by
   reading upstream's changelog — delete it once upstream has fixed it.
3. **Attribute-ownership effects** — every `hellOwnsNgpAttribute` /
   `hellOwnsControlAriaInvalid` call site (see
   `packages/angular/internal/ng-primitives/ngp-attr-ownership.ts`). These are
   deliberate contract differences, not defect bridges: they survive upgrades,
   but each one reads the same signals its upstream writer reads, so verify
   those triggers still hold on the new version.

Retired probes, for the record: the toggle-group mode-ARIA override
(`toggleGroupItemModeAria()`) was deleted when 0.128 fixed upstream issue #813,
and pagination keyboard activation turned out not to be upstream-retirable at
all — `hellPageLink` composes no upstream pagination primitives, so
`paginationKeyboardActivation` is Hell's own implementation and stays.

Three pins move together and are enforced by
`tools/architecture/check-architecture.mjs`: the catalog entry, the
`ng-primitives` peer in `packages/angular/package.json`, and the adapter version
constant.

## Overrides

Every entry under `overrides:` and `packageExtensions:` in
`pnpm-workspace.yaml` is debt. The sweep's job is to retire it.

**Test each one by deleting it and re-resolving.** If the tree is unchanged, the
override is dead — a pin that no longer moves anything is not protection, it is
camouflage that hides whether the real dependency ever moved.

An override may stay only if all of these hold:

- removing it provably changes the resolved tree or fails a check;
- the comment above it names what keeps it alive;
- the comment names the condition that will retire it.

Watch for two failure modes seen in practice:

- **Open-ended replacements overshoot.** `"fast-uri": ">=3.1.2"` resolved to the
  newest 4.x, which carried advisories the natural 3.x resolution did not. The
  override was the cause of the finding it existed to prevent.
- **Exact pins go stale downward.** `undici: 7.28.0` held the tree at a version
  that later became the vulnerable one.

### Accepting an advisory

Accept an advisory only when no direct-dependency update and no lockfile
refresh can clear it — that is, when an upstream package pins the vulnerable
dependency in a way you cannot move without an override. Record it below rather
than silencing it with a pin.

## Standing exceptions

Re-probe every entry here on each sweep; delete the ones that have retired.

| Exception | Why it exists | Retires when |
|---|---|---|
| `packageExtensions: ng-primitives` | `ng-primitives/dialog` imports `@angular/router` without declaring the peer — still true at 0.128.8. | `ng-primitives` declares the peer. |
| Angular toolchain held at `~22.0.x` | Every stable `@angular/cli` 22.1.x depends on `listr2` 10.2.2 while its bundled `@listr2/prompt-adapter-inquirer` 4.2.4 peer-requires `listr2` 10.2.1. No adapter release pairs with 10.2.2, so the tree is unsatisfiable under strict peers. | `@angular/cli` ships a self-consistent `listr2` pair (22.1.4+ or 22.2). |
| Accepted: `@hono/node-server` <2.0.5 (moderate) | Reached only via `@angular/cli` → `@modelcontextprotocol/sdk`, which the CLI pins to `1.29.0` exactly; that SDK caps the adapter at `^1.19.9`. SDK 1.30.0 allows the patched 2.0.5, but the CLI's exact pin blocks it. The defect is a Windows-only path traversal in `serve-static` inside `ng mcp`, a local dev tool — not in the published package or any CI path. | `@angular/cli` bumps its `@modelcontextprotocol/sdk` pin to 1.30.0+. |

### Deferred upgrades

| Package | Held at | Why |
|---|---|---|
| `typescript` | `~6.0.3` (7.0.2 available) | TypeScript 7 is the native-port major and its own migration, not a sweep item. |

These are **range caps, not overrides** — they express "this is the newest
version that works" at the point where the dependency is declared, which is the
cheaper and more visible mechanism. Reach for a cap before an override.

### A trap this repo has already hit twice

A dependency can be constrained by something that is not in any manifest:

- **Playwright** is pinned by two prebuilt container images — the GitHub E2E job
  image and GitLab's `E2E_IMAGE_TAG`/`E2E_PLAYWRIGHT_VERSION`. All three move in
  one change or none; see `tools/ci/e2e-image/README.md`. Keep the range a `~`:
  a `^` let a lock refresh cross the coupling silently, installing a browser
  revision neither image carried, and every E2E test died at
  `browserType.launch`.
- **Changie** changes behavior based on the *environment*, not the platform:
  1.25.2 stops prompting when it detects CI. That made two fragment fixtures
  fail in CI while passing locally. The fix was to clear the CI markers for the
  fixture's own child process (`interactiveChangieEnv()` in
  `tools/release/change-fragment-fixtures.mjs`) — those fixtures model a
  contributor at a workstation and always supply the answer.

When a bump is green locally but red in CI, suspect an environment check before
suspecting the platform. Re-run the failing command with `CI=true` locally; it
reproduced both of these immediately.

## Validation

A sweep is not done until the full ladder passes:

```bash
pnpm lint
pnpm test:unit
pnpm test:tools
pnpm test:dead-code
pnpm test:architecture
pnpm ci:check:entrypoints
pnpm test:api-report
pnpm test:package-pack
pnpm test:consumer-fixtures
pnpm release:dry-run
```

An Angular bump can move api-report surfaces; regenerate with
`pnpm api-report:update` and **review the diff** rather than accepting it.
E2E runs in CI.

### What consumer fixtures do and do not prove

`pnpm test:consumer-fixtures` installs a packed `file:` tarball into a scratch
workspace. That workspace inherits this repo's `overrides` but **not** its
`packageExtensions`, and it resolves the package from a tarball rather than
from published metadata.

So a green fixture run does not prove adopters are fine. It cannot see:

- **published-metadata defects** — anything the registry serves differently from
  the tarball, such as dropped `peerDependenciesMeta` optional flags;
- **missing-override defects** — anything our own `overrides:` repairs locally,
  because adopters do not inherit them. The retired tsquery override was exactly
  this case: fixtures passed while adopters on TypeScript 6 with strict peers
  could not install, until ng-primitives 0.128.8 moved its own tsquery pin.

When a fixture only passes because of a local workaround, say so in the ticket.
Do not treat the green run as evidence about adopters.
