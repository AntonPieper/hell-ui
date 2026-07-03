# Production-readiness checklist

Status: **internal beta until the production-readiness gate passes**.

This checklist is the release-claim gate for Hell UI. Until `pnpm production-ready:check` passes against fresh release-candidate evidence, release notes, README copy, package registry descriptions, docs pages, and agent handoffs must keep using internal-beta, beta, or experimental language instead of "production ready". Version bumps must also satisfy `docs/release/semver-policy.md`, [`docs/release/release-evidence-policy.md`](release-evidence-policy.md), and the `CHANGELOG.md` entry enforced by release dry-run.

The gate is evidence-based, not a replacement for running the commands. Evidence under `test-results/` is intentionally untracked; run the commands, inspect failures, then run the gate.

```bash
pnpm release:dry-run -- --full
pnpm e2e
pnpm production-ready:check
```

## Machine-readable gate

`tools/production-ready-check.mjs` reads this block. Keep every blocker category
mapped to command evidence and concrete evidence checks.

```json production-readiness-gate
{
  "version": 1,
  "status": "internal-beta-until-gate-passes",
  "blockers": [
    {
      "category": "package-consumer",
      "title": "Package-consumer install/build proof",
      "commandEvidence": [
        "pnpm test:package-consumer -- --minimal-deps",
        "pnpm release:dry-run -- --full"
      ],
      "evidenceChecks": [
        {
          "type": "releaseDryRunEvidence",
          "label": "full release dry-run includes selected package-consumer scenarios",
          "requiredScenarios": [
            "root-core",
            "core",
            "testing",
            "button-ui",
            "button",
            "primitive-icons-css",
            "pagination",
            "composite-css",
            "app-shell",
            "resizable",
            "split-view",
            "audio-player",
            "audio-transcript",
            "table",
            "table-tanstack",
            "table-tanstack-virtual",
            "no-legacy-alias",
            "code-editor",
            "pdf-viewer"
          ]
        }
      ]
    },
    {
      "category": "api",
      "title": "API report proof for stable entry points and documented internal exception",
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
          "label": "internal hotkeys API report exception is committed",
          "path": "etc/api-reports/hell-ui-angular-internal-hotkeys.api.md"
        },
        {
          "type": "fileExists",
          "label": "input API report is committed",
          "path": "etc/api-reports/hell-ui-angular-input.api.md"
        },
        {
          "type": "fileExists",
          "label": "dialpad API report is committed",
          "path": "etc/api-reports/hell-ui-angular-dialpad.api.md"
        },
        {
          "type": "fileExists",
          "label": "testing API report is committed",
          "path": "etc/api-reports/hell-ui-angular-testing.api.md"
        },
        {
          "type": "fileExists",
          "label": "accordion API report is committed",
          "path": "etc/api-reports/hell-ui-angular-accordion.api.md"
        },
        {
          "type": "fileExists",
          "label": "app shell API report is committed",
          "path": "etc/api-reports/hell-ui-angular-app-shell.api.md"
        },
        {
          "type": "fileExists",
          "label": "avatar API report is committed",
          "path": "etc/api-reports/hell-ui-angular-avatar.api.md"
        },
        {
          "type": "fileExists",
          "label": "avatar group API report is committed",
          "path": "etc/api-reports/hell-ui-angular-avatar-group.api.md"
        },
        {
          "type": "fileExists",
          "label": "breadcrumbs API report is committed",
          "path": "etc/api-reports/hell-ui-angular-breadcrumbs.api.md"
        },
        {
          "type": "fileExists",
          "label": "button API report is committed",
          "path": "etc/api-reports/hell-ui-angular-button.api.md"
        },
        {
          "type": "fileExists",
          "label": "card API report is committed",
          "path": "etc/api-reports/hell-ui-angular-card.api.md"
        },
        {
          "type": "fileExists",
          "label": "checkbox API report is committed",
          "path": "etc/api-reports/hell-ui-angular-checkbox.api.md"
        },
        {
          "type": "fileExists",
          "label": "date picker API report is committed",
          "path": "etc/api-reports/hell-ui-angular-date-picker.api.md"
        },
        {
          "type": "fileExists",
          "label": "dialog API report is committed",
          "path": "etc/api-reports/hell-ui-angular-dialog.api.md"
        },
        {
          "type": "fileExists",
          "label": "drop zone API report is committed",
          "path": "etc/api-reports/hell-ui-angular-drop-zone.api.md"
        },
        {
          "type": "fileExists",
          "label": "field API report is committed",
          "path": "etc/api-reports/hell-ui-angular-field.api.md"
        },
        {
          "type": "fileExists",
          "label": "flyout API report is committed",
          "path": "etc/api-reports/hell-ui-angular-flyout.api.md"
        },
        {
          "type": "fileExists",
          "label": "icon API report is committed",
          "path": "etc/api-reports/hell-ui-angular-icon.api.md"
        },
        {
          "type": "fileExists",
          "label": "listbox API report is committed",
          "path": "etc/api-reports/hell-ui-angular-listbox.api.md"
        },
        {
          "type": "fileExists",
          "label": "menu API report is committed",
          "path": "etc/api-reports/hell-ui-angular-menu.api.md"
        },
        {
          "type": "fileExists",
          "label": "omnibar API report is committed",
          "path": "etc/api-reports/hell-ui-angular-omnibar.api.md"
        },
        {
          "type": "fileExists",
          "label": "pagination API report is committed",
          "path": "etc/api-reports/hell-ui-angular-pagination.api.md"
        },
        {
          "type": "fileExists",
          "label": "popover API report is committed",
          "path": "etc/api-reports/hell-ui-angular-popover.api.md"
        },
        {
          "type": "fileExists",
          "label": "progress API report is committed",
          "path": "etc/api-reports/hell-ui-angular-progress.api.md"
        },
        {
          "type": "fileExists",
          "label": "radio API report is committed",
          "path": "etc/api-reports/hell-ui-angular-radio.api.md"
        },
        {
          "type": "fileExists",
          "label": "resizable API report is committed",
          "path": "etc/api-reports/hell-ui-angular-resizable.api.md"
        },
        {
          "type": "fileExists",
          "label": "search API report is committed",
          "path": "etc/api-reports/hell-ui-angular-search.api.md"
        },
        {
          "type": "fileExists",
          "label": "separator API report is committed",
          "path": "etc/api-reports/hell-ui-angular-separator.api.md"
        },
        {
          "type": "fileExists",
          "label": "skeleton API report is committed",
          "path": "etc/api-reports/hell-ui-angular-skeleton.api.md"
        },
        {
          "type": "fileExists",
          "label": "slider API report is committed",
          "path": "etc/api-reports/hell-ui-angular-slider.api.md"
        },
        {
          "type": "fileExists",
          "label": "split view API report is committed",
          "path": "etc/api-reports/hell-ui-angular-split-view.api.md"
        },
        {
          "type": "fileExists",
          "label": "switch API report is committed",
          "path": "etc/api-reports/hell-ui-angular-switch.api.md"
        },
        {
          "type": "fileExists",
          "label": "table API report is committed",
          "path": "etc/api-reports/hell-ui-angular-table.api.md"
        },
        {
          "type": "fileExists",
          "label": "tabs API report is committed",
          "path": "etc/api-reports/hell-ui-angular-tabs.api.md"
        },
        {
          "type": "fileExists",
          "label": "tag API report is committed",
          "path": "etc/api-reports/hell-ui-angular-tag.api.md"
        },
        {
          "type": "fileExists",
          "label": "time input API report is committed",
          "path": "etc/api-reports/hell-ui-angular-time-input.api.md"
        },
        {
          "type": "fileExists",
          "label": "toast API report is committed",
          "path": "etc/api-reports/hell-ui-angular-toast.api.md"
        },
        {
          "type": "fileExists",
          "label": "toggle API report is committed",
          "path": "etc/api-reports/hell-ui-angular-toggle.api.md"
        },
        {
          "type": "fileExists",
          "label": "tooltip API report is committed",
          "path": "etc/api-reports/hell-ui-angular-tooltip.api.md"
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
          "path": "apps/docs/src/app/pages/accessibility/accessibility.page.ts",
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
      "title": "pnpm pack contents and APF audit proof",
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

| Blocker category | Required command evidence                                                        | What blocks the production-ready claim                                                                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package-consumer | `pnpm test:package-consumer -- --minimal-deps`; `pnpm release:dry-run -- --full` | Full release JSON evidence must show every release-candidate strict-peer consumer scenario from the [release evidence policy](release-evidence-policy.md) passing, including the split-package `pdf-viewer` scenario.                                                                                          |
| API              | `pnpm build:lib`; `pnpm test:api-report`; `pnpm release:dry-run -- --full`       | Stable API reports and the documented internal-hotkeys API report exception must exist, and the full release dry-run must pass the API report task.                                                                                                                                                          |
| Accessibility    | `pnpm e2e`; `pnpm release:dry-run -- --full`                                     | `test-results/playwright-report.json` must report zero unexpected results for every `e2e/*.spec.ts` file across chromium, firefox, and webkit on the current commit; the accessibility matrix must not contain `Critical gap` or `criticalGap: true` rows. Current critical gaps keep Hell UI internal beta. |
| Docs budgets     | `pnpm build:docs`; `pnpm diagnose:docs-bundle`; `pnpm release:dry-run -- --full` | The budget diagnosis must classify warnings as accepted or regression, and the full release dry-run must pass docs build.                                                                                                                                                                                    |
| Pack audit       | `pnpm build:lib`; `pnpm test:package-pack`; `pnpm release:dry-run -- --full`     | Full release JSON evidence must show the pack audit passing before production language.                                                                                                                                                                                                                      |
| Release dry-run  | `pnpm release:dry-run -- --full`                                                 | The latest full release-candidate JSON evidence must pass every dry-run task, including the changelog entry check for the current package version.                                                                                                                                                           |

## Current blocker notes

- Accessibility remains blocked while the matrix source contains `Critical gap` rows.
- Local release evidence is untracked by design. Do not commit `test-results/`; rerun the commands for each release candidate.
- Release dry-run JSON evidence must match the current product Git commit, be generated from a clean tracked tree, be newer than the current commit, and contain pass records for the required tasks.
- The split `pdf-viewer` package-consumer scenario is release evidence for `@hell-ui/pdf-viewer`; it does not make pdf.js part of `@hell-ui/angular` peer metadata.
- The `@hell-ui/angular/internal/hotkeys` API report is an internal exception that guards accidental shape drift; it does not promote the entrypoint to Stable.
- Release dry-run fails when `packages/angular/package.json` has a package version without a matching `CHANGELOG.md` section.
- This gate can prove evidence presence, freshness, and checklist honesty, but it is not a cryptographic attestation. CI/release workflow artifacts remain the authoritative evidence chain for a published package.
