import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
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
import { TooltipStylingExample } from './examples/styling.example';
import tooltipStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, TooltipExampleExample, TooltipWithDelayExample, TooltipHoverableExample, TooltipStylingExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tooltip"
        icon="faSolidCircleQuestion"
        category="Styled primitive"
        importPath="@hell-ui/angular/tooltip"
        stylesPath="@hell-ui/angular/tooltip/styles.css"
      >
        Short hover- and focus-triggered hints positioned around the trigger — for names and shortcuts, not essential content.
      </hd-page-header>
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

      <h2>Styling</h2>
      <p>
        <code>HellTooltipUi</code> refines the tooltip surface's <code>root</code> Public Part. Keep overrides to visual utilities; positioning and accessibility stay owned by the trigger contract.
      </p>
      <hd-example-tabs [code]="tooltipStylingExampleCode" previewClass="flex flex-wrap gap-2">
        <app-tooltip-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>placement</code>, <code>offset</code>, <code>container</code></li>
        <li><code>showDelay</code>, <code>hideDelay</code> (ms)</li>
        <li><code>disabled</code>, <code>showOnOverflow</code>, <code>hoverableContent</code></li>
        <li><code>ui</code>: Part Style Map for the tooltip surface's local <code>root</code> part. The surface renders <code>data-slot="root"</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Opens on focus as well as hover and is linked with <code>aria-describedby</code>.</li>
        <li>Content must be supplementary; controls stay usable when the tooltip never shows.</li>
        <li>Hoverable tooltips stay open while the pointer moves onto them.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use tooltips for supplemental explanations, not primary labels.</li>
        <li>Keep copy short enough to read at a glance.</li>
        <li>Ensure the trigger already has an accessible name.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
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
  protected readonly tooltipStylingExampleCode = tooltipStylingExampleCodeRaw;
}
