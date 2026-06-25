# ADR: Resize behavior ownership

- Status: Accepted
- Date: 2026-06-01

## Context

Resize behavior is a manual runtime risk because pointer capture, keyboard
resize, minimum-size math, and table layout constraints are easy to get subtly
wrong. The decision must keep separator-style resize narrow and must not reopen
grid keyboard, column-model, or data-source ownership outside the primitive and
table-shell boundary.

Current local implementation evidence:

- `projects/hell/src/lib/core/resize-behavior.ts` owns a small, framework-agnostic adjacent-pair resize model: min-size clamping, total-preserving deltas, horizontal/vertical coordinates, RTL horizontal inversion, arrow/Home/End key intents, pointer capture/listeners, commit callbacks, and dynamic pair lookup.
- `projects/hell/src/lib/composites/resizable/resizable.ts` uses that shared runtime for flex split panes. A handle lives between sibling panes, exposes `role="separator"`, `aria-orientation`, `aria-valuemin/max/now`, `aria-controls`, pointer drag, and keyboard resize.
- Table resize uses the same runtime for adjacent header/cell pairs through the
  `hellTableResizeHandle` primitive.
- Existing unit tests cover math, RTL key/pointer semantics, pointer lifecycle, keyboard commit, resizable pane redistribution, table adjacent-column keyboard/pointer resizing, disabled-last-column behavior, ARIA attributes, and sort/resizer interaction separation.

External sources checked:

- Context7 `/websites/angular_dev` and `https://angular.dev/guide/drag-drop`: CDK DragDrop is for free dragging, reorderable/transfer lists, custom drag handles, previews/placeholders, axis locks, boundaries, and drag position restoration.
- `https://next.material.angular.dev/docs-content/api-docs/cdk-drag-drop`: `CdkDrag` exposes `cdkDragBoundary`, `cdkDragConstrainPosition`, `cdkDragFreeDragPosition`, `cdkDragLockAxis`, lifecycle events, `cdkDragMoved`, and `CdkDragHandle`; `DragRef` exposes pointer-drag state and position APIs.
- WAI-ARIA APG Window Splitter pattern: a focusable splitter is a `separator` with an accessible name, `aria-controls`, `aria-valuenow/min/max`, arrow-key movement, and optional Home/End movement to min/max positions.

## Decision

Keep Hell's resize behavior as a narrow, documented **adjacent-pair resize adapter**, and add browser-level contract tests before production-ready claims.

Do **not** replace it with CDK DragDrop. CDK DragDrop should remain the first
choice for future draggable/reorderable/drop-list interactions, but it is not a
drop-in replacement for the current resize contract because Hell must update two
caller-owned layout items, preserve their combined size, expose
splitter/separator keyboard semantics, and support table-specific adjacent
header width transactions.

The kept contract is intentionally small:

- Split-pane handles may resize the panes immediately before and after the handle.
- Table resize handles may resize only adjacent header/cell layout items in the same semantic or adapter-rendered row contract.
- The shared runtime may own pointer capture/listener cleanup, key-to-intent mapping, min-size math, RTL horizontal inversion, and commit/value callbacks.
- Caller-specific code owns layout storage: flex pane CSS variables for resizable panes; table column ids, width CSS variables, and committed resize payloads for modern table primitives/adapters.

This is a **keep+test** decision, not permission to grow a drag/drop or data-grid framework. Reopen this ADR if resize behavior starts needing CDK-like features such as free dragging, auto-scroll, previews/placeholders, drop targets, sortable/reorderable lists, persistent column schema, Hell-owned column visibility/reorder/pinning state, roving grid focus, or grid-wide selection shortcuts.

## Options compared

