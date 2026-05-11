import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton, HellPopover, HellPopoverTrigger } from 'hell/primitives';

@Component({
  selector: 'app-popover-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <button hellButton variant="default" [hellPopoverTrigger]="info" placement="bottom-start">
      Show details
    </button>

    <ng-template #info>
      <div hellPopover class="min-w-[240px]">
        <strong>Heinrich K.</strong>
        <p class="hd-muted mt-2">Senior Engineer · Berlin · last seen 2h ago</p>
      </div>
    </ng-template>
  `,
})
export class PopoverExampleExample {}
