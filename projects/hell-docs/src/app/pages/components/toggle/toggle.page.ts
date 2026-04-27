import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
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

@Component({
  selector: 'hd-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ToggleSingleToggleExample,
    ToggleToggleGroupSingleExample,
    ToggleToggleGroupMultipleExample,
    ToggleDisabledExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Toggle</h1>
      <p>
        Press-toggle button. Use the standalone <code>hellToggle</code> for a single binary action,
        or wrap several <code>hellToggleGroupItem</code> buttons in a
        <code>hellToggleGroup</code> for single- or multi-select choices.
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
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use toggle for compact pressed/unpressed tools.</li>
        <li>Use toggle groups when options are visually peer actions.</li>
        <li>Provide labels or tooltips for icon-only toggles.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
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
}
