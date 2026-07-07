import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import type { NgpPopoverPlacement } from 'ng-primitives/popover';

const PLACEMENTS: NgpPopoverPlacement[] = ['top', 'right', 'bottom', 'left'];

@Component({
  selector: 'app-popover-placement-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellPopover, HellPopoverTrigger],
  template: `
    <div class="flex min-h-[160px] flex-wrap items-center justify-center gap-hell-4">
      @for (placement of placements; track placement) {
        <button hellButton variant="soft" [hellPopoverTrigger]="hint" [placement]="placement">
          {{ placement }}
        </button>

        <ng-template #hint>
          <div hellPopover class="text-sm">
            Anchored <strong>{{ placement }}</strong> of its trigger. Flips and shifts to stay in
            the viewport.
          </div>
        </ng-template>
      }
    </div>
  `,
})
export class PopoverPlacementExample {
  protected readonly placements = PLACEMENTS;
}
