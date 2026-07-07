import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';

@Component({
  selector: 'app-popover-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <div class="min-h-[140px]">
      <button hellButton [hellPopoverTrigger]="styled" placement="bottom-start">
        Styled popover
      </button>
    </div>

    <ng-template #styled>
      <!-- HellPopover has exactly one Public Part, "root" — the panel itself.
           HellPopoverTrigger renders no owned structure and has no Part Style Map. -->
      <div
        hellPopover
        ui="max-w-[280px] rounded-hell-lg border-hell-primary bg-hell-primary-soft p-hell-4 text-hell-primary-soft-foreground shadow-hell-lg"
      >
        Scheduled maintenance window starts at 22:00 UTC.
      </div>
    </ng-template>
  `,
})
export class PopoverAllPartsStylingExample {}
