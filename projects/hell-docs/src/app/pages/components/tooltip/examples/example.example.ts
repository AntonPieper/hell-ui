import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellTooltip, HellTooltipTrigger } from 'hell/primitives';

@Component({
  selector: 'app-tooltip-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <button hellButton [hellTooltipTrigger]="t1" placement="top">Top</button>
    <button hellButton [hellTooltipTrigger]="t2" placement="right">Right</button>
    <button hellButton [hellTooltipTrigger]="t3" placement="bottom">Bottom</button>
    <button hellButton [hellTooltipTrigger]="t4" placement="left">Left</button>

    <ng-template #t1><span hellTooltip>I'm on top</span></ng-template>
    <ng-template #t2><span hellTooltip>I'm on the right</span></ng-template>
    <ng-template #t3><span hellTooltip>I'm at the bottom</span></ng-template>
    <ng-template #t4><span hellTooltip>I'm on the left</span></ng-template>
  `,
})
export class TooltipExampleExample {}
