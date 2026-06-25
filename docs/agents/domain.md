# Domain Docs

How engineering skills should consume this repo's domain documentation when
exploring the codebase.

## Layout

This repo uses a single-context layout:

```text
/
|-- CONTEXT.md
|-- docs/
|   `-- adr/
`-- projects/
    |-- hell/
    |-- hell-docs/
    `-- hell-pdf-viewer/
```

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- Relevant ADRs under `docs/adr/`.
- Relevant architecture or release docs under `docs/architecture/` and
  `docs/release/` when the touched area is covered there.

If a referenced file does not exist, proceed silently. The domain-modeling flow
creates new glossary entries and ADRs lazily when terms or decisions actually
get resolved.

## Use the glossary vocabulary

When output names a domain concept in an issue title, refactor proposal,
hypothesis, test name, or review finding, use the term as defined in
`CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If the concept you need is missing from the glossary, either you are inventing a
term the project does not use, or there is a real gap to resolve with
domain-modeling.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than
silently overriding it.
