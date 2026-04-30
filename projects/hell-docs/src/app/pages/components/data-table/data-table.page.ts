import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DataTableExampleExample } from './examples/example.example';
import dataTableExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, DataTableExampleExample],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Data table</h1>
        <p>
          A set of low-level structural directives for building dense tables. The directives apply
          only host classes, data attributes, and ARIA wiring; the consumer owns the
          <code>&lt;table&gt;</code>, <code>&lt;tr&gt;</code>, and cell markup, and composes search,
          filtering, sorting, and pagination from other <code>hell</code> primitives.
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
        <h2>API</h2>
        <h3>Structural directives</h3>
        <ul>
          <li>
            <code>[hellTableContainer]</code>: optional shell — frame, border, radius, overflow
            clip. <code>[busy]</code> sets <code>aria-busy</code> and
            <code>data-loading</code> for async table states.
          </li>
          <li>
            <code>table[hellTable]</code>: applies the table host class and switches to fixed layout
            so column widths are honored.
          </li>
          <li><code>thead[hellTableHead]</code> / <code>tbody[hellTableBody]</code>: host classes.</li>
          <li>
            <code>tr[hellTableRow]</code>: <code>[selected]</code> →
            <code>data-selected="true"</code>, <code>aria-selected</code>; <code>[interactive]</code>
            enables click / Enter / Space and emits <code>(rowSelect)</code>.
          </li>
          <li>
            <code>th[hellTableHeaderCell]</code>: <code>[sortable]</code>, <code>[sort]</code>
            (<code>'asc' | 'desc' | null</code>) → <code>aria-sort</code> / <code>data-sort</code>;
            emits <code>(sortToggle)</code>. <code>[width]</code> sets initial column width.
          </li>
          <li>
            <code>td[hellTableCell]</code>: emits <code>(cellSelect)</code> on click for
            per-cell handlers.
          </li>
          <li>
            <code>[hellTableColumnResizer]</code>: place inside a header cell. Drives column width
            via pointer drag and arrow keys; emits <code>(widthChange)</code> on the parent cell.
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
            signals, and your own backend data source.
          </li>
          <li>Drive selection from <code>(rowSelect)</code> and reflect it via <code>[selected]</code>.</li>
          <li>Use <code>hellTableContainer</code> when the table is a standalone framed surface.</li>
        </ul>

        <h2>Don't</h2>
        <ul>
          <li>Don't put a filter input inside the table; compose it as a sibling.</li>
          <li>Don't hide the resize grip by overflowing the header cell — keep
            <code>position: relative</code> if you replace the host class.</li>
        </ul>
      </div>
    </article>
  `,
})
export class DataTablePage {
  protected readonly dataTableExampleExampleCode = dataTableExampleExampleCodeRaw;
}
