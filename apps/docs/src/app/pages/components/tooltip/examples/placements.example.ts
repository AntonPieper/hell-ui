import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-placements-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipSurface],
  template: `
    <button hellButton [hellTooltip]="top" placement="top" type="button">Top</button>
    <button hellButton [hellTooltip]="right" placement="right" type="button">Right</button>
    <button hellButton [hellTooltip]="bottom" placement="bottom" type="button">
      Bottom
    </button>
    <button hellButton [hellTooltip]="left" placement="left" type="button">Left</button>

    <ng-template #top><span hellTooltipSurface>I'm on top</span></ng-template>
    <ng-template #right><span hellTooltipSurface>I'm on the right</span></ng-template>
    <ng-template #bottom><span hellTooltipSurface>I'm at the bottom</span></ng-template>
    <ng-template #left><span hellTooltipSurface>I'm on the left</span></ng-template>
  `,
})
export class TooltipPlacementsExample {}
