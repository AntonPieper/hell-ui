import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
import type { Placement } from '@floating-ui/dom';

const PLACEMENTS: Placement[] = ['top', 'right', 'bottom', 'left'];

@Component({
  selector: 'app-flyout-placement-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger],
  template: `
    <div class="flex min-h-[160px] flex-wrap items-center justify-center gap-hell-4">
      @for (placement of placements; track placement) {
        <button
          hellButton
          variant="soft"
          hellFlyoutTrigger
          #t="hellFlyoutTrigger"
          (openChange)="onOpenChange(placement, $event)"
        >
          {{ placement }}
        </button>

        @if (open() === placement) {
          <div [hellFlyout]="t" [placement]="placement" class="text-sm">
            Anchored <strong>{{ placement }}</strong> of its trigger. Flips and shifts to stay in
            the viewport.
          </div>
        }
      }
    </div>
  `,
})
export class FlyoutPlacementExample {
  protected readonly placements = PLACEMENTS;
  protected readonly open = signal<Placement | null>(null);

  protected onOpenChange(placement: Placement, isOpen: boolean): void {
    this.open.set(isOpen ? placement : null);
  }
}
