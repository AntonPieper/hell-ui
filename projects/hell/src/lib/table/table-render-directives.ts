import { Directive, Input, TemplateRef, inject, type Type } from '@angular/core';

import { hellTemplateRenderer } from './table-columns';
import {
  hellTableCreateRenderRegistry,
  type HellTableCellRenderContext,
  type HellTableColumnId,
  type HellTableEditFieldRenderContext,
  type HellTableHeaderRenderContext,
  type HellTableRenderer,
  type HellTableRenderRegistry,
  type HellTableRenderRegistryInput,
  type HellTableTemplateRenderer,
  type HellTableRowEditorRenderContext,
  type HellTableRowRenderContext,
} from './table-model';

/** Projected cell template registered by column id. */
@Directive({
  selector: 'ng-template[hellCell]',
  exportAs: 'hellCell',
})
export class HellCell<TData = unknown, TValue = unknown> {
  @Input('hellCell') columnId: HellTableColumnId = '';
  readonly template = inject(TemplateRef<HellTableCellRenderContext<TData, TValue>>);

  renderer(): HellTableTemplateRenderer<unknown> {
    return hellTemplateRenderer(this.template);
  }
}

/** Projected header-cell template registered by column id. */
@Directive({
  selector: 'ng-template[hellHeaderCell]',
  exportAs: 'hellHeaderCell',
})
export class HellHeaderCell<TData = unknown> {
  @Input('hellHeaderCell') columnId: HellTableColumnId = '';
  readonly template = inject(TemplateRef<HellTableHeaderRenderContext<TData>>);

  renderer(): HellTableTemplateRenderer<unknown> {
    return hellTemplateRenderer(this.template);
  }
}

/** Projected row-actions template registered by actions slot id or action column id. */
@Directive({
  selector: 'ng-template[hellRowActions]',
  exportAs: 'hellRowActions',
})
export class HellRowActions<TData = unknown> {
  @Input('hellRowActions') id = '';
  readonly template = inject(TemplateRef<HellTableRowRenderContext<TData>>);

  renderer(): HellTableTemplateRenderer<unknown> {
    return hellTemplateRenderer(this.template);
  }
}

/** Projected row-editor template registered by editor slot id. */
@Directive({
  selector: 'ng-template[hellRowEditor]',
  exportAs: 'hellRowEditor',
})
export class HellRowEditor<TData = unknown> {
  @Input('hellRowEditor') id = '';
  readonly template = inject(TemplateRef<HellTableRowEditorRenderContext<TData>>);

  renderer(): HellTableTemplateRenderer<unknown> {
    return hellTemplateRenderer(this.template);
  }
}

/** Projected field template registered by row-editor field id. */
@Directive({
  selector: 'ng-template[hellEditField]',
  exportAs: 'hellEditField',
})
export class HellEditField<TData = unknown, TValue = unknown> {
  @Input('hellEditField') fieldId = '';
  readonly template = inject(TemplateRef<HellTableEditFieldRenderContext<TData, TValue>>);

  renderer(): HellTableTemplateRenderer<unknown> {
    return hellTemplateRenderer(this.template);
  }
}

/** Projected render templates collected from content/view queries. */
export interface HellProjectedTableRenderers<TData = unknown> {
  readonly cells?: Iterable<HellCell<TData, unknown>>;
  readonly headers?: Iterable<HellHeaderCell<TData>>;
  readonly rowActions?: Iterable<HellRowActions<TData>>;
  readonly rowEditors?: Iterable<HellRowEditor<TData>>;
  readonly editFields?: Iterable<HellEditField<TData, unknown>>;
}

/** Creates a render registry from projected template directives. */
export function hellTableCreateProjectedRenderRegistry<TData>(
  projected: HellProjectedTableRenderers<TData>,
  base: HellTableRenderRegistryInput<TData> = {},
): HellTableRenderRegistry<TData> {
  const headers = { ...(base.headers ?? {}) };
  const cells = { ...(base.cells ?? {}) };
  const rowActions = { ...(base.rowActions ?? {}) };
  const rowEditors = { ...(base.rowEditors ?? {}) };
  const editFields = { ...(base.editFields ?? {}) };

  for (const template of projected.headers ?? []) {
    headers[template.columnId] =
      template.renderer() as HellTableRenderer<HellTableHeaderRenderContext<TData>>;
  }
  for (const template of projected.cells ?? []) {
    cells[template.columnId] =
      template.renderer() as HellTableRenderer<HellTableCellRenderContext<TData, unknown>>;
  }
  for (const template of projected.rowActions ?? []) {
    rowActions[template.id] =
      template.renderer() as HellTableRenderer<HellTableRowRenderContext<TData>>;
  }
  for (const template of projected.rowEditors ?? []) {
    rowEditors[template.id] =
      template.renderer() as HellTableRenderer<HellTableRowEditorRenderContext<TData>>;
  }
  for (const template of projected.editFields ?? []) {
    editFields[template.fieldId] =
      template.renderer() as HellTableRenderer<HellTableEditFieldRenderContext<TData, unknown>>;
  }

  return hellTableCreateRenderRegistry({ headers, cells, rowActions, rowEditors, editFields });
}

/** Standalone imports for projected table render-template directives. */
export const HELL_TABLE_RENDER_DIRECTIVES: readonly Type<unknown>[] = [
  HellCell,
  HellHeaderCell,
  HellRowActions,
  HellRowEditor,
  HellEditField,
];
