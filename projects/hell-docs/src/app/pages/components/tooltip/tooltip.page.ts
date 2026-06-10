import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { TooltipExampleExample } from './examples/example.example';
import tooltipExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { TooltipWithDelayExample } from './examples/with-delay.example';
import tooltipWithDelayExampleCodeRaw from './examples/with-delay.example.ts?raw' with {
  loader: 'text',
};
import { TooltipHoverableExample } from './examples/hoverable.example';
import tooltipHoverableExampleCodeRaw from './examples/hoverable.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, TooltipExampleExample, TooltipWithDelayExample, TooltipHoverableExample],
  template: `
    <article class="hd-prose">
      <h1>Tooltip</h1>
      <p>
        Show a short, supporting hint on hover and focus. For richer content, use a
        <code>popover</code>.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="tooltipExampleExampleCode" previewClass="flex flex-wrap gap-4">
        <app-tooltip-example-example />
      </hd-example-tabs>

      <h2>With delay</h2>
      <hd-example-tabs [code]="tooltipWithDelayExampleCode">
        <app-tooltip-with-delay-example />
      </hd-example-tabs>

      <h2>Hoverable content</h2>
      <hd-example-tabs [code]="tooltipHoverableExampleCode">
        <app-tooltip-hoverable-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>placement</code>, <code>offset</code></li>
        <li><code>showDelay</code>, <code>hideDelay</code> (ms)</li>
        <li><code>disabled</code>, <code>showOnOverflow</code>, <code>hoverableContent</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use tooltips for supplemental explanations, not primary labels.</li>
        <li>Keep copy short enough to read at a glance.</li>
        <li>Ensure the trigger already has an accessible name.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put interactive controls inside a tooltip.</li>
        <li>Don't hide required instructions in hover-only content.</li>
      </ul>
    </article>
  `,
})
export class TooltipPage {
  protected readonly tooltipExampleExampleCode = tooltipExampleExampleCodeRaw;
  protected readonly tooltipWithDelayExampleCode = tooltipWithDelayExampleCodeRaw;
  protected readonly tooltipHoverableExampleCode = tooltipHoverableExampleCodeRaw;
}
