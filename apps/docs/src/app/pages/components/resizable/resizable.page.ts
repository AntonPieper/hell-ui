import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ResizableContractHarnessPage } from './resizable-contract-harness.page';
import { ResizableBasicExample } from './examples/basic.example';
import resizableBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ResizableVerticalExample } from './examples/vertical.example';
import resizableVerticalExampleCodeRaw from './examples/vertical.example.ts?raw' with {
  loader: 'text',
};
import { ResizableMinSizesExample } from './examples/min-sizes.example';
import resizableMinSizesExampleCodeRaw from './examples/min-sizes.example.ts?raw' with {
  loader: 'text',
};
import { ResizableGripHandleExample } from './examples/grip-handle.example';
import resizableGripHandleExampleCodeRaw from './examples/grip-handle.example.ts?raw' with {
  loader: 'text',
};
import { ResizableInspectorExample } from './examples/inspector.example';
import resizableInspectorExampleCodeRaw from './examples/inspector.example.ts?raw' with {
  loader: 'text',
};
import { ResizableStylingExample } from './examples/styling.example';
import resizableStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-resizable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ResizableBasicExample,
    ResizableVerticalExample,
    ResizableMinSizesExample,
    ResizableGripHandleExample,
    ResizableInspectorExample,
    ResizableStylingExample,
    ResizableContractHarnessPage,
    PageHeader,
  ],
  template: `
    @if (showResizeHarness) {
      <hd-resizable-contract-harness />
    } @else {
      <article class="hd-prose">
        <hd-page-header
          title="Resizable"
          icon="faSolidLeftRight"
          category="Composite"
          importPath="@hell-ui/angular/resizable"
          stylesPath="@hell-ui/angular/resizable/styles.css"
        >
          Split a region into panes a user can drag or keyboard-resize, with per-pane minimums and
          automatic rebalancing when the container changes size.
        </hd-page-header>
        <p>
          Resizable is a three-directive suite — <code>hellResizable</code> on the group,
          <code>hellResizablePane</code> on each region, and <code>hellResizableHandle</code> on the
          divider between two panes. You own the DOM and the content; the directives own the sizing
          math, pointer and keyboard interaction, and the separator accessibility contract. It
          builds on Hell's layout-agnostic Resize Behavior (the same pointer/keyboard/minimum-size
          engine that powers table column resizing), applied here to a flexbox pane layout.
        </p>
        <p>
          The group splits its main-axis size between panes proportionally, driven by each pane's
          <code>initialFlex</code>. Dragging a handle redistributes size between only its two
          adjacent panes; the others hold their size. Once a user has sized panes, a
          <code>ResizeObserver</code> rebalances them when the container grows or shrinks, so no pane
          can vanish on a window resize while explicit sizes are still respected. Reach for it in
          dense apps whenever a user needs to trade space between regions — list/detail inspectors,
          editor + console stacks, or a navigator beside a preview.
        </p>

        <h2>Basic</h2>
        <p>
          The smallest usage: two panes with one handle between them, inside a group with an explicit
          height. No <code>ui</code> refinements — panes and the hairline handle render their
          defaults.
        </p>
        <hd-example-tabs [code]="resizableBasicExampleCode" flush>
          <app-resizable-basic-example />
        </hd-example-tabs>

        <h2>Vertical orientation</h2>
        <p>
          Set <code>orientation="vertical"</code> to stack panes top-to-bottom; the handle becomes a
          row divider with a <code>row-resize</code> cursor. The default is
          <code>horizontal</code>.
        </p>
        <hd-example-tabs [code]="resizableVerticalExampleCode" flush>
          <app-resizable-vertical-example />
        </hd-example-tabs>

        <h2>Minimum sizes</h2>
        <p>
          Give every pane a <code>minSize</code> (pixels) so it never shrinks below usable content.
          Each handle rebalances only its two neighbours, so dragging one divider can never collapse
          a pane on the far side. When the container is smaller than the combined minimums the group
          reports a constrained state and the handles are disabled.
        </p>
        <hd-example-tabs [code]="resizableMinSizesExampleCode" flush>
          <app-resizable-min-sizes-example />
        </hd-example-tabs>

        <h2>Grip handle</h2>
        <p>
          Set <code>appearance="grip"</code> for a pill-shaped divider with a three-dot indicator.
          Use it when the handle is the primary affordance — user-resizable panels people are meant
          to notice — and the default hairline (<code>line</code>) reads as too decorative.
        </p>
        <hd-example-tabs [code]="resizableGripHandleExampleCode" flush>
          <app-resizable-grip-handle-example />
        </hd-example-tabs>

        <h2>With card and table</h2>
        <p>
          A list/detail inspector: a <code>hellTableRoot</code> of tickets in the left pane and a
          <code>hellCard</code> detail view in the right, split by a grip handle. Selecting a row
          updates the card, and the user drags the divider to trade space between the list and the
          detail. The handle's <code>aria-controls</code> names the two panes it resizes.
        </p>
        <hd-example-tabs [code]="resizableInspectorExampleCode" flush>
          <app-resizable-inspector-example />
        </hd-example-tabs>

        <h2>Styling</h2>
        <p>
          Every module in this entry point follows the Part Style Map contract. Pass
          <code>ui="..."</code> as a shorthand class string to refine a module's default
          <code>root</code> part, or pass a <code>[ui]</code> map to refine named parts by name. A
          Part Style Map only styles the DOM its own directive owns — the group's <code>ui</code>
          does not reach into panes or handles, so refine each directive on its own element. All
          refinements merge on top of the recipe through Hell's Tailwind merge, so they win
          deterministically over the defaults they conflict with.
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
              <td><code>hellResizable</code></td>
              <td><code>root</code></td>
              <td>The group host — the flex container that lays panes and handles along the main axis.</td>
            </tr>
            <tr>
              <td><code>hellResizablePane</code></td>
              <td><code>root</code></td>
              <td>A single pane region — its background, padding, radius, and scroll behavior.</td>
            </tr>
            <tr>
              <td><code>hellResizableHandle</code></td>
              <td><code>root</code></td>
              <td>The draggable divider host — its width/thickness, background, and hit area.</td>
            </tr>
            <tr>
              <td><code>hellResizableHandle</code></td>
              <td><code>grip</code></td>
              <td>The visual indicator inside the handle — the hairline or three-dot grip glyph.</td>
            </tr>
          </tbody>
        </table>
        <p>
          The example below refines every public part: the group root, both pane roots, and the
          handle's <code>root</code> and <code>grip</code> through a <code>HellResizableHandleUi</code>
          map. Template <code>class</code> still works for layout hooks and non-conflicting
          utilities, but prefer <code>ui</code> whenever a refinement must beat a recipe class.
        </p>
        <hd-example-tabs [code]="resizableStylingExampleCode" flush>
          <app-resizable-styling-example />
        </hd-example-tabs>

        <h2>API</h2>
        <h3><code>hellResizable</code> (group)</h3>
        <ul>
          <li>
            <code>orientation</code>: <code>HellOrientation</code> —
            <code>horizontal | vertical</code>. Main axis panes are laid out and resized along.
            Default <code>horizontal</code>.
          </li>
          <li>
            <code>rescaleOnResize</code>: <code>boolean</code>. When <code>true</code>, container
            size changes rebalance panes to fit; set <code>false</code> to freeze explicit pixel
            sizes across container resizes. Default <code>true</code>.
          </li>
          <li>
            <code>ui</code>: <code>HellUiInput&lt;HellResizablePart&gt;</code> — shorthand string or
            <code>HellResizableUi</code> map (<code>&#123; root: string &#125;</code>) refining the
            <code>root</code> part.
          </li>
          <li>
            Reflects <code>data-orientation</code> for stateful styling; exports as
            <code>hellResizable</code>.
          </li>
        </ul>
        <h3><code>hellResizablePane</code></h3>
        <ul>
          <li>
            <code>initialFlex</code>: <code>number</code>. Flex-grow factor used until the pane is
            first sized by a drag. Default <code>1</code>.
          </li>
          <li>
            <code>minSize</code>: <code>number</code> (pixels). Minimum size on the main axis. Default
            <code>80</code>.
          </li>
          <li>
            <code>ui</code>: <code>HellUiInput&lt;HellResizablePanePart&gt;</code> — shorthand string
            or <code>HellResizablePaneUi</code> map (<code>&#123; root: string &#125;</code>).
          </li>
        </ul>
        <h3><code>hellResizableHandle</code></h3>
        <ul>
          <li>
            <code>appearance</code>: <code>'line' | 'grip'</code>. <code>line</code> is a hairline
            that thickens on hover/drag; <code>grip</code> is a pill with a three-dot indicator.
            Default <code>line</code>.
          </li>
          <li>
            <code>aria-label</code>: <code>string | null</code>. Accessible name for the handle;
            falls back to the resizable Label Contract (<code>"Resize panels"</code>).
          </li>
          <li>
            <code>aria-controls</code>: <code>string | readonly string[] | null</code>. Id(s) of the
            panes the handle resizes, mirrored to the <code>aria-controls</code> attribute.
          </li>
          <li>
            <code>ui</code>: <code>HellUiInput&lt;HellResizableHandlePart&gt;</code> — shorthand
            string or <code>HellResizableHandleUi</code> map
            (<code>&#123; root?: string; grip?: string &#125;</code>) refining the
            <code>root</code> and <code>grip</code> parts.
          </li>
        </ul>
        <h3>Exported types &amp; helpers</h3>
        <ul>
          <li>
            Part unions: <code>HellResizablePart</code> / <code>HellResizablePanePart</code>
            (<code>'root'</code>) and <code>HellResizableHandlePart</code>
            (<code>'root' | 'grip'</code>).
          </li>
          <li>
            Part Style Map types: <code>HellResizableUi</code>, <code>HellResizablePaneUi</code>,
            <code>HellResizableHandleUi</code>.
          </li>
          <li>
            <code>HELL_RESIZABLE_DIRECTIVES</code> — the group, pane, and handle bundled for
            <code>imports</code>.
          </li>
          <li>
            <code>provideHellResizableLabels(&#123; resizePanels &#125;)</code> and
            <code>HELL_RESIZABLE_LABELS</code> — override the handle's default accessible label.
          </li>
        </ul>

        <h2>Accessibility</h2>
        <ul>
          <li>
            Each handle is <code>role="separator"</code> with <code>tabindex="0"</code>,
            <code>aria-valuemin="0"</code>, <code>aria-valuemax="100"</code>, and a live
            <code>aria-valuenow</code> reflecting the size split between its two adjacent panes.
          </li>
          <li>
            <code>aria-orientation</code> is set to the cross axis of the group
            (<code>vertical</code> for a horizontal group, and vice versa), matching the separator's
            visual direction.
          </li>
          <li>
            Keyboard: arrow keys nudge the split; Home/End jump to the adjacent pane's minimum and
            maximum. Direction is RTL-aware, so arrows follow the writing direction.
          </li>
          <li>
            The handle carries an <code>aria-label</code> from the Label Contract
            (<code>"Resize panels"</code> by default). Set <code>aria-label</code> per handle for a
            more specific name, or override globally with
            <code>provideHellResizableLabels</code>.
          </li>
          <li>
            When the container is too small for the combined pane minimums, handles set
            <code>aria-disabled="true"</code> and <code>tabindex="-1"</code>, so they drop out of the
            tab order until there is room to resize.
          </li>
        </ul>

        <h2>Do</h2>
        <ul class="hd-do">
          <li>Set a practical <code>minSize</code> on every pane so content never gets crushed.</li>
          <li>Give the group an explicit main-axis size — a resizable needs a bounded height (or width).</li>
          <li>Use <code>appearance="grip"</code> when the divider is a primary, discoverable control.</li>
          <li>Point <code>aria-controls</code> at the panes a handle resizes when they have stable ids.</li>
          <li>Refine each directive on its own element, since a Part Style Map only styles its own DOM.</li>
        </ul>

        <h2>Don't</h2>
        <ul class="hd-dont">
          <li>Don't omit a handle between two panes — a pane pair needs an explicit divider to resize.</li>
          <li>Don't place a handle where it overlaps a scrollbar or another drag target.</li>
          <li>Don't try to style panes or handles through the group's <code>ui</code>; it only styles the group root.</li>
          <li>Don't set <code>rescaleOnResize="false"</code> unless you truly want sizes frozen through container resizes.</li>
        </ul>
      </article>
    }
  `,
})
export class ResizablePage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showResizeHarness = this.route.snapshot.queryParamMap.has('resizeHarness');
  protected readonly resizableBasicExampleCode = resizableBasicExampleCodeRaw;
  protected readonly resizableVerticalExampleCode = resizableVerticalExampleCodeRaw;
  protected readonly resizableMinSizesExampleCode = resizableMinSizesExampleCodeRaw;
  protected readonly resizableGripHandleExampleCode = resizableGripHandleExampleCodeRaw;
  protected readonly resizableInspectorExampleCode = resizableInspectorExampleCodeRaw;
  protected readonly resizableStylingExampleCode = resizableStylingExampleCodeRaw;
}
