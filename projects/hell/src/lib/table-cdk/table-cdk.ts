import { Directive } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';

import {
  HellTable,
  HellTableCell,
  HellTableHeaderCell,
  HellTableResizeHandle,
  HellTableRow,
  HellTableRowAction,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableSelectionCell,
  HellTableSortTrigger,
} from '../features/table-utilities/table-utilities';
export {
  HellTable,
  HellTableCell,
  HellTableHeaderCell,
  HellTableResizeHandle,
  HellTableRow,
  HellTableRowAction,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableSelectionCell,
  HellTableSortTrigger,
} from '../features/table-utilities/table-utilities';
import {
  hellTableColumnIsVisible,
  type HellTableColumn,
  type HellTableColumnVisibilityState,
} from '../table/table';

/** Column shape needed when deriving CDK row-def column ids from Hell visibility state. */
export type HellCdkDisplayedColumnInput<TData = unknown> = Pick<
  HellTableColumn<TData>,
  'id' | 'visibility' | 'visible' | 'hideable'
>;

/**
 * Guidance for the CDK virtualization path.
 *
 * CDK table virtual scrolling is the fixed-size route: use a
 * `cdk-virtual-scroll-viewport` with `itemSize`/fixed row height and keep the
 * data source, sorting, and pagination in the app or CDK layer. Dynamic
 * row/detail/editor heights stay on `@hell-ui/angular/table-virtual`, backed by
 * the TanStack Virtual adapter and Hell row-part measurements.
 */
export const HELL_CDK_TABLE_VIRTUAL_SCROLL_GUIDANCE =
  'CDK table virtual scrolling is supported for fixed-size rows; use @hell-ui/angular/table-virtual for dynamic-height TanStack Virtual row parts.';

/**
 * Derives the CDK `cdkHeaderRowDef`/`cdkRowDefColumns` list from Hell column
 * definitions and app-owned `columnVisibility` state.
 *
 * CDK still owns the row definitions, data source, sorting, pagination, and
 * rendering. Hell only supplies the visibility rule and skin primitives.
 */
export function hellCdkDisplayedColumns<TData>(
  columns: readonly HellCdkDisplayedColumnInput<TData>[],
  columnVisibility: HellTableColumnVisibilityState = {},
): readonly string[] {
  return columns
    .filter((column) => hellTableColumnIsVisible(column, columnVisibility))
    .map((column) => column.id);
}

/** Applies Hell table-root primitives to `<cdk-table>` and native `<table cdk-table>` hosts. */
@Directive({
  selector: 'cdk-table, table[cdk-table]',
  exportAs: 'hellCdkTable',
  hostDirectives: [{ directive: HellTable, inputs: ['unstyled', 'contentWidth'] }],
  host: {
    '[attr.data-hell-cdk-table]': '""',
  },
})
export class HellCdkTable {}

/** Applies Hell row primitives to CDK header rows without replacing CDK row definitions. */
@Directive({
  selector: 'cdk-header-row, tr[cdk-header-row]',
  exportAs: 'hellCdkHeaderRow',
  hostDirectives: [{ directive: HellTableRow, inputs: ['unstyled', 'active', 'selected'] }],
  host: {
    '[attr.data-hell-cdk-header-row]': '""',
  },
})
export class HellCdkHeaderRow {}

/** Applies Hell row primitives to CDK data rows without replacing CDK row definitions. */
@Directive({
  selector: 'cdk-row, tr[cdk-row]',
  exportAs: 'hellCdkRow',
  hostDirectives: [{ directive: HellTableRow, inputs: ['unstyled', 'active', 'selected'] }],
  host: {
    '[attr.data-hell-cdk-row]': '""',
  },
})
export class HellCdkRow {}

/** Applies Hell row primitives to CDK footer rows without replacing CDK row definitions. */
@Directive({
  selector: 'cdk-footer-row, tr[cdk-footer-row]',
  exportAs: 'hellCdkFooterRow',
  hostDirectives: [{ directive: HellTableRow, inputs: ['unstyled', 'active', 'selected'] }],
  host: {
    '[attr.data-hell-cdk-footer-row]': '""',
  },
})
export class HellCdkFooterRow {}

/** Applies Hell header-cell primitives to CDK header cells. */
@Directive({
  selector: 'cdk-header-cell, th[cdk-header-cell]',
  exportAs: 'hellCdkHeaderCell',
  hostDirectives: [
    {
      directive: HellTableHeaderCell,
      inputs: ['unstyled', 'sort', 'sortable', 'columnId'],
      outputs: ['sortToggle'],
    },
  ],
  host: {
    '[attr.data-hell-cdk-header-cell]': '""',
  },
})
export class HellCdkHeaderCell {}

/** Applies Hell data-cell primitives to CDK cells. */
@Directive({
  selector: 'cdk-cell, td[cdk-cell]',
  exportAs: 'hellCdkCell',
  hostDirectives: [{ directive: HellTableCell, inputs: ['unstyled', 'align', 'space'] }],
  host: {
    '[attr.data-hell-cdk-cell]': '""',
  },
})
export class HellCdkCell {}

/** Applies Hell data-cell primitives to CDK footer cells. */
@Directive({
  selector: 'cdk-footer-cell, td[cdk-footer-cell]',
  exportAs: 'hellCdkFooterCell',
  hostDirectives: [{ directive: HellTableCell, inputs: ['unstyled', 'align', 'space'] }],
  host: {
    '[attr.data-hell-cdk-footer-cell]': '""',
  },
})
export class HellCdkFooterCell {}

/**
 * Standalone imports for using CDK Table with the Hell skin adapter.
 *
 * Importing this list enables CDK table declarations and automatically layers
 * Hell table primitives onto CDK table, row, and cell hosts in the same template
 * scope. CDK row definitions and data sources remain app/CDK-owned.
 */
export const HELL_CDK_TABLE_DIRECTIVES = [
  CdkTableModule,
  HellCdkTable,
  HellCdkHeaderRow,
  HellCdkRow,
  HellCdkFooterRow,
  HellCdkHeaderCell,
  HellCdkCell,
  HellCdkFooterCell,
  HellTableSortTrigger,
  HellTableResizeHandle,
  HellTableSelectionCell,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableRowAction,
] as const;
