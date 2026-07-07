import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';

@Component({
  selector: 'app-flyout-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger],
  template: `
    <div class="min-h-[140px]">
      <button hellButton hellFlyoutTrigger #t="hellFlyoutTrigger" (openChange)="open.set($event)">
        {{ open() ? 'Hide' : 'Show' }} styled flyout
      </button>

      @if (open()) {
        <!-- HellFlyout has exactly one Public Part, "root" — the panel itself. -->
        <div
          [hellFlyout]="t"
          ui="max-w-[280px] rounded-hell-lg border-hell-primary bg-hell-primary-soft p-hell-4 text-hell-primary-soft-foreground"
        >
          Pinned filters apply to every saved view.
        </div>
      }
    </div>
  `,
})
export class FlyoutAllPartsStylingExample {
  protected readonly open = signal(false);
}
