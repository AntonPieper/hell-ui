import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TablePrimitiveExample } from './examples/primitive-table.example';
import tablePrimitiveExampleCodeRaw from './examples/primitive-table.example.ts?raw' with {
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
import { TableBasicExample } from './examples/basic-table.example';
import tableBasicExampleCodeRaw from './examples/basic-table.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-table-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TableBasicExample,
    TablePrimitiveExample,
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
            Semantic native-table primitives — plus a Hell-styled shell that renders a caller-owned TanStack Table with toolbar, status, pagination, and optional virtual rows.
          </hd-page-header>
          <p>
            Hell supports two table paths. <code>@hell-ui/angular/table</code> is the low-level
            native-table primitive layer. <code>@hell-ui/angular/table-tanstack</code> is a
            Hell-styled shell for a caller-owned TanStack Table instance.
          </p>
          <p>
            TanStack owns columns, rows, sorting, filtering, pagination, selection, pinning, sizing,
            expansion, virtualization math, and state. Hell owns the reusable chrome: table markup,
            sticky header styling, pinned-column attributes, projected shell regions, status views,
            pagination/filter controls, and FlexRender integration.
          </p>

          <h2>Basic</h2>
          <p>
            Default table chrome with no <code>ui</code> refinements: container scroll region,
            header, rows, and cells.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableBasicExampleCode">
          <app-table-basic-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Primitive table</h2>
          <p>
            Use the primitive path when you already have simple native markup and only need Hell
            styling hooks, sortable header triggers, resize handles, active/selected row visuals, or
            native selection controls. The primitives do not create a table model or data renderer.
          </p>
          <p>
            Each primitive accepts <code>ui</code> for its local <code>root</code> part, while
            <code>hellTableResizeHandle</code> also exposes <code>grip</code>. Repeated rows, cells,
            and actions keep static parts and publish state through data attributes.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tablePrimitiveExampleCode">
          <app-table-primitive-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>TanStack shell</h2>
          <p>
            Create the TanStack <code>Table&lt;T&gt;</code> in your component and pass it to
            <code>hell-tanstack-table</code>. Column definitions are the primary source of truth.
            Plain accessor columns render normally, reusable custom cells use TanStack/FlexRender,
            and one-off Angular markup can be projected with
            <code>ng-template hellTableShellCell="columnId"</code> when that column does not define
            <code>cell</code>.
          </p>
          <p>
            Pagination is projected by the consumer. Use <code>hell-tanstack-pagination</code> in a
            repeatable <code>hellTableShellFooter</code> region instead of a shorthand prop. The
            control adapts TanStack pagination APIs to the reusable Hell pagination strip, so
            callers keep one table engine while avoiding repeated pagination markup.
          </p>
          <p>
            The example composes the shell with Hell Omnibar, Menu, and Split View. Those remain
            normal app-level controls around the caller-owned TanStack table, not a second
            table-state abstraction.
          </p>
          <p>
            The shell example treats sorting, filtering, search, and pagination as async
            server-side work: the component owns the request state, passes manual TanStack state to
            the table, and uses shell status templates for loading, error, and empty display.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableTanStackShellExampleCode">
          <app-table-tanstack-shell-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Virtual rows</h2>
          <p>
            Virtualization is an optional body strategy on the same shell. Add
            <code>HellTanStackVirtualRows</code> from
            <code>@hell-ui/angular/table-tanstack/virtual</code> when the table needs TanStack
            Virtual row math. Expanded rows still come from TanStack expansion state and render
            through the shell's <code>hellTableShellExpandedRow</code> template.
          </p>
        </div>

        <hd-example-tabs class="hd-doc-wide" [code]="tableTanStackVirtualExampleCode">
          <app-table-tanstack-virtual-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Status views</h2>
          <p>
            The shell accepts one external status value:
            <code>HellTableStatus.READY</code>, <code>HellTableStatus.LOADING</code>, or
            <code>HellTableStatus.error(error)</code>. A ready table with no rendered rows shows the
            empty template. Local loading, error, and empty templates override any provided default
            status-view components.
          </p>

          <h2>API Summary</h2>
          <ul>
            <li>
              <code>HELL_TABLE_UTILITIES_DIRECTIVES</code>: native table primitive import list.
            </li>
            <li>
              <code>ui</code>: Part Style Map input on table primitives; most expose
              <code>root</code>, and <code>hellTableResizeHandle</code> exposes
              <code>root</code> plus <code>grip</code>.
            </li>
            <li><code>hell-tanstack-table</code>: shell for a caller-owned TanStack table.</li>
            <li><code>hellTableShellToolbar</code>: repeatable projected toolbar region.</li>
            <li><code>hellTableShellFooter</code>: repeatable projected footer region.</li>
            <li>
              <code>hellTableShellCell</code>, <code>hellTableShellHeader</code>, and
              <code>hellTableShellFooterCell</code>: one-off projected TanStack contexts.
            </li>
            <li>
              <code>hellTableShellExpandedRow</code>: expanded row template driven by TanStack row
              expansion.
            </li>
            <li><code>hellTanStackVirtualRows</code>: optional TanStack Virtual body strategy.</li>
          </ul>

          <h2>Accessibility</h2>
          <ul>
            <li>Primitives preserve native table semantics; roles are only inferred when markup is non-native.</li>
            <li>Sorting is activated through real buttons (<code>hellTableSortTrigger</code>) exposing <code>aria-sort</code> on the header cell.</li>
            <li>Column resize handles are keyboard-operable separators with Label Contract names.</li>
          </ul>

          <h2>Do</h2>
          <ul class="hd-do">
            <li>Let TanStack own table state and feature behavior.</li>
            <li>
              Use projected shell regions for pagination, selected-count summaries, and exports.
            </li>
            <li>
              Use <code>columnDef.meta.hell.*Class</code> for shell cell/header/footer class
              passthrough.
            </li>
            <li>
              Keep one-off projected templates small and derive feature state from the native
              TanStack context.
            </li>
          </ul>

          <h2>Don't</h2>
          <ul class="hd-dont">
            <li>Don't build a second table model or column-definition DSL in Hell.</li>
            <li>Don't use row click shortcuts for actions; put Hell table controls in cells.</li>
            <li>
              Don't add parallel Hell props for column pinning, sorting, filtering, pagination, or
              expansion state.
            </li>
            <li>Don't create a separate virtual-table root component.</li>
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
  protected readonly tableTanStackShellExampleCode = tableTanStackShellExampleCodeRaw;
  protected readonly tableTanStackVirtualExampleCode = tableTanStackVirtualExampleCodeRaw;
}
