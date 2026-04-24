import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HellButton, HellFlyout, HellFlyoutTrigger, HellInput } from 'hell';

@Component({
  selector: 'hd-flyout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellFlyout, HellFlyoutTrigger, HellInput, RouterLink],
  template: `
    <article class="hd-prose">
      <h1>Flyout</h1>
      <p>An anchored, non-modal, light-dismiss surface that <strong>does not
        trap focus</strong>. Use a flyout when the surrounding context — for
        example a media player or a toolbar — must remain interactive while
        the surface is open.</p>

      <p class="hd-muted">Pick <a routerLink="/components/popover">Popover</a> or
        <a routerLink="/components/dialog">Dialog</a> instead when you need a
        focus trap.</p>

      <h2>Behaviour</h2>
      <ul>
        <li>Trigger drives the open state. Read it via <code>open()</code> and
          <code>(openChange)</code>.</li>
        <li>Light dismiss on outside <code>pointerdown</code> or
          <code>focusin</code>.</li>
        <li><code>Escape</code> closes and restores focus to the trigger.</li>
        <li>Pass <code>boundary</code> to widen the “inside” region beyond
          the trigger and panel — useful for composites where surrounding
          controls must stay interactive.</li>
        <li>No focus trap. Tab moves focus naturally; the flyout dismisses if
          focus lands outside the boundary.</li>
      </ul>

      <h2>Example — boundary keeps siblings interactive</h2>
      <div #boundaryEl class="hd-example hd-flyout-boundary">
        <button
          hellButton
          hellFlyoutTrigger
          #t="hellFlyoutTrigger"
          variant="default"
          (click)="t.toggle()"
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
              Click anywhere inside the dashed boundary (including the input)
              and this flyout stays open. Click outside, focus another control
              or press <kbd>Escape</kbd> to dismiss.
            </p>
          </div>
        }
      </div>

      <h2>API</h2>
      <h3><code>hellFlyoutTrigger</code></h3>
      <ul>
        <li><code>open()</code>, <code>show()</code>, <code>hide()</code>,
          <code>toggle()</code></li>
        <li><code>(openChange)</code></li>
        <li><code>disabled</code></li>
      </ul>

      <h3><code>hellFlyout</code></h3>
      <ul>
        <li><code>[hellFlyout]</code>: the trigger instance (template ref or
          <code>viewChild</code>)</li>
        <li><code>boundary</code>: optional <code>HTMLElement</code> treated as
          “inside” for dismiss</li>
        <li><code>closeOnEscape</code> (default <code>true</code>)</li>
        <li><code>closeOnOutsideInteraction</code> (default <code>true</code>)</li>
        <li><code>unstyled</code></li>
      </ul>
    </article>
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
    }
  `,
})
export class FlyoutPage {
  protected readonly open = signal(false);
}
