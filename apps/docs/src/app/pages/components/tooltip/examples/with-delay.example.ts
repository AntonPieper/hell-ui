import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-with-delay-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <button hellButton [hellTooltipTrigger]="slow" [showDelay]="600" [hideDelay]="300">
      Hover for 600ms
    </button>
    <ng-template #slow><span hellTooltip>Took my time</span></ng-template>
  `,
})
export class TooltipWithDelayExample {}
