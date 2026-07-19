import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip, HellTooltipSurface } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip, HellTooltipSurface],
  template: `
    <button hellButton [hellTooltip]="hint" type="button">Hover me</button>
    <ng-template #hint><span hellTooltipSurface>Saves the current draft</span></ng-template>
  `,
})
export class TooltipBasicExample {}
