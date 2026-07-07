import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-placements-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <button hellButton [hellTooltipTrigger]="top" placement="top" type="button">Top</button>
    <button hellButton [hellTooltipTrigger]="right" placement="right" type="button">Right</button>
    <button hellButton [hellTooltipTrigger]="bottom" placement="bottom" type="button">
      Bottom
    </button>
    <button hellButton [hellTooltipTrigger]="left" placement="left" type="button">Left</button>

    <ng-template #top><span hellTooltip>I'm on top</span></ng-template>
    <ng-template #right><span hellTooltip>I'm on the right</span></ng-template>
    <ng-template #bottom><span hellTooltip>I'm at the bottom</span></ng-template>
    <ng-template #left><span hellTooltip>I'm on the left</span></ng-template>
  `,
})
export class TooltipPlacementsExample {}
