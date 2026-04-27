import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellPopover, HellPopoverTrigger } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <article class="hd-prose">
      <h1>Popover</h1>
      <p>
        An anchored, dismissible surface for richer content than a tooltip (forms, menus,
        summaries). Use a <code>&lt;ng-template&gt;</code> for the content.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <button hellButton variant="default" [hellPopoverTrigger]="info" placement="bottom-start">
          Show details
        </button>

        <ng-template #info>
          <div hellPopover class="min-w-[240px]">
            <strong>Heinrich K.</strong>
            <p class="hd-muted mt-2">Senior Engineer · Berlin · last seen 2h ago</p>
          </div>
        </ng-template>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellPopoverTrigger</code>: bind to a <code>&lt;ng-template&gt;</code> reference
        </li>
        <li><code>placement</code>, <code>offset</code>, <code>flip</code></li>
        <li><code>closeOnEscape</code>, <code>closeOnOutsideClick</code>, <code>disabled</code></li>
        <li><code>(openChange)</code>: emits when opened or closed</li>
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
  protected readonly exampleCodes = [
    '<button hellButton variant="default" [hellPopoverTrigger]="info" placement="bottom-start">\n  Show details\n</button>\n\n<ng-template #info>\n  <div hellPopover class="min-w-[240px]">\n    <strong>Heinrich K.</strong>\n    <p class="hd-muted mt-2">\n      Senior Engineer \u00b7 Berlin \u00b7 last seen 2h ago\n    </p>\n  </div>\n</ng-template>\n',
  ] as const;
}
