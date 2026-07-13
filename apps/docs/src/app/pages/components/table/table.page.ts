import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TableBasicExample } from './examples/basic-table.example';
import tableBasicExampleCodeRaw from './examples/basic-table.example.ts?raw' with {
  loader: 'text',
};
import { TablePrimitiveExample } from './examples/primitive-table.example';
import tablePrimitiveExampleCodeRaw from './examples/primitive-table.example.ts?raw' with {
  loader: 'text',
};
import { TableStylingExample } from './examples/styling.example';
import tableStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { TableTanStackShellExample } from './examples/tanstack-shell.example';
import tableTanStackShellExampleCodeRaw from './examples/tanstack-shell.example.ts?raw' with {
  loader: 'text',
};
import { TableTanStackVirtualExample } from './examples/tanstack-virtual.example';
import tableTanStackVirtualExampleCodeRaw from './examples/tanstack-virtual.example.ts?raw' with {
  loader: 'text',
};
import { TableA11yHarnessPage } from './table-a11y-harness.page';

@Component({
  selector: 'hd-table-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TableBasicExample,
    TablePrimitiveExample,
    TableStylingExample,
    TableTanStackShellExample,
    TableTanStackVirtualExample,
    TableA11yHarnessPage,
    PageHeader,
  ],
  template: `
    @if (showTableA11yHarness) {
      <hd-table-a11y-harness />
    } @else {
      <article class="hd-doc-page">
        <div class="hd-prose">
          <hd-page-header
            title="Table"
            icon="faSolidTable"
            category="Table primitives"
            status="Beta"
            importPath="@hell-ui/angular/table"
            stylesPath="@hell-ui/angular/table/styles.css"
          >
            Semantic native-table directives that add Hell styling, sorting, resize, and selection
            hooks to markup you own — never a data-table model.
          </hd-page-header>
          <p>
            Hell supports two table paths. <code>@hell-ui/angular/table</code> is a suite of
            directives you attach to native <code>&lt;table&gt;</code> markup. Each element stays
            yours — Hell only adds the dense typography and border treatment, stateful
            <code>data-*</code> hooks, sortable header triggers, keyboard-operable resize handles,
            and native checkbox/radio selection controls. It deliberately owns no row model,
            filtering, pagination, or virtualization: those belong to your app or to TanStack.
          </p>
          <p>
            When you already have a TanStack <code>Table&lt;T&gt;</code> and want standard chrome
            around it — toolbar, sticky header, pinned columns, status views, pagination — reach for
            the companion shell in <code>@hell-ui/angular/table-tanstack</code>. It renders your
            caller-owned table instance with these primitives, keeping TanStack as the engine.
            TanStack owns columns, rows, sorting, filtering, pagination, selection, pinning, sizing,
            expansion, virtualization math, and state; Hell owns the reusable chrome around it. Use
            the raw primitives when you have small static or app-driven tables; use the shell when
            TanStack already owns the data.
          </p>

          <h2>Basic</h2>
          <p>
            The smallest realistic table: <code>hellTableContainer</code> frames it with the
            elevated surface and border, and <code>hellTableRoot</code>,
            <code>hellTableHeader</code>, <code>hellTableRow</code>, <code>hellTableHeaderCell</code>,
            and <code>hellTableCell</code> style native markup with no <code>ui</code> refinements.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableBasicExampleCode">
          <app-table-basic-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Interactive primitives</h2>
          <p>
            Sorting, selection, row actions, and column resize are opt-in directives layered onto
            the same native markup. A sortable header sets <code>sortable</code> and reflects the
            current <code>sort</code> direction, while a nested
            <code>button[hellTableSortTrigger]</code> owns focus and activation; you decide what the
            <code>sortToggle</code> output does to your data. Rows expose
            <code>[active]</code> and <code>[selected]</code> visual states,
            <code>input[hellTableRowRadio]</code> / <code>input[hellTableRowCheckbox]</code> handle
            selection, and <code>button[hellTableRowAction]</code> styles an inline row action.
          </p>
          <p>
            The primitives never install row-click handlers — rows stay static and interactions live
            in real focusable controls inside the cells.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tablePrimitiveExampleCode">
          <app-table-primitive-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>With TanStack, search, filters, and pagination</h2>
          <p>
            A full data table built on the shell in <code>@hell-ui/angular/table-tanstack</code>.
            The component owns a TanStack <code>Table&lt;T&gt;</code> in manual mode — sorting,
            filtering, pagination, and selection are driven by simulated server queries — and
            <code>hell-tanstack-table</code> renders it with Hell chrome. Column definitions are the
            source of truth for cells; one-off controls are projected through
            <code>ng-template hellTableShellCell="columnId"</code>.
          </p>
          <p>
            The toolbar (<code>hellTableShellToolbar</code>) hosts a Hell Omnibar search and a Menu
            of checkable filters; the footer (<code>hellTableShellFooter</code>) hosts a selection
            summary and <code>hell-tanstack-pagination</code>, which adapts TanStack's pagination
            API to the Hell pagination strip and a rows-per-page select. Loading, error, and empty
            states come from the shell's status templates. The whole table sits inside a Split View
            master/detail layout — all of it normal app controls around the caller-owned table, not
            a second table-state abstraction.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableTanStackShellExampleCode">
          <app-table-tanstack-shell-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Virtual rows and expansion</h2>
          <p>
            Virtualization is an optional body strategy on the same shell. Add
            <code>hellTanStackVirtualRows</code> from
            <code>@hell-ui/angular/table-tanstack/virtual</code> to render only the visible rows via
            TanStack Virtual, tuning <code>virtualEstimateRowSize</code> and
            <code>virtualOverscan</code> as needed. The shell chrome, projected templates, and
            styling contract are unchanged; expanded rows still come from TanStack expansion state
            and render through the <code>hellTableShellExpandedRow</code> template.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableTanStackVirtualExampleCode">
          <app-table-tanstack-virtual-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Styling</h2>
          <p>
            Every module in this family follows the Part Style Map contract. Pass a shorthand
            <code>ui="..."</code> string to refine a module's default part (<code>root</code> for
            all of them), or a <code>[ui]</code> map keyed by part name for multi-part modules like
            <code>hellTableResizeHandle</code>. Refinements merge on top of each module's recipe
            through Hell's Tailwind merge, so a conflicting utility wins deterministically over the
            default it replaces. Because the primitives are directives on your own markup, template
            <code>class</code> still works for layout hooks — but reach for <code>ui</code> whenever
            a refinement must beat a recipe utility.
          </p>

          <h3>Primitive parts (<code>@hell-ui/angular/table</code>)</h3>
          <table class="hd-doc-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Part</th>
                <th>Styles</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>hellTableContainer</code></td>
                <td><code>root</code></td>
                <td>The optional frame — elevated surface, border, radius, overflow clipping.</td>
              </tr>
              <tr>
                <td><code>hellTableRoot</code></td>
                <td><code>root</code></td>
                <td>The <code>&lt;table&gt;</code> host — fixed layout, dense typography.</td>
              </tr>
              <tr>
                <td><code>hellTableHead</code></td>
                <td><code>root</code></td>
                <td>The header section (<code>&lt;thead&gt;</code>) surface.</td>
              </tr>
              <tr>
                <td><code>hellTableBody</code></td>
                <td><code>root</code></td>
                <td>The body section (<code>&lt;tbody&gt;</code>).</td>
              </tr>
              <tr>
                <td><code>hellTableRow</code></td>
                <td><code>root</code></td>
                <td>A row — hover, <code>data-active</code>, and <code>data-selected</code> visuals.</td>
              </tr>
              <tr>
                <td><code>hellTableHeaderCell</code></td>
                <td><code>root</code></td>
                <td>A header cell — sticky header, uppercase label, sortable padding.</td>
              </tr>
              <tr>
                <td><code>hellTableSortTrigger</code></td>
                <td><code>root</code></td>
                <td>The button inside a sortable header cell.</td>
              </tr>
              <tr>
                <td><code>hellTableCell</code></td>
                <td><code>root</code></td>
                <td>A data cell — padding, truncation, <code>data-align</code>/<code>data-space</code>.</td>
              </tr>
              <tr>
                <td><code>hellTableSelectionCell</code></td>
                <td><code>root</code></td>
                <td>The narrow cell wrapping a selection control.</td>
              </tr>
              <tr>
                <td><code>hellTableRowCheckbox</code></td>
                <td><code>root</code></td>
                <td>The native checkbox selection control.</td>
              </tr>
              <tr>
                <td><code>hellTableRowRadio</code></td>
                <td><code>root</code></td>
                <td>The native radio selection control.</td>
              </tr>
              <tr>
                <td><code>hellTableRowAction</code></td>
                <td><code>root</code></td>
                <td>The inline row-action button/anchor.</td>
              </tr>
              <tr>
                <td><code>hellTableResizeHandle</code></td>
                <td><code>root</code></td>
                <td>The separator hit area on a header cell's trailing edge.</td>
              </tr>
              <tr>
                <td><code>hellTableResizeHandle</code></td>
                <td><code>grip</code></td>
                <td>The visible divider line inside the handle.</td>
              </tr>
              <tr>
                <td><code>hellTableMeasureRow</code></td>
                <td>—</td>
                <td>Behavior-only row measurement directive; no styled parts.</td>
              </tr>
            </tbody>
          </table>

          <h3>Shell parts (<code>@hell-ui/angular/table-tanstack</code>)</h3>
          <table class="hd-doc-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Part</th>
                <th>Styles</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>hell-tanstack-table</code></td>
                <td><code>root</code></td>
                <td>The shell panel — elevated surface, border, radius, shadow.</td>
              </tr>
              <tr>
                <td><code>hell-tanstack-table</code></td>
                <td><code>toolbar</code></td>
                <td>The projected toolbar bar above the table.</td>
              </tr>
              <tr>
                <td><code>hell-tanstack-table</code></td>
                <td><code>scrollport</code></td>
                <td>The scroll container around the table element.</td>
              </tr>
              <tr>
                <td><code>hell-tanstack-table</code></td>
                <td><code>footer</code></td>
                <td>The projected footer bar below the table.</td>
              </tr>
              <tr>
                <td><code>hell-tanstack-pagination</code></td>
                <td><code>root</code></td>
                <td>The pagination control wrapper.</td>
              </tr>
              <tr>
                <td><code>hell-tanstack-pagination</code></td>
                <td><code>pageSize</code></td>
                <td>
                  The rows-per-page label wrapper. Refine its nested <code>&lt;select&gt;</code>
                  through the <code>hellNativeSelect</code> <code>root</code> part.
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            The example below refines every primitive part in one native table — including the
            resize handle's <code>root</code> and <code>grip</code> through a map — using Hell design
            tokens. The shell and pagination parts render in the composite examples above.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableStylingExampleCode">
          <app-table-styling-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>API</h2>
          <h3>Primitives — <code>@hell-ui/angular/table</code></h3>
          <ul>
            <li>
              <code>HELL_TABLE_UTILITIES_DIRECTIVES</code>: the standalone import list for the whole
              primitive suite.
            </li>
            <li>
              <code>hellTableContainer</code>: <code>busy</code> (<code>boolean</code>, default
              <code>false</code>) reflects <code>data-loading</code> / <code>aria-busy</code>.
            </li>
            <li>
              <code>hellTableRoot</code> (<code>table[hellTable]</code>): <code>contentWidth</code>
              (<code>boolean</code>, default <code>false</code>) sizes the table to its content;
              infers <code>role="table"</code> on non-native hosts.
            </li>
            <li>
              <code>hellTableRow</code>: <code>active</code> and <code>selected</code>
              (<code>boolean</code>, default <code>false</code>) drive
              <code>data-active</code>/<code>data-selected</code>.
            </li>
            <li>
              <code>hellTableHeaderCell</code>: <code>sortable</code> (<code>boolean</code>),
              <code>sort</code> (<code>'asc' | 'desc' | null</code>), <code>columnId</code>
              (<code>string | null</code>); output <code>sortToggle</code>
              (<code>MouseEvent | KeyboardEvent</code>). Reflects <code>aria-sort</code>.
            </li>
            <li>
              <code>hellTableSortTrigger</code> (<code>button</code> only): output
              <code>sortToggle</code> (<code>MouseEvent</code>); auto-disabled when its header cell
              is not sortable.
            </li>
            <li>
              <code>hellTableCell</code>: <code>align</code>
              (<code>'start' | 'center' | 'end'</code>, default <code>start</code>),
              <code>space</code> (<code>'normal' | 'empty'</code>, default <code>normal</code>).
            </li>
            <li>
              <code>hellTableRowCheckbox</code> / <code>hellTableRowRadio</code> (native inputs):
              <code>required</code>, and (checkbox) <code>indeterminate</code>; outputs
              <code>checkedChange</code>, <code>indeterminateChange</code> (checkbox only).
            </li>
            <li>
              <code>hellTableResizeHandle</code>: <code>minWidth</code> (<code>number</code>, default
              <code>40</code>), <code>resizeAdapter</code> (<code>HellTableResizeAdapter | null</code>),
              <code>aria-label</code>, <code>aria-controls</code>; output <code>resizeCommit</code>
              (<code>HellTableResizeEvent</code>).
            </li>
            <li>
              <code>hellTableMeasureRow</code>: <code>hellTableMeasureRow</code> (item),
              <code>hellTableMeasureRowKey</code>, <code>hellTableMeasureRowCallback</code>; output
              <code>measured</code> (<code>HellTableRowMeasurement</code>).
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;Part&gt;</code> on every directive — shorthand
              string for <code>root</code>, or a map. Multi-part modules export part/UI types, e.g.
              <code>HellTableResizeHandlePart</code> (<code>'root' | 'grip'</code>) /
              <code>HellTableResizeHandleUi</code>; single-part modules take
              <code>HellUiInput&lt;'root'&gt;</code>.
            </li>
            <li>
              <code>HELL_TABLE_UTILITIES_LABELS</code>: overrides the Label Contract (currently
              <code>resizeColumn</code>).
            </li>
          </ul>

          <h3>TanStack shell — <code>@hell-ui/angular/table-tanstack</code></h3>
          <ul>
            <li>
              <code>hell-tanstack-table</code> (<code>HellTanStackTable&lt;T&gt;</code>):
              <code>table</code> (required <code>Table&lt;T&gt;</code>), <code>status</code>
              (<code>HellTableStatusValue</code>, default <code>HellTableStatus.READY</code>),
              <code>stickyHeader</code> (<code>boolean</code>, default <code>false</code>),
              <code>rowClass</code> (<code>HellTanStackRowClass&lt;T&gt;</code> or a class value),
              <code>ui</code> (<code>HellTanStackTableUi</code>).
            </li>
            <li>
              Projected regions: <code>[hellTableShellToolbar]</code> and
              <code>[hellTableShellFooter]</code> (repeatable), and one-off templates
              <code>ng-template hellTableShellHeader/Cell/FooterCell="columnId"</code>,
              <code>hellTableShellExpandedRow</code>, and <code>hellTableShellLoading/Empty/Error</code>.
            </li>
            <li>
              <code>HellTableStatus</code>: <code>READY</code>, <code>LOADING</code>, and
              <code>error(error)</code> build the <code>HellTableStatusValue</code> passed to
              <code>status</code>. <code>provideHellTableStatusViews()</code> registers default
              status components.
            </li>
            <li>
              <code>hell-tanstack-pagination</code> (<code>HellTanStackPagination&lt;T&gt;</code>):
              <code>table</code> (required), <code>pageSizeOptions</code>
              (<code>readonly number[]</code>), <code>ui</code>
              (<code>HellTanStackPaginationUi</code> over <code>root</code>/<code>pageSize</code>).
            </li>
            <li>
              <code>hell-tanstack-global-filter</code> / <code>hell-tanstack-column-filter</code>:
              <code>table</code> (required), <code>placeholder</code>, and (column)
              <code>columnId</code> (required).
            </li>
            <li>
              Column passthrough: set <code>columnDef.meta.hell.headerClass</code> /
              <code>cellClass</code> / <code>footerClass</code> to feed the shell's cell
              <code>ui</code>. Import TanStack's <code>FlexRenderDirective</code> directly when
              building renderers outside the shell.
            </li>
            <li>
              <b>Virtual</b> (<code>@hell-ui/angular/table-tanstack/virtual</code>):
              <code>hellTanStackVirtualRows</code> (<code>boolean</code>, default <code>true</code>),
              <code>virtualEstimateRowSize</code> (<code>number</code>, default <code>44</code>),
              <code>virtualOverscan</code> (<code>number</code>, default <code>6</code>).
            </li>
          </ul>

          <h2>Accessibility</h2>
          <ul>
            <li>
              The primitives preserve native <code>&lt;table&gt;</code> semantics. Roles
              (<code>table</code>, <code>rowgroup</code>, <code>row</code>,
              <code>columnheader</code>, <code>cell</code>) are only inferred when the host is
              non-native and no explicit <code>role</code> is set.
            </li>
            <li>
              Sorting is activated through a real <code>button[hellTableSortTrigger]</code>; the
              header cell carries <code>aria-sort="ascending" | "descending"</code> (and
              <code>data-sort</code>) while the button owns focus and activation, per APG sortable
              table guidance.
            </li>
            <li>
              <code>hellTableResizeHandle</code> is a keyboard-operable
              <code>role="separator"</code> with <code>aria-orientation="vertical"</code>,
              <code>aria-valuemin</code>/<code>max</code>/<code>now</code>, and an
              <code>aria-controls</code> pointing at the two affected columns; its accessible name
              comes from the injectable <code>resizeColumn</code> label. When it has no resolvable
              resize pair it becomes inert (<code>tabindex="-1"</code>, no separator role).
            </li>
            <li>
              Row checkbox/radio controls are native inputs, so they receive native focus, keyboard,
              and form semantics; give each one an <code>aria-label</code> naming the row it selects.
            </li>
            <li>
              Rows are static — no row-level <code>tabindex</code>, click, or keydown is installed —
              so interactions must live in the focusable controls inside cells.
            </li>
          </ul>

          <h2>Do</h2>
          <ul class="hd-do">
            <li>Let TanStack (or your app) own row models, sorting, filtering, and pagination state.</li>
            <li>
              Put interactions in real controls inside cells:
              <code>hellTableSortTrigger</code>, <code>hellTableRowAction</code>, and the native
              selection inputs.
            </li>
            <li>
              Use projected shell regions for search, filters, selection summaries, and pagination
              instead of shorthand props.
            </li>
            <li>
              Style cells passed to the shell via <code>columnDef.meta.hell.*Class</code>, and
              refine parts with <code>ui</code> using Hell design tokens.
            </li>
          </ul>

          <h2>Don't</h2>
          <ul class="hd-dont">
            <li>Don't build a second table model or column-definition DSL in Hell.</li>
            <li>Don't add row-click activation for actions; rows stay static.</li>
            <li>
              Don't add parallel Hell props for column pinning, sorting, filtering, pagination, or
              expansion — those come from TanStack state.
            </li>
            <li>Don't create a separate virtual-table root; virtualization is a body strategy.</li>
          </ul>
        </div>
      </article>
    }
  `,
})
export class TablePage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showTableA11yHarness =
    this.route.snapshot.queryParamMap.has('tableA11yHarness');
  protected readonly tableBasicExampleCode = tableBasicExampleCodeRaw;
  protected readonly tablePrimitiveExampleCode = tablePrimitiveExampleCodeRaw;
  protected readonly tableStylingExampleCode = tableStylingExampleCodeRaw;
  protected readonly tableTanStackShellExampleCode = tableTanStackShellExampleCodeRaw;
  protected readonly tableTanStackVirtualExampleCode = tableTanStackVirtualExampleCodeRaw;
}
