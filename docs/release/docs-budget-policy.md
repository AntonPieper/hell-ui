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
      "acceptedMaximum": "825kB",
      "owner": "Docs shell / global styles",
      "rationale": "HELL-030 traced the current initial warning to the docs shell baseline rather than a single routed page, HELL-031 removed the PDF component-style warning, HELL-043 added one docs-shell catalog/search route for the accessibility matrix, HELL-047 made that shell search hotkey path opt-in/app-safe without adding a new eager dependency, HELL-050 adds a static lazy-route import graph guard for docs examples, HELL-087 keeps shared docs code previews lazy, and HELL-122/HELL-129 replace the old table docs route with `/components/table` examples for `/table` primitives and the TanStack shell. HELL-120 moves the table stylesheet into the docs global stylesheet because Vercel production proved route-level TypeScript CSS side-effect imports emitted unreferenced CSS assets and left table routes unstyled. The pagination/split-view navigation controls add shared component CSS for compact page status/jump controls and split-view item navigation, with docs examples kept behind lazy component routes and no new eager docs dependency. The slider/toggle/avatar polish slice adds global component state CSS for vertical slider containment, dark selected toggle contrast, and avatar overflow hover/open/focus states without adding eager docs route imports or dependencies. The remaining initial overage is accepted as an alpha docs-shell baseline, not as permission for unrelated eager imports.",
      "evidence": "docs/release/docs-bundle-budget-diagnosis.md",
      "followUp": "HELL-050 static guard",
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
| Initial bundle warning | 825 kB | Docs shell / global styles | HELL-030 showed the overage is the docs shell baseline; HELL-031 removed the PDF component-style warning; HELL-043 adds one catalog/search route for the accessibility matrix; HELL-047 hardens the existing docs-shell search hotkey path without adding a new eager dependency; HELL-050 adds a static lazy-route import graph guard for docs examples; HELL-087 keeps shared docs code previews lazy; HELL-122/HELL-129 replace the old table docs route with `/components/table` examples for `/table` primitives and the TanStack shell. HELL-120 deliberately loads `@hell-ui/angular/styles/table` globally because production Vercel evidence showed the previous route-level TypeScript CSS import produced unreferenced CSS and unstyled tables. The pagination/split-view navigation slice adds shared component CSS for compact page status/jump controls and item navigation without adding eager docs route imports. The slider/toggle/avatar polish slice adds global component state CSS for vertical slider containment, dark selected toggle contrast, and avatar overflow hover/open/focus states without new eager docs imports or dependencies. This is accepted only as an alpha docs-shell overage, not as permission for unrelated eager imports. | HELL-050 static guard blocks new eager docs example imports; HELL-120 architecture guard blocks reverting to route TS table CSS imports. Expires immediately if the accepted ceiling, initial error budget, or production-readiness budget decision is reached. |

No `anyComponentStyle` warning is accepted. If one appears, treat it as a regression until this policy records a specific owner, rationale, evidence, and follow-up slice.
