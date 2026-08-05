# ADR: TanStack-owned table shell

- Status: Accepted
- Date: 2026-06-19
- Clarified: 2026-07-15 — column visibility composes the documented
  table-agnostic Multi-Select Menu Button recipe; it is not a table API or a
  separate owned Composite.
- Clarified: 2026-08-05 — TanStack Table v9 adoption; see
  [Adopting TanStack Table v9](#adopting-tanstack-table-v9) for the three
  adopter-facing decisions and the measurements behind them.

## Context

A previous table direction had too many composable table layers: table
primitives, a simple data table, a TanStack adapter, a TanStack Virtual adapter,
and a CDK skin. That overreaches Hell's product boundary. A first-party
data-table renderer, normalized Hell table model, shared table state channels,
CDK table adapter, and separate virtual table entry point would make Hell a
worse custom data-table library instead of a component system that composes with
the best table engine.

TanStack Table remains the intended table engine. Its Angular adapter and feature APIs own table instances, columns, rows, sorting, filtering, pagination, selection, pinning, sizing, virtualization integration, and table state. Hell should make TanStack tables feel excellent in Hell UI without translating TanStack into a competing Hell table engine.

## Decision

Hell supports exactly two table paths:

1. `hell-ui/table` — native-table primitives for semantics, accessibility, styling hooks, sort affordances, resize affordances, row action hooks, selection-control hooks, and primitive-level measurement. This path must not export a normalized table model, row/column state channels, column definition DSL, row draft controller, column visibility panel, grid mode, or first-party data-table renderer.
2. `hell-ui/table-tanstack` — the only high-level table engine path. It provides a reusable Hell-styled TanStack table shell and TanStack-aware controls while requiring callers to create and pass a TanStack `Table<TFeatures, TData>` instance. TanStack column definitions and table state remain the source of truth.

Remove `hell-ui/data-table`, `hell-ui/table-virtual`, and `hell-ui/table-cdk` outright before beta. Do not keep deprecated aliases. Do not document CDK table skinning, a Hell data-table component, or a separate virtual-table path.

## TanStack shell contract

`hell-tanstack-table` owns shell chrome, Hell styling, native table markup, sticky-header chrome, projected shell regions, status rendering, and correct TanStack/FlexRender integration. It does not accept raw `rows`/`columns` and does not create a parallel table model.
The shell owns the standard scroll container and table skeleton by default so sticky headers, pinned columns, and virtualization have a predictable DOM contract. Consumers customize through classes, CSS variables, and projected shell regions rather than rebuilding the scroll skeleton for normal cases.

TanStack column definitions are primary for `header`, `cell`, and `footer` renderers. Projected templates such as `ng-template hellTableShellCell="actions"` are one-off slot fills and are valid only when the matching TanStack column does not define that renderer. Shell-scoped names such as `hellTableShellCell`, `hellTableShellHeader`, `hellTableShellFooterCell`, and `hellTableShellExpandedRow` are canonical. In dev mode, a projected Hell template targeting a slot already defined by TanStack must throw a clear error instead of silently choosing precedence.

Projected cell, header, and footer templates receive native TanStack context, not a Hell wrapper model. The implicit value is the TanStack `Cell<TFeatures, TData, TValue>` or `Header<TFeatures, TData, TValue>` as appropriate, with only direct aliases such as `cell`, `header`, `row`, `column`, and `table`. Derived aliases such as `value`, `label`, `rowId`, `columnId`, `sortable`, `isSelected`, `isPinned`, or `sortDirection` are avoided because they encode semantic choices or TanStack feature state. Consumers can derive those values in Angular templates from the TanStack context.

Expanded rows are supported only as TanStack row expansion rendered by shell chrome. TanStack owns `expanded` state, expanded row models, row expandability, and toggle behavior. Hell may expose an expanded-row template that receives native TanStack `Row<TFeatures, TData>` context, but it must not introduce `activeRowKey`, row draft controllers, detail-panel APIs, or master/detail ownership.

TanStack `columnDef.meta.hell` is reserved for shell element class passthrough only, such as `headerClass`, `cellClass`, and `footerClass` applied to shell-rendered containers. Hell must not read generic `meta` keys and must not define semantic table styling options such as `align`, `cellSpace`, `density`, `width`, or feature state in metadata. Projected templates own only their inner content; shell container classes still come from the TanStack column metadata.

Row-level styling uses explicit class passthrough, not semantic row variants. A shell input may accept a function from native TanStack `Row<TFeatures, TData>` to class values, but Hell must not add shortcuts such as `rowVariant`, `selected`, `active`, or row-state styling modes.

The shell receives one external status value:

- `HellTableStatus.READY`
- `HellTableStatus.LOADING`
- `HellTableStatus.error(error)`

`HellTableStatus` is an exported value namespace/object with readonly singleton values for ready/loading and a typed error factory; consumers do not instantiate a status class. There is no empty status. When status is ready and `table.getRowModel().rows.length === 0`, the shell renders the empty template.

The shell has no automatic hidden fallback UI for loading, error, or empty states. It renders state chrome only from local templates or an explicitly mounted status-view provider such as `provideHellTableStatusViews(...)`. Local templates override provider views. If a required state has no local template and no provider view, dev mode should fail clearly.

Shell regions are repeatable markers such as `hellTableShellToolbar` and `hellTableShellFooter`; children render in template order. Avoid shorthand props such as `pagination`, `filtering`, or `toolbarFilters`. Reusable TanStack-aware controls such as `hell-tanstack-pagination` and filter controls are placed into shell regions and talk directly to the caller-owned TanStack table instance.
Convenience import bundles may be exported, but they must preserve optional dependency isolation. A base bundle may include the shell, region/template directives, TanStack-aware controls, and FlexRender integration, but it must not include virtual directives if doing so imports `@tanstack/virtual-core`. Virtual directives may live in the nested `hell-ui/table-tanstack/virtual` entrypoint so the base shell stays free of TanStack Virtual.

Sticky headers are shell-owned presentation and may be enabled with shell chrome inputs. Column pinning comes entirely from TanStack column pinning state; the shell reflects it with stable Hell classes, data attributes, and namespaced CSS variables such as pinned start/end offsets. CSS owns the actual sticky positioning rules. The shell must not expose parallel pinning inputs or write raw inline fixed `left`/`right` styles.

Virtualization is an optional body strategy registered on the same shell with a directive such as `hellTanStackVirtualRows`. The base shell must remain a normal TanStack shell if that directive is removed. `@tanstack/virtual-core` imports are isolated to virtual strategy files inside the nested `/table-tanstack/virtual` entrypoint; base shell files must not import virtual-specific code. The virtual strategy must support the shell's internal rendered row sequence, including expanded-row items derived from TanStack expansion state, from its first implementation, but it must not expose a supported Hell row-part model. Any first-party internal shell/strategy seam needed by the nested entrypoint must stay under Angular-style `ɵ` names and out of docs. It accepts estimated row size inputs for TanStack Virtual setup and must dynamically measure rendered rows, including expanded rows, from the start. TanStack owns expansion state; TanStack Virtual owns measurement and virtual item math. The normal strategy renders native table markup. The virtual strategy may use non-table markup only when required by virtualization, and then it must document and test its accessible semantics rather than pretending to be equivalent to the native table path.

## Adopting TanStack Table v9

Measured against 9.0.0 on 2026-08-05. The package ships its own migration
reference at `@tanstack/angular-table/skills/migrate-v8-to-v9/SKILL.md`; read
that and `dist/types/` rather than reconstructing v9 from v8 memory.

v9 gates every feature API on the features a table registers at construction.
That single change drove three decisions, each verified with a compile probe
before it was built on.

### 1. Shell classes take `TFeatures` first

Every shell class grows a `TFeatures` parameter ahead of `TData`, matching
TanStack's own order (`Table<TFeatures, TData>`, `Cell<TFeatures, TData, TValue>`).

The alternative — pinning one concrete feature set so the classes keep a single
parameter — is not viable. `Table_Core` is declared `in out TFeatures`, so
`Table` is **invariant** in it: a table registering even one feature Hell does
not name is not assignable to `Table<HellFeatures, TData>`. Pinning a set would
therefore lock adopters out of row selection, grouping and faceting, escapable
only by a cast. Inverting the order to `HellTanStackTable<TData, TFeatures>` was
rejected outright: sitting next to `Table<TFeatures, TData>` it is a permanent
foot-gun.

Both parameters are inferred from the `[table]` binding, so template call sites
did not change; only explicit type annotations did.

### 2. Each shell class names the features it reads

Requirements are per class, not one shared union, so a caller who wants a sorted
table never has to register pagination or filtering:

| Class | Requires |
|---|---|
| `hell-tanstack-table` | `columnPinningFeature`, `columnResizingFeature`, `columnSizingFeature`, `columnVisibilityFeature`, `rowExpandingFeature`, `rowSortingFeature` |
| `hell-tanstack-pagination` | `rowPaginationFeature` |
| `hell-tanstack-global-filter` | `columnFilteringFeature`, `globalFilteringFeature` |
| `hell-tanstack-column-filter` | `columnFilteringFeature` |

Each is a named interface extending `TableFeatures`, so a missing feature fails
with a diagnostic naming the interface and the absent feature keys rather than a
missing method.

`columnOrderingFeature` is deliberately **not** required. v8's
`getIsFirstColumn`/`getIsLastColumn` moved onto column ordering in v9, so the
pinned-edge flags ask pinning for its own edges instead —
`getStartVisibleLeafColumns()` / `getEndVisibleLeafColumns()`.

`columnResizingFeature` is required even though it only decides whether a resize
separator renders, which costs non-resizing adopters the resizing state. Making
resizing a separate opt-in directive would remove that cost and is the better
long-term shape, but it moves the separator out of the shell template — a public
API redesign that does not belong inside a dependency migration. Recorded as
follow-up work, not settled against.

### 3. `@tanstack/table-core` does not become a peer

An earlier investigation recorded that v9's `@tanstack/angular-table` re-exports
only `rowPaginationFeature`, which would have made `@tanstack/table-core` a new
published peer. That is wrong: the adapter does `export * from
'@tanstack/table-core'` at both the type and the runtime level, so all 16
features, every `create*RowModel` factory, and every feature-slice type are
reachable from `@tanstack/angular-table` — already a peer. Nothing changed in
the architecture guard's peer-class lists.

### How the shell reads gated APIs while staying generic

A type generic over `TFeatures` cannot reach feature APIs as instance methods:
TanStack's feature-map lookup is a conditional type that stays unresolved while
`TFeatures` is a type parameter, so `Table<TFeatures, TData>` exposes only core
members. Intersecting the published feature-slice interfaces does not rescue it
either, because columns and rows obtained *from* the table come back as bare
generic types and are not assignable to the intersected forms.

TanStack special-cases `TFeatures = any` to expose everything — v8's bundled
behaviour — but `@typescript-eslint/no-explicit-any` is an error here and
`packages/angular` contains no explicit `any`. `Table<TableFeatures, TData>`
reaches the same effect without the keyword, but a concrete table is not
assignable to it (invariance again), so it cannot be an input type.

The shell therefore reads gated APIs through
`@tanstack/angular-table/static-functions`. Those functions are themselves
generic over `TFeatures` and take the instance as their first argument, which is
exactly this case. Core APIs (`getRowModel`, `getHeaderGroups`, `getColumn`,
`getContext`, `renderValue`) are not gated and stay instance methods.

Three further reads use TanStack's own broadened views, which are intersections
rather than gated conditionals and so resolve generically:

- state: `table.atoms.<slice>` typed from `Atoms_All`, replacing `getState()`.
  Slices are optional there, so each read falls back to TanStack's own
  `getDefault*State()` rather than a value Hell invents.
- column size bounds: `ColumnDefBase_All`, since `minSize`/`maxSize` live on the
  sizing slice of the column definition.
- `enableColumnResizing`: `TableOptions_All`.

`defaultColumnSizing` is gone; `getDefaultColumnSizingColumnDef()` from the
static-function entry point replaces it. `table._getDefaultColumnDef()` became
the public `table.getDefaultColumnDef()`.

### Logical pinning

Pinning is logical in v9: `'left'`/`'right'` became `'start'`/`'end'` throughout.
The shell publishes `data-pinned="start" | "end"` and the stylesheet positions
with `inset-inline-start`/`inset-inline-end` instead of `left`/`right`, so pinned
columns now resolve against the writing direction. This is a DOM contract change
for anyone selecting on `[data-pinned='left']`.

## Consequences

- The old table examples become either tiny native `/table` primitive examples or `/table-tanstack` examples.
- Dynamic business-table docs route to `/table-tanstack`.
- Column visibility UI is removed from table APIs. Consumers may compose the
  documented table-agnostic Multi-Select Menu Button recipe from `hellButton`
  and checkbox Menu primitives while keeping TanStack visibility state as the
  source of truth.
- Existing architecture, package-consumer, docs, and API gates must be rewritten around the two supported paths and must reject the removed entry points.
