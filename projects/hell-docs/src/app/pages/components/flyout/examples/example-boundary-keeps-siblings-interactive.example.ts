import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton, HellFlyout, HellFlyoutTrigger, HellInput } from 'hell/primitives';

@Component({
  selector: 'app-flyout-example-boundary-keeps-siblings-interactive-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger, HellInput],
  template: `
    <div #boundaryEl class="hd-flyout-boundary">
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

      @if (open()) {
        <div [hellFlyout]="t" [boundary]="boundaryEl" class="hd-flyout-panel">
          <strong>Anchored, non-modal</strong>
          <p class="hd-muted mt-2">
            Click anywhere inside the dashed boundary (including the input) and this flyout stays
            open. Click outside, focus another control or press <kbd>Escape</kbd> to dismiss.
          </p>
        </div>
      }
    </div>
  `,
  styles: `
    .hd-flyout-boundary {
      position: relative;
      display: flex;
      gap: var(--spacing-hell-3);
      align-items: center;
      flex-wrap: wrap;
      padding: var(--spacing-hell-4);
      border: 1px dashed var(--color-hell-border);
      border-radius: var(--radius-md);
    }
    .hd-flyout-panel {
      position: absolute;
      top: calc(100% + var(--spacing-hell-2));
      left: var(--spacing-hell-4);
      max-width: 320px;
      padding: var(--spacing-hell-4);
      background-color: var(--color-hell-surface-elevated);
      border: 1px solid var(--color-hell-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-hell-lg);
      z-index: 1;
    }
  `,
})
export class FlyoutExampleBoundaryKeepsSiblingsInteractiveExample {
  protected readonly open = signal(false);
}
