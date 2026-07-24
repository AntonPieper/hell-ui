# Internal Package Path baselines

These files are **not** public API stability reports. They are drift guards
for guarded `hell-ui/internal/*` seams whose declarations cross into public
reports (see `tools/check-api-reports.mjs` and
`tools/check-api-report-warnings.mjs`).

Internal Package Paths ship only for Angular Package Format cross-entrypoint
linking. They keep the `internal` prefix and internal Module Category, stay
out of consumer documentation and examples, and carry no consumer support
promise. A baseline here detects shape drift behind a guarded seam; it never
promotes the surface to a supported contract. When a contract becomes
genuinely consumer-relevant, promote it individually to a named non-internal
Package Entry Point with a public report in `etc/api-reports/`
(docs/adr/0002-public-package-and-stylesheet-surface.md, #272).
