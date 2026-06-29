# Release evidence policy

This policy names the local evidence that can support a release claim. The
enforced source for the lists below is
[`tools/release-evidence-policy.mjs`](../../tools/release-evidence-policy.mjs);
release docs explain the policy, while the tools fail when the docs drift.

Hell UI stays **internal beta** until the
[production-readiness checklist](production-readiness-checklist.md) passes
against fresh release-candidate evidence for the current clean commit.

## Release-candidate package-consumer scenarios

Full release dry-run evidence must include every release-candidate
package-consumer scenario below. The first-beta consumer guide may show these as
individual proof paths, but release evidence treats the set as one gate.

| Scenario | Evidence role |
| --- | --- |
| `root-core` | Root entrypoint stays stable core-only with light peers. |
| `core` | Narrow core entrypoint remains installable with the light peer group. |
| `testing` | Stable test harness entrypoint remains installable with the light peer group. |
| `button-ui` | Button Part Style Map compiles without Tailwind or Hell CSS. |
| `button` | Styled Button CSS ships compiled recipe utilities and semantic tokens. |
| `primitive-icons-css` | Icon-backed primitive CSS stays isolated to narrow primitive imports. |
| `composite-css` | Composite CSS stays behind narrow composite entrypoints. |
| `app-shell` | App Shell composite remains installable without feature peers. |
| `resizable` | Resizable composite Part Style Map roots ship through the narrow entrypoint. |
| `split-view` | Split View owned anatomy and icon-backed navigation ship through the narrow entrypoint. |
| `audio-player` | Base audio player stays separate from transcript runtime peers. |
| `audio-transcript` | Speech transcript is explicit opt-in and does not pull CodeMirror or pdf.js. |
| `table` | Table primitives stay free of TanStack and heavy feature peers. |
| `table-tanstack` | TanStack shell owns the optional TanStack Table peer boundary. |
| `table-tanstack-virtual` | Virtual row strategy owns the optional TanStack Virtual peer boundary. |
| `no-legacy-alias` | Removed table aliases stay unavailable before beta. |
| `code-editor` | CodeMirror peers stay isolated to the code editor feature entrypoint. |
| `pdf-viewer` | PDF viewer split-package exception: proves `@hell-ui/pdf-viewer` with its exact pdf.js peer as part of the release train, but does not put pdf.js back into `@hell-ui/angular` peer metadata. |

## API report membership

API reports are release evidence for stable entrypoints plus one explicit
internal exception. They track public shape only; stability tags and promotion
language remain policy-owned.

| Entrypoint | Report file | Policy |
| --- | --- | --- |
| `@hell-ui/angular` | `hell-ui-angular.api.md` | Stable API report. |
| `@hell-ui/angular/core` | `hell-ui-angular-core.api.md` | Stable API report. |
| `@hell-ui/angular/internal/hotkeys` | `hell-ui-angular-internal-hotkeys.api.md` | Internal hotkeys API report exception: Temporary internal compatibility guard for the hotkey boundary. API Extractor tracks shape so accidental public drift is reviewed, but this entrypoint is not promoted to Stable. |
| `@hell-ui/angular/input` | `hell-ui-angular-input.api.md` | Stable API report. |
| `@hell-ui/angular/dialpad` | `hell-ui-angular-dialpad.api.md` | Stable API report. |
| `@hell-ui/angular/testing` | `hell-ui-angular-testing.api.md` | Stable API report. |

## Freshness rules

Release dry-run JSON evidence must match the current Git commit, be generated
from a clean tracked tree, be newer than the current commit, and include pass
records for the required release tasks. Production-ready claims additionally
require current Playwright JSON evidence and docs budget diagnosis evidence.

Local evidence under `test-results/` stays untracked by design. Rerun the
commands for each release candidate instead of relying on stale local files.
