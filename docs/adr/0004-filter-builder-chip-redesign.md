# ADR: Filter Builder rides the Control Group + Chip Set pattern

- Status: Proposed — merging PR #401 constitutes the maintainer approval
  required by #362, at which point this ADR reads as Accepted; implementation
  is #363
- Date: 2026-07-27

## Context

The Filter Builder Feature (`hell-ui/features/filter-builder`, introduced by
#201) already owns the right runtime: a controlled immutable expression array,
typed application-projected editors, stable edit targeting, layered Floating
Dismissal, focus restoration, and announcements. Its rendered surface,
however, predates the fixed chip-in-control-group pattern:

- The renderer's root is a bare flex row. Filter tokens sit in an unframed
  `hellChipSet`, while a *nested* Control Group frames only the field-picker
  Combobox. The result reads as "some pills next to a small input", not as one
  grouped field that holds its filters.
- Tokens are hand-rolled inside the renderer: a `[hellChip]` hosting an edit
  `<button data-slot="tokenLabel">` with a single flat display string. There is
  no visible field/operator/value structure.
- The create-mode editor *replaces* the field picker inline
  (`@if (editorMode() === 'create')` swaps the Control Group out of the chip
  flow), so the surface reflows every time an editor opens, while the edit
  flow anchors a popover to the token. Two placement models exist for one
  editor lifecycle.
- Clear-all is a detached ghost `hellButton` floating outside the field
  surface.

Meanwhile #339/#340 fixed the shared chip-in-control-group recipe: a
`hellChipSet` inside `[hellControlGroup]` now pads itself away from the frame
border (`data-in-control-group` tightens gaps and adds `px`/`py`), wraps
across rows without touching the border, and lets an inline
`input[hellChipInput]` join the chip flow. The Chip and Combobox docs pages
already demonstrate a multi-select "chips in a grouped field" composition on
that contract. The Filter Builder should be the flagship consumer of the same
pattern instead of approximating it.

This ADR is the UX spec requested by #362. It defines the target anatomy,
the chip anatomy, the add/edit/remove/clear flows, the complete keyboard
contract, and the overflow behavior. #363 implements it; #340 (merged) is the
spacing/alignment contract it builds on.

### Prior art surveyed

| System | Shape | What we take | What we reject |
| --- | --- | --- | --- |
| GitLab Pajamas "Filter" (filtered search bar) | One input field; each committed query renders inline as a three-part token — key, logical operator ("is"/"is not"), value — each part clickable to reopen its dropdown; raw text converts to tokens on Tab/blur; the field scrolls horizontally on overflow. | Tokens live *inside* the field with the text cursor; three-part token anatomy; sequential field → operator → value flow; Escape/ArrowDown dropdown contract. | Horizontal scroll (hides active filters); per-part dropdowns (requires a library-owned operator schema, which the projected-editor contract deliberately avoids); raw-text-to-token parsing (a query language is a non-goal). |
| Linear filters | A filter bar of segmented pills: field icon + name, a clickable operator segment that cycles/menus ("is", "is not", "includes any of"), a clickable value segment, and a remove ×. | Segmented pill presentation that makes field/operator/value scannable; operator copy owned by the domain, not the shell. | Interactive per-segment menus, for the same schema-ownership reason as GitLab. |
| Grafana ad hoc filters (2024 redesign) | Dashboard filter field; each `{ key, operator, value }` filter is a compact pill; clicking anywhere in the field starts a new filter and the flow auto-detects which part is being set; keyboard-first creation. | Click-anywhere-to-start affordance (the whole frame focuses the inline input); pills-in-field presentation. | Grafana's fixed key/operator/value editing widgets — Hell's editors are application-projected. |
| GitHub issues search | Plain-text query language (`is:open label:bug`) with autocomplete; tokens stay text. | Nothing structural — cited as the model we explicitly do not follow. | Text-only tokens: no chip affordances, hard remove/edit ergonomics, high syntax burden. |
| Kibana / Datadog filter pills | Pills rendered under a query bar; clicking a pill opens an edit popover with a field/operator/value form; pills wrap to multiple rows. | Whole-pill edit-in-popover; wrap-and-grow overflow. | Separate query bar + pill strip (two surfaces for one model). |

Sources: [GitLab Pajamas Filter](https://design.gitlab.com/components/filter/),
[Linear filter docs](https://linear.app/docs/filters),
[Grafana: redesigned dashboard filters](https://grafana.com/whats-new/2024-10-28-redesigned-filters-for-dashboards/).

The synthesis: mature systems converge on *filters as structured tokens
inside one field-shaped surface*, differing mainly in whether token parts are
individually interactive. Individually interactive parts require the shell to
own the operator/value schema. Hell's Filter Builder deliberately has no
closed field schema (`projection-first-interactions.md`: the Feature "owns
token/focus runtime without a closed field schema"), so this spec adopts the
structured *presentation* and keeps editing whole-token through the projected
editor — one Interaction State Machine, no renderer-owned twin.

## Decision

### 1. Anatomy: one Control Group frame

The Filter Builder renders as **one Control Group frame** containing a Chip
Set in which filter chips and the inline field-picker input share one flow,
plus an optional trailing clear-all group action:

```text
[hellControlGroup]  ...................................... root (frame)
  [hellChipSet] ........................................ tokens
    [hellChip] × n ....................................... token
      edit trigger ....................................... tokenLabel
        field segment .................................... tokenField
        operator segment ................................. tokenOperator
        value segment .................................... tokenValue
      [hellChipRemove] × button
    [hellControlGroup-less inline Combobox] ............. control
      input[hellChipInput][hellComboboxInput] ............ (the inline field picker)
      dropdown ........................................... panel
        option × n ....................................... fieldOption
  button[hellControlGroupAction] (when filters exist) .... clear
editor popover (portalled, anchored) ..................... editor
sr-only live region ...................................... live
```

- The **root Public Part is the frame**. The frame carries the Control Group
  visual contract: border, focus-within ring, `data-invalid`, `data-disabled`,
  and the `md` size. The `disabled` input flows into the frame, the chip set,
  the input, and the action, exactly as the Control Group product documents.
- The chip set uses the `data-in-control-group` recipe fixed by #340; no
  Filter-Builder-private spacing overrides. Chips render at chip size `sm`
  inside the `md` frame, as the chip-in-group compositions already do.
- The inline field picker keeps the existing frameless Combobox refinement
  (transparent, borderless, no own focus ring — the frame's focus-within ring
  is the single focus presentation) and keeps `hellChipInput` composed with
  `hellComboboxInput` on the same real `<input>`, so the existing Chip Input
  keyboard bridge continues to apply.
- Clicking anywhere on empty frame space focuses the inline input (the
  click-anywhere-to-start affordance from Grafana); clicks on chips and the
  action keep their own targets.
- **Clear-all becomes a `button[hellControlGroupAction]`** at the end of the
  frame, rendered only while filters exist. It is icon-only (an × glyph) with
  its accessible name from the existing `clearAll` label; the docs page may
  show a text variant as a `ui` refinement. The detached ghost button is
  removed — the frame is the whole product surface.

### 2. Chip anatomy: field / operator / value

Each active filter renders as one chip whose label is structured into three
presentation segments:

- `tokenField` — the descriptor's human field label (for example
  `Status`), styled as the muted leading segment;
- `tokenOperator` — the operator copy (for example `is`, `is not`,
  `≥`), styled muted;
- `tokenValue` — the value copy (for example `Open`), styled as the
  emphasized segment.

The segments come from a new **optional** descriptor callback:

```ts
interface HellFilterFieldDescriptor<TFilter> {
  // existing members unchanged …
  /** Optional structured token presentation; falls back to display(). */
  displayParts?(filter: TFilter): {
    readonly field: string;
    readonly operator?: string;
    readonly value: string;
  };
}
```

- `display(filter)` stays required and stays the single source for accessible
  names and announcements. Duplicate detection is unaffected by either
  callback: it stays identity-based (`identify` plus the
  `commitHellFilterBuilderValue` rules), never display-text-based.
  `displayParts` is presentation-only sugar; when absent, the chip renders
  the flat `display(filter)` string exactly as today. No expression shape changes; the
  segments are derived strings, not new state.
- The three segments are **not individually interactive**. The whole label
  region (`tokenLabel`) remains the single edit trigger. Per-segment
  dropdowns (GitLab/Linear style) are rejected: they require the shell to own
  an operator/value schema per field kind, which contradicts the
  projected-editor decision and would introduce a second Interaction State
  Machine per token. The projected editor is where the application offers
  field, operator, and value controls in whatever form its domain needs.
- The remove × stays a separate sibling `hellChipRemove` button with its
  Label-Contract name (`Remove {display}`).

### 3. Add flow: field, then operator + value

1. Focus lands in the inline input (Tab, click-anywhere, or programmatic).
2. Typing filters the field list (ranked by the existing local search over
   label and field id); `ArrowDown` opens the list without typing.
   Single-instance fields that already have an expression are excluded, as
   today.
3. Committing a field option (`Enter`, `Tab` onto an active option, or click)
   opens the **create editor** with that descriptor's projected template.
4. The application editor collects operator and value (its own controls, its
   own Search Resources) and calls `commit(filter)`; a valid commit appends
   the chip, clears the query, returns focus to the inline input, and
   announces `added`. Invalid commits return `false` and change nothing.
5. `Escape` (or focus leaving the editor's Floating Scope) cancels the create
   editor; focus returns to the inline input with the query cleared.

**Editor placement is unified**: the create editor renders in an anchored,
non-modal popover — the same surface behavior the edit flow already uses —
anchored to the frame at its bottom-start, instead of swapping the inline
picker out of the chip flow. Rationale: the inline swap reflows the frame on
every open/close and gives create and edit two different placement models;
prior art (GitLab, Grafana, Kibana) consistently anchors the token editor
under the field surface. The popover registers with the builder's Floating
Scope so nested application surfaces (comboboxes, date pickers) count as
inside for dismissal, exactly as the current editors do. `trapFocus` stays
`false`; the existing create-mode focus-out cancellation (with the
scope-containment check) carries over.

The recommended editor recipe on the docs page shows an operator control
(select/toggle) plus a value control with `Enter` committing — but the
contract only requires `commit`/`cancel`; the shell never inspects editor
internals.

### 4. Edit flow

1. Activating a chip's label (click, or `Enter`/`Space` while the chip has
   roving focus) opens the edit editor in a popover anchored to that chip,
   with the typed context carrying the current expression (`mode: 'edit'`).
2. A valid commit replaces the expression **in place** (array order
   preserved, identity unchanged — the existing
   `commitHellFilterBuilderValue` rules), closes the popover, restores focus
   to the chip, and announces `updated`.
3. `Escape` cancels, closes, restores focus to the chip.
4. Outside interaction dismisses without stealing focus, as today.

Editing never happens through the inline input; the input is exclusively the
create entry point. (GitLab re-opens per-part dropdowns; with whole-token
editors the anchored popover is the equivalent.)

### 5. Remove and clear flows

- The chip's × button removes its filter (pointer path).
- `Delete`/`Backspace` on a focused chip removes it (keyboard path).
- `Backspace` in the **empty** inline input focuses the last removable chip;
  a second `Backspace` removes it (the deliberate two-step guard from the
  Chip Input bridge — never destroy data on the first keypress).
- After a focused removal, the Chip Set focus-continuity contract applies:
  focus moves to the nearest surviving chip, or back to the inline input when
  the removed chip was the last one before the input.
- The clear-all group action empties the whole array, announces `cleared`,
  and returns focus to the inline input. No confirmation step — the action is
  reversible by re-adding, and dense business UIs should not modal-guard it.
- Every mutation stays an immutable whole-array `valueChange` emission; the
  builder never mutates and never initially emits, unchanged.

### 6. Keyboard contract

One frame, three focus stops in tab order: **chip set (roving) → inline
input → clear action** (when present). The editor popover is a transient
fourth surface owning its own focus while open.

| Focus location | Key | Behavior |
| --- | --- | --- |
| Any chip | `ArrowLeft` / `ArrowRight` | Roving focus to previous/next enabled chip (no wrap). |
| Last chip | `ArrowRight` | Focus moves into the inline input. |
| Any chip | `Home` / `End` | Roving focus to first/last enabled chip. |
| Any chip | `Enter` / `Space` | Open the edit editor for that chip. |
| Any chip | `Delete` / `Backspace` | Remove the chip (if removable); focus continuity per Chip Set contract. |
| Any chip | printable character | Focus the inline input and start the query with that character. |
| Any chip | `Escape` | Focus the inline input. |
| Any chip | modified keys (Ctrl/Cmd/Alt) | Not intercepted; browser/platform shortcuts pass through (Chip Set contract when an input is composed). |
| Inline input | typing | Filters field options; dropdown opens with matches. |
| Inline input | `ArrowDown` | Opens the field dropdown; then active-descendant navigation per the Combobox contract (`docs/architecture/keyboard-navigation-matrix.md`). |
| Inline input | `Enter` (active option) | Commits the field option → opens the create editor. |
| Inline input | `Tab` (dropdown open, active option) | Commits like `Enter` instead of leaving the field (GitLab's Tab-commits affordance, already implemented). |
| Inline input, empty | `Backspace` | Focus the last removable chip (two-step removal). |
| Inline input, empty | `ArrowLeft` | Focus the last enabled chip. |
| Inline input | `Escape` | Dropdown open → close it; else query present → clear it; else no-op. |
| Create/edit editor | application keys | Application-owned; the projected template renders real controls. |
| Create/edit editor | `Enter` (recommended recipe) | `commit(filter)`; on success the shell closes and restores focus (input for create, chip for edit). |
| Create/edit editor | `Escape` | `cancel()`; shell closes and restores focus (input for create, chip for edit). |
| Clear action | `Enter` / `Space` | Clear all; focus returns to the inline input. |

Nothing in this table is new invention: it is the union of the existing Chip
Set controller, Chip Input bridge, Combobox pattern, and the current Filter
Builder's token-set handlers — now applying to one framed surface. #363 must
keep the existing behaviors listed here verbatim and add the frame-level
pieces (click-anywhere focus, group action stop).

### 7. Overflow behavior

- **Chips wrap; the frame grows vertically.** The chip set is the frame's
  flexible surface (`min-w-0 flex-1`), rows wrap with the #340 in-group
  spacing so no row touches the border. This intentionally deviates from the
  Control Group's single-line "never grows or wraps" overflow contract;
  chip-in-group is the documented exception, and the Control Group docs must
  say so when #363 lands. Wrap-and-grow follows Linear/Kibana; GitLab's
  horizontal scrolling is rejected because it hides active filters — the
  entire point of chips is glanceable active state.
- **The inline input claims a minimum width** (about `8rem`, refinable via
  Part Style Map) and wraps to its own row when the current row cannot fit
  it; it always sits after the last chip in flow.
- **Long values truncate.** `tokenValue` gets a recipe `max-width` (default
  around `16rem`, refinable per part) with ellipsis truncation; `tokenField`
  and `tokenOperator` keep intrinsic size. The full text remains available
  through the edit trigger's accessible name (`Edit {display}`), the live
  announcements, and the editor itself — truncation is visual only.
- **No built-in "+N more" collapse and no max-height.** Collapse requires
  measurement/overflow runtime (an Overflow-Toolbar-class problem) and is out
  of scope; consumers who must cap height apply a `ui` refinement
  (`tokens: 'max-h-… overflow-y-auto'`) — the docs page documents that as a
  recipe, not a mode input (`mode-inputs.md`).

### 8. Accessibility and announcements

- The chip set keeps `role="group"` with the effective accessible name
  (`aria-label` input or the `input` label). The frame keeps the Control
  Group's `role="group"`/state attributes; two nested groups are acceptable
  and already shipped by the chip-in-group compositions.
- Live-region announcements (`added`, `updated`, `removed`, `cleared`) and
  the `HellFilterBuilderLabels` Label Contract are unchanged. No new label
  keys are required; the clear action reuses `clearAll` and the edit trigger
  reuses `edit(display)`.
- The field picker keeps the editable-Combobox ARIA pattern
  (`role="combobox"`, `aria-activedescendant`) per
  `docs/architecture/keyboard-navigation-matrix.md`.
- Editor popovers keep their accessible name (`edit(display)` for edit; the
  effective builder name for create).

### 9. Unchanged contracts (explicit)

- The controlled value contract: `value`/`valueChange` immutable whole-array
  emissions, required `identify`, create/edit/duplicate/stale commit rules in
  `filter-builder.state.ts`. (Per `0001-control-value-authority.md` the
  Filter Builder's collection state needs its own authority decision; this
  redesign does not change that state model.)
- The projected-editor contract: `HellFilterBuilderEditor` registration, the
  typed `HellFilterBuilderEditorContext`, `commit`/`cancel` semantics, and
  the no-field-kind descriptor philosophy. `displayParts` is the only
  descriptor addition, and it is optional.
- Floating Scope containment and dismissal composition (delegated popover
  engine per `floating-dismissal.md`).
- The chip, Chip Set, Chip Input, and Control Group public contracts — the
  Filter Builder becomes a consumer of the fixed pattern, not a fork of it.

### 10. Non-goals

- A text query language or raw-text-to-token parsing (GitHub/GitLab style).
- Library-owned operator or value schemas, per-segment token dropdowns, or
  any field-kind discriminator.
- Saved filters, OR/grouping semantics between expressions, drag reorder.
- A `size` axis on the Filter Builder (frame `md` + chip `sm` is the single
  shipped density; revisit only with a real consumer need).
- Built-in overflow collapse ("+N more") or measurement runtime.

## Consequences

- **For #363 (implementation):**
  - Restructure the renderer around the frame anatomy in section 1; delete
    the nested Control Group and the detached clear button; move create
    editing into the anchored popover surface.
  - Public Part changes are breaking for this experimental Feature: `root`
    becomes the frame; `control` becomes the inline picker region inside the
    chip flow; `tokenLabel` remains the edit trigger and gains `tokenField`,
    `tokenOperator`, `tokenValue` child parts; `clear` moves onto a group
    action. One Breaking Change Fragment with Part-Style-Map migration
    guidance is required.
  - Add optional `displayParts` to `HellFilterFieldDescriptor` (Added
    fragment) and render segmented labels with flat-`display` fallback.
  - Keep every row of the section 6 keyboard table green: extend
    `e2e/filter-builder-contracts.spec.ts` for the frame focus model, create
    popover, segmented tokens, and clear action;
    `combobox-chip-input-a11y-contracts.spec.ts` already pins the shared
    chip-input bridge.
  - Rewrite the Filter Builder docs page around the new anatomy (recommended
    operator+value editor recipe, wrap/`max-h` overflow recipe, segmented
    display example) and verify hands-on in the browser per AGENTS.md.
  - Document the chip-in-group wrap exception in the Control Group overflow
    prose.
- **For the pattern family:** the Filter Builder becomes the reference
  composition for "chips in a grouped field", aligning the Chip, Combobox,
  and Filter Builder pages on one visual and keyboard contract.
- **Risks:** anchoring the create editor as a popover changes create-flow
  dismissal timing; the existing scope-containment focus-out rule must be
  re-verified in the popover placement (WebKit focus races were already
  stabilized once in #234 — keep that coverage). Segmented labels tempt
  per-segment interactivity; this ADR explicitly rejects it, and reviewers
  should hold that line until a schema-owning design is actually accepted.
