# Table Contract

Read this for any table primitive, table docs, TanStack shell, pagination,
filtering, resizing, virtual rows, or table package work.

## Supported Paths

- Hell supports exactly two table paths:
  `hell-ui/table` for native-table primitives and
  `hell-ui/table-tanstack` for the TanStack Table Shell.
- Do not add `hell-ui/data-table`, `table-virtual`, `table-cdk`, a
  normalized Hell table model, grid mode, row draft controller, column
  definition DSL, column visibility panel, or first-party data-table renderer.

## TanStack Ownership

- TanStack owns table instances, row/column models, sorting, filtering,
  pagination, grouping, selection, pinning, sizing, expansion, virtualization,
  and state.
- The shell requires a caller-owned `Table<T>`. It does not accept raw
  rows/columns and does not translate TanStack into a Hell engine.
- TanStack column definitions own header/cell/footer renderers. Projected Hell
  templates fill only otherwise undefined one-off slots and receive native
  TanStack context.
- Shell status is ready, loading, or error. Empty chrome is inferred from the
  ready row model, not a separate status.
- Shell regions are repeatable projected regions, not shorthand props for
  pagination, filtering, or toolbars.
- Virtualization is an optional `/table-tanstack/virtual` body strategy. Column
  pinning comes from TanStack state and is reflected by Hell classes,
  `data-*`, and CSS variables.

Completion criterion: table work is done only when it preserves the two-path
boundary and proves any changed path through docs, architecture guards, package
consumer checks, or browser tests that match the touched surface.
