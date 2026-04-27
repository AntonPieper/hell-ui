import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DataTableExampleExample } from './examples/example.example';
import dataTableExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text'
};

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ALL: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: 'User ' + (i + 1),
  email: 'user' + (i + 1) + '@example.com',
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
}));

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, DataTableExampleExample],
  template: `
    <article class="hd-prose">
      <h1>Data table</h1>
      <p>
        Wraps <code>&#64;tanstack/angular-table</code>. Server-side pagination, sorting and
        filtering are all delegated to the consumer via the <code>(queryChange)</code> output.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="dataTableExampleExampleCode" flush>
        <app-data-table-example-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>data</code>: current page rows.</li>
        <li><code>columns</code>: TanStack <code>ColumnDef&lt;T&gt;[]</code>.</li>
        <li><code>total</code>: total rows across all pages.</li>
        <li><code>pageSize</code>: initial rows per page.</li>
        <li><code>pageSizeOptions</code>: selectable page sizes.</li>
        <li>
          <code>(queryChange)</code>: emits <code>pageIndex</code>, <code>pageSize</code>,
          <code>sorting</code>, and <code>filter</code>; fetch or derive rows from this.
        </li>
        <li><code>unstyled</code>: opt out of shell styling.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Treat <code>(queryChange)</code> as the source for server fetches.</li>
        <li>Keep column headers concise and sortable only when supported.</li>
        <li>Pass the real <code>total</code> for correct pagination.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't mutate row arrays in place and expect sorting state to reset.</li>
        <li>Don't use a data table for small static definition lists.</li>
      </ul>
    </article>
  `,
})
export class DataTablePage {
  protected readonly dataTableExampleExampleCode = dataTableExampleExampleCodeRaw;
}
