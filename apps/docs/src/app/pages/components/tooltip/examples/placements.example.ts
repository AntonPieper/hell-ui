import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellTooltip } from 'hell-ui/tooltip';

@Component({
  selector: 'app-tooltip-placements-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellTooltip],
  template: `
    <button hellButton hellTooltip="I'm on top" placement="top" type="button">Top</button>
    <button hellButton hellTooltip="I'm on the right" placement="right" type="button">
      Right
    </button>
    <button hellButton hellTooltip="I'm at the bottom" placement="bottom" type="button">
      Bottom
    </button>
    <button hellButton hellTooltip="I'm on the left" placement="left" type="button">Left</button>
  `,
})
export class TooltipPlacementsExample {}
