import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_TABLE_RENDER_DIRECTIVES,
  HellCell,
  HellEditField,
  HellHeaderCell,
  HellRowActions,
  HellRowEditor,
  actionColumn,
  booleanColumn,
  hellColumns,
  hellComponentRenderer,
  hellTableColumnValue,
  hellTableComponentRendererInputs,
  hellTableCreateProjectedRenderRegistry,
  hellTableCreateRenderRegistry,
  hellTableEvaluateRenderer,
  hellTableIsComponentRenderer,
  hellTableIsTemplateRenderer,
  hellTableResolveCellRenderer,
  hellTableResolveHeaderRenderer,
  selectColumn,
  selectionColumn,
  textColumn,
  type HellColumnDef,
  type HellTableCellRenderContext,
  type HellTableModelRow,
} from './table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly role: 'admin' | 'user';
  readonly score: number;
}

const ada: Person = { id: 'ada', name: 'Ada', active: true, role: 'admin', score: 42 };

@Component({
  imports: [...HELL_TABLE_RENDER_DIRECTIVES],
  template: `
    <ng-template [hellCell]="'name'" let-value="value">{{ value }}</ng-template>
    <ng-template [hellHeaderCell]="'name'" let-header="header">{{ header.label }}</ng-template>
    <ng-template [hellRowActions]="'actions'" let-row="row">{{ row.key }}</ng-template>
    <ng-template [hellRowEditor]="'detail'" let-row="row">{{ row.key }}</ng-template>
    <ng-template [hellEditField]="'role'" let-value="value">{{ value }}</ng-template>
  `,
})
class ProjectedRendererHost {
  @ViewChild(HellCell) cell!: HellCell;
  @ViewChild(HellHeaderCell) header!: HellHeaderCell;
  @ViewChild(HellRowActions) rowActions!: HellRowActions;
  @ViewChild(HellRowEditor) rowEditor!: HellRowEditor;
  @ViewChild(HellEditField) editField!: HellEditField;
}

@Component({
  template: '',
})
class NameCellRenderer {}

