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
2. **Pagination keyboard activation** — `paginationKeyboardActivation` in
   `packages/angular/pagination/pagination.ts`.
3. **Toggle-group mode ARIA** — `toggleGroupItemModeAria()` in
   `packages/angular/toggle/toggle.ts`.
4. **Breadcrumb ellipsis role/aria-hidden** — `HellBreadcrumbEllipsis` in
   `packages/angular/breadcrumbs/breadcrumbs.ts`.

Each of 2–4 is a local override of an upstream defect, carried with a doc
comment naming the upstream issue. Re-probe all three on **every** upgrade and
delete the ones upstream has fixed — that deletion is the point of the bump.

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
| `overrides: @phenomnomnominal/tsquery` | `ng-primitives` (through 0.128.7) pins tsquery `6.1.3`, whose peer range `^3 \|\| ^4 \|\| ^5` excludes this repo's TypeScript 6. Without it `pnpm test:consumer-fixtures` fails, because fixtures install with `--strict-peer-dependencies`. | `ng-primitives` moves its tsquery dependency to `6.2.0`, whose peer is `>3.0.0`. |
| `packageExtensions: ng-primitives` | `ng-primitives/dialog` imports `@angular/router` without declaring the peer — still true at 0.128.7. | `ng-primitives` declares the peer. |
| Angular toolchain held at `~22.0.x` | Every stable `@angular/cli` 22.1.x depends on `listr2` 10.2.2 while its bundled `@listr2/prompt-adapter-inquirer` 4.2.4 peer-requires `listr2` 10.2.1. No adapter release pairs with 10.2.2, so the tree is unsatisfiable under strict peers. | `@angular/cli` ships a self-consistent `listr2` pair (22.1.4+ or 22.2). |
| Accepted: `@hono/node-server` <2.0.5 (moderate) | Reached only via `@angular/cli` → `@modelcontextprotocol/sdk`, which the CLI pins to `1.29.0` exactly; that SDK caps the adapter at `^1.19.9`. SDK 1.30.0 allows the patched 2.0.5, but the CLI's exact pin blocks it. The defect is a Windows-only path traversal in `serve-static` inside `ng mcp`, a local dev tool — not in the published package or any CI path. | `@angular/cli` bumps its `@modelcontextprotocol/sdk` pin to 1.30.0+. |

### Deferred upgrades

| Package | Held at | Why |
|---|---|---|
| `typescript` | `~6.0.3` (7.0.2 available) | TypeScript 7 is the native-port major and its own migration, not a sweep item. |
| `@tanstack/angular-table` | `^8.21.4` (9.0.0 available) | v9 is a feature-registration rewrite, and migrating it is a public-API design project rather than a bump. See below. |
| `@playwright/test` | `~1.59.1` (1.62.1 available) | The version is coupled to two prebuilt browser images: the GitHub E2E job runs `mcr.microsoft.com/playwright:v1.59.1-noble` and GitLab builds `e2e:v1.59.1-node22-r2`. Resolving past 1.59.x installs a browser revision neither image carries and every test fails at `browserType.launch`. Bumping means moving both images in the same change — see `tools/ci/e2e-image/README.md`. Note the range must be `~`, not `^`: a caret lets a lock refresh drift across the coupling silently. |

These are **range caps, not overrides** — they express "this is the newest
version that works" at the point where the dependency is declared, which is the
cheaper and more visible mechanism. Reach for a cap before an override.

### A trap this repo has already hit twice

A dependency can be constrained by something that is not in any manifest:

- **Playwright** is pinned by two prebuilt container images. A `^` range let a
  lock refresh cross that coupling silently, and every E2E test died at
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

### TanStack Table v9 — what blocks it

Measured against 9.0.0 on 2026-08-05. The package ships its own migration
reference at `@tanstack/angular-table/skills/migrate-v8-to-v9/SKILL.md`; read it
first, and inspect `dist/types/` rather than reconstructing v9 from v8 memory.

The mechanical part is small — 59 type errors, all in
`packages/angular/table-tanstack/table-tanstack.ts`, plus physical-to-logical
pinning renames (`'left'`/`'right'` become `'start'`/`'end'`). What makes it a
project is three adopter-facing decisions it forces:

1. **Hell's public generics change shape.** v9 puts `TFeatures` first on every
   type: `Table<TFeatures, TData>`, `Row<TFeatures, TData>`,
   `Cell<TFeatures, TData, TValue>`. Hell's shell classes are generic in `TData`
   alone today, so every one of them either grows a parameter or pins one.
2. **The permissive escape hatch is closed here.** TanStack special-cases
   `TFeatures = any` to expose every feature API — exactly v8's bundled-feature
   behaviour — but `@typescript-eslint/no-explicit-any` is an error in this repo
   and `packages/angular` has no explicit `any` anywhere. So Hell has to name the
   feature set its shell actually requires (it reads pinning, sizing, sorting,
   filtering and pagination APIs), which in turn dictates what adopters must
   register.
3. **It likely adds a published peer dependency.** `@tanstack/angular-table` v9
   re-exports only `rowPaginationFeature`. Registering pinning, sizing or sorting
   means importing from `@tanstack/table-core`, which is not currently a Hell
   dependency or peer at all.

Scope beyond the library: 9 files construct tables (`createAngularTable` →
`injectTable`, `getCoreRowModel()` dropped, features registered) across the docs
app and both consumer fixtures, plus api-report regeneration, the table specs,
e2e pinning assertions, and Breaking fragments for the peer range and the
generic change.

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
  because adopters do not inherit them. The tsquery entry above is exactly this
  case: fixtures pass, adopters on TypeScript 6 with strict peers do not.

When a fixture only passes because of a local workaround, say so in the ticket.
Do not treat the green run as evidence about adopters.
