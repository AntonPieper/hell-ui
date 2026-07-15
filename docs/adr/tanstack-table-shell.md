# ADR: TanStack-owned table shell

- Status: Accepted
- Date: 2026-06-19
- Clarified: 2026-07-15 — column visibility composes the documented
  table-agnostic Multi-Select Menu Button recipe; it is not a table API or a
  separate owned Composite.

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

1. `@hell-ui/angular/table` — native-table primitives for semantics, accessibility, styling hooks, sort affordances, resize affordances, row action hooks, selection-control hooks, and primitive-level measurement. This path must not export a normalized table model, row/column state channels, column definition DSL, row draft controller, column visibility panel, grid mode, or first-party data-table renderer.
2. `@hell-ui/angular/table-tanstack` — the only high-level table engine path. It provides a reusable Hell-styled TanStack table shell and TanStack-aware controls while requiring callers to create and pass a TanStack `Table<T>` instance. TanStack column definitions and table state remain the source of truth.

Remove `@hell-ui/angular/data-table`, `@hell-ui/angular/table-virtual`, and `@hell-ui/angular/table-cdk` outright before beta. Do not keep deprecated aliases. Do not document CDK table skinning, a Hell data-table component, or a separate virtual-table path.

## TanStack shell contract

`hell-tanstack-table` owns shell chrome, Hell styling, native table markup, sticky-header chrome, projected shell regions, status rendering, and correct TanStack/FlexRender integration. It does not accept raw `rows`/`columns` and does not create a parallel table model.
The shell owns the standard scroll container and table skeleton by default so sticky headers, pinned columns, and virtualization have a predictable DOM contract. Consumers customize through classes, CSS variables, and projected shell regions rather than rebuilding the scroll skeleton for normal cases.

TanStack column definitions are primary for `header`, `cell`, and `footer` renderers. Projected templates such as `ng-template hellTableShellCell="actions"` are one-off slot fills and are valid only when the matching TanStack column does not define that renderer. Shell-scoped names such as `hellTableShellCell`, `hellTableShellHeader`, `hellTableShellFooterCell`, and `hellTableShellExpandedRow` are canonical. In dev mode, a projected Hell template targeting a slot already defined by TanStack must throw a clear error instead of silently choosing precedence.

Projected cell, header, and footer templates receive native TanStack context, not a Hell wrapper model. The implicit value is the TanStack `Cell<TData, TValue>` or `Header<TData, TValue>` as appropriate, with only direct aliases such as `cell`, `header`, `row`, `column`, and `table`. Derived aliases such as `value`, `label`, `rowId`, `columnId`, `sortable`, `isSelected`, `isPinned`, or `sortDirection` are avoided because they encode semantic choices or TanStack feature state. Consumers can derive those values in Angular templates from the TanStack context.

Expanded rows are supported only as TanStack row expansion rendered by shell chrome. TanStack owns `expanded` state, expanded row models, row expandability, and toggle behavior. Hell may expose an expanded-row template that receives native TanStack `Row<TData>` context, but it must not introduce `activeRowKey`, row draft controllers, detail-panel APIs, or master/detail ownership.

TanStack `columnDef.meta.hell` is reserved for shell element class passthrough only, such as `headerClass`, `cellClass`, and `footerClass` applied to shell-rendered containers. Hell must not read generic `meta` keys and must not define semantic table styling options such as `align`, `cellSpace`, `density`, `width`, or feature state in metadata. Projected templates own only their inner content; shell container classes still come from the TanStack column metadata.

Row-level styling uses explicit class passthrough, not semantic row variants. A shell input may accept a function from native TanStack `Row<TData>` to class values, but Hell must not add shortcuts such as `rowVariant`, `selected`, `active`, or row-state styling modes.

The shell receives one external status value:

- `HellTableStatus.READY`
- `HellTableStatus.LOADING`
- `HellTableStatus.error(error)`

`HellTableStatus` is an exported value namespace/object with readonly singleton values for ready/loading and a typed error factory; consumers do not instantiate a status class. There is no empty status. When status is ready and `table.getRowModel().rows.length === 0`, the shell renders the empty template.

The shell has no automatic hidden fallback UI for loading, error, or empty states. It renders state chrome only from local templates or an explicitly mounted status-view provider such as `provideHellTableStatusViews(...)`. Local templates override provider views. If a required state has no local template and no provider view, dev mode should fail clearly.

Shell regions are repeatable markers such as `hellTableShellToolbar` and `hellTableShellFooter`; children render in template order. Avoid shorthand props such as `pagination`, `filtering`, or `toolbarFilters`. Reusable TanStack-aware controls such as `hell-tanstack-pagination` and filter controls are placed into shell regions and talk directly to the caller-owned TanStack table instance.
Convenience import bundles may be exported, but they must preserve optional dependency isolation. A base bundle may include the shell, region/template directives, TanStack-aware controls, and FlexRender integration, but it must not include virtual directives if doing so imports `@tanstack/virtual-core`. Virtual directives may live in the nested `@hell-ui/angular/table-tanstack/virtual` entrypoint so the base shell stays free of TanStack Virtual.

Sticky headers are shell-owned presentation and may be enabled with shell chrome inputs. Column pinning comes entirely from TanStack column pinning state; the shell reflects it with stable Hell classes, data attributes, and namespaced CSS variables such as pinned start/end offsets. CSS owns the actual sticky positioning rules. The shell must not expose parallel pinning inputs or write raw inline fixed `left`/`right` styles.

Virtualization is an optional body strategy registered on the same shell with a directive such as `hellTanStackVirtualRows`. The base shell must remain a normal TanStack shell if that directive is removed. `@tanstack/virtual-core` imports are isolated to virtual strategy files inside the nested `/table-tanstack/virtual` entrypoint; base shell files must not import virtual-specific code. The virtual strategy must support the shell's internal rendered row sequence, including expanded-row items derived from TanStack expansion state, from its first implementation, but it must not expose a supported Hell row-part model. Any first-party internal shell/strategy seam needed by the nested entrypoint must stay under Angular-style `ɵ` names and out of docs. It accepts estimated row size inputs for TanStack Virtual setup and must dynamically measure rendered rows, including expanded rows, from the start. TanStack owns expansion state; TanStack Virtual owns measurement and virtual item math. The normal strategy renders native table markup. The virtual strategy may use non-table markup only when required by virtualization, and then it must document and test its accessible semantics rather than pretending to be equivalent to the native table path.

## Consequences

- The old table examples become either tiny native `/table` primitive examples or `/table-tanstack` examples.
- Dynamic business-table docs route to `/table-tanstack`.
- Column visibility UI is removed from table APIs. Consumers may compose the
  documented table-agnostic Multi-Select Menu Button recipe from `hellButton`
  and checkbox Menu primitives while keeping TanStack visibility state as the
  source of truth.
- Existing architecture, package-consumer, docs, and API gates must be rewritten around the two supported paths and must reject the removed entry points.
