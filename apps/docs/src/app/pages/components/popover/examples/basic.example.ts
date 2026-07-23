import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';

@Component({
  selector: 'app-popover-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <div class="min-h-[140px]">
      <button hellButton [hellPopoverTrigger]="info" placement="bottom-start">
        What is this status?
      </button>
    </div>

    <ng-template #info>
      <div hellPopover aria-labelledby="basic-popover-title" class="max-w-[260px]">
        <strong id="basic-popover-title">Pending review</strong>
        <p class="my-2 text-sm">
          A reviewer has 2 business days to approve or request changes before this expires.
        </p>
      </div>
    </ng-template>
  `,
})
export class PopoverBasicExample {}
