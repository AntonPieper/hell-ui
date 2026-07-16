import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { FilterBuilderAsyncEntityExample } from './examples/async-entity.example';
import filterBuilderAsyncEntityExampleCodeRaw from './examples/async-entity.example.ts?raw' with {
  loader: 'text',
};
import { FilterBuilderDateRangeExample } from './examples/date-range.example';
import filterBuilderDateRangeExampleCodeRaw from './examples/date-range.example.ts?raw' with {
  loader: 'text',
};
import { FilterBuilderRecipesExample } from './examples/recipes.example';
import filterBuilderRecipesExampleCodeRaw from './examples/recipes.example.ts?raw' with {
  loader: 'text',
};
import { FilterBuilderServerDispatchExample } from './examples/server-dispatch.example';
import filterBuilderServerDispatchExampleCodeRaw from './examples/server-dispatch.example.ts?raw' with {
  loader: 'text',
};
import { FilterBuilderTanStackExample } from './examples/tanstack.example';
import filterBuilderTanStackExampleCodeRaw from './examples/tanstack.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-filter-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @import '@hell-ui/angular/features/filter-builder/styles.css';

      @media (max-width: 639px) {
        hd-filter-builder .hd-prose li code {
          overflow-wrap: anywhere;
          white-space: normal;
        }
      }
    `,
  ],
  imports: [
    CodeBlock,
    ExampleTabs,
    PageHeader,
    FilterBuilderRecipesExample,
    FilterBuilderAsyncEntityExample,
    FilterBuilderDateRangeExample,
    FilterBuilderServerDispatchExample,
    FilterBuilderTanStackExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Filter Builder"
        icon="faSolidFilter"
        category="Feature"
        status="Experimental"
        importPath="@hell-ui/angular/features/filter-builder"
        stylesPath="@hell-ui/angular/features/filter-builder/styles.css"
      >
        A controlled token surface for domain-neutral expressions, with typed application-projected
        editors for every field.
      </hd-page-header>

      <p>
        <code>hell-filter-builder</code> owns the hard interaction shell: field selection, token
        navigation, immutable create/edit/remove/clear changes, stable edit targeting, layered
        floating dismissal, focus restoration, and announcements. Your application owns the field
        schema, expression unions, editor rendering, display copy, validation, and any async data.
        This projected Feature replaces the retired Filter Bar contract without carrying its fixed
        field kinds, equality-only operator, value union, or built-in search policy forward.
      </p>

      <h2>Text, options, and a custom operator</h2>
      <p>
        These are recipes rather than built-in kinds. Three typed descriptors bind three projected
        templates: a text input, a projection-first options Combobox, and a numeric
        <code>atLeast</code> operator. The controlled preview shows the complete array emitted after
        each valid commit.
      </p>
      <hd-example-tabs [code]="recipesCode" previewClass="min-h-[250px]">
        <app-filter-builder-recipes-example />
      </hd-example-tabs>

      <h2>TanStack Filter Controls recipe</h2>
      <p>
        A Filter Builder can live in a Table Shell toolbar without owning table state. The
        application maps its own global-search expression to TanStack's
        <code>globalFilter</code> and groups its own name, status, role, and team expressions into
        <code>columnFilters</code>. Multiple team expressions use application-defined OR semantics;
        TanStack remains the only table engine.
      </p>
      <hd-example-tabs [code]="tanStackCode" previewClass="min-h-[360px]">
        <app-filter-builder-tanstack-example />
      </hd-example-tabs>

      <h2>External async entity Search Resource</h2>
      <p>
        The application creates the public <code>hellSearchResource</code> and projects its query,
        results, loading, error, and empty states through a Combobox editor. The Filter Builder has
        no source, debounce, loading, error, or entity configuration. Type <code>fail</code> to see
        the application-owned failure state.
      </p>
      <hd-example-tabs [code]="asyncEntityCode" previewClass="min-h-[190px]">
        <app-filter-builder-async-entity-example />
      </hd-example-tabs>

      <h2>Server-dispatch recipe</h2>
      <p>
        The complete application expression array can be sent directly to a server adapter. This
        example keeps the Owner Search Resource separate from request dispatch and combines its
        domain entity expression with the same projected date-range editor. Type
        <code>error</code> in Owner search to exercise application-owned error presentation.
      </p>
      <hd-example-tabs [code]="serverDispatchCode" previewClass="min-h-[480px]">
        <app-filter-builder-server-dispatch-example />
      </hd-example-tabs>

      <h2>Structured date-range recipe</h2>
      <p>
        A custom projected component edits a structured <code>{{ '{' }} from, to {{ '}' }}</code>
        value with two Date Inputs. Their portalled calendars join the Filter Builder floating
        scope, so Escape closes one nested layer at a time before cancelling the editor.
      </p>
      <hd-example-tabs [code]="dateRangeCode" previewClass="min-h-[170px]">
        <app-filter-builder-date-range-example />
      </hd-example-tabs>

      <h2>Typed expression and editor context</h2>
      <hd-code-block [code]="contractCode" />
      <ul>
        <li>
          <code>HellFilter&lt;TField, TOperator, TValue&gt;</code> has only readonly
          <code>field</code>, <code>operator</code>, and <code>value</code>. Extend it with your own
          stable id or other domain metadata.
        </li>
        <li>
          <code>HellFilterFieldDescriptor&lt;TFilter&gt;</code> has no kind discriminator. It supplies
          <code>field</code>, <code>label</code>, <code>display(filter)</code>, and
          <code>validate(filter)</code>. Optional <code>multiple</code> controls only whether that
          field may produce more than one token.
        </li>
        <li>
          Bind the descriptor directly through
          <code>&lt;ng-template [hellFilterBuilderEditor]="descriptor" let-editor&gt;</code>. The typed
          context exposes <code>descriptor</code>, the latest controlled <code>filter</code>,
          <code>mode</code>, <code>display()</code>, <code>validate()</code>,
          <code>commit()</code>, and <code>cancel()</code>. Invalid commits return
          <code>false</code> and emit nothing.
        </li>
        <li>
          <code>[identify]</code> is required. Return a stable <code>string</code> or
          <code>number</code> that survives controlled object recreation and array reordering; the
          feature never fingerprints generic values.
        </li>
      </ul>

      <h2>Migrate from Filter Bar</h2>
      <ul>
        <li>
          Replace each built-in field <code>kind</code> with an application-owned typed descriptor
          and projected editor template. Text, options, entity, and date range remain recipes.
        </li>
        <li>
          Replace <code>{{ '{' }} key, operator: 'eq', value {{ '}' }}</code> tokens with your domain
          expression type extending <code>HellFilter</code>, including a stable application id.
        </li>
        <li>
          Move entity query, debounce, cancellation, loading, empty, and error policy into a public
          <code>Search Resource</code> consumed by the projected editor.
        </li>
        <li>
          Import the feature and its stylesheet from
          <code>@hell-ui/angular/features/filter-builder</code>; the removed
          <code>@hell-ui/angular/filter-bar</code> entry point has no compatibility alias.
        </li>
      </ul>

      <h2>Keyboard and focus</h2>
      <ul>
        <li>
          Use the field Combobox with Arrow keys and Enter. Escape closes its panel, then clears a
          typed query; selecting a field focuses the projected editor's first interactive control.
        </li>
        <li>
          Tokens use Chip Set roving focus. Arrow Left/Right and Home/End navigate, Enter or Space
          edits, Delete/Backspace removes, and printable typing returns to the field picker.
        </li>
        <li>
          Cancelling or committing an edit restores focus to the same stable token. A nested
          calendar or application popover consumes Escape before the surrounding editor.
        </li>
      </ul>

      <h2>Styling</h2>
      <p>
        Refine the owned anatomy through <code>ui</code>. Projected inputs, options, entity rows,
        calendars, and custom editor controls keep their own component or application styling
        contracts.
      </p>
      <table class="hd-doc-table">
        <thead><tr><th>Part</th><th>Purpose</th></tr></thead>
        <tbody>
          @for (part of parts; track part.name) {
            <tr><td><code>{{ part.name }}</code></td><td>{{ part.purpose }}</td></tr>
          }
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li><code>fields</code>: required typed descriptor array.</li>
        <li><code>value</code>: controlled readonly expression array; default <code>[]</code>.</li>
        <li>
          <code>identify</code>: required stable identity callback returning a string or number.
        </li>
        <li>
          <code>(valueChange)</code>: the complete immutable next array after a valid user action;
          never emitted on initial render.
        </li>
        <li><code>disabled</code>, <code>placeholder</code>, <code>aria-label</code>, and <code>ui</code>.</li>
        <li>
          <code>HELL_FILTER_BUILDER_IMPORTS</code> bundles the component and projected-editor
          directive. <code>HELL_FILTER_BUILDER_LABELS</code> localizes visible and announced copy.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Replace application state from each complete <code>valueChange</code> array.</li>
        <li>Use real stable ids for identity across recreation, sorting, and persistence.</li>
        <li>Keep editor-specific drafts, search resources, and status UI in application code.</li>
        <li>Let descriptor callbacks be the single source of display and validation policy.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mutate the supplied array or expression objects in place.</li>
        <li>Don't use <code>multiple</code> as a field-kind discriminator.</li>
        <li>Don't derive identity with <code>JSON.stringify</code> or display values.</li>
        <li>Don't build text/options/entity/date-range unions into shared infrastructure.</li>
      </ul>
    </article>
  `,
})
export class FilterBuilderPage {
  protected readonly recipesCode = filterBuilderRecipesExampleCodeRaw;
  protected readonly tanStackCode = filterBuilderTanStackExampleCodeRaw;
  protected readonly asyncEntityCode = filterBuilderAsyncEntityExampleCodeRaw;
  protected readonly serverDispatchCode = filterBuilderServerDispatchExampleCodeRaw;
  protected readonly dateRangeCode = filterBuilderDateRangeExampleCodeRaw;
  protected readonly contractCode = `interface PeopleFilter
  extends HellFilter<'status', 'is' | 'isNot', 'active' | 'paused'> {
  readonly id: string;
}

readonly statusField: HellFilterFieldDescriptor<PeopleFilter> = {
  field: 'status',
  label: 'Status',
  display: filter => \`Status \${filter.operator} \${filter.value}\`,
  validate: filter => filter.value === 'active' || filter.value === 'paused',
};
readonly identifyFilter = (filter: PeopleFilter) => filter.id;

<hell-filter-builder
  [fields]="[statusField]"
  [value]="filters()"
  [identify]="identifyFilter"
  (valueChange)="filters.set($event)"
>
  <ng-template [hellFilterBuilderEditor]="statusField" let-editor>
    <!-- Application-owned typed editor calls editor.commit(...) or editor.cancel(). -->
  </ng-template>
</hell-filter-builder>`;

  protected readonly parts = [
    { name: 'root', purpose: 'Feature host around tokens, control, clear action, and live status.' },
    { name: 'tokens', purpose: 'Chip Set and Chip Input container.' },
    { name: 'token', purpose: 'One controlled filter expression chip.' },
    { name: 'tokenLabel', purpose: 'Visible label and token edit trigger.' },
    { name: 'control', purpose: 'Field-picker Control Group.' },
    { name: 'panel', purpose: 'Portalled field suggestion panel.' },
    { name: 'fieldOption', purpose: 'One available typed field descriptor.' },
    { name: 'editor', purpose: 'Host for the application-projected create or edit template.' },
    { name: 'clear', purpose: 'Clear-all action shown when expressions exist.' },
    { name: 'live', purpose: 'Polite add, update, remove, and clear announcement region.' },
  ] as const;
}
