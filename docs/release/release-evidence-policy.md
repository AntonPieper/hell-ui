# Release evidence policy

This policy names the local evidence that can support a release claim. The
single enforced source for the scenario and API-report membership lists is
[`tools/release-evidence-policy.mjs`](../../tools/release-evidence-policy.mjs);
this doc explains the policy and deliberately does not mirror those lists.

## Release-candidate package-consumer scenarios

Full release dry-run evidence must include every scenario in
`releaseCandidateConsumerScenarios`. Each entry carries its own rationale
string; the set covers the root/core/testing light installs, the styled and
icon-backed primitive tiers, composite tiers, both supported table paths, and
the optional feature entry points (audio transcript, code editor, PDF viewer)
with their isolated peers.

## API report membership

API reports are release evidence for stable entrypoints plus one explicit
exception: `@hell-ui/angular/internal/hotkeys` is tracked to catch accidental
public drift without being promoted to Stable. Membership lives in
`apiReportEntrypoints`.

Blocked entry points: `@hell-ui/angular/audio-player`, `@hell-ui/angular/combobox`,
`@hell-ui/angular/date-input`, and `@hell-ui/angular/select` are temporarily
outside the API report gate because `@microsoft/api-extractor` crashes
analyzing their flattened declarations ("InternalError: Unable to follow
symbol"). The list lives in `tools/release-evidence-policy.mjs` as
`apiReportBlockedEntrypoints` and is re-probed on extractor upgrades.
Experimental entry points (`features/*`, `table-tanstack*`) stay out of stable
reports by policy.

## Freshness rules

Release dry-run JSON evidence must match the current Git commit, be generated
from a clean tracked tree, be newer than the current commit, and include pass
records for the required release tasks.

Local evidence under `test-results/` stays untracked by design. Rerun the
commands for each release candidate instead of relying on stale local files.
