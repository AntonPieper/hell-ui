import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DataTableExampleExample } from './examples/example.example';
import dataTableExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { DataTableRowEditorExample } from './examples/row-editor.example';
import dataTableRowEditorExampleCodeRaw from './examples/row-editor.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, DataTableExampleExample, DataTableRowEditorExample],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Table utilities</h1>
        <p>
          Table utilities from <code>@hell-ui/angular/features/table-utilities</code> are a set of
          low-level structural directives for table markup, selection, sorting affordances, and column
          resizing. They are not a batteries-included data grid and do not wrap TanStack Table.
          <code>@hell-ui/angular/features/data-table</code> is a compatibility naming alias for this
          package.
        </p>

        <p>
          The directives apply only host classes, data attributes, and ARIA wiring; the consumer
          owns the <code>&lt;table&gt;</code>, <code>&lt;tr&gt;</code>, and cell markup, and composes
          search, filtering, sorting, and pagination from other <code>hell</code> primitives.
        </p>

        <h2>Scope</h2>
        <p>
          This feature deliberately does not own a data source, column definition model, filtering,
          pagination, virtualization, selection model, or grid semantics. Import it from
          <code>@hell-ui/angular/features/table-utilities</code>; <code>@hell-ui/angular/features/data-table</code>
          remains a compatibility naming alias. Bring Angular CDK Table, TanStack Table, AG Grid, a
          backend API, or your own state layer when you need a real data table. Use Hell's directives
          only for host styling, row activation, sortable header affordances, and column resize handles.
        </p>

        <h2>Example</h2>
        <p>
          Commit searches through <code>hell-omnibar</code>, tune filters and sorting from menu
          submenus, fetch pages asynchronously with table skeletons, paginate via
          <code>hell-pagination</code>, and edit selected rows in a responsive
          <code>hell-split-view</code>.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableExampleExampleCode" flush>
        <app-data-table-example-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Row editor</h2>
        <p>
          Pair table selection with resizable panes when the table and editor both need persistent
          room.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableRowEditorExampleCode" flush>
        <app-data-table-row-editor-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Migration note</h2>
        <p>
          Sortable headers use <code>button[hellTableSortButton]</code>. The
          <code>&lt;th&gt;</code> keeps <code>aria-sort</code>; the button owns focus and activation.
          Do not rely on a focusable or clickable header cell.
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
            <code>tr[hellTableRow]</code>: <code>[selected]</code> →
            <code>data-selected="true"</code>, <code>aria-selected</code>;
            <code>[interactive]</code> enables click / Enter / Space and emits
            <code>(rowSelect)</code>.
          </li>
          <li>
            <code>th[hellTableHeaderCell]</code>: <code>[sortable]</code>,
            <code>[sort]</code> (<code>'asc' | 'desc' | null</code>) → <code>aria-sort</code> /
            <code>data-sort</code>. Add <code>columnId</code> when pairing with a column resizer.
            Initial sizing belongs to your CSS/Tailwind.
          </li>
          <li>
            <code>button[hellTableSortButton]</code>: native button trigger for a sortable header.
            Place it inside <code>th[hellTableHeaderCell]</code>; the header keeps
            <code>aria-sort</code> while the button owns focus and emits
            <code>(sortToggle)</code> through the header.
          </li>
          <li>
            <code>HELL_TABLE_UTILITIES_DIRECTIVES</code>: preferred standalone import list.
            <code>HELL_TABLE_UTILITY_DIRECTIVES</code> and <code>HELL_TABLE_DIRECTIVES</code> remain
            compatibility aliases for older imports.
          </li>
          <li>
            <code>td[hellTableCell]</code>: emits <code>(cellSelect)</code> on click for per-cell
            handlers.
          </li>
          <li>
            <code>[hellTableColumnResizer]</code>: place inside a header cell with
            <code>columnId</code>. Drives resize CSS custom properties via pointer drag and arrow
            keys; emits one <code>(columnResize)</code> transaction containing both affected columns;
            optional <code>aria-controls</code> for controlled DOM element IDs.
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
            Highlighted rows are styled via <code>[data-selected="true"]</code> on
            <code>.hell-table-row</code>. To override, target the same attribute on your own class.
          </li>
        </ul>

        <h2>Do</h2>
        <ul>
          <li>
            Compose search and query controls from <code>hell-omnibar</code>, <code>hellMenu</code>,
            Angular CDK Table, TanStack Table, signals, and your own backend data source.
          </li>
          <li>
            Drive selection from <code>(rowSelect)</code> and reflect it via
            <code>[selected]</code>.
          </li>
          <li>
            Put sortable labels in <code>button[hellTableSortButton]</code> instead of making the
            <code>&lt;th&gt;</code> itself focusable.
          </li>
          <li>
            Use <code>hellTableContainer</code> when the table is a standalone framed surface.
          </li>
        </ul>

        <h2>Don't</h2>
        <ul>
          <li>Don't call these directives a complete data-table implementation.</li>
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
  protected readonly dataTableExampleExampleCode = dataTableExampleExampleCodeRaw;
  protected readonly dataTableRowEditorExampleCode = dataTableRowEditorExampleCodeRaw;
}
