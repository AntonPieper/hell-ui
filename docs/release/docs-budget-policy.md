# Docs budget policy

The docs app budgets are warning gates, not permanent wallpaper. If a build warns, the warning must be either listed as an accepted warning here or treated as a regression.

Source of truth:

- Threshold enforcement lives in `apps/docs/angular.json` under `hell-docs` production budgets.
- Owner/rationale and accepted warnings live in this document.
- `tools/docs-bundle-budget-report.mjs --check` fails when a configured threshold is missing an owner/rationale here or diverges from `apps/docs/angular.json`.
- `tools/docs-bundle-budget-report.mjs --check` also classifies current docs build budget status as **accepted** or **regression** after `build:docs` writes `dist/hell-docs/stats.json`, and writes the full diagnosis to the untracked `dist/docs-bundle-budget-diagnosis.md` (uploaded as a CI build artifact; regenerate locally with `pnpm run diagnose:docs-bundle`).
- The tables below are CI-checked against the JSON block so threshold, owner, rationale, follow-up, and expiry metadata cannot silently drift from the source of truth.

```json docs-budget-policy
{
  "version": 1,
  "thresholds": [
    {
      "type": "initial",
      "maximumWarning": "500kB",
      "maximumError": "1.05MB",
      "owner": "Docs shell / global styles",
      "rationale": "Keep the docs shell honest while the internal-beta docs still carry Angular runtime/router, global Tailwind, Hell composite CSS, app-shell/search/menu/select navigation UI, and the top-level icon registry.",
      "regressionMeaning": "A warning beyond the accepted shell overage means new eager docs code, global CSS, or a dependency leaked into the initial route boundary."
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "4kB",
      "maximumError": "8kB",
      "owner": "Individual docs page owner",
      "rationale": "Component/page styles should stay small enough to review locally; heavy feature CSS must be loaded as documented lazy/global assets instead of hiding inside component styles.",
      "regressionMeaning": "Any component-style warning is a regression unless this file adds a narrow, time-boxed accepted warning with owner and follow-up."
    }
  ],
  "acceptedWarnings": [
    {
      "type": "initial",
      "acceptedMaximum": "945kB",
      "owner": "Docs shell / global styles",
      "rationale": "The current warning is the accepted Angular 22 and TypeScript 6 internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table/toast CSS imported from public stylesheet entry points exactly as an external consumer would, app-shell/search/menu/select navigation UI, the full sidebar icon registry, shared docs page-header chrome, and tailwind-merge. The 2026-07 docs example-suite rewrite (simple/composite/all-part-styles examples on every component page) adds ~14 kB: new example Tailwind utilities in the global stylesheet and additional fa-solid icons in the shared eager icon module. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports.",
      "evidence": "dist/docs-bundle-budget-diagnosis.md",
      "followUp": "lazy-route import graph guard",
      "expiresWhen": "Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision."
    }
  ]
}
```

## Thresholds

| Budget | Warning | Error | Owner | Rationale | Regression meaning |
| --- | ---: | ---: | --- | --- | --- |
| Initial bundle | 500kB | 1.05MB | Docs shell / global styles | Keep the docs shell honest while the internal-beta docs still carry Angular runtime/router, global Tailwind, Hell composite CSS, app-shell/search/menu/select navigation UI, and the top-level icon registry. | A warning beyond the accepted shell overage means new eager docs code, global CSS, or a dependency leaked into the initial route boundary. |
| Any component style | 4kB | 8kB | Individual docs page owner | Component/page styles should stay small enough to review locally; heavy feature CSS must be loaded as documented lazy/global assets instead of hiding inside component styles. | Any component-style warning is a regression unless this file adds a narrow, time-boxed accepted warning with owner and follow-up. |

## Accepted current warnings

| Budget | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |
| --- | ---: | --- | --- | --- | --- | --- |
| Initial bundle | 945kB | Docs shell / global styles | The current warning is the accepted Angular 22 and TypeScript 6 internal-beta docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table/toast CSS imported from public stylesheet entry points exactly as an external consumer would, app-shell/search/menu/select navigation UI, the full sidebar icon registry, shared docs page-header chrome, and tailwind-merge. The 2026-07 docs example-suite rewrite (simple/composite/all-part-styles examples on every component page) adds ~14 kB: new example Tailwind utilities in the global stylesheet and additional fa-solid icons in the shared eager icon module. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports. | dist/docs-bundle-budget-diagnosis.md | lazy-route import graph guard | Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision. |

No `anyComponentStyle` warning is accepted. If one appears, treat it as a regression until this policy records a specific owner, rationale, evidence, and follow-up.
