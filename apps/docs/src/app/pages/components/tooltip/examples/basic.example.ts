import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellTooltip } from '@hell-ui/angular/tooltip';

@Component({
  selector: 'app-tooltip-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip],
  template: `
    <button hellButton hellTooltip="Saves the current draft" type="button">Hover me</button>
  `,
})
export class TooltipBasicExample {}
