import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TooltipAllPartsStylingExample } from './examples/all-parts-styling.example';
import tooltipAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { TooltipBasicExample } from './examples/basic.example';
import tooltipBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TooltipDelayExample } from './examples/delay.example';
import tooltipDelayExampleCodeRaw from './examples/delay.example.ts?raw' with {
  loader: 'text',
};
import { TooltipHoverableExample } from './examples/hoverable.example';
import tooltipHoverableExampleCodeRaw from './examples/hoverable.example.ts?raw' with {
  loader: 'text',
};
import { TooltipPlacementsExample } from './examples/placements.example';
import tooltipPlacementsExampleCodeRaw from './examples/placements.example.ts?raw' with {
  loader: 'text',
};
import { TooltipWithToolbarExample } from './examples/with-toolbar.example';
import tooltipWithToolbarExampleCodeRaw from './examples/with-toolbar.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    TooltipAllPartsStylingExample,
    TooltipBasicExample,
    TooltipDelayExample,
    TooltipHoverableExample,
    TooltipPlacementsExample,
    TooltipWithToolbarExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tooltip"
        icon="faSolidCircleQuestion"
        category="Styled primitive"
        importPath="@hell-ui/angular/tooltip"
        stylesPath="@hell-ui/angular/tooltip/styles.css"
      >
        A short, hover- and focus-triggered hint anchored to its trigger — for names and
        shortcuts, never for content the user actually needs.
      </hd-page-header>
      <p>
        <code>HellTooltipTrigger</code> and <code>HellTooltip</code> are a directive pair built on
        <code>NgpTooltipTrigger</code> and <code>NgpTooltip</code> from <code>ng-primitives</code>.
        The trigger attaches to a native <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> and
        owns placement, delay, and open state; the surface directive goes on whatever element you
        render inside an <code>&lt;ng-template&gt;</code>. Positioning comes from
        <a href="https://floating-ui.com" target="_blank" rel="noreferrer">Floating UI</a>, and the
        surface registers with any active Hell Floating Scope so a hoverable tooltip nested inside
        another floating surface still counts as an inside interaction.
      </p>
      <p>
        Reach for tooltip whenever the trigger already makes sense on its own and you're adding a
        supplementary hint on top — an icon-only toolbar button's name, a truncated label's full
        text, a keyboard shortcut. Because the surface carries <code>role="tooltip"</code> and no
        focus trap, it can never hold the one piece of information a user actually needs; anything
        interactive or essential belongs in a
        <a routerLink="/components/popover">Popover</a> or a
        <a routerLink="/components/flyout">Flyout</a> instead.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[hellTooltipTrigger]</code> to a template reference; the surface inside it opens
        on hover and on keyboard focus, and closes automatically once the pointer or focus leaves
        the trigger.
      </p>
      <hd-example-tabs [code]="tooltipBasicExampleCode">
        <app-tooltip-basic-example />
      </hd-example-tabs>

      <h2>Placement</h2>
      <p>
        <code>placement</code> (default <code>'top'</code>) sets the preferred side and alignment
        relative to the trigger, with <code>top-start</code>, <code>bottom-end</code>, and eight
        other variants available. Floating UI flips and shifts the surface automatically to stay
        inside the viewport when the preferred placement doesn't fit.
      </p>
      <hd-example-tabs [code]="tooltipPlacementsExampleCode" previewClass="flex flex-wrap gap-4">
        <app-tooltip-placements-example />
      </hd-example-tabs>

      <h2>Delay</h2>
      <p>
        <code>showDelay</code> (default <code>500</code>ms) and <code>hideDelay</code> (default
        <code>0</code>ms) tune how eager or patient a tooltip feels. Raise <code>showDelay</code>
        for hints on controls a user's pointer passes over incidentally, so tooltips don't flash on
        every pixel the cursor crosses.
      </p>
      <hd-example-tabs [code]="tooltipDelayExampleCode">
        <app-tooltip-delay-example />
      </hd-example-tabs>

      <h2>Hoverable content</h2>
      <p>
        Set <code>hoverableContent</code> to keep the surface open while the pointer travels from
        the trigger onto the tooltip itself — useful when the hint is long enough that a user might
        want to select its text, or sits close enough to the trigger that a small gap would
        otherwise close it prematurely.
      </p>
      <hd-example-tabs [code]="tooltipHoverableExampleCode">
        <app-tooltip-hoverable-example />
      </hd-example-tabs>

      <h2>With icon buttons and shortcuts</h2>
      <p>
        A common toolbar shape: icon-only <code>hellButton</code>s (narrow entry point
        <code>@hell-ui/angular/button</code>) with <code>hell-icon</code>s
        (<code>@hell-ui/angular/icon</code>) for glyphs, and <code>hellKbd</code>
        (<code>@hell-ui/angular/tag</code>) inside each tooltip to spell out the shortcut next to
        the action name. Icon-only buttons still need their own <code>aria-label</code> — the
        tooltip is a supplementary hint on top, not the button's accessible name.
      </p>
      <hd-example-tabs [code]="tooltipWithToolbarExampleCode">
        <app-tooltip-with-toolbar-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellTooltip</code> exposes exactly one Public Part, <code>root</code> — the surface
        element itself. Pass <code>ui="..."</code> as shorthand to refine it, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit
        <code>&#123; root?: string &#125;</code> map. Both forms merge on top of the default recipe through
        Hell's Tailwind merge, so refinements win deterministically over the defaults they
        conflict with. <code>HellTooltipTrigger</code> renders no owned structure of its own — it
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
            <td><code>HellTooltip</code></td>
            <td><code>root</code></td>
            <td>
              The surface element — background, text color, radius, shadow, max width, and open
              animation.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Positioning, the show/hide lifecycle, and Floating Scope registration are unaffected by the
        Part Style Map — only visual classes flow through <code>ui</code>.
      </p>
      <hd-example-tabs [code]="tooltipAllPartsStylingExampleCode">
        <app-tooltip-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hellTooltipTrigger</code></h3>
      <p>
        Selector: <code>button[hellTooltipTrigger], a[hellTooltipTrigger]</code>.
      </p>
      <ul>
        <li><code>[hellTooltipTrigger]</code>: <code>TemplateRef</code> — the tooltip content.</li>
        <li>
          <code>placement</code>: <code>NgpTooltipPlacement</code> (Floating UI) —
          <code>'top' | 'right' | 'bottom' | 'left'</code> plus <code>-start</code>/<code>-end</code>
          variants of each. Default <code>'top'</code>.
        </li>
        <li>
          <code>offset</code>: <code>number | &#123; mainAxis?, crossAxis?, alignmentAxis? &#125;</code>,
          default <code>0</code>.
        </li>
        <li><code>showDelay</code>: <code>number</code> (ms), default <code>500</code>.</li>
        <li><code>hideDelay</code>: <code>number</code> (ms), default <code>0</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>, default <code>false</code>.</li>
        <li>
          <code>container</code>: <code>string | HTMLElement | null</code>, default
          <code>document.body</code>.
        </li>
        <li><code>showOnOverflow</code>: <code>boolean</code>, default <code>false</code> — show the tooltip only when the trigger's own content is visually truncated.</li>
        <li><code>hoverableContent</code>: <code>boolean</code>, default <code>false</code> — keep the tooltip open while the pointer is over the tooltip surface itself.</li>
      </ul>

      <h3><code>hellTooltip</code></h3>
      <p>Selector: <code>[hellTooltip]</code>.</p>
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
        <li>
          The surface renders <code>role="tooltip"</code>, and while it is open the trigger gets a
          matching <code>aria-describedby</code> pointing at the surface's id.
        </li>
        <li>
          The tooltip opens on pointer hover and on keyboard focus alike, so keyboard-only users
          see the same hint as mouse users.
        </li>
        <li>
          Content must stay supplementary — a trigger's function must remain clear and usable even
          if its tooltip never shows, since the surface has no focus trap and cannot host
          interactive controls.
        </li>
        <li>
          When <code>hoverableContent</code> is enabled the surface carries
          <code>data-hoverable</code>, which switches it from <code>pointer-events-none</code> to
          <code>pointer-events-auto</code> so the pointer can move onto it without the tooltip
          closing first.
        </li>
        <li>
          A disabled trigger sets the native <code>disabled</code> attribute on a
          <code>&lt;button&gt;</code> host, or <code>aria-disabled="true"</code> plus
          <code>tabindex="-1"</code> on an <code>&lt;a&gt;</code> host, and blocks click/Enter
          activation either way.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use tooltips for supplemental hints — icon names, truncated text, keyboard shortcuts.</li>
        <li>Keep copy short enough to read at a glance.</li>
        <li>Ensure the trigger already has an accessible name, independent of the tooltip.</li>
        <li>Raise <code>showDelay</code> for controls a pointer often passes over incidentally.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put interactive controls inside a tooltip — reach for popover instead.</li>
        <li>Don't hide required instructions in hover-only content; keyboard and touch users may never trigger it.</li>
        <li>Don't rely on a tooltip as an element's only accessible name.</li>
      </ul>
    </article>
  `,
})
export class TooltipPage {
  protected readonly tooltipAllPartsStylingExampleCode = tooltipAllPartsStylingExampleCodeRaw;
  protected readonly tooltipBasicExampleCode = tooltipBasicExampleCodeRaw;
  protected readonly tooltipDelayExampleCode = tooltipDelayExampleCodeRaw;
  protected readonly tooltipHoverableExampleCode = tooltipHoverableExampleCodeRaw;
  protected readonly tooltipPlacementsExampleCode = tooltipPlacementsExampleCodeRaw;
  protected readonly tooltipWithToolbarExampleCode = tooltipWithToolbarExampleCodeRaw;
}
