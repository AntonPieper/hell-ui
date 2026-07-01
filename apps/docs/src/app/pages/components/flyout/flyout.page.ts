import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { FloatingDismissalHarnessPage } from '../../testing/floating-dismissal-harness.page';
import { FlyoutExampleBoundaryKeepsSiblingsInteractiveExample } from './examples/example-boundary-keeps-siblings-interactive.example';
import flyoutExampleBoundaryKeepsSiblingsInteractiveExampleCodeRaw from './examples/example-boundary-keeps-siblings-interactive.example.ts?raw' with {
  loader: 'text',
};
import { FlyoutStylingExample } from './examples/styling.example';
import flyoutStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-flyout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    FloatingDismissalHarnessPage,
    FlyoutExampleBoundaryKeepsSiblingsInteractiveExample, FlyoutStylingExample,
  ],
  template: `
    @if (showFloatingDismissalHarness) {
      <hd-floating-dismissal-harness />
    } @else {
      <article class="hd-prose">
      <h1>Flyout</h1>
      <p>
        An anchored, non-modal, light-dismiss surface that <strong>does not trap focus</strong>. Use
        a flyout when the surrounding context — for example a media player or a toolbar — must
        remain interactive while the surface is open. The panel has <code>role="dialog"</code>, so
        give every flyout an accessible name with <code>aria-label</code> or
        <code>aria-labelledby</code>.
      </p>

      <p class="hd-muted">
        Pick <a routerLink="/components/popover">Popover</a> or
        <a routerLink="/components/dialog">Dialog</a> instead when you need a focus trap.
      </p>

      <h2>Behaviour</h2>
      <ul>
        <li>
          Trigger drives the open state. Read it via <code>open()</code> and
          <code>(openChange)</code>.
        </li>
        <li>
          Light dismiss on outside <code>click</code> or <code>focusin</code>. Touch scroll gestures
          do not dismiss.
        </li>
        <li><code>Escape</code> closes and restores focus to the trigger.</li>
        <li>
          Pass <code>boundary</code> to widen the “inside” region beyond the trigger and panel —
          useful for composites where surrounding controls must stay interactive.
        </li>
        <li>
          No focus trap. Tab moves focus naturally; the flyout dismisses if focus lands outside the
          boundary.
        </li>
      </ul>

      <h2>Example — boundary keeps siblings interactive</h2>
      <hd-example-tabs [code]="flyoutExampleBoundaryKeepsSiblingsInteractiveExampleCode" flush>
        <app-flyout-example-boundary-keeps-siblings-interactive-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        <code>HellFlyoutUi</code> refines the flyout surface's <code>root</code> Public Part. Anchoring, boundary, and dismissal behavior are not affected by the Part Style Map.
      </p>
      <hd-example-tabs [code]="flyoutStylingExampleCode">
        <app-flyout-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hellFlyoutTrigger</code></h3>
      <ul>
        <li>
          <code>open()</code>, <code>show()</code>, <code>hide()</code>, <code>toggle()</code>
        </li>
        <li><code>(openChange)</code></li>
        <li><code>disabled</code></li>
      </ul>

      <h3><code>hellFlyout</code></h3>
      <ul>
        <li>
          <code>[hellFlyout]</code>: the trigger instance (template ref or <code>viewChild</code>)
        </li>
        <li>
          <code>boundary</code>: optional <code>HTMLElement</code> or
          <code>ElementRef</code> treated as “inside” for dismiss
        </li>
        <li>
          <code>anchor</code>: optional visual reference <code>HTMLElement</code> or
          <code>ElementRef</code> when the panel should align to a sibling control instead of the
          trigger
        </li>
        <li>
          <code>flip</code> (default <code>true</code>): allow viewport-aware placement flipping
        </li>
        <li>
          <code>shift</code> (default <code>true</code>): allow viewport-aware placement shifting
        </li>
        <li>
          <code>aria-label</code> or <code>aria-labelledby</code>: accessible name for the
          dialog panel
        </li>
        <li><code>ui</code>: Part Style Map for the panel's local <code>root</code> part. The panel renders <code>data-slot="root"</code>.</li>
        <li><code>closeOnEscape</code> (default <code>true</code>)</li>
        <li><code>closeOnOutsideInteraction</code> (default <code>true</code>)</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use flyout for anchored non-modal panels where nearby controls stay interactive.</li>
        <li>Pass <code>anchor</code> when the panel should visually attach to a sibling control.</li>
        <li>Pass <code>boundary</code> when siblings should count as inside.</li>
        <li>
          Name each flyout panel with visible heading text via
          <code>aria-labelledby</code>, or a concise <code>aria-label</code>.
        </li>
        <li>Close on Escape unless the composite has a stronger reason not to.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use flyout when focus must be trapped; use Dialog or Popover.</li>
        <li>Don't place critical confirmation flows in a light-dismiss surface.</li>
      </ul>
      </article>
    }
  `,
})
export class FlyoutPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showFloatingDismissalHarness =
    this.route.snapshot.queryParamMap.has('floatingDismissalHarness');
  protected readonly flyoutExampleBoundaryKeepsSiblingsInteractiveExampleCode =
    flyoutExampleBoundaryKeepsSiblingsInteractiveExampleCodeRaw;
  protected readonly flyoutStylingExampleCode = flyoutStylingExampleCodeRaw;
}
