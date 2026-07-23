import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellTooltip, provideHellTooltipDefaults } from 'hell-ui/tooltip';

@Component({
  selector: 'app-tooltip-delay-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // One scoped policy instead of repeating [showDelay]/[hideDelay] per trigger.
  providers: [provideHellTooltipDefaults({ showDelay: 600, hideDelay: 300 })],
  imports: [HellButton, HellTooltip],
  template: `
    <div class="flex flex-wrap gap-hell-3">
      <button hellButton hellTooltip="Took my time" type="button">Hover for 600ms</button>
      <button hellButton hellTooltip="The cooldown skipped the wait" type="button">
        Then dart over here
      </button>
    </div>
  `,
})
export class TooltipDelayExample {}
