import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-flyout-anchor-and-boundary-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger, HellInput],
  template: `
    <div class="grid gap-hell-3">
      <div #boundaryEl class="grid gap-hell-3 rounded-hell-md border border-dashed border-hell-border p-hell-4">
        <div class="flex flex-wrap items-center gap-hell-3">
          <button
            hellButton
            hellFlyoutTrigger
            #t="hellFlyoutTrigger"
            (openChange)="open.set($event)"
          >
            {{ open() ? 'Hide' : 'Show' }} suggestions
          </button>

          <input
            #inputAnchor
            hellInput
            placeholder="Type here — flyout stays open"
            aria-label="Sibling input within boundary"
          />
        </div>

        @if (open()) {
          <div
            [hellFlyout]="t"
            [anchor]="inputAnchor"
            [boundary]="boundaryEl"
            class="grid max-w-[320px] gap-hell-3 p-hell-4"
            aria-labelledby="boundary-flyout-title"
          >
            <strong id="boundary-flyout-title">Anchored to the input</strong>
            <p class="hd-muted">
              The panel is positioned against the input via <code>anchor</code>, while the button
              still owns open state. Interacting anywhere inside the dashed
              <code>boundary</code> — including the input — keeps it open; clicking outside,
              focusing another control, or pressing <kbd>Escape</kbd> dismisses it.
            </p>
            <button hellButton type="button" size="sm" variant="soft">Apply suggestion</button>
          </div>
        }
      </div>

      <button hellButton type="button" variant="ghost">Outside boundary action</button>
    </div>
  `,
})
export class FlyoutAnchorAndBoundaryExample {
  protected readonly open = signal(false);
}
