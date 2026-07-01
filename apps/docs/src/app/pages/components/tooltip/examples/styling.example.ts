import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipTrigger],
  template: `
    <button hellButton [hellTooltipTrigger]="tip" placement="top">Deploy</button>

    <ng-template #tip>
      <!-- ui refines the tooltip's root Public Part. -->
      <span hellTooltip ui="bg-hell-primary text-hell-foreground-inverse">
        Deploys the current branch to production
      </span>
    </ng-template>
  `,
})
export class TooltipStylingExample {}
