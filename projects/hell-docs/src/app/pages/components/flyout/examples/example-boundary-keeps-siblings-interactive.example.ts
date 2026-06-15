import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-flyout-example-boundary-keeps-siblings-interactive-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger, HellInput],
  template: `
    <div class="hd-flyout-demo">
      <div #boundaryEl class="hd-flyout-boundary">
        <div class="hd-flyout-controls">
          <button
            hellButton
            hellFlyoutTrigger
            #t="hellFlyoutTrigger"
            variant="default"
            (openChange)="open.set($event)"
          >
            {{ open() ? 'Hide' : 'Show' }} flyout
          </button>

          <input
            hellInput
            placeholder="Type here — flyout stays open"
            aria-label="Sibling input within boundary"
          />
        </div>

        @if (open()) {
          <div
            [hellFlyout]="t"
            [boundary]="boundaryEl"
            class="hd-flyout-panel"
            aria-labelledby="boundary-flyout-title"
          >
            <strong id="boundary-flyout-title">Anchored, non-modal</strong>
            <p class="hd-muted mt-2">
              Click anywhere inside the dashed boundary (including the input) and this flyout stays
              open. Click outside, focus another control or press <kbd>Escape</kbd> to dismiss.
            </p>
            <button hellButton type="button" size="sm" variant="soft">Review settings</button>
          </div>
        }
      </div>

      <button hellButton type="button" variant="ghost">Outside boundary action</button>
    </div>
  `,
  styles: `
    .hd-flyout-demo {
      display: grid;
      gap: var(--spacing-hell-3);
      align-items: start;
    }
    .hd-flyout-boundary {
      display: grid;
      gap: var(--spacing-hell-3);
      align-items: start;
      padding: var(--spacing-hell-4);
      border: 1px dashed var(--color-hell-border);
      border-radius: var(--radius-md);
    }
    .hd-flyout-controls {
      display: flex;
      gap: var(--spacing-hell-3);
      align-items: center;
      flex-wrap: wrap;
    }
    .hd-flyout-panel {
      --hell-flyout-max-inline-size: 320px;
      padding: var(--spacing-hell-4);
      display: grid;
      gap: var(--spacing-hell-3);
    }
  `,
})
export class FlyoutExampleBoundaryKeepsSiblingsInteractiveExample {
  protected readonly open = signal(false);
}
