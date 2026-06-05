import { ChangeDetectionStrategy, Component } from '@angular/core';
import '@hell-ui/angular/styles/table';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DataTableColumnVisibilityExample } from './examples/column-visibility.example';
import dataTableColumnVisibilityExampleCodeRaw from './examples/column-visibility.example.ts?raw' with {
  loader: 'text',
};
import { DataTableCustomRenderersExample } from './examples/custom-renderers.example';
import dataTableCustomRenderersExampleCodeRaw from './examples/custom-renderers.example.ts?raw' with {
  loader: 'text',
};
import { DataTableExampleExample } from './examples/example.example';
import dataTableExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { DataTableRowEditorExample } from './examples/row-editor.example';
import dataTableRowEditorExampleCodeRaw from './examples/row-editor.example.ts?raw' with {
  loader: 'text',
};
import { DataTableSimpleRendererExample } from './examples/simple-renderer.example';
import dataTableSimpleRendererExampleCodeRaw from './examples/simple-renderer.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    DataTableSimpleRendererExample,
    DataTableColumnVisibilityExample,
    DataTableCustomRenderersExample,
    DataTableExampleExample,
    DataTableRowEditorExample,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Table utilities</h1>
        <p>
          Table primitives from <code>@hell-ui/angular/table</code> are a set of low-level structural
          directives for table markup, visual active/selected row states, explicit row action and
          selection controls, sorting affordances, and column resizing. They are not a
          batteries-included data grid and do not wrap TanStack Table.
          The simple native renderer lives at <code>@hell-ui/angular/data-table</code>, with
          optional adapter entrypoints still planned for TanStack, virtual rows, and Angular CDK table skins.
        </p>

        <p>
          The directives apply only host classes, data attributes, and ARIA wiring; the consumer
          owns the <code>&lt;table&gt;</code>, <code>&lt;tr&gt;</code>, and cell markup, and composes
          search, filtering, sorting, and pagination from other <code>hell</code> primitives.
        </p>

        <h2>Scope</h2>
        <p>
          This entrypoint deliberately does not own a backend data source, filtering, pagination,
          virtualization, column-visibility persistence, or grid semantics yet. Import it from
          <code>@hell-ui/angular/table</code>. Bring Angular CDK Table, TanStack Table, AG Grid, a
          backend API, or your own state layer when you need a real data table. Use Hell's directives
          only for host styling, active-row state, selected-row state, row action or selection
          controls, sortable header affordances, column visibility UI, and column resize handles.
        </p>

        <h2>Simple renderer smoke</h2>
        <p>
          <code>hell-data-table</code> renders <code>HellColumnDef</code> columns against array or
          signal rows with native <code>&lt;table&gt;</code> semantics. Minimal usage does not need
          projected templates or optional table engines.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableSimpleRendererExampleCode" flush>
        <app-data-table-simple-renderer-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Custom renderers smoke</h2>
        <p>
          Project <code>hellCell</code>, <code>hellHeaderCell</code>, and
          <code>hellRowActions</code> templates when a simple table needs custom cell, header, or
          action rendering without changing the native table shell. Row-action templates receive
          <code>commands.openRow</code>, <code>commands.closeRow</code>,
          <code>commands.isActive</code>, and <code>commands.activeRow</code>, and the simple renderer
          exposes <code>[(activeRowKey)]</code> for external master/detail panes.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableCustomRenderersExampleCode" flush>
        <app-data-table-custom-renderers-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Column visibility</h2>
        <p>
          Bind <code>[(columnVisibility)]</code> to app state and pass the same state to
          <code>hell-column-visibility-panel</code>. The state is a stable
          <code>Record&lt;columnId, boolean&gt;</code>: <code>false</code> hides a toggleable column,
          while missing or <code>true</code> shows it. Hell renders the picker and reset behavior;
          your application owns persistence such as <code>localStorage</code>, a backend profile, or
          URL state.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableColumnVisibilityExampleCode" flush>
        <app-data-table-column-visibility-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Table primitives example</h2>
        <p>
          Commit searches through <code>hell-omnibar</code>, tune filters and sorting from menu
          submenus, fetch pages asynchronously with table skeletons, paginate via
          <code>hell-pagination</code>, select rows for bulk actions with native checkboxes, and open
          one active row in a responsive <code>hell-split-view</code> editor.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableExampleExampleCode" flush>
        <app-data-table-example-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Row editor</h2>
        <p>
          Pair an explicit cell action with resizable panes when the table and editor both need
          persistent room. Wire <code>aria-controls</code> and <code>aria-expanded</code> from the
          action to the controlled editor pane.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableRowEditorExampleCode" flush>
        <app-data-table-row-editor-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Migration note</h2>
        <p>
          Rows are not buttons. For row actions such as Open or Edit, put a real
          <code>button[hellTableRowAction]</code> or <code>a[hellTableRowAction]</code> inside a cell
          and bind the native action there. Avoid whole-row actions for action-only tables.
        </p>
        <p>
          Active rows and selected rows are separate. Use <code>[active]</code> on
          <code>tr[hellTableRow]</code> for the row opened in a master/detail editor. Use
          <code>[selected]</code> only as a visual mirror of a row-selection model, and expose the
          actual checked state through <code>input[hellTableRowCheckbox]</code> or
          <code>input[hellTableRowRadio]</code>. Native table rows do not get
          <code>aria-selected</code>, <code>tabindex</code>, or row keyboard handlers.
        </p>
        <p>
          Sortable headers use <code>button[hellTableSortTrigger]</code>. The
          <code>&lt;th&gt;</code> keeps <code>aria-sort</code> only while it is the active sorted
          header; the native button owns click and keyboard activation. Do not rely on a
          focusable or clickable header cell.
        </p>

        <h2>API</h2>
        <h3>Structural directives</h3>
        <ul>
          <li>
            <code>[hellTableContainer]</code>: optional shell — frame, border, radius, overflow
            clip. <code>[busy]</code> sets <code>aria-busy</code> and <code>data-loading</code> for
            async table states.
          </li>
          <li>
            <code>table[hellTable]</code>: applies the table host class and switches to fixed layout
            so column widths are honored.
          </li>
          <li>
            <code>thead[hellTableHead]</code> / <code>tbody[hellTableBody]</code>: host classes.
          </li>
          <li>
            <code>tr[hellTableRow]</code>: <code>[active]</code> →
            <code>data-active="true"</code> for a master/detail editor highlight;
            <code>[selected]</code> → <code>data-selected="true"</code> for a bulk-selection
            highlight. The row stays passive in native table mode: no <code>tabindex</code>,
            <code>aria-selected</code>, click, or keydown handlers.
          </li>
          <li>
            <code>th[hellTableHeaderCell]</code>: <code>[sortable]</code>,
            <code>[sort]</code> (<code>'asc' | 'desc' | null</code>) → <code>aria-sort</code> /
            <code>data-sort</code> only for the active sorted header. Unsorted sortable headers
            omit <code>aria-sort</code> by default. Add <code>columnId</code> when pairing with a
            resize handle. Initial sizing belongs to your CSS/Tailwind.
          </li>
          <li>
            <code>button[hellTableSortTrigger]</code>: native button trigger for a sortable
            header. Place it inside <code>th[hellTableHeaderCell]</code>; the selector accepts
            only native <code>&lt;button&gt;</code> hosts, the header keeps <code>aria-sort</code>
            only while sorted, and the button emits <code>(sortToggle)</code> through the header.
          </li>
          <li>
            <code>HELL_TABLE_UTILITIES_DIRECTIVES</code>: standalone import list for the table
            primitives entrypoint.
          </li>
          <li>
            <code>td[hellTableCell]</code>: passive body/data cell with alignment and empty-state
            hooks.
          </li>
          <li>
            <code>button[hellTableRowAction]</code> / <code>a[hellTableRowAction]</code>: native row
            action control. The button/link owns focus, click, keyboard activation, and accessible
            name. For master/detail editors, bind <code>aria-controls</code> to the editor pane id
            and <code>aria-expanded</code> to the active-row state.
          </li>
          <li>
            <code>[hellTableSelectionCell]</code>: narrow styling hook for the cell that contains
            row-selection controls. Combine it with <code>hellTableCell</code> or
            <code>hellTableHeaderCell</code>.
          </li>
          <li>
            <code>input[type="checkbox"][hellTableRowCheckbox]</code> and
            <code>input[type="radio"][hellTableRowRadio]</code>: native controls for row selection.
            Their <code>checked</code> state, not <code>aria-selected</code> on the row, exposes
            selection to assistive technology.
          </li>
          <li>
            <code>[hellTableResizeHandle]</code>: place inside a header cell with
            <code>columnId</code> or pass a narrow <code>[resizeAdapter]</code>. Pointer drag and
            arrow keys keep separator ARIA while sizing state stays adapter-owned; emits one
            <code>(resizeCommit)</code> transaction containing both affected columns; optional
            <code>aria-controls</code> for controlled DOM element IDs.
          </li>
        </ul>

        <h3>Simple renderer</h3>
        <ul>
          <li>
            <code>hell-data-table</code>: accepts <code>[activeRowKey]</code> /
            <code>(activeRowKeyChange)</code> (or <code>[(activeRowKey)]</code>) for the visible
            master/detail row. Projected <code>hellRowActions</code> templates receive
            <code>commands.openRow(row)</code>, <code>commands.closeRow(row)</code>,
            <code>commands.isActive(row)</code>, and <code>commands.activeRow()</code>. Active-row
            state is independent from row selection.
          </li>
          <li>
            Add <code>selectionColumn()</code> to render native checkbox or radio controls. Checkbox
            selection binds to <code>[(rowSelection)]</code> as a stable
            <code>Record&lt;rowKey, boolean&gt;</code>; radio selection binds to
            <code>[(selectedRowKey)]</code> and never reuses <code>activeRowKey</code>. A projected
            <code>[hellDataTableBulkActions]</code> toolbar slot appears when checkbox selection is
            non-empty.
          </li>
          <li>
            Bind <code>[(columnVisibility)]</code> on both <code>hell-data-table</code> and
            <code>hell-column-visibility-panel</code> for app-owned visibility persistence. Column
            helpers accept <code>visibility: 'always'</code>, <code>'user-toggleable'</code>, or
            <code>'initially-hidden'</code>; required action and selection columns render as disabled
            checked options in the picker.
          </li>
        </ul>

        <h3>Theming</h3>
        <ul>
          <li>
            Every directive accepts <code>unstyled</code>. With <code>unstyled</code> set, the host
            class is not applied — behavior, ARIA, and data attributes still apply, so consumers can
            reskin freely without losing accessibility or selection state.
          </li>
          <li>
            Highlighted rows are styled via <code>[data-active="true"]</code> and
            <code>[data-selected="true"]</code> on <code>.hell-table-row</code>. To override, target
            the same attributes on your own class.
          </li>
        </ul>

        <h2>Do</h2>
        <ul>
          <li>
            Compose search and query controls from <code>hell-omnibar</code>, <code>hellMenu</code>,
            Angular CDK Table, TanStack Table, signals, and your own backend data source.
          </li>
          <li>
            Put row actions such as Open, Edit, or View details in native
            <code>button[hellTableRowAction]</code> or <code>a[hellTableRowAction]</code> controls
            inside <code>td[hellTableCell]</code>.
          </li>
          <li>
            Reflect the editor row with <code>[active]</code>, bulk selection with
            <code>[selected]</code>, and the actual checkbox/radio state with native
            <code>[checked]</code> bindings on the controls. Bring a grid implementation when you
            need roving focus, multi-select keyboard shortcuts, or cell navigation.
          </li>
          <li>
            Put sortable labels in <code>button[hellTableSortTrigger]</code> instead of making the
            <code>&lt;th&gt;</code> or <code>role="columnheader"</code> host focusable or clickable.
          </li>
          <li>
            Use <code>hellTableContainer</code> when the table is a standalone framed surface.
          </li>
        </ul>

        <h2>Don't</h2>
        <ul>
          <li>Don't call these directives a complete data-table implementation.</li>
          <li>Don't make the whole row open details; use a native button or link inside a cell.</li>
          <li>Don't use <code>[selected]</code> to mean “open in the editor”; that is <code>[active]</code>.</li>
          <li>Don't leave <code>aria-selected</code> on native table rows.</li>
          <li>Don't put a filter input inside the table; compose it as a sibling.</li>
          <li>
            Don't hide the resize grip by overflowing the header cell — keep
            <code>position: relative</code> if you replace the host class.
          </li>
        </ul>
      </div>
    </article>
  `,
})
export class DataTablePage {
  protected readonly dataTableSimpleRendererExampleCode = dataTableSimpleRendererExampleCodeRaw;
  protected readonly dataTableColumnVisibilityExampleCode = dataTableColumnVisibilityExampleCodeRaw;
  protected readonly dataTableCustomRenderersExampleCode = dataTableCustomRenderersExampleCodeRaw;
  protected readonly dataTableExampleExampleCode = dataTableExampleExampleCodeRaw;
  protected readonly dataTableRowEditorExampleCode = dataTableRowEditorExampleCodeRaw;
}