describe('Hell table column DSL and renderer registry', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedRendererHost],
    }).compileComponents();
  });

  it('creates typed column definitions with ids, accessors, visibility, sizing, sortability, and metadata', () => {
    const columns = hellColumns<Person>();
    const definitions = columns.define([
      columns.text<string>('name', {
        accessor: 'name',
        header: 'Name',
        visibility: { visible: true, hideable: true },
        sizing: { size: 180, minSize: 120, maxSize: 320 },
        sortable: true,
        meta: { priority: 'primary' },
      }),
      columns.boolean<boolean>('active', {
        accessor: (row) => row.active,
        visible: false,
        sortable: false,
      }),
      columns.select<Person['role']>('role', {
        accessor: 'role',
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'user', label: 'User' },
        ],
      }),
      columns.action({ header: 'Actions', meta: { slot: 'row-actions' } }),
      columns.selection('select', {
        mode: 'radio',
        selectAll: false,
        radioName: 'primary-person',
        ariaLabel: (row) => `Choose ${row.name}`,
        disabled: (row) => !row.active,
      }),
    ]);
    const defaultText = textColumn<Person, string>('name');
    const directText = textColumn<Person, string>('displayName', { accessor: (row) => row.name });
    const directBoolean = booleanColumn<Person, boolean>('active', { accessor: 'active' });
    const directSelect = selectColumn<Person, Person['role']>('role', { accessor: 'role' });
    const directAction = actionColumn<Person>('actions');
    const directSelection = selectionColumn<Person>('selection');

    expect(definitions.map((column) => column.id)).toEqual([
      'name',
      'active',
      'role',
      'actions',
      'select',
    ]);
    expect(definitions[0].accessor?.(ada)).toBe('Ada');
    expect(definitions[0]).toEqual(
      expect.objectContaining({
        kind: 'text',
        header: 'Name',
        visible: true,
        hideable: true,
        sortable: true,
        size: 180,
        minSize: 120,
        maxSize: 320,
        meta: { priority: 'primary' },
      }),
    );
    expect(definitions[1]).toEqual(expect.objectContaining({ kind: 'boolean', visible: false }));
    expect(definitions[2].options?.[0]).toEqual({ value: 'admin', label: 'Administrator' });
    expect(definitions[3]).toEqual(
      expect.objectContaining({ kind: 'action', sortable: false, hideable: false }),
    );
    expect(definitions[4]).toEqual(
      expect.objectContaining({ kind: 'selection', sortable: false, hideable: false }),
    );
    expect(definitions[4].meta).toEqual({ mode: 'radio' });
    expect(definitions[4].selection).toEqual(
      expect.objectContaining({ mode: 'radio', selectAll: false, radioName: 'primary-person' }),
    );
    const selection = definitions[4].selection;
    if (typeof selection?.ariaLabel !== 'function' || typeof selection.disabled !== 'function') {
      throw new Error('Expected function selection config.');
    }
    expect(selection.ariaLabel(ada)).toBe('Choose Ada');
    expect(selection.disabled(ada)).toBe(false);
    expect(defaultText.accessorKey).toBe('name');
    expect(defaultText.accessor?.(ada)).toBe('Ada');
    expect(directText.accessorKey).toBeUndefined();
    expect(directText.accessor?.(ada)).toBe('Ada');
    expect(directBoolean.accessor?.(ada)).toBe(true);
    expect(directSelect.accessor?.(ada)).toBe('admin');
    expect(directAction.accessor).toBeUndefined();
    expect(directSelection.accessor).toBeUndefined();
  });

  it('registers projected TemplateRef renderers by column, action, editor, and field ids', () => {
    const fixture = TestBed.createComponent(ProjectedRendererHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const registry = hellTableCreateProjectedRenderRegistry<Person>({
      cells: [host.cell],
      headers: [host.header],
      rowActions: [host.rowActions],
      rowEditors: [host.rowEditor],
      editFields: [host.editField],
    });

    const cell = registry.cells['name'];
    const header = registry.headers['name'];
    const actions = registry.rowActions['actions'];
    const editor = registry.rowEditors['detail'];
    const field = registry.editFields['role'];

    expect(cell && hellTableIsTemplateRenderer(cell)).toBe(true);
    expect(header && hellTableIsTemplateRenderer(header)).toBe(true);
    expect(actions && hellTableIsTemplateRenderer(actions)).toBe(true);
    expect(editor && hellTableIsTemplateRenderer(editor)).toBe(true);
    expect(field && hellTableIsTemplateRenderer(field)).toBe(true);
    if (!cell || !header || !actions || !editor || !field) throw new Error('Expected renderers.');
    expect(hellTableIsTemplateRenderer(cell) && cell.template).toBe(host.cell.template);
    expect(hellTableIsTemplateRenderer(header) && header.template).toBe(host.header.template);
    expect(hellTableIsTemplateRenderer(actions) && actions.template).toBe(host.rowActions.template);
    expect(hellTableIsTemplateRenderer(editor) && editor.template).toBe(host.rowEditor.template);
    expect(hellTableIsTemplateRenderer(field) && field.template).toBe(host.editField.template);
  });

  it('prefers projected TemplateRef renderers before column renderers', () => {
    const fixture = TestBed.createComponent(ProjectedRendererHost);
    fixture.detectChanges();
    const column = textColumn<Person, string>('name', {
      accessor: 'name',
      cell: () => 'column renderer',
      headerCell: () => 'column header',
    });
    const registry = hellTableCreateProjectedRenderRegistry<Person>({
      cells: [fixture.componentInstance.cell],
      headers: [fixture.componentInstance.header],
    });

    const resolvedCell = hellTableResolveCellRenderer(registry, column);
    const resolvedHeader = hellTableResolveHeaderRenderer(registry, {
      id: 'header:name',
      columnId: 'name',
      column,
      label: 'Name',
    });

    expect(resolvedCell.source).toBe('projected');
    expect(hellTableIsTemplateRenderer(resolvedCell.renderer)).toBe(true);
    expect(resolvedHeader.source).toBe('projected');
    expect(hellTableIsTemplateRenderer(resolvedHeader.renderer)).toBe(true);
  });

  it('resolves component column renderers before built-in renderers', () => {
    const column = textColumn<Person, string>('name', {
      accessor: 'name',
      cell: hellComponentRenderer<HellTableCellRenderContext<Person, string>, NameCellRenderer>(
        NameCellRenderer,
        (context) => ({ value: context.value, rowKey: context.row.key }),
      ),
    });
    const context = cellContext(column);
    const resolved = hellTableResolveCellRenderer(hellTableCreateRenderRegistry<Person>(), column);

    expect(resolved.source).toBe('column');
    expect(hellTableIsComponentRenderer(resolved.renderer)).toBe(true);
    if (!hellTableIsComponentRenderer(resolved.renderer)) throw new Error('Expected component.');
    expect(resolved.renderer.component).toBe(NameCellRenderer);
    expect(hellTableComponentRendererInputs(resolved.renderer, context)).toEqual({
      value: 'Ada',
      rowKey: 'ada',
    });
  });

  it('falls through to built-in renderers and then raw accessor values', () => {
    const boolean = booleanColumn<Person, boolean>('active', { accessor: 'active' });
    const raw: HellColumnDef<Person, number> = {
      id: 'score',
      accessor: (row) => row.score,
    };

    const resolvedBoolean = hellTableResolveCellRenderer(
      hellTableCreateRenderRegistry<Person>(),
      boolean,
    );
    const resolvedRaw = hellTableResolveCellRenderer(hellTableCreateRenderRegistry<Person>(), raw);

    expect(resolvedBoolean.source).toBe('built-in');
    expect(hellTableEvaluateRenderer(resolvedBoolean, cellContext(boolean))).toBe('true');
    expect(resolvedRaw.source).toBe('accessor');
    expect(hellTableColumnValue(raw, ada)).toBe(42);
    expect(hellTableEvaluateRenderer(resolvedRaw, cellContext(raw))).toBe(42);
  });
});

function cellContext<TValue>(
  column: HellColumnDef<Person, TValue>,
): HellTableCellRenderContext<Person, TValue> {
  const row: HellTableModelRow<Person> = { key: ada.id, original: ada, index: 0 };
  return {
    row,
    column,
    value: hellTableColumnValue(column, ada) as TValue,
  };
}
