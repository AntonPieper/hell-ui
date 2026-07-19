import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipSurface],
  template: `
    <button hellButton [hellTooltip]="tip" placement="top" type="button">Deploy</button>

    <ng-template #tip>
      <!-- ui refines HellTooltipSurface's only Public Part, root. -->
      <span
        hellTooltipSurface
        ui="rounded-hell-lg bg-hell-primary px-hell-3 py-hell-2 text-hell-primary-foreground shadow-hell-lg"
      >
        Deploys the current branch to production
      </span>
    </ng-template>
  `,
})
export class TooltipAllPartsStylingExample {}
