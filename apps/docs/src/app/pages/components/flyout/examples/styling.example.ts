import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';

@Component({
  selector: 'app-flyout-styling-example',
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
        {{ open() ? 'Hide' : 'Show' }} styled flyout
      </button>

      @if (open()) {
        <!-- The flyout surface is its root Public Part. -->
        <div
          [hellFlyout]="t"
          ui="max-w-[280px] border-hell-primary bg-hell-primary-soft text-hell-primary-soft-foreground"
        >
          Pinned filters apply to every saved view.
        </div>
      }
    </div>
  `,
})
export class FlyoutStylingExample {
  protected readonly open = signal(false);
}
