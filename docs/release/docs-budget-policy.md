# Docs budget policy

The docs app budgets are warning gates, not permanent wallpaper. If a build warns, the warning must be either listed as an accepted warning here or treated as a regression.

Source of truth:

- Threshold enforcement lives in `angular.json` under `hell-docs` production budgets.
- Owner/rationale and accepted warnings live in this document.
- `tools/check-ci-contract.mjs` fails when a configured threshold is missing an owner/rationale here or diverges from `angular.json`.
- `tools/docs-bundle-budget-report.mjs --check` classifies current docs build budget status as **accepted** or **regression** after `build:docs` writes `dist/hell-docs/stats.json`.

```json docs-budget-policy
{
  "version": 1,
  "thresholds": [
    {
      "type": "initial",
      "maximumWarning": "500kB",
      "maximumError": "1.05MB",
      "owner": "Docs shell / global styles",
      "rationale": "Keep the docs shell honest while the alpha docs still carry Angular runtime/router, global Tailwind, Hell composite CSS, app-shell/search/menu/select navigation UI, and the top-level icon registry.",
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
      "acceptedMaximum": "870kB",
      "owner": "Docs shell / global styles",
      "rationale": "The current warning is the accepted alpha docs-shell baseline: Angular runtime/router, global Tailwind, Hell composite/table CSS, app-shell/search/menu/select navigation UI, top-level icons, Button recipe utilities, and tailwind-merge. Heavy feature examples and raw source previews stay behind lazy docs route boundaries. This acceptance is not permission for unrelated eager imports.",
      "evidence": "docs/release/docs-bundle-budget-diagnosis.md",
      "followUp": "lazy-route import graph guard",
      "expiresWhen": "Any build that exceeds the accepted ceiling, reaches the initial maximumError threshold, or reopens the production-readiness budget decision."
    }
  ]
}
```

## Thresholds

| Budget | Warning | Error | Owner | Rationale |
| --- | ---: | ---: | --- | --- |
| Initial bundle | 500 kB | 1.05 MB | Docs shell / global styles | Keeps eager docs-shell/runtime/global CSS cost visible while alpha docs still intentionally use shell controls, search, menus, selects, icons, Tailwind, and Hell composite styles globally. |
| Any component style | 4 kB | 8 kB | Individual docs page owner | Prevents a single page from hiding feature CSS in Angular component styles; heavy feature CSS belongs behind a documented lazy/global asset boundary. |

## Accepted current warnings

| Budget | Accepted ceiling | Owner | Why accepted now | Follow-up / expiry |
| --- | ---: | --- | --- | --- |
| Initial bundle warning | 870 kB | Docs shell / global styles | The overage is accepted only as an alpha docs-shell baseline: runtime/router, global Tailwind, Hell composite/table CSS, shell navigation/search controls, top-level icons, Button recipe utilities, and tailwind-merge. Heavy examples and raw source previews stay lazy. | Lazy-route import graph and table-style guards block new eager docs leaks. Expires immediately if the accepted ceiling, initial error budget, or production-readiness budget decision is reached. |

No `anyComponentStyle` warning is accepted. If one appears, treat it as a regression until this policy records a specific owner, rationale, evidence, and follow-up.
