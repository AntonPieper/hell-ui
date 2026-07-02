import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';

@Component({
  selector: 'app-popover-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <div class="min-h-[140px]">
      <button hellButton [hellPopoverTrigger]="styled" placement="bottom-start">
        Styled popover
      </button>
    </div>

    <ng-template #styled>
      <!-- The panel is the popover's root Public Part; refine it with ui. -->
      <div
        hellPopover
        ui="max-w-[280px] border-hell-primary bg-hell-primary-soft text-hell-primary-soft-foreground"
      >
        Scheduled maintenance window starts at 22:00 UTC.
      </div>
    </ng-template>
  `,
})
export class PopoverStylingExample {}
