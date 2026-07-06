import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ToggleDisabledExample } from './examples/disabled.example';
import toggleDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { ToggleSingleToggleExample } from './examples/single-toggle.example';
import toggleSingleToggleExampleCodeRaw from './examples/single-toggle.example.ts?raw' with {
  loader: 'text',
};
import { ToggleToggleGroupMultipleExample } from './examples/toggle-group-multiple.example';
import toggleToggleGroupMultipleExampleCodeRaw from './examples/toggle-group-multiple.example.ts?raw' with {
  loader: 'text',
};
import { ToggleToggleGroupSingleExample } from './examples/toggle-group-single.example';
import toggleToggleGroupSingleExampleCodeRaw from './examples/toggle-group-single.example.ts?raw' with {
  loader: 'text',
};
import { ToggleStylingExample } from './examples/styling.example';
import toggleStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ToggleSingleToggleExample,
    ToggleToggleGroupSingleExample,
    ToggleToggleGroupMultipleExample,
    ToggleDisabledExample, ToggleStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Toggle"
        icon="faSolidToggleOn"
        category="Styled primitive"
        importPath="@hell-ui/angular/toggle"
        stylesPath="@hell-ui/angular/toggle/styles.css"
      >
        Pressed-state buttons — standalone, or in single/multiple selection groups for view options and formatting bars.
      </hd-page-header>
      <p>
        Press-toggle button. Use the standalone <code>hellToggle</code> for a single binary action,
        or wrap several <code>hellToggleGroupItem</code> buttons in a
        <code>hellToggleGroup</code> for single- or multi-select choices.
      </p>
      <p>
        Prefer native controls where native form semantics matter. Toggle group Angular form
        writes use public <code>ng-primitives</code> setters; no private state bridge is used.
      </p>

      <h2>Single toggle</h2>
      <hd-example-tabs [code]="toggleSingleToggleExampleCode" previewClass="flex gap-2">
        <app-toggle-single-toggle-example />
      </hd-example-tabs>

      <h2>Toggle group (single)</h2>
      <hd-example-tabs [code]="toggleToggleGroupSingleExampleCode">
        <app-toggle-toggle-group-single-example />
      </hd-example-tabs>

      <h2>Toggle group (multiple)</h2>
      <hd-example-tabs [code]="toggleToggleGroupMultipleExampleCode">
        <app-toggle-toggle-group-multiple-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="toggleDisabledExampleCode" previewClass="flex gap-2">
        <app-toggle-disabled-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellToggleUi</code> refines the toggle's <code>root</code> Public Part. The string shorthand and the explicit map are equivalent for single-part directives.
      </p>
      <hd-example-tabs [code]="toggleStylingExampleCode" previewClass="flex flex-wrap items-center gap-2">
        <app-toggle-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellToggle</code>: <code>selected</code>, <code>selectedChange</code>,
          <code>disabled</code>
        </li>
        <li>
          <code>hellToggleGroup</code>: <code>type</code> (<code>single | multiple</code>),
          <code>value</code>, <code>valueChange</code>, <code>disabled</code>
        </li>
        <li><code>hellToggleGroupItem</code>: <code>value</code>, <code>disabled</code></li>
        <li>
          <code>ui</code>: string shorthand targets <code>root</code> on each directive; typed
          maps use <code>HellToggleUi</code>, <code>HellToggleGroupUi</code>, or
          <code>HellToggleGroupItemUi</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Standalone toggles expose <code>aria-pressed</code>.</li>
        <li>
          Single-select group items expose <code>role="radio"</code> with
          <code>aria-checked</code>; multiple-select group items stay toggle buttons with
          <code>aria-pressed</code>.
        </li>
        <li>Icon-only toggles need an <code>aria-label</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use toggle for compact pressed/unpressed tools.</li>
        <li>Use toggle groups when options are visually peer actions.</li>
        <li>Provide labels or tooltips for icon-only toggles.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use toggles for irreversible actions.</li>
        <li>Don't mix single toggles and group items without visual separation.</li>
      </ul>
    </article>
  `,
})
export class TogglePage {
  protected readonly toggleSingleToggleExampleCode = toggleSingleToggleExampleCodeRaw;
  protected readonly toggleToggleGroupSingleExampleCode = toggleToggleGroupSingleExampleCodeRaw;
  protected readonly toggleToggleGroupMultipleExampleCode = toggleToggleGroupMultipleExampleCodeRaw;
  protected readonly toggleDisabledExampleCode = toggleDisabledExampleCodeRaw;
  protected readonly toggleStylingExampleCode = toggleStylingExampleCodeRaw;
}
