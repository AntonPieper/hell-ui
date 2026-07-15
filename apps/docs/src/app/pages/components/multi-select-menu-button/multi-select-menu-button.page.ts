import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MultiSelectMenuButtonBasicExample } from './examples/basic.example';
import multiSelectMenuButtonBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { MultiSelectMenuButtonTanStackExample } from './examples/tanstack-columns.example';
import multiSelectMenuButtonTanStackExampleCodeRaw from './examples/tanstack-columns.example.ts?raw' with {
  loader: 'text',
};
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-multi-select-menu-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlock,
    ExampleTabs,
    PageHeader,
    MultiSelectMenuButtonBasicExample,
    MultiSelectMenuButtonTanStackExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Multi-select menu button"
        icon="faSolidListCheck"
        category="Recipe"
        importPath="@hell-ui/angular/menu"
        stylesPath="@hell-ui/angular/menu/styles.css"
      >
        A button that opens a menu of checkable options and reflects the selected count on its
        trigger — built from the button and menu entry points, not a dedicated component.
      </hd-page-header>
      <p>
        This is a <strong>recipe</strong>: compose <code>hellButton</code>, a
        <code>[hellMenu]</code> panel, and an explicit loop of
        <code>button[hellMenuItemCheckbox]</code> rows. Iterate real domain objects, bind each row's
        <code>checked</code> and <code>disabled</code> state, and update your own collection from
        <code>(checkedChange)</code>. Toggling keeps the menu open — adjusting several choices is
        one visit, not five. Nothing here is private API: every behavior below is yours to
        rearrange.
      </p>
      <p>
        The former <code>&#64;hell-ui/angular/multi-select-menu-button</code> entry point shipped
        this exact composition as a component; it was removed in favor of this recipe, which is the
        migration target.
      </p>

      <h2>Consumer-owned collection, count, floor, and reset</h2>
      <p>
        The trigger shows a count while anything is selected (the recipe reflects
        <code>data-selection-count</code> / <code>data-has-selection</code> for styling). The
        selection floor is caller policy: when the collection is at the minimum, disable only its
        still-selected row so the collection can never drop below it. The reset item is an
        ordinary <code>hellMenuItem</code> after a separator — you restore your own defaults; no
        component holds a notion of a default for you.
      </p>
      <hd-example-tabs [code]="basicExampleCode">
        <app-multi-select-menu-button-basic-example />
      </hd-example-tabs>
      <p>The core of the recipe is one trigger and one explicit checkbox loop:</p>
      <hd-code-block [code]="bindingRecipe" />

      <h2>Recipe: TanStack column visibility</h2>
      <p>
        Iterate the caller-owned TanStack table's real <code>Column</code> objects and route each
        toggle through <code>column.toggleVisibility()</code>. The rows are the columns TanStack
        reports as hideable via <code>column.getCanHide()</code>, so a column marked
        <code>enableHiding: false</code> — the identity column here — never appears in the menu.
        The floor keeps at least one toggleable column on, and the reset item restores every
        column. This keeps the table boundary intact — TanStack still owns the state, and Hell UI
        owns none of it.
      </p>
      <hd-example-tabs [code]="tanStackExampleCode">
        <app-multi-select-menu-button-tanstack-example />
      </hd-example-tabs>
      <p>
        Persistence is a caller concern. The example writes the whole visibility map to
        <code>localStorage</code> on every change through the table's
        <code>onColumnVisibilityChange</code> and reads it back on init — the app owns the storage
        key and its version, exactly as it owns page size. Drop the same
        <code>hellTableShellToolbar</code>-projected composition into any TanStack Table Shell
        toolbar alongside filter and pagination controls.
      </p>

      <h2>Styling</h2>
      <p>
        Every piece keeps its own Part Style Map: the trigger is the button primitive, the panel
        and each checkbox/indicator are independent Menu directives, and the count badge is your
        own markup. Refine each directive through its own <code>ui</code> input; there is no shared
        renderer map.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Each option is a <code>menuitemcheckbox</code> with its <code>aria-checked</code> state,
          so current choices are perceivable to screen readers; give the menu an
          <code>aria-label</code> matching the trigger text.
        </li>
        <li>
          Full menu-pattern keyboard support comes from the menu entry point — arrow-key roving,
          Home/End, typeahead, and Escape to close — while toggling a checkbox keeps the menu open.
        </li>
        <li>
          Keep the count badge decorative (<code>aria-hidden</code>) and announce the count through
          visually hidden text, as the example does.
        </li>
        <li>Options held at the selection floor use native <code>disabled</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Iterate real domain objects and update your collection from <code>(checkedChange)</code>.</li>
        <li>Disable still-selected options when an empty selection would be a broken state.</li>
        <li>Bind it to TanStack <code>columnVisibility</code> and persist the map in your own storage.</li>
        <li>Give the trigger clear text and the menu an <code>aria-label</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't introduce a parallel option schema just to render labels and disabled state.</li>
        <li>Don't reach into the menu to force it closed on toggle — staying open is the point.</li>
        <li>Don't wire the reset item through checkbox state; it is an ordinary menu item you handle yourself.</li>
      </ul>
    </article>
  `,
})
export class MultiSelectMenuButtonPage {
  protected readonly basicExampleCode = multiSelectMenuButtonBasicExampleCodeRaw;
  protected readonly tanStackExampleCode = multiSelectMenuButtonTanStackExampleCodeRaw;

  protected readonly bindingRecipe = `<button hellButton type="button" [hellMenuTrigger]="menu">
  Columns ({{ visibleColumns().length }})
</button>
<ng-template #menu>
  <div hellMenu aria-label="Columns">
    @for (column of columns; track column.id) {
      <button
        hellMenuItemCheckbox
        type="button"
        [checked]="isVisible(column)"
        [disabled]="isLastVisible(column)"
        (checkedChange)="setVisible(column, $event)"
      >
        <span hellMenuItemIndicator></span>
        <span>{{ column.name }}</span>
      </button>
    }
  </div>
</ng-template>`;
}
