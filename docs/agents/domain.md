# Domain Docs

How engineering workflows should consume this repo's domain documentation when
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

If a referenced file is missing, note that briefly and continue with available
evidence. Do not invent glossary entries or ADRs to fill the gap.

## Use the glossary vocabulary

When output names a domain concept in an issue title, refactor proposal,
hypothesis, test name, or review finding, use the term as defined in
`CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If a needed concept is missing from the glossary, either avoid introducing that
term, update `CONTEXT.md` once the term is resolved, open an ADR for a real
architecture decision, or ask the user to resolve the ambiguity.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than
silently overriding it.
