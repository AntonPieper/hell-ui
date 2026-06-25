# Issues And Domain Language

Read this for issue, PRD, triage, domain vocabulary, glossary, or ADR-conflict
work.

## Issue Tracker

- Issues and PRDs live in GitHub Issues for `AntonPieper/hell-ui`; use `gh` from
  the repository root.
- External PRs are reviewed as PRs, not pulled into the triage queue as request
  issues.
- Use the exact triage labels from `docs/agents/triage-labels.md`:
  `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and
  `wontfix`.

## Domain Language

- Use `CONTEXT.md` vocabulary in issue titles, refactor proposals, hypotheses,
  test names, review findings, and user-facing summaries.
- Avoid synonyms that the glossary explicitly rejects.
- Surface conflicts with ADRs explicitly instead of silently overriding them.
- If implementation evidence disproves a term or ADR, use domain-modeling
  discipline: resolve the language or decision before encoding it in output.
