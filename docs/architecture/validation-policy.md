# Validation policy

- ID: validation-policy
- Slice: HELL-123
- Source of truth for terms: `CONTEXT.md`

Hell UI validates each Specification Slice with the narrowest reliable
Validation Evidence. Static checks are useful only when the claim is naturally
static: source shape, package metadata, generated files, command wiring, or a
machine-readable manifest.

## Terms

| Term | Meaning |
| --- | --- |
| Validation Evidence | Proof that a product claim is true, produced by the matching command, browser/manual review, API report, package-consumer run, release gate, or static contract. |
| Evidence Class | One of `unit`, `integration/build`, `browser/e2e`, `visual`, `package-consumer`, `api-report`, `static-contract`, or `release-evidence`. |
| Static Contract Check | A static rule for stable source/package/metadata/manifest boundaries. |
| Static Contract Manifest | Machine-readable source of truth read by a Static Contract Check. |
| Release Evidence Gate | A release-only check that verifies fresh evidence exists without replacing the command or review that produced it. |
| Evidence-Based Review | Fresh-context review that inspects the evidence and affected code instead of trusting a summary or one green static script. |

## Evidence by slice type

| Slice claim | Required Evidence Class |
| --- | --- |
| Component behavior, state transitions, parsing, adapters, and pure controllers | `unit`; add `browser/e2e` when DOM focus, keyboard, pointer, or rendered ARIA behavior matters. |
| Accessibility workflows, focus management, keyboard contracts, axe/ARIA expectations | `browser/e2e`; use `unit` only for isolated controller logic. |
| Docs UI, CSS, responsive layout, and component appearance | `visual` plus `integration/build`; add `browser/e2e` for interaction-prone regressions. |
| Library build output, docs build output, generated reports, budget reports | `integration/build`. |
| Packed package shape and APF metadata | `integration/build` or `static-contract`; real external install claims require `package-consumer`. |
| Consumer install/build scenarios and peer-tier claims | `package-consumer`; static peer metadata checks are supporting evidence only. |
| Public API report drift and promoted API coverage | `api-report`; use `static-contract` only for API-report command wiring or manifest coverage. |
| Release readiness, changelog stage, production-readiness claims | `release-evidence`, backed by the child commands listed by that gate. |
| Source/package/import/metadata boundaries that should fail before runtime | `static-contract`, preferably reading a Static Contract Manifest. |

## Static checks

Static Contract Checks may prove:

- package scripts, exports, peer metadata, publish metadata, and CI adapter wiring;
- generated entrypoint files and package secondary-entrypoint files;
- import-graph boundaries, browser-global seams, and package split boundaries;
- manifest consistency such as docs budget policy JSON versus `angular.json`.

Static Contract Checks must not prove:

- component behavior, accessibility, focus order, keyboard support, visual quality, or responsive layout;
- package-consumer reality after publish/pack unless the package is packed and installed in a consumer scenario;
- API stability beyond the committed API report and API policy manifest;
- release readiness without fresh release evidence;
- exact docs prose, example text, spec titles, or implementation tokens that normal feature work can legitimately change.

## Manifest rule

Scripts may enforce stable lists only from machine-readable manifests or stable
project metadata. If a list is volatile, temporary, or still being decided, keep
it in the owning Specification Slice and review it as evidence instead of
hardcoding prose into a `.mjs` check.

Docs prose explains rationale. It is not the source of truth for script-enforced
allowlists, scenario matrices, API coverage expectations, or release evidence
requirements.

Validation scripts may check command wiring, metadata, manifests, and artifact
freshness. They must not assert exact paragraphs from this policy.
