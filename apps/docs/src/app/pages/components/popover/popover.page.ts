import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { PopoverAllPartsStylingExample } from './examples/all-parts-styling.example';
import popoverAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { PopoverBasicExample } from './examples/basic.example';
import popoverBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { PopoverDismissalExample } from './examples/dismissal.example';
import popoverDismissalExampleCodeRaw from './examples/dismissal.example.ts?raw' with {
  loader: 'text',
};
import { PopoverPlacementExample } from './examples/placement.example';
import popoverPlacementExampleCodeRaw from './examples/placement.example.ts?raw' with {
  loader: 'text',
};
import { PopoverWithCardExample } from './examples/with-card.example';
import popoverWithCardExampleCodeRaw from './examples/with-card.example.ts?raw' with {
  loader: 'text',
};
import { PopoverNonModalExample } from './examples/non-modal.example';
import popoverNonModalExampleCodeRaw from './examples/non-modal.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    PopoverAllPartsStylingExample,
    PopoverBasicExample,
    PopoverDismissalExample,
    PopoverPlacementExample,
    PopoverWithCardExample,
    PopoverNonModalExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Popover"
        icon="faSolidMessage"
        category="Styled primitive"
        importPath="@hell-ui/angular/popover"
        stylesPath="@hell-ui/angular/popover/styles.css"
      >
        A focus-trapping anchored surface for interactive content — richer than a tooltip,
        lighter than a dialog.
      </hd-page-header>
      <p>
        <code>HellPopoverTrigger</code> and <code>HellPopover</code> are a directive pair built on
        <code>NgpPopoverTrigger</code> and <code>NgpPopover</code> from <code>ng-primitives</code>.
        The trigger attaches to a native <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> and
        owns open state, placement, and dismissal; the panel directive goes on whatever element you
        render inside an <code>&lt;ng-template&gt;</code>. Positioning comes from
        <a href="https://floating-ui.com" target="_blank" rel="noreferrer">Floating UI</a>, and the
        panel registers with any active Hell Floating Scope so nested menus or popovers still count
        as inside interactions for dismissal.
      </p>
      <p>
        Because the panel has <code>role="dialog"</code> and <strong>traps focus</strong> by
        default, reach for popover whenever the anchored content itself needs keyboard
        interaction — a profile summary with action buttons, an inline confirmation, a small
        settings form. Set <code>[trapFocus]="false"</code> when nearby controls must stay
        reachable while the panel is open, and use
        <a routerLink="/components/tooltip">Tooltip</a> for a plain-text hint.
      </p>
      <p>
        Weighing popover against the other floating surfaces? See
        <a routerLink="/guide/overlays">When to use which overlay</a>.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[hellPopoverTrigger]</code> to a template reference. The panel opens on click,
        traps focus, and returns focus to the trigger on close.
      </p>
      <hd-example-tabs [code]="popoverBasicExampleCode">
        <app-popover-basic-example />
      </hd-example-tabs>

      <h2>Placement</h2>
      <p>
        <code>placement</code> (default <code>'top'</code>) sets the preferred side and alignment
        relative to the trigger. <code>flip</code> and <code>shift</code> (both default
        <code>true</code>) let Floating UI move the panel to stay inside the viewport when the
        preferred placement doesn't fit.
      </p>
      <hd-example-tabs [code]="popoverPlacementExampleCode">
        <app-popover-placement-example />
      </hd-example-tabs>

      <h2>Dismissal</h2>
      <p>
        <code>closeOnOutsideClick</code> and <code>closeOnEscape</code> (both default
        <code>true</code>) each accept a boolean or a guard function that receives the dismissal
        target and returns whether it should close the panel. Turn outside-click dismissal off for
        destructive confirmations where an accidental stray click shouldn't silently discard the
        action.
      </p>
      <hd-example-tabs [code]="popoverDismissalExampleCode">
        <app-popover-dismissal-example />
      </hd-example-tabs>

      <h2>Non-modal</h2>
      <p>
        Set <code>[trapFocus]="false"</code> for an anchored, light-dismiss surface that does not
        trap focus: opening it leaves focus where it is, outside clicks and outside focus close it
        without stealing focus, and only <code>Escape</code> returns focus to the trigger. Pass
        <code>boundary</code> to widen the "inside" region — interactions inside the boundary
        element keep the panel open, so a composite's other controls stay usable. Pass
        <code>anchor</code> when the panel should position against a different element than the
        interactive trigger. The trigger also exposes a reactive <code>open</code> signal for
        template reads.
      </p>
      <hd-example-tabs [code]="popoverNonModalExampleCode">
        <app-popover-non-modal-example />
      </hd-example-tabs>

      <h2>With card</h2>
      <p>
        A link-styled trigger opens a profile summary built from <code>hellCard</code> (narrow
        entry point <code>@hell-ui/angular/card</code>), <code>hell-avatar</code>, and
        <code>hellChip</code>. The popover surface itself stays an unpadded frame — its own
        <code>ui</code> refinement removes padding and constrains width — while the nested card
        owns its own Public Parts and visual chrome. This is the shape most "click a name to see
        details" interactions take in a dense business app.
      </p>
      <hd-example-tabs [code]="popoverWithCardExampleCode">
        <app-popover-with-card-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellPopover</code> exposes exactly one Public Part, <code>root</code> — the panel
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the default recipe through
        Hell's Tailwind merge, so refinements win deterministically over the defaults they
        conflict with. <code>HellPopoverTrigger</code> renders no owned structure of its own — it
        attaches directly to your <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> and has no
        Part Style Map.
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
            <td><code>HellPopover</code></td>
            <td><code>root</code></td>
            <td>
              The panel surface — background, border, radius, shadow, max width, and open
              animation.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Positioning, focus trapping, and dismissal behavior are unaffected by the Part Style Map —
        only visual classes flow through <code>ui</code>.
      </p>
      <hd-example-tabs [code]="popoverAllPartsStylingExampleCode">
        <app-popover-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hellPopoverTrigger</code></h3>
      <p>
        Selector: <code>button[hellPopoverTrigger], a[hellPopoverTrigger]</code>. Exported as
        <code>hellPopoverTrigger</code>.
      </p>
      <ul>
        <li><code>[hellPopoverTrigger]</code>: <code>TemplateRef</code> — the popover content.</li>
        <li>
          <code>placement</code>: <code>Placement</code> (Floating UI), default <code>'top'</code>.
        </li>
        <li>
          <code>offset</code>: <code>number | &#123; mainAxis?, crossAxis?, alignmentAxis? &#125;</code>,
          default <code>0</code>.
        </li>
        <li>
          <code>flip</code>: <code>boolean | &#123; padding?, fallbackPlacements? &#125;</code>,
          default <code>true</code>.
        </li>
        <li>
          <code>shift</code>: <code>boolean | &#123; padding?, limiter? &#125;</code>, default
          enabled.
        </li>
        <li>
          <code>container</code>: <code>string | HTMLElement | null</code>, default
          <code>document.body</code>.
        </li>
        <li><code>disabled</code>: <code>boolean</code>, default <code>false</code>.</li>
        <li>
          <code>closeOnEscape</code>: <code>boolean | ((event: KeyboardEvent) =&gt; boolean | Promise&lt;boolean&gt;)</code>,
          default <code>true</code>.
        </li>
        <li>
          <code>closeOnOutsideClick</code>: <code>boolean | ((target: Element) =&gt; boolean | Promise&lt;boolean&gt;)</code>,
          default <code>true</code>. Also governs outside-focus dismissal of non-modal panels.
        </li>
        <li>
          <code>trapFocus</code>: <code>boolean</code>, default <code>true</code>. When
          <code>false</code> the panel is non-modal: no focus trap, no focus steal on open, and
          focus returns to the trigger only on Escape.
        </li>
        <li>
          <code>anchor</code>: <code>HTMLElement | ElementRef | null</code> — positions the panel
          against this element instead of the trigger. Default <code>null</code>.
        </li>
        <li>
          <code>boundary</code>: <code>HTMLElement | ElementRef | null</code> — widens the
          light-dismiss "inside" region beyond the trigger and panel. Default <code>null</code>.
        </li>
        <li>
          <code>(openChange)</code>: <code>OutputEmitterRef&lt;boolean&gt;</code> — emits the new
          open state whenever the panel opens or closes.
        </li>
        <li><code>open()</code>: reactive signal reporting whether the panel is open.</li>
        <li><code>show()</code>, <code>hide(origin?: FocusOrigin)</code>: imperative methods on the exported reference, both returning <code>Promise&lt;void&gt;</code>.</li>
      </ul>

      <h3><code>hellPopover</code></h3>
      <p>Selector: <code>[hellPopover]</code>.</p>
      <ul>
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
        <li>The trigger sets <code>aria-expanded</code> reflecting open state.</li>
        <li>
          The panel renders <code>role="dialog"</code> and, while open, the trigger's
          <code>aria-describedby</code> points at the panel's id.
        </li>
        <li>
          The panel traps focus while open (via a nested focus trap) and restores focus to the
          trigger when it closes. With <code>trapFocus</code> false the panel renders
          <code>aria-modal="false"</code>, never steals focus, and restores focus only on
          keyboard (Escape) closes.
        </li>
        <li>The panel has no accessible name by default; set <code>aria-label</code> or <code>aria-labelledby</code> on every popover.</li>
        <li>
          <code>Escape</code> closes the panel unless <code>closeOnEscape</code> is
          <code>false</code> or its guard function returns <code>false</code>; outside clicks
          close it unless <code>closeOnOutsideClick</code> is <code>false</code> or its guard
          returns <code>false</code>.
        </li>
        <li>
          A disabled trigger sets the native <code>disabled</code> attribute on a
          <code>&lt;button&gt;</code> host, or <code>aria-disabled="true"</code> plus
          <code>tabindex="-1"</code> on an <code>&lt;a&gt;</code> host, and blocks click/Enter
          activation either way; anchor clicks are always <code>preventDefault</code>-ed so an
          enabled anchor trigger never navigates.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use popover for anchored content that needs its own focus management, like action buttons or a small form.</li>
        <li>Give every popover an accessible name via <code>aria-labelledby</code> pointing at a visible heading, or a concise <code>aria-label</code>.</li>
        <li>Keep content short and task-focused — a summary and a couple of actions, not a full workflow.</li>
        <li>Use <code>ui</code> instead of conflicting <code>class</code> utilities for visual refinements.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put essential page content only in a popover — it is unavailable until the trigger is activated.</li>
        <li>Don't disable <code>closeOnEscape</code> without another obvious way to close the panel.</li>
        <li>Don't use popover for a non-modal panel that must leave surrounding controls interactive — use Flyout instead.</li>
        <li>Don't target private descendants for styling — <code>root</code> is the only public part.</li>
      </ul>
    </article>
  `,
})
export class PopoverPage {
  protected readonly popoverAllPartsStylingExampleCode = popoverAllPartsStylingExampleCodeRaw;
  protected readonly popoverBasicExampleCode = popoverBasicExampleCodeRaw;
  protected readonly popoverDismissalExampleCode = popoverDismissalExampleCodeRaw;
  protected readonly popoverPlacementExampleCode = popoverPlacementExampleCodeRaw;
  protected readonly popoverWithCardExampleCode = popoverWithCardExampleCodeRaw;
  protected readonly popoverNonModalExampleCode = popoverNonModalExampleCodeRaw;
}
