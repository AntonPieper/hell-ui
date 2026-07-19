import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-hoverable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipSurface],
  template: `
    <button
      hellButton
      [hellTooltip]="hoverable"
      placement="right"
      [hideDelay]="100"
      type="button"
    >
      Hoverable
    </button>
    <ng-template #hoverable>
      <span hellTooltipSurface>Stays open while you hover this hint.</span>
    </ng-template>
  `,
})
export class TooltipHoverableExample {}
