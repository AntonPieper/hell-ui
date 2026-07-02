import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';

@Component({
  selector: 'app-flyout-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger],
  template: `
    <div class="min-h-[140px]">
      <button
        hellButton
        hellFlyoutTrigger
        #t="hellFlyoutTrigger"
        (openChange)="open.set($event)"
      >
        {{ open() ? 'Hide' : 'Show' }} details
      </button>

      @if (open()) {
        <div [hellFlyout]="t" aria-labelledby="flyout-basic-title" class="max-w-[280px]">
          <strong id="flyout-basic-title">Non-modal details</strong>
          <p class="my-2 text-sm">
            The page behind this surface stays interactive — no focus trap, no backdrop.
          </p>
        </div>
      }
    </div>
  `,
})
export class FlyoutBasicExample {
  protected readonly open = signal(false);
}
