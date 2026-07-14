# ADR: Mode inputs encode behavior, not bundled presets

- Status: Accepted
- Date: 2026-07-14

## Context

CONTEXT.md's Customization Surface term warns against "mode switches or
booleans that apply bundled presets." Several composites still carried
enum inputs, and the API-simplification audit (#174) needed a written rule
for which survive.

## Decision

A mode-like input may stay only when it selects **behavior the consumer
cannot compose from the outside**: rendering lifecycle, focus policy,
announcements, dismissal semantics. A mode input must go when it merely
bundles styling (that is the Part Style Map's job), copy (that is plain
data or the Label Contract's job), or a layout the primitives can compose
(that is a documented recipe's job).

Verdicts from the audit:

| Axis | Verdict | Rationale |
| --- | --- | --- |
| `HellSaveBar.mode` (`contextual`/`persistent`) | **Kept** | Changes rendering lifecycle (render-while-dirty vs always) and LiveAnnouncer behavior on contextual appearance — real behavior, not styling. |
| `HellAlert.layout` (`inline`/`banner`) | **Removed** (#174) | Pure root styling (`w-full rounded-none border-x-0`); the banner look is a documented `ui` refinement. |
| `HellPaginationStrip.mode` | **Removed** (#172) | Three layouts in one component; compact and jump forms are recipes over `[hellPagination]` + `hellPageLink`. |
| `HellEmptyState.preset` | **Removed** (#173) | Bundled glyph + copy; `glyph` stays as a purely visual choice and copy became exported data. |
| `HellPopoverTrigger.trapFocus` | **Kept** (#168) | Modal vs non-modal focus and dismissal semantics — the same axis the native popover API models. |
| `HellSpinner.variant`, `HellButton.variant`, `HellChip.variant`, `HellAlert.variant` | **Kept** | Appearance variants reflected as `data-variant` for recipes and Theme Adapter Stylesheets; they select a curated look, not bundled behavior or copy. |

## Consequences

- New enum inputs on public modules must name which side of this rule they
  fall on in their PR description.
- Removing a styling-only mode is a breaking change worth taking; the
  migration is a one-line `ui` refinement or recipe.
