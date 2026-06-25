# Risk Checks

Read this only when work touches production-readiness, public packages, Part
Style Map migrations, visual QA, or runtime seams.

- Production/release claims need consumer proof, full release evidence,
  Playwright/browser evidence, and package-specific release paths. Green local
  static gates are not enough.
- Public API and package boundary changes need manifest, API-report/stability,
  package-consumer, and pack-audit evidence tied to the touched surface.
- Visual QA must cover the actual affected surface. Whole-page screenshots alone
  are not enough for component-level regressions; nested scroll containers need
  explicit region checks.
- Part Style Map migrations must check downstream consumers: composed
  components, stale CSS variables, stale docs/comments, API reports, shipped
  recipe CSS, and consumer proof.
- Runtime/browser seams need ADR-first treatment. Floating, hotkey, resize, PDF,
  CodeMirror, audio, table, and omnibar behavior require browser/runtime proof
  that matches the changed contract.
- Current files and current validation are the proof. Treat review notes,
  issue text, and existing docs as claims until verified against the checkout.
