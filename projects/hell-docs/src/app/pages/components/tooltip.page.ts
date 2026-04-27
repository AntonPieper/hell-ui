import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellTooltip, HellTooltipTrigger } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <article class="hd-prose">
      <h1>Tooltip</h1>
      <p>
        Show a short, supporting hint on hover and focus. For richer content, use a
        <code>popover</code>.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap gap-4">
        <button hellButton [hellTooltipTrigger]="t1" placement="top">Top</button>
        <button hellButton [hellTooltipTrigger]="t2" placement="right">Right</button>
        <button hellButton [hellTooltipTrigger]="t3" placement="bottom">Bottom</button>
        <button hellButton [hellTooltipTrigger]="t4" placement="left">Left</button>

        <ng-template #t1><span hellTooltip>I'm on top</span></ng-template>
        <ng-template #t2><span hellTooltip>I'm on the right</span></ng-template>
        <ng-template #t3><span hellTooltip>I'm at the bottom</span></ng-template>
        <ng-template #t4><span hellTooltip>I'm on the left</span></ng-template>
      </hd-example-tabs>

      <h2>With delay</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
        <button hellButton [hellTooltipTrigger]="slow" [showDelay]="600" [hideDelay]="100">
          Hover for 600ms
        </button>
        <ng-template #slow><span hellTooltip>Took my time</span></ng-template>
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
  protected readonly exampleCodes = [
    '<button hellButton [hellTooltipTrigger]="t1" placement="top">Top</button>\n<button hellButton [hellTooltipTrigger]="t2" placement="right">Right</button>\n<button hellButton [hellTooltipTrigger]="t3" placement="bottom">Bottom</button>\n<button hellButton [hellTooltipTrigger]="t4" placement="left">Left</button>\n\n<ng-template #t1><span hellTooltip>I\'m on top</span></ng-template>\n<ng-template #t2><span hellTooltip>I\'m on the right</span></ng-template>\n<ng-template #t3><span hellTooltip>I\'m at the bottom</span></ng-template>\n<ng-template #t4><span hellTooltip>I\'m on the left</span></ng-template>\n',
    '<button hellButton [hellTooltipTrigger]="slow" [showDelay]="600" [hideDelay]="100">\n  Hover for 600ms\n</button>\n<ng-template #slow><span hellTooltip>Took my time</span></ng-template>\n',
  ] as const;
}
