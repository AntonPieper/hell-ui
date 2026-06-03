# Production-readiness checklist

Status: **internal beta until the production-readiness gate passes**.

This checklist is the release-claim gate for Hell UI. Until `pnpm production-ready:check` passes against fresh release-candidate evidence, release notes, README copy, npm descriptions, docs pages, and agent handoffs must keep using internal-beta, beta, or experimental language instead of "production ready". Version bumps must also satisfy `docs/release/semver-policy.md` and the `CHANGELOG.md` entry enforced by release dry-run.

The gate is evidence-based, not a replacement for running the commands. Evidence under `test-results/` is intentionally untracked; run the commands, inspect failures, then run the gate.

```bash
pnpm release:dry-run -- --full
pnpm e2e
pnpm production-ready:check
```

## Machine-readable gate

`tools/production-ready-check.mjs` reads this block. Keep every blocker category mapped to slice IDs, command evidence, and concrete evidence checks.

```json production-readiness-gate
{
  "version": 1,
  "status": "internal-beta-until-gate-passes",
  "blockers": [
    {
      "category": "package-consumer",
      "title": "Package-consumer install/build proof",
      "sliceIds": [
        "HELL-012",
        "HELL-020",
        "HELL-021",
        "HELL-022",
        "HELL-023",
        "HELL-024",
        "HELL-055"
      ],
      "commandEvidence": [
        "pnpm test:package-consumer -- --minimal-deps",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run includes selected package-consumer scenarios"
        }
      ]
    },
    {
      "category": "api",
      "title": "API report proof for stable entry points",
      "sliceIds": [
        "HELL-025",
        "HELL-026",
        "HELL-051"
      ],
      "commandEvidence": [
        "pnpm build:lib",
        "pnpm test:api-report",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "fileExists",
          "label": "root API report is committed",
          "path": "etc/api-reports/hell-ui-angular.api.md"
        },
        {
          "type": "fileExists",
          "label": "core API report is committed",
          "path": "etc/api-reports/hell-ui-angular-core.api.md"
        },
        {
          "type": "fileExists",
          "label": "primitives API report is committed",
          "path": "etc/api-reports/hell-ui-angular-primitives.api.md"
        },
        {
          "type": "fileExists",
          "label": "testing API report is committed",
          "path": "etc/api-reports/hell-ui-angular-testing.api.md"
        },
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run passed API report task"
        }
      ]
    },
    {
      "category": "accessibility",
      "title": "Browser accessibility and matrix proof",
      "sliceIds": [
        "HELL-038",
        "HELL-039",
        "HELL-040",
        "HELL-041",
        "HELL-042",
        "HELL-043",
        "HELL-061"
      ],
      "commandEvidence": [
        "pnpm e2e",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "playwrightJsonReport",
          "label": "Playwright accessibility/browser report passed on current code",
          "path": "test-results/playwright-report.json",
          "modifiedAfterCurrentGitCommit": true,
          "allE2eSpecs": true
        },
        {
          "type": "fileNotContains",
          "label": "accessibility matrix has no critical gaps",
          "path": "projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts",
          "forbids": [
            "Critical gap",
            "criticalGap: true"
          ]
        }
      ]
    },
    {
      "category": "docs-budgets",
      "title": "Docs budget policy and current diagnosis proof",
      "sliceIds": [
        "HELL-019",
        "HELL-030",
        "HELL-031",
        "HELL-032",
        "HELL-050"
      ],
      "commandEvidence": [
        "pnpm build:docs",
        "pnpm diagnose:docs-bundle",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "fileContains",
          "label": "docs budget diagnosis is current and classified",
          "path": "docs/release/docs-bundle-budget-diagnosis.md",
          "contains": [
            "## Budget status",
            "accepted warning",
            "within warning budget",
            "Regression budget warnings: none"
          ],
          "modifiedAfterCurrentGitCommit": true
        },
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run passed docs build task"
        }
      ]
    },
    {
      "category": "pack-audit",
      "title": "npm pack contents and APF audit proof",
      "sliceIds": [
        "HELL-023",
        "HELL-024",
        "HELL-053"
      ],
      "commandEvidence": [
        "pnpm build:lib",
        "pnpm test:package-pack",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run passed pack audit task"
        }
      ]
    },
    {
      "category": "release-dry-run",
      "title": "Full release-candidate dry-run evidence",
      "sliceIds": [
        "HELL-027",
        "HELL-028",
        "HELL-049",
        "HELL-051",
        "HELL-052"
      ],
      "commandEvidence": [
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run completed with exit 0"
        }
      ]
    }
  ]
}
```

## Human checklist

| Blocker category | Slice IDs | Required command evidence | What blocks the production-ready claim |
| --- | --- | --- | --- |
| Package-consumer | HELL-012, HELL-020, HELL-021, HELL-022, HELL-023, HELL-024, HELL-055 | `pnpm test:package-consumer -- --minimal-deps`; `pnpm release:dry-run -- --full` | Full release JSON evidence must show selected strict-peer consumer scenarios passing (`root-core`, `button-unstyled`, `primitives-css`, `audio-player`, `audio-transcript`, `code-editor`). |
| API | HELL-025, HELL-026, HELL-051 | `pnpm build:lib`; `pnpm test:api-report`; `pnpm release:dry-run -- --full` | Stable API reports must exist and the full release dry-run must pass the API report task. HELL-051 still owns semver/changelog policy before public beta. |
| Accessibility | HELL-038, HELL-039, HELL-040, HELL-041, HELL-042, HELL-043, HELL-061 | `pnpm e2e`; `pnpm release:dry-run -- --full` | `test-results/playwright-report.json` must report zero unexpected results for every `e2e/*.spec.ts` file across chromium, firefox, and webkit on the current commit; the accessibility matrix must not contain `Critical gap` or `criticalGap: true` rows. Current critical gaps keep Hell UI internal beta. |
| Docs budgets | HELL-019, HELL-030, HELL-031, HELL-032, HELL-050 | `pnpm build:docs`; `pnpm diagnose:docs-bundle`; `pnpm release:dry-run -- --full` | The budget diagnosis must classify warnings as accepted or regression, and the full release dry-run must pass docs build. HELL-050 owns the remaining eager-import audit. |
| Pack audit | HELL-023, HELL-024, HELL-053 | `pnpm build:lib`; `pnpm test:package-pack`; `pnpm release:dry-run -- --full` | Full release JSON evidence must show the pack audit passing before production language. HELL-053 still owns PDF package split risk before beta. |
| Release dry-run | HELL-027, HELL-028, HELL-049, HELL-051, HELL-052 | `pnpm release:dry-run -- --full` | The latest full release-candidate JSON evidence must pass every dry-run task, including the changelog entry check for the current package version. |

## Current blocker notes

- Accessibility remains blocked while the matrix source contains `Critical gap` rows.
- Local release evidence is untracked by design. Do not commit `test-results/`; rerun the commands for each release candidate.
- Release dry-run JSON evidence must match the current product Git commit, be generated from a clean tracked tree, be newer than the current commit, and contain pass records for the required tasks.
- Release dry-run fails when `projects/hell/package.json` has a package version without a matching `CHANGELOG.md` section.
- This gate can prove evidence presence, freshness, and checklist honesty, but it is not a cryptographic attestation. CI/release workflow artifacts remain the authoritative evidence chain for a published package.
