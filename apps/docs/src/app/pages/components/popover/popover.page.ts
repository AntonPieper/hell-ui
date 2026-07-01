import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PopoverExampleExample } from './examples/example.example';
import popoverExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { PopoverStylingExample } from './examples/styling.example';
import popoverStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, PopoverExampleExample, PopoverStylingExample],
  template: `
    <article class="hd-prose">
      <h1>Popover</h1>
      <p>
        An anchored, dismissible surface for richer content than a tooltip (forms, menus,
        summaries). Use a <code>&lt;ng-template&gt;</code> for the content.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="popoverExampleExampleCode">
        <app-popover-example-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        The popover panel is its <code>root</code> Public Part — even though it renders in an overlay, it stays part of <code>HellPopoverUi</code>. Portaling changes DOM location, not ownership.
      </p>
      <hd-example-tabs [code]="popoverStylingExampleCode">
        <app-popover-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellPopoverTrigger</code>: bind to a <code>&lt;ng-template&gt;</code> reference
        </li>
        <li><code>placement</code>, <code>offset</code>, <code>flip</code></li>
        <li><code>closeOnEscape</code>, <code>closeOnOutsideClick</code>, <code>disabled</code></li>
        <li><code>(openChange)</code>: emits when opened or closed</li>
        <li><code>ui</code>: Part Style Map for the popover surface's local <code>root</code> part. The surface renders <code>data-slot="root"</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use popover for anchored content that needs focus management.</li>
        <li>Keep content short and task-focused.</li>
        <li>Use Dialog for long forms or confirmations.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put essential page content only in a popover.</li>
        <li>Don't open nested popovers unless interaction has been tested by keyboard.</li>
      </ul>
    </article>
  `,
})
export class PopoverPage {
  protected readonly popoverExampleExampleCode = popoverExampleExampleCodeRaw;
  protected readonly popoverStylingExampleCode = popoverStylingExampleCodeRaw;
}
