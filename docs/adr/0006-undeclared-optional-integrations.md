# ADR: Optional integrations are undeclared, not optional peers

- Status: Accepted 2026-08-10
- Date: 2026-08-10

## Context

Since the heavy-feature boundary ADR, every package a feature entry point
needs at the consumer's side — Tailwind, the Router, ng-icons, the TanStack
table engine and virtualizer, CodeMirror, pdf.js — was declared a peer
dependency with `peerDependenciesMeta.<name>.optional: true`. The intent:
consumers who use the entry point get version-range checking; consumers who
don't are not asked for anything.

That contract only works if installers can see the optional flags, and they
resolve peers from **registry metadata**, not from the downloaded tarball.
Registries that serve the npm "abbreviated version object" rebuild it from a
field allowlist and a typed dependency table with no column for optionality —
GitLab's package registry (all current editions) drops `peerDependenciesMeta`
entirely, and GitHub's npm registry has the same defect (pnpm/pnpm#9814).
Measured on a published 0.3.0: 19 peers served, 0 optional. The consequences
land on every adopter posture:

- strict peers (`autoInstallPeers: false`, `strictPeerDependencies: true`):
  twelve `missing peer` errors for packages the consumer never uses —
  install fails outright;
- installer defaults (`autoInstallPeers: true`): all twelve peers and their
  transitive closure are silently installed — 78 packages where 23 were
  asked for; a consumer that wants a button gets a PDF renderer and a code
  editor.

Publishing is innocent: the client sends the flags and the registry stores
them; they are dropped at serve time. Republishing the same manifest shape or
upgrading the registry does not fix it (unfixed upstream, issues closed by
triage automation).

## Decision

The package manifest declares exactly the required core peers —
`@angular/cdk`, `@angular/common`, `@angular/core`, `@angular/forms`,
`@floating-ui/dom`, `ng-primitives`, `rxjs` — and nothing else. There is no
`peerDependenciesMeta`.

Everything a feature entry point needs beyond the core is an **integration**:
deliberately absent from package metadata, installed by the consumer
alongside the entry point that uses it. With nothing declared, the metadata
every registry serves is correct by construction: strict-peer installs
succeed, default-posture installs add exactly what was asked for.

The costs are accepted and mitigated:

- **No installer range-checking for integrations.** The tested ranges move to
  the consumer guide's integration table, and the architecture check keeps
  that table naming every integration (pdf.js pinned to the workspace catalog
  version, the one exact-version integration).
- **The contract lives in checks, not in npm.** The architecture check
  (`consumer-integration-contract`) pins the declared peer set to the core,
  forbids `peerDependenciesMeta` and integration creep into `dependencies`,
  and requires every import to be core, declared, or a known integration.
  The pack audit asserts the packed manifest's peer set. The consumer
  fixtures keep proving each entry point's real install set, including that
  foreign integrations stay out of foundation installs.

## Alternatives rejected

- **A consumer-side `packageExtensions` block** restoring the flags per
  adopter workspace: works, but every adopter carries ~15 lines of
  boilerplate compensating for registry behavior forever, and nothing on our
  side can keep their copies from drifting when the integration set changes.
- **Posture advice** (`autoInstallPeers: false` + `strictPeerDependencies:
  false`): silences real peer problems along with the false ones.
- **Accepting the bloat**: makes the smallest consumer pay for every feature;
  contradicts the heavy-feature boundary this library is built around.
