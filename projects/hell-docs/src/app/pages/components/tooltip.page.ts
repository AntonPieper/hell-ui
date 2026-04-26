import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellTooltip, HellTooltipTrigger } from 'hell';

@Component({
  selector: 'hd-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <article class="hd-prose">
      <h1>Tooltip</h1>
      <p>
        Show a short, supporting hint on hover and focus. For richer content, use a
        <code>popover</code>.
      </p>

      <h2>Example</h2>
      <div class="hd-example flex flex-wrap gap-4">
        <button hellButton [hellTooltipTrigger]="t1" placement="top">Top</button>
        <button hellButton [hellTooltipTrigger]="t2" placement="right">Right</button>
        <button hellButton [hellTooltipTrigger]="t3" placement="bottom">Bottom</button>
        <button hellButton [hellTooltipTrigger]="t4" placement="left">Left</button>

        <ng-template #t1><span hellTooltip>I'm on top</span></ng-template>
        <ng-template #t2><span hellTooltip>I'm on the right</span></ng-template>
        <ng-template #t3><span hellTooltip>I'm at the bottom</span></ng-template>
        <ng-template #t4><span hellTooltip>I'm on the left</span></ng-template>
      </div>

      <h2>With delay</h2>
      <div class="hd-example">
        <button hellButton [hellTooltipTrigger]="slow" [showDelay]="600" [hideDelay]="100">
          Hover for 600ms
        </button>
        <ng-template #slow><span hellTooltip>Took my time</span></ng-template>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>placement</code>, <code>offset</code></li>
        <li><code>showDelay</code>, <code>hideDelay</code> (ms)</li>
        <li><code>disabled</code>, <code>showOnOverflow</code>, <code>hoverableContent</code></li>
      </ul>
    </article>
  `,
})
export class TooltipPage {}
