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
      "regressionMeaning": "Any component-style warning is a regression unless this file adds a narrow, time-boxed accepted warning with owner and follow-up slice."
    }
  ],
  "acceptedWarnings": [
    {
      "type": "initial",
      "acceptedMaximum": "775kB",
      "owner": "Docs shell / global styles",
      "rationale": "HELL-030 traced the current initial warning to the docs shell baseline rather than a single routed page, and HELL-031 removed the PDF component-style warning. The remaining initial overage is accepted only while HELL-050 audits eager example imports and HELL-049 decides the production-readiness gate.",
      "evidence": "docs/release/docs-bundle-budget-diagnosis.md",
      "followUp": "HELL-050",
      "expiresWhen": "Close HELL-050 or any build that reaches the initial maximumError threshold."
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
| Initial bundle warning | 775 kB | Docs shell / global styles | HELL-030 showed the overage is the docs shell baseline; HELL-031 removed the PDF component-style warning. This is accepted only as an alpha docs-shell overage, not as permission for new eager imports. | HELL-050 audits future eager imports; HELL-049 decides whether production readiness lowers, raises, or blocks on this budget. Expires immediately if the accepted ceiling or initial error budget is reached. |

No `anyComponentStyle` warning is accepted. If one appears, treat it as a regression until this policy records a specific owner, rationale, evidence, and follow-up slice.
