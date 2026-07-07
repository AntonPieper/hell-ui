import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-hoverable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <button
      hellButton
      [hellTooltipTrigger]="hoverable"
      placement="right"
      [hideDelay]="100"
      [hoverableContent]="true"
      type="button"
    >
      Hoverable
    </button>
    <ng-template #hoverable>
      <span hellTooltip>Stays open while you hover this hint.</span>
    </ng-template>
  `,
})
export class TooltipHoverableExample {}
