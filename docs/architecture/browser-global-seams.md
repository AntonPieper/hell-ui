# SSR/browser global seams

- Slice: HELL-048
- Enforced by: `pnpm run test:static-contracts` (`tools/check-static-contracts.mjs`, `checkBrowserGlobalContract()`)
- Scope: production TypeScript under `projects/hell/src/lib`; specs, declarations, and the PDF worker file are excluded.
- Static Contract Manifest: `tools/static-contracts/browser-global-seams.json`

## Rule

Do not reference browser globals directly from library source unless the file/global pair is listed in the Static Contract Manifest. The static audit parses TypeScript source and reports runtime identifier use of `document`, `window`, `ResizeObserver`, and `IntersectionObserver`; comments, string text, type positions, declaration names, and non-global property names do not count, but template expressions do.

Angular SSR guidance says browser-specific globals such as `document` should not be referenced directly; use `DOCUMENT` for platform-aware document access. Angular render callbacks such as `afterNextRender` run only in the browser, but this package still keeps explicit seams so imports remain safe and browser-only behavior has an owner.

A new direct global must do one of these in the same slice:

1. move behind an existing Angular/DOM seam such as injected `DOCUMENT`, an owner document passed by the caller, or a browser-only render/lifecycle callback;
2. add one narrow row to `tools/static-contracts/browser-global-seams.json` with a rationale and owner slice; or
3. create/update a follow-up board slice and mark the manifest row as provisional until the debt is removed.

## Allowed seams

`tools/static-contracts/browser-global-seams.json` owns the allowed seam rows, the direct browser globals inspected by the static check, each owner slice, status, rationale, and file/global allowance.

## Follow-up ownership

Provisional manifest rows are not permanent waivers. They map to existing board slices: HELL-054 (CodeMirror optional/client-only boundary) and HELL-061 (resize browser contracts). HELL-053 moved PDF browser globals out of the main `@hell-ui/angular` package into `@hell-ui/pdf-viewer`; HELL-055 moved audio transcript globals into the optional transcript feature provider; HELL-057 accepted the remaining flyout/core floating-dismissal fallback; HELL-058 shrank omnibar to a focus-only owner-document rule. Those feature/package seams own their browser-only runtime separately. If any of those slices changes scope, update the manifest in the same commit.
