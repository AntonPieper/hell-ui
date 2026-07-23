import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAvatar } from 'hell-ui/avatar';
import { HellButton } from 'hell-ui/button';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';
import { HellChip } from 'hell-ui/chip';

@Component({
  selector: 'app-popover-with-card-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar, HellButton, HellPopover, HellPopoverTrigger, HellChip, ...HELL_CARD_IMPORTS],
  template: `
    <div class="min-h-[220px]">
      <button
        hellButton
        variant="link"
        [hellPopoverTrigger]="assignee"
        placement="bottom-start"
      >
        Assigned to Mara Voss
      </button>
    </div>

    <ng-template #assignee>
      <!-- The popover surface is a thin, unpadded frame; hellCard owns the visible
           chrome as a nested Composite with its own Public Parts. -->
      <div hellPopover aria-labelledby="assignee-card-name" ui="max-w-none p-0">
        <div hellCard [elevation]="0" ui="border-none shadow-none">
          <div hellCardBody class="flex items-start gap-hell-3">
            <hell-avatar fallback="MV" size="lg" />
            <div class="min-w-0">
              <p id="assignee-card-name" class="truncate text-sm font-semibold">Mara Voss</p>
              <p class="hd-muted truncate text-sm">Platform team &middot; Berlin</p>
              <div class="mt-2 flex flex-wrap gap-1">
                <span hellChip variant="info">On call</span>
                <span hellChip>4 open tickets</span>
              </div>
            </div>
          </div>
          <div hellCardFooter>
            <button hellButton type="button" size="sm" variant="ghost">View profile</button>
            <button hellButton type="button" size="sm" variant="primary">Reassign</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class PopoverWithCardExample {}