| Option | Benefits | Costs | Decision |
| --- | --- | --- | --- |
| Replace with CDK DragDrop | Delegates pointer lifecycle, handles, axis locks, boundaries, drag thresholds, and drag events to Angular CDK. Aligns with the target architecture preference to delegate hard browser behavior. | Still needs custom width math, adjacent-pair storage, separator ARIA, keyboard resizing, min/max/Home/End behavior, RTL share math, table column event shape, and table-layout constraints. `cdkDrag` moves a root element/preview with transforms; Hell needs to resize two existing layout items and not insert drag previews/placeholders into table markup. `cdkDragMoved` fires for every pixel, so callers would still own throttling/math/commit policy. | Rejected for this contract. Use CDK DragDrop for actual dragging/reordering work, not separator resize. |
| Replace with a purpose-built split-pane/table-resize dependency | Could outsource mature split-pane edge cases or table column resizing if a library matches Hell's semantics. | Adds another dependency surface and likely still needs table-specific adapters. Split panes and semantic table headers have different DOM/layout constraints. | Rejected for now. Reconsider only if browser contracts expose failures that are cheaper to delegate than fix. |
| Keep current runtime but document obligations and add browser contracts | Keeps a compact adapter already shared by split panes and table columns. Keeps table-specific state out of the generic runtime. Avoids forcing CDK's draggable/preview/drop-list model onto a separator-resize problem. | Hell continues to own pointer capture cleanup, keyboard mapping, ARIA value updates, RTL/min/max math, and browser regression coverage. | Chosen. Browser contracts must guard the modern resize handles. |
| Shrink to pure math only and duplicate pointer/keyboard in each caller | Reduces shared runtime surface. | Duplicates pointer capture/listener cleanup and keyboard semantics in resizable/table code, making the same risk easier to fork. | Rejected until a real duplicate-pressure or API-surface problem appears. |

## Keyboard resize obligations

Every public resize handle that uses this runtime must meet these obligations:

- Use a focusable `role="separator"` when enabled.
- Provide an accessible name (`aria-label` or `aria-labelledby`) and, where the controlled pane/cell id is available, `aria-controls`.
- Provide `aria-orientation` matching the separator line: vertical separators use Left/Right; horizontal separators use Up/Down.
- Provide `aria-valuemin="0"`, `aria-valuemax="100"`, and an `aria-valuenow` percentage representing the primary/before pane or column share.
- Arrow keys move by the configured small step (`HELL_RESIZE_KEY_DELTA`, currently 16 px) and prevent default only when a resize is applied.
- Home moves to the primary/before item minimum; End moves to the primary/before item maximum while preserving the secondary/after item minimum.
- Horizontal RTL inverts Left/Right intent so visual movement remains correct.
- Focus remains on the handle after keyboard resize; callers must not convert this into grid roving focus or row activation.
- Disabled/non-resizable handles must not be focusable or intercept keyboard events; any remaining ARIA exposure for disabled separators must be covered by the browser contract or split into a follow-up fix.

## Pointer resize obligations

Every public pointer resize handle that uses this runtime must meet these obligations:

- Start only from the primary pointer button; ignore non-primary button presses.
- Prevent default during active resize and use CSS such as `touch-action: none` / `user-select: none` on handles so dragging does not scroll or select text.
- Use pointer capture when available, with window-level `pointermove`, `pointerup`, and `pointercancel` cleanup as a fallback/backup.
- Update live layout and `aria-valuenow` during movement without emitting the public committed transaction until the drag ends.
- Commit once on `pointerup`/`pointercancel`, clear active styling, and release pointer capture/listeners on completion or component destroy.
- Preserve the before+after total size unless minimum sizes cannot fit; clamp rather than let a pane/column disappear.
- Respect horizontal RTL delta inversion.
- For table resize handles, stop propagation so resize pointer events do not also sort headers, activate row actions, or leak into table/grid shortcuts.

## Table-specific constraints

`hellTableResizeHandle` replaces the legacy `hellTableColumnResizer` name and stays a separator-style table primitive/adaptor seam, not a data-grid column manager:

- It may resize only adjacent table layout items with stable `columnId` values.
- It must emit committed widths for the affected columns plus their share of the total transaction.
- It must not own column persistence, pinning, reorder, virtualization, selection, visibility, or data-source policy.
- It must not add `role="grid"`, roving tabindex, `aria-activedescendant`, or grid cell-navigation semantics.
- The table docs must continue to describe column resizing as a narrow primitive/adaptor seam, not proof that Hell owns a full grid.

## Consequences

- Architecture reviewers should treat untested browser behavior, not the mere existence of custom resize math, as the remaining blocker.
- If browser contracts find behavior that unit tests miss and CDK DragDrop can
  cover with less code, reopen this ADR and create a replace/shrink task instead
  of patching broadly.
- Table resize remains a `/table` primitive affordance or TanStack-shell styling
  seam, not a Hell column model.
