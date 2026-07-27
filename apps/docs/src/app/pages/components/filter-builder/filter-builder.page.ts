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
        importPath="hell-ui/features/filter-builder"
        stylesPath="hell-ui/features/filter-builder/styles.css"
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
      <p>
        The rendered surface is one grouped field: a Control Group frame holding a Chip Set in which
        filter chips and the inline field picker share a single flow, plus a trailing clear-all group
        action. It is the reference composition of the chip-in-control-group pattern the Chip and
        Combobox pages document, so the frame owns the border, the focus-within ring, and the
        <code>md</code> density while chips render at <code>sm</code>.
      </p>

      <h2>Anatomy</h2>
      <hd-code-block [code]="anatomyCode" />
      <ul>
        <li>
          The <code>root</code> Public Part <em>is</em> the frame. Clicking anywhere on empty frame
          space focuses the inline picker; chips, remove buttons, and the clear action keep their own
          targets.
        </li>
        <li>
          The chip set uses the shared <code>data-in-control-group</code> spacing recipe. The Filter
          Builder adds no private spacing overrides.
        </li>
        <li>
          The inline picker is a frameless Combobox on a real
          <code>input[hellChipInput][hellComboboxInput]</code>, so the Chip Input keyboard bridge
          applies unchanged.
        </li>
        <li>
          Create and edit share one placement model: both render the projected template in an
          anchored, non-modal popover — create anchored to the frame, edit anchored to its chip. The
          frame never reflows when an editor opens.
        </li>
      </ul>

      <h2>Text, options, and a custom operator</h2>
      <p>
        These are recipes rather than built-in kinds. Three typed descriptors bind three projected
        templates: a text value plus an operator <code>select</code>, a projection-first options
        Combobox, and a numeric <code>atLeast</code> operator. The recommended editor recipe pairs an
        operator control with a value control and commits on <code>Enter</code>; the contract itself
        only requires <code>commit</code> and <code>cancel</code>, and the shell never inspects
        editor internals. The controlled preview shows the complete array emitted after each valid
        commit.
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
        value with two native <code>input[hellDateInput]</code> controls. Each control owns its typed
        date draft; Escape directly cancels the projected editor and restores Filter Builder focus.
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
          Optional <code>displayParts(filter)</code> returns
          <code>{{ '{' }} field, operator?, value {{ '}' }}</code> and renders the chip as three
          segments — muted field, muted operator, emphasized value. It is presentation-only sugar:
          <code>display(filter)</code> stays the single source for accessible names and
          announcements, and duplicate detection stays identity-based. Omit it and the chip renders
          the flat <code>display(filter)</code> string inside <code>tokenValue</code>, which means it
          truncates at <code>16rem</code> and renders at medium weight like any value segment.
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

      <h2>Migrate the Part Style Map</h2>
      <p>
        The redesign reshuffles the owned anatomy, so <code>ui</code> maps written against the old
        two-surface layout need updating.
      </p>
      <table class="hd-doc-table">
        <thead><tr><th>Part</th><th>What changed</th></tr></thead>
        <tbody>
          @for (row of partMigration; track row.before) {
            <tr><td><code>{{ row.before }}</code></td><td>{{ row.now }}</td></tr>
          }
        </tbody>
      </table>

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
          <code>hell-ui/features/filter-builder</code>; the removed
          <code>hell-ui/filter-bar</code> entry point has no compatibility alias.
        </li>
      </ul>

      <h2>Overflow</h2>
      <p>
        Chips wrap and the frame grows vertically. This is the documented exception to the Control
        Group's single-line overflow contract: the chip set is the frame's flexible surface, rows
        wrap with in-group spacing so no row touches the border, and the inline picker claims about
        <code>8rem</code> before wrapping to its own row after the last chip. Long values truncate —
        <code>tokenValue</code> carries a <code>16rem</code> max width with an ellipsis, while the
        full text stays available through the edit trigger's accessible name, the announcements, and
        the editor.
      </p>
      <p>
        There is no built-in “+N more” collapse and no max height. Cap the height in application
        code with a Part Style Map refinement rather than asking for a mode:
      </p>
      <hd-code-block [code]="overflowRecipeCode" />

      <h2>Keyboard and focus</h2>
      <p>
        The frame has three tab stops — the chip set (one roving stop), the inline picker, and the
        clear action when filters exist. An open editor popover is a transient fourth surface that
        owns its own focus.
      </p>
      <table class="hd-doc-table">
        <thead><tr><th>Focus</th><th>Key</th><th>Behavior</th></tr></thead>
        <tbody>
          @for (row of keyboard; track row.key + row.focus) {
            <tr>
              <td>{{ row.focus }}</td>
              <td><code>{{ row.key }}</code></td>
              <td>{{ row.behavior }}</td>
            </tr>
          }
        </tbody>
      </table>
      <ul>
        <li>
          Committing or cancelling an edit restores focus to the same stable chip; committing or
          cancelling a create returns focus to the inline picker with the query cleared.
        </li>
        <li>
          Escape is layered. A control inside the editor that has its own layer open — a Combobox
          dropdown, a nested popover — closes that layer first; the next Escape cancels the editor.
          Nested Hell surfaces count as inside the editor's Floating Scope, so opening one never
          dismisses the editor.
        </li>
        <li>
          Create editing also ends when focus leaves the editor's own surface, so returning to the
          frame never leaves the editor and the picker dropdown open at once. Tabbing off the end of
          the editor hands focus back to the inline picker rather than out of the component.
        </li>
        <li>
          Removing a focused chip follows the Chip Set focus-continuity contract: focus moves to the
          nearest surviving chip, or back to the inline picker when the removed chip was the last
          one.
        </li>
      </ul>

      <h2>Styling</h2>
      <p>
        Refine the owned anatomy through <code>ui</code>. Projected inputs, options, entity rows,
        and custom editor controls keep their own directive, component, or application styling
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
        <li>
          Don't try to make the chip segments individually interactive. The whole label is the one
          edit trigger; per-segment menus would need a shell-owned operator schema.
        </li>
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
  protected readonly anatomyCode = `[hellControlGroup] .................................. root (the frame)
  [hellChipSet] .................................... tokens
    [hellChip] x n ................................. token
      edit trigger ................................. tokenLabel
        field segment .............................. tokenField
        operator segment ........................... tokenOperator
        value segment .............................. tokenValue
      button[hellChipRemove]
    inline Combobox ................................ control
      input[hellChipInput][hellComboboxInput]
      dropdown ..................................... panel
        option x n ................................. fieldOption
  button[hellControlGroupAction] ................... clear
editor popover (portalled, anchored) ............... editor
sr-only live region ................................ live`;

  protected readonly overflowRecipeCode = `<hell-filter-builder
  [ui]="{ tokens: 'max-h-24 overflow-y-auto' }"
  [fields]="fields"
  [value]="filters()"
  [identify]="identifyFilter"
  (valueChange)="filters.set($event)"
>`;

  protected readonly contractCode = `interface PeopleFilter
  extends HellFilter<'status', 'is' | 'isNot', 'active' | 'paused'> {
  readonly id: string;
}

readonly statusField: HellFilterFieldDescriptor<PeopleFilter> = {
  field: 'status',
  label: 'Status',
  display: filter => \`Status \${filter.operator} \${filter.value}\`,
  // Optional: muted field + operator segments and an emphasized value segment.
  displayParts: filter => ({ field: 'Status', operator: filter.operator, value: filter.value }),
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
    { name: 'root', purpose: 'The Control Group frame holding the whole surface.' },
    { name: 'tokens', purpose: 'Chip Set holding the chips and the inline picker.' },
    { name: 'token', purpose: 'One controlled filter expression chip.' },
    { name: 'tokenLabel', purpose: 'Chip edit trigger wrapping the display segments.' },
    { name: 'tokenField', purpose: 'Muted field segment; present only with displayParts.' },
    { name: 'tokenOperator', purpose: 'Muted operator segment; present only with a displayParts operator.' },
    { name: 'tokenValue', purpose: 'Emphasized value segment, or the flat display fallback. Truncates.' },
    { name: 'control', purpose: 'Frameless inline field-picker Combobox inside the chip flow.' },
    { name: 'panel', purpose: 'Portalled field suggestion panel.' },
    { name: 'fieldOption', purpose: 'One available typed field descriptor.' },
    { name: 'editor', purpose: 'Host for the projected create or edit template inside its popover.' },
    { name: 'clear', purpose: 'Icon-only clear-all group action shown when expressions exist.' },
    { name: 'live', purpose: 'Polite add, update, remove, and clear announcement region.' },
  ] as const;

  protected readonly partMigration = [
    {
      before: 'root',
      now: 'Was the bare flex row around everything. It is now the Control Group frame itself, so border, padding, and background refinements belong here while outer layout moves to the surrounding element.',
    },
    {
      before: 'control',
      now: 'Was the nested Control Group around the field picker. It is now the frameless inline Combobox inside the chip flow; move frame styling to root and keep only picker sizing here.',
    },
    {
      before: 'clear',
      now: 'Was a detached ghost hellButton outside the surface. It is now an icon-only button[hellControlGroupAction] at the end of the frame, so button variant utilities no longer apply.',
    },
    {
      before: 'tokenLabel',
      now: 'Still the edit trigger, but it now wraps tokenField, tokenOperator, and tokenValue. Descriptors without displayParts render their flat display string inside tokenValue, so it now truncates at 16rem and renders at medium weight. Move whole-label typography onto the segment parts.',
    },
    {
      before: 'editor',
      now: 'Create editors used to render inline inside hell-filter-builder; both modes now render in a body-level popover, and the part lost its flex-1. Selectors scoped under hell-filter-builder no longer match — style the part through the ui map instead of descendant CSS.',
    },
  ] as const;

  protected readonly keyboard = [
    { focus: 'Chip', key: 'ArrowLeft / ArrowRight', behavior: 'Roving focus to the previous or next enabled chip; ArrowRight on the last chip enters the inline picker.' },
    { focus: 'Chip', key: 'Home / End', behavior: 'Roving focus to the first or last enabled chip.' },
    { focus: 'Chip', key: 'Enter / Space', behavior: 'Open the edit editor anchored to that chip.' },
    { focus: 'Chip', key: 'Delete / Backspace', behavior: 'Remove the chip when it is removable.' },
    { focus: 'Chip', key: 'printable character', behavior: 'Focus the inline picker and start the query with that character.' },
    { focus: 'Chip', key: 'Escape', behavior: 'Focus the inline picker.' },
    { focus: 'Chip', key: 'Ctrl / Cmd / Alt combinations', behavior: 'Not intercepted; browser and platform shortcuts pass through.' },
    { focus: 'Inline picker', key: 'typing', behavior: 'Rank and filter the field list; the dropdown opens with matches.' },
    { focus: 'Inline picker', key: 'ArrowDown', behavior: 'Open the field dropdown, then navigate by active descendant.' },
    { focus: 'Inline picker', key: 'Enter', behavior: 'Commit the active field option and open the create editor.' },
    { focus: 'Inline picker', key: 'Tab', behavior: 'With an active option, commits like Enter instead of leaving the field.' },
    { focus: 'Inline picker (empty)', key: 'Backspace', behavior: 'Focus the last removable chip; a second Backspace removes it.' },
    { focus: 'Inline picker (empty)', key: 'ArrowLeft', behavior: 'Focus the last enabled chip.' },
    { focus: 'Inline picker', key: 'Escape', behavior: 'Close an open dropdown, else clear a typed query, else no-op.' },
    { focus: 'Editor', key: 'Escape', behavior: 'Cancel; the shell closes the popover and restores focus (picker for create, chip for edit).' },
    { focus: 'Clear action', key: 'Enter / Space', behavior: 'Clear every expression and return focus to the inline picker.' },
  ] as const;
}
