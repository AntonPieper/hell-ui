import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellPopover, HellPopoverTrigger } from 'hell';

@Component({
  selector: 'hd-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <article class="hd-prose">
      <h1>Popover</h1>
      <p>An anchored, dismissible surface for richer content than a tooltip
        (forms, menus, summaries). Use a <code>&lt;ng-template&gt;</code> for
        the content.</p>

      <h2>Example</h2>
      <div class="hd-example">
        <button hellButton variant="default" [hellPopoverTrigger]="info" placement="bottom-start">
          Show details
        </button>

        <ng-template #info>
          <div hellPopover class="min-w-[240px]">
            <strong>Heinrich K.</strong>
            <p class="hd-muted mt-2">
              Senior Engineer · Berlin · last seen 2h ago
            </p>
          </div>
        </ng-template>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellPopoverTrigger</code>: bind to a <code>&lt;ng-template&gt;</code> reference</li>
        <li><code>placement</code>, <code>offset</code>, <code>flip</code></li>
        <li><code>closeOnEscape</code>, <code>closeOnOutsideClick</code>, <code>disabled</code></li>
        <li><code>(openChange)</code>: emits when opened or closed</li>
      </ul>
    </article>
  `,
})
export class PopoverPage {}
