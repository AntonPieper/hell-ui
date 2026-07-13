import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { FloatingDismissalHarnessPage } from '../../testing/floating-dismissal-harness.page';
import { FlyoutAllPartsStylingExample } from './examples/all-parts-styling.example';
import flyoutAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { FlyoutAnchorAndBoundaryExample } from './examples/anchor-and-boundary.example';
import flyoutAnchorAndBoundaryExampleCodeRaw from './examples/anchor-and-boundary.example.ts?raw' with {
  loader: 'text',
};
import { FlyoutBasicExample } from './examples/basic.example';
import flyoutBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { FlyoutPlacementExample } from './examples/placement.example';
import flyoutPlacementExampleCodeRaw from './examples/placement.example.ts?raw' with {
  loader: 'text',
};
import { FlyoutWithFiltersPanelExample } from './examples/with-filters-panel.example';
import flyoutWithFiltersPanelExampleCodeRaw from './examples/with-filters-panel.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-flyout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    FloatingDismissalHarnessPage,
    FlyoutAllPartsStylingExample,
    FlyoutAnchorAndBoundaryExample,
    FlyoutBasicExample,
    FlyoutPlacementExample,
    FlyoutWithFiltersPanelExample,
    PageHeader,
  ],
  template: `
    @if (showFloatingDismissalHarness) {
      <hd-floating-dismissal-harness />
    } @else {
      <article class="hd-prose">
      <hd-page-header
        title="Flyout"
        icon="faSolidCommentDots"
        category="Styled primitive"
        importPath="@hell-ui/angular/flyout"
        stylesPath="@hell-ui/angular/flyout/styles.css"
      >
        An anchored, non-modal surface that keeps the rest of the page interactive — for pinned
        helpers, filter panels, and toolbar controls.
      </hd-page-header>
      <p>
        <code>HellFlyoutTrigger</code> and <code>HellFlyout</code> are a directive pair, not a
        component: the trigger directive owns open state and is applied to a
        <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code>, while the panel directive is applied
        to whatever element you render as the surface. Positioning comes from
        <a href="https://floating-ui.com" target="_blank" rel="noreferrer">Floating UI</a>; dismissal
        joins the shared Floating Scope so outside clicks, outside focus, and Escape are handled
        consistently with every other floating surface in Hell.
      </p>
      <p>
        Because the panel has <code>role="dialog"</code> but <strong>does not trap focus</strong>,
        it is the right choice whenever the trigger's surrounding context must stay usable while
        the panel is open — a toolbar filter, an audio player's caption settings, or an inspector
        pinned beside a row. Reach for <a routerLink="/components/popover">Popover</a> or
        <a routerLink="/components/dialog">Dialog</a> instead when the interaction needs a focus
        trap.
      </p>

      <h2>Basic</h2>
      <p>
        Bind a trigger with <code>hellFlyoutTrigger</code>, capture it with a template reference
        variable, and render the surface with <code>[hellFlyout]="t"</code> when open. The consumer
        owns open state entirely — showing the surface from routing, selection, or media events is
        trivial.
      </p>
      <hd-example-tabs [code]="flyoutBasicExampleCode">
        <app-flyout-basic-example />
      </hd-example-tabs>

      <h2>Placement</h2>
      <p>
        <code>placement</code> (default <code>bottom-start</code>) sets the preferred side and
        alignment relative to the reference element. <code>flip</code> and <code>shift</code>
        (both default <code>true</code>) let Floating UI move the panel to stay inside the
        viewport when the preferred placement doesn't fit — resize the window to see it kick in.
      </p>
      <hd-example-tabs [code]="flyoutPlacementExampleCode">
        <app-flyout-placement-example />
      </hd-example-tabs>

      <h2>Anchor and boundary</h2>
      <p>
        <code>anchor</code> repositions the panel against a different element than the trigger —
        useful when a sibling input owns the visual anchor while a nearby button still owns open
        state. <code>boundary</code> widens the "inside" region for dismissal beyond the trigger
        and panel, so surrounding controls (like that sibling input) stay interactive without
        closing the flyout.
      </p>
      <hd-example-tabs [code]="flyoutAnchorAndBoundaryExampleCode" flush>
        <app-flyout-anchor-and-boundary-example />
      </hd-example-tabs>

      <h2>With a filters panel</h2>
      <p>
        A toolbar button that opens a checklist of status filters and reflects the active count
        back onto the trigger with <code>hellChip</code> (narrow entry point
        <code>@hell-ui/angular/chip</code>). Each option is a <code>hellCheckbox</code> wrapped in
        <code>hellField</code> (narrow entry point <code>@hell-ui/angular/field</code>) for label
        association. Because the flyout doesn't trap focus, the rest of the toolbar stays usable
        while the panel is open.
      </p>
      <hd-example-tabs [code]="flyoutWithFiltersPanelExampleCode">
        <app-flyout-with-filters-panel-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellFlyout</code> exposes exactly one Public Part, <code>root</code> — the panel
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the default recipe through Hell's
        Tailwind merge, so refinements win deterministically over the defaults they conflict with.
        <code>HellFlyoutTrigger</code> renders no owned structure of its own — it attaches directly
        to your <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> and has no Part Style Map.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>HellFlyout</code></td>
            <td><code>root</code></td>
            <td>The panel surface — background, border, radius, shadow, and open animation.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Anchoring, boundary, and dismissal behavior are unaffected by the Part Style Map — only
        visual classes flow through <code>ui</code>.
      </p>
      <hd-example-tabs [code]="flyoutAllPartsStylingExampleCode">
        <app-flyout-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hellFlyoutTrigger</code></h3>
      <p>Selector: <code>button[hellFlyoutTrigger], a[hellFlyoutTrigger]</code>. Exported as <code>hellFlyoutTrigger</code>.</p>
      <ul>
        <li><code>disabled</code>: <code>boolean</code>, default <code>false</code>.</li>
        <li>
          <code>(openChange)</code>: <code>OutputEmitterRef&lt;boolean&gt;</code> — emits the new
          open state whenever the panel opens or closes.
        </li>
        <li>
          <code>open()</code>: <code>Signal&lt;boolean&gt;</code> — the current open state, read
          via the exported reference (<code>#t="hellFlyoutTrigger"</code>).
        </li>
        <li>
          <code>show()</code>, <code>hide()</code>, <code>toggle()</code>: imperative methods on
          the exported reference.
        </li>
        <li><code>panelId</code>: the stable id wired into <code>aria-controls</code> and the panel's <code>id</code>.</li>
      </ul>

      <h3><code>hellFlyout</code></h3>
      <p>Selector: <code>[hellFlyout]</code>. Exported as <code>hellFlyout</code>.</p>
      <ul>
        <li><code>[hellFlyout]</code>: <code>HellFlyoutTrigger</code>, required — the trigger instance that owns this panel's open state.</li>
        <li>
          <code>anchor</code>: <code>HTMLElement | ElementRef&lt;HTMLElement&gt; | null</code>,
          default <code>null</code>. Element the panel positions against when it differs from the
          trigger.
        </li>
        <li>
          <code>boundary</code>: <code>HTMLElement | ElementRef&lt;HTMLElement&gt; | null</code>,
          default <code>null</code>. Element defining the "inside" region for light-dismiss beyond
          the trigger and panel.
        </li>
        <li><code>placement</code>: <code>Placement</code> (Floating UI), default <code>'bottom-start'</code>.</li>
        <li><code>offset</code>: <code>number</code>, default <code>8</code>. Distance in pixels between the panel and its reference element.</li>
        <li><code>flip</code>: <code>boolean</code>, default <code>true</code>.</li>
        <li><code>shift</code>: <code>boolean</code>, default <code>true</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code>, default <code>null</code>.</li>
        <li><code>aria-labelledby</code>: <code>string | null</code>, default <code>null</code>.</li>
        <li><code>closeOnEscape</code>: <code>boolean</code>, default <code>true</code>.</li>
        <li><code>closeOnOutsideInteraction</code>: <code>boolean</code>, default <code>true</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — a shorthand class
          string or a <code>&#123; root?: string &#125;</code> map that
          refines the <code>root</code> public part.
        </li>
        <li>
          </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The trigger sets <code>aria-haspopup="dialog"</code>, <code>aria-expanded</code>, and (while open) <code>aria-controls</code> pointing at the panel's id.</li>
        <li>The panel renders <code>role="dialog"</code> with <code>aria-modal="false"</code> — it participates in the accessibility tree as a dialog without claiming modal semantics.</li>
        <li>The panel has no accessible name by default; set <code>aria-label</code> or <code>aria-labelledby</code> on every flyout.</li>
        <li>Dismissal listens for outside <code>click</code> and outside <code>focusin</code> (each gated by <code>closeOnOutsideInteraction</code>), and <code>Escape</code> (gated by <code>closeOnEscape</code>).</li>
        <li>Escape stops propagation and restores focus to the trigger element.</li>
        <li>There is no focus trap: Tab moves through the document normally, and focus leaving the trigger, panel, anchor, and boundary dismisses the panel.</li>
        <li>A disabled trigger sets the native <code>disabled</code> attribute on a <code>&lt;button&gt;</code> host, or <code>aria-disabled="true"</code> plus <code>tabindex="-1"</code> on an <code>&lt;a&gt;</code> host, and blocks click/Enter activation either way.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use flyout for anchored, non-modal panels where nearby controls must stay interactive.</li>
        <li>Give every flyout an accessible name via <code>aria-labelledby</code> pointing at a visible heading, or a concise <code>aria-label</code>.</li>
        <li>Pass <code>anchor</code> when the panel should visually attach to a sibling control instead of the trigger.</li>
        <li>Pass <code>boundary</code> when sibling controls should count as "inside" for dismissal.</li>
        <li>Leave <code>closeOnEscape</code> and <code>closeOnOutsideInteraction</code> enabled unless the composite has a strong reason not to.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use flyout when the interaction needs a focus trap — use Dialog or Popover instead.</li>
        <li>Don't place critical confirmation flows in a light-dismiss surface; a stray click elsewhere silently discards them.</li>
        <li>Don't target private descendants for styling — <code>root</code> is the only public part.</li>
      </ul>
      </article>
    }
  `,
})
export class FlyoutPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showFloatingDismissalHarness =
    this.route.snapshot.queryParamMap.has('floatingDismissalHarness');
  protected readonly flyoutAllPartsStylingExampleCode = flyoutAllPartsStylingExampleCodeRaw;
  protected readonly flyoutAnchorAndBoundaryExampleCode = flyoutAnchorAndBoundaryExampleCodeRaw;
  protected readonly flyoutBasicExampleCode = flyoutBasicExampleCodeRaw;
  protected readonly flyoutPlacementExampleCode = flyoutPlacementExampleCodeRaw;
  protected readonly flyoutWithFiltersPanelExampleCode = flyoutWithFiltersPanelExampleCodeRaw;
}
