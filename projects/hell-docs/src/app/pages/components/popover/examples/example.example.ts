import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';

@Component({
  selector: 'app-popover-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <div class="min-h-[180px]">
      <button hellButton variant="default" [hellPopoverTrigger]="info" placement="bottom-start">
        Show profile summary
      </button>
    </div>

    <ng-template #info>
      <div
        hellPopover
        aria-labelledby="profile-popover-title"
        class="min-w-[260px] max-w-[320px] space-y-3"
      >
        <div class="space-y-1">
          <h3 id="profile-popover-title" class="text-sm font-semibold">Profile summary</h3>
          <p class="hd-muted text-sm">Heinrich K. Senior Engineer, Berlin, last seen 2h ago.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button hellButton type="button" size="sm" variant="primary">Message Heinrich</button>
          <button hellButton type="button" size="sm" variant="ghost">View activity</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class PopoverExampleExample {}
