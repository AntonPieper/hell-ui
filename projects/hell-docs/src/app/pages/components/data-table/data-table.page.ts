import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DataTableCdkSkinExample } from './examples/cdk-skin.example';
import dataTableCdkSkinExampleCodeRaw from './examples/cdk-skin.example.ts?raw' with {
  loader: 'text',
};
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
import { DataTableGridModeExample } from './examples/grid-mode.example';
import dataTableGridModeExampleCodeRaw from './examples/grid-mode.example.ts?raw' with {
  loader: 'text',
};
import { DataTableSelectionExample } from './examples/selection.example';
import dataTableSelectionExampleCodeRaw from './examples/selection.example.ts?raw' with {
  loader: 'text',
};
import { DataTableSimpleRendererExample } from './examples/simple-renderer.example';
import dataTableSimpleRendererExampleCodeRaw from './examples/simple-renderer.example.ts?raw' with {
  loader: 'text',
};
import { DataTableTanStackTableExample } from './examples/tanstack-table.example';
import dataTableTanStackTableExampleCodeRaw from './examples/tanstack-table.example.ts?raw' with {
  loader: 'text',
};
import { DataTableVirtualExample } from './examples/virtual.example';
import dataTableVirtualExampleCodeRaw from './examples/virtual.example.ts?raw' with {
  loader: 'text',
};
import { TableA11yHarnessPage } from './table-a11y-harness.page';

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    DataTableSimpleRendererExample,
    TableA11yHarnessPage,
    DataTableColumnVisibilityExample,
    DataTableCustomRenderersExample,
    DataTableCdkSkinExample,
    DataTableExampleExample,
    DataTableGridModeExample,
    DataTableSelectionExample,
    DataTableTanStackTableExample,
    DataTableVirtualExample,
  ],
  template: `
    @if (showTableA11yHarness) {
      <hd-table-a11y-harness />
    } @else {
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Table utilities</h1>
        <p>
          Table utilities are composable layers, not a batteries-included data grid. Table primitives
          from <code>@hell-ui/angular/table</code> provide semantic structure and state helpers,
          <code>@hell-ui/angular/data-table</code> for the simple native array renderer, and optional
          adapter entrypoints for TanStack Table, TanStack Virtual dynamic row parts, and Angular CDK
          table skins.
        </p>

        <p>
          Hell owns styling hooks, explicit active/selected visuals, native row action and selection
          controls, sortable header affordances, column visibility UI, resize handles, and explicit
          grid-mode semantics. Your app or table engine owns data sources, filtering, pagination,
          persistence, and complex grid behavior.
        </p>

        <h2>Simple array table</h2>
        <p>
          <code>hell-data-table</code> renders <code>HellColumnDef</code> columns against a simple
          array with native <code>&lt;table&gt;</code> semantics. Minimal usage does not need projected
          templates, TanStack, CDK, virtual scrolling, router, Font Awesome, CodeMirror, or pdf.js.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableSimpleRendererExampleCode" flush>
        <app-data-table-simple-renderer-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Selectable rows</h2>
        <p>
          Add <code>selectionColumn()</code> and bind <code>[(rowSelection)]</code> when rows need
          bulk actions. Selection is a stable <code>Record&lt;rowKey, boolean&gt;</code> and is exposed
          through native checkbox or radio controls, not through row click shortcuts.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableSelectionExampleCode" flush>
        <app-data-table-selection-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Custom renderers</h2>
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
          URL state. In dense toolbars, place the panel inside a <code>hellPopover</code> next to
          the filter menu so the default page layout does not spend permanent space on column
          preferences.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableColumnVisibilityExampleCode" flush>
        <app-data-table-column-visibility-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>TanStack Table adapter</h2>
        <p>
          Import <code>@hell-ui/angular/table-tanstack</code> when TanStack owns row models, sorting,
          selection, column visibility, and sizing. The adapter normalizes the TanStack table into a
          Hell model so primitive table markup and render slots can stay consistent.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableTanStackTableExampleCode" flush>
        <app-data-table-tanstack-table-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>TanStack Virtual dynamic rows</h2>
        <p>
          Import <code>@hell-ui/angular/table-virtual</code> for dynamic-height row, detail, or
          editor parts. Hell flattens rows into stable keys such as <code>row:42</code> and
          <code>editor:42</code>; TanStack Virtual owns windowing, measurement, and scrolling.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableVirtualExampleCode" flush>
        <app-data-table-virtual-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Angular CDK table skin</h2>
        <p>
          Import <code>@hell-ui/angular/table-cdk</code> when an Angular CDK table should use the
          Hell table skin without replacing CDK row definitions. The adapter layers Hell classes,
          data attributes, active/selected row visuals, sortable header inputs, and row actions onto
          <code>cdk-table</code>, <code>cdk-header-cell</code>, <code>cdk-cell</code>, and
          <code>cdk-row</code> hosts, including native <code>&lt;table cdk-table&gt;</code> markup.
        </p>
        <p>
          Keep <code>dataSource</code>, sorting transforms, pagination, and persistence in the app or
          CDK layer. Derive <code>displayedColumns</code> from Hell's
          <code>columnVisibility</code> state with <code>hellCdkDisplayedColumns()</code> and pass the
          result to the CDK header/data row definitions.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableCdkSkinExampleCode" flush>
        <app-data-table-cdk-skin-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Explicit grid mode</h2>
        <p>
          Normal tables remain semantic tables. Opt into grid semantics only with
          <code>semantics=&quot;grid&quot;</code> plus an <code>interactionMode</code> such as
          <code>cell-navigation</code>, <code>row-selection</code>, or <code>editing</code>. Grid mode
          provides one table-root tab stop, row/column counts, row/cell indexes, and
          <code>aria-activedescendant</code> wiring.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableGridModeExampleCode" flush>
        <app-data-table-grid-mode-example />
      </hd-example-tabs>

      <div class="hd-prose">
        <h2>Master/detail split editor</h2>
        <p>
          The larger primitive example combines <code>hell-omnibar</code>, menus, skeletons,
          pagination, column visibility, native checkbox bulk selection, and a responsive
          <code>hell-split-view</code> editor. It uses <code>activeRowKey</code> only for the open
          detail pane, <code>rowSelection</code> only for bulk actions, and
          <code>columnVisibility</code> only for user show/hide preferences.
        </p>
      </div>

      <hd-example-tabs class="hd-doc-wide" [code]="dataTableExampleExampleCode" flush>
        <app-data-table-example-example />
      </hd-example-tabs>


      <div class="hd-prose">
        <h2>Migration note</h2>
        <p>
          The modern table layer intentionally removed the legacy compatibility names before beta:
        </p>
        <ul>
          <li>
            Legacy <code>features/data-table</code> entrypoint aliases and
            <code>styles/features/data-table</code> style aliases were removed. Use
            <code>@hell-ui/angular/table</code>, <code>@hell-ui/angular/data-table</code>, and
            <code>@hell-ui/angular/styles/table</code>.
          </li>
          <li>
            Old directive constants such as <code>HELL_TABLE_DIRECTIVES</code> and
            <code>HELL_TABLE_UTILITY_DIRECTIVES</code> were removed. Import standalone directives or
            the current <code>HELL_TABLE_UTILITIES_DIRECTIVES</code> list.
          </li>
          <li>
            Row interactive shortcuts such as <code>HellTableRow.interactive</code>,
            <code>selectionSemantics</code>, <code>[selectable]</code>, and <code>(rowSelect)</code>
            were removed. Put real row-action controls inside cells, and compose
            <code>hellButton</code> with <code>hellTableRowAction</code> when you want the default
            Hell button appearance.
          </li>
          <li>
            <code>hellTableSortButton</code> was replaced by
            <code>button[hellTableSortTrigger]</code>; the native button owns click and keyboard
            activation while the header owns <code>aria-sort</code>.
          </li>
          <li>
            <code>hellTableColumnResizer</code> was replaced by
            <code>hellTableResizeHandle</code>; sizing state stays app- or adapter-owned.
          </li>
        </ul>
        <p>
          Active rows, selected rows, and checked controls are separate. Use <code>[active]</code>
          for the row opened in a master/detail editor, <code>[selected]</code> only as a visual
          mirror of <code>rowSelection</code>, and native checkbox/radio checked state for assistive
          technology.
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
            name. Compose <code>hellButton</code> on the same host for styled button visuals; the
            row-action primitive itself stays a table state hook. For master/detail editors, bind
            <code>aria-controls</code> to the editor pane id and <code>aria-expanded</code> to the
            active-row state.
          </li>
          <li>
            <code>[hellTableSelectionCell]</code>: narrow styling hook for the cell that contains
            row-selection controls. Combine it with <code>hellTableCell</code> or
            <code>hellTableHeaderCell</code>.
          </li>
          <li>
            <code>input[type="checkbox"][hellTableRowCheckbox]</code> and
            <code>input[type="radio"][hellTableRowRadio]</code>: table selection controls layered on
            the Hell native checkbox/radio primitives. Their <code>checked</code> state, not
            <code>aria-selected</code> on the row, exposes selection to assistive technology.
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

        <h3>CDK adapter</h3>
        <ul>
          <li>
            <code>HELL_CDK_TABLE_DIRECTIVES</code>: standalone import list for CDK Table plus the
            Hell skin directives. It skins existing CDK table, header row, data row, header cell,
            data cell, and footer hosts; it does not create wrapper rows or duplicate
            <code>cdkHeaderRowDef</code>/<code>cdkRowDef</code> templates.
          </li>
          <li>
            <code>hellCdkDisplayedColumns(columns, columnVisibility)</code>: derives the string array
            consumed by <code>cdkHeaderRowDef</code> and <code>cdkRowDefColumns</code> from Hell
            column definitions while the app/CDK layer keeps data source, sorting, and pagination
            ownership.
          </li>
          <li>
            CDK virtual scrolling is the fixed-size path: wrap the table in
            <code>cdk-virtual-scroll-viewport</code> with a stable <code>itemSize</code>. Use
            <code>@hell-ui/angular/table-virtual</code> with TanStack Virtual for dynamic row, detail,
            or editor heights.
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
            Put row actions such as Open, Edit, or View details in native controls inside
            <code>td[hellTableCell]</code>. Add <code>hellButton</code> to the same host when the
            action should use Hell's styled button primitive.
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
    }
  `,
})
export class DataTablePage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showTableA11yHarness =
    this.route.snapshot.queryParamMap.has('tableA11yHarness');
  protected readonly dataTableSimpleRendererExampleCode = dataTableSimpleRendererExampleCodeRaw;
  protected readonly dataTableSelectionExampleCode = dataTableSelectionExampleCodeRaw;
  protected readonly dataTableColumnVisibilityExampleCode = dataTableColumnVisibilityExampleCodeRaw;
  protected readonly dataTableCustomRenderersExampleCode = dataTableCustomRenderersExampleCodeRaw;
  protected readonly dataTableCdkSkinExampleCode = dataTableCdkSkinExampleCodeRaw;
  protected readonly dataTableExampleExampleCode = dataTableExampleExampleCodeRaw;
  protected readonly dataTableGridModeExampleCode = dataTableGridModeExampleCodeRaw;
  protected readonly dataTableTanStackTableExampleCode = dataTableTanStackTableExampleCodeRaw;
  protected readonly dataTableVirtualExampleCode = dataTableVirtualExampleCodeRaw;
}
