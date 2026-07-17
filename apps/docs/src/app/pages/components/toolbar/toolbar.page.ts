import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ToolbarContractHarnessPage } from './toolbar-contract-harness.page';
import { ToolbarBasicExample } from './examples/basic.example';
import toolbarBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ToolbarOverflowPoliciesExample } from './examples/overflow-policies.example';
import toolbarOverflowPoliciesExampleCodeRaw from './examples/overflow-policies.example.ts?raw' with {
  loader: 'text',
};
import { ToolbarIconOnlyExample } from './examples/icon-only.example';
import toolbarIconOnlyExampleCodeRaw from './examples/icon-only.example.ts?raw' with {
  loader: 'text',
};
import { ToolbarTableExample } from './examples/table-toolbar.example';
import toolbarTableExampleCodeRaw from './examples/table-toolbar.example.ts?raw' with {
  loader: 'text',
};
import { ToolbarStylingExample } from './examples/styling.example';
import toolbarStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    ToolbarContractHarnessPage,
    ToolbarBasicExample,
    ToolbarOverflowPoliciesExample,
    ToolbarIconOnlyExample,
    ToolbarTableExample,
    ToolbarStylingExample,
  ],
  template: `
    @if (showHarness) {
      <hd-toolbar-contract-harness />
    } @else {
      <article class="hd-doc-page">
        <div class="hd-prose">
          <hd-page-header
            title="Toolbar"
            icon="faSolidSliders"
            category="Composite"
            importPath="@hell-ui/angular/toolbar"
            stylesPath="@hell-ui/angular/toolbar/styles.css"
          >
            Two focused Interfaces: a plain directive Toolbar for consumer-owned controls, and an
            Overflow Toolbar Composite for measured action placement.
          </hd-page-header>
          <p>
            Use <code>[hellToolbar]</code> with <code>[hellToolbarItem]</code> for an ordinary
            WAI-ARIA toolbar. It contributes the role, accessible name, orientation, root recipe,
            and one roving tab stop; your native buttons, Hell Buttons, Tooltips, layout, and click
            handlers stay in your template. It creates no <code>ResizeObserver</code>, measurement
            row, portal, or duplicate rendering.
          </p>
          <p>
            Use <code>hell-overflow-toolbar</code> only when actions must move between an inline row
            and a trailing menu as the component's own container changes width. That Composite
            keeps the existing declaration templates, measurement, focus rescue, widgets,
            group-aware separators, and synchronized open menu.
          </p>

          <h2>Plain Toolbar</h2>
          <p>
            Apply <code>hellToolbar</code> to consumer-owned markup and
            <code>hellToolbarItem</code> to each interactive control. The root may refine its single
            <code>root</code> Public Part through <code>ui</code>; item styling and activation remain
            with the composed control. This example chooses <code>flex-wrap</code> as an app-owned
            layout decision.
          </p>
        </div>

        <hd-example-tabs [code]="basicCode">
          <app-toolbar-basic-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>HellButton and Tooltip composition</h2>
          <p>
            <code>hellToolbarItem</code> has no class binding and does not emit an activation event.
            The same element can therefore remain a <code>hellButton</code>, a Tooltip trigger, and a
            consumer-owned <code>(click)</code> target. Disabled items register as disabled and are
            skipped by Arrow and Home/End navigation.
          </p>
        </div>

        <hd-example-tabs [code]="iconOnlyCode">
          <app-toolbar-icon-only-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Overflow policies</h2>
          <p>
            <code>hell-overflow-toolbar</code> renders each
            <code>ng-template[hellToolbarAction]</code> inline or in its menu from one explicit
            placement policy. The <code>overflow</code> input defaults to <code>auto</code>.
          </p>
          <table class="hd-doc-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Placement</th>
                <th>Pre-split migration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>never</code></td>
                <td>Always inline.</td>
                <td><code>priority="primary"</code></td>
              </tr>
              <tr>
                <td><code>auto</code></td>
                <td>Inline while it fits; then in the menu.</td>
                <td><code>priority="default"</code></td>
              </tr>
              <tr>
                <td><code>always</code></td>
                <td>Only in the menu.</td>
                <td><code>priority="overflowOnly"</code></td>
              </tr>
            </tbody>
          </table>
          <p>
            The old selector, class, input, and policy type have no aliases: rename
            <code>hell-toolbar</code> to <code>hell-overflow-toolbar</code>,
            <code>HellToolbar</code> to <code>HellOverflowToolbar</code>,
            <code>priority</code> to <code>overflow</code>, and
            <code>HellToolbarActionPriority</code> to <code>HellToolbarActionOverflow</code>.
          </p>
        </div>

        <hd-example-tabs [code]="overflowPoliciesCode">
          <app-toolbar-overflow-policies-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Groups and widgets</h2>
          <p>
            <code>hellToolbarSeparator</code> declares a group boundary. Trailing groups move as a
            unit, and separators render only when they divide two visible groups in the relevant
            placement. <code>hellToolbarWidget</code> projects a search field or other control that
            stays inline and participates in the Composite's focus engine without being duplicated
            into the menu.
          </p>
        </div>

        <hd-example-tabs [code]="tableCode">
          <app-toolbar-table-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Overflow Toolbar styling</h2>
          <p>
            The measured Composite exposes <code>HellOverflowToolbarPart</code> and
            <code>HellOverflowToolbarUi</code>. Its flat Part Style Map owns only its anatomy; plain
            Toolbar items keep the Part Style Maps of their consumer-owned controls.
          </p>
          <table class="hd-doc-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Styles</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>root</code></td><td>The host toolbar and layout.</td></tr>
              <tr><td><code>action</code></td><td>Each inline action button.</td></tr>
              <tr><td><code>separator</code></td><td>An inline group divider.</td></tr>
              <tr><td><code>widget</code></td><td>The wrapper around projected widget content.</td></tr>
              <tr><td><code>overflowTrigger</code></td><td>The trailing menu trigger.</td></tr>
              <tr><td><code>overflowMenu</code></td><td>The overflow menu panel.</td></tr>
              <tr><td><code>overflowItem</code></td><td>Each action rendered as a menu item.</td></tr>
              <tr><td><code>overflowSeparator</code></td><td>A divider between menu groups.</td></tr>
            </tbody>
          </table>
        </div>

        <hd-example-tabs [code]="stylingCode">
          <app-toolbar-styling-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>API</h2>
          <p><strong><code>[hellToolbar]</code></strong> (<code>HellToolbar</code>) inputs:</p>
          <ul>
            <li><code>label</code>: accessible name mapped to <code>aria-label</code>.</li>
            <li><code>labelledBy</code>: ID mapped to <code>aria-labelledby</code>.</li>
            <li><code>orientation</code>: <code>'horizontal' | 'vertical'</code>; default <code>'horizontal'</code>.</li>
            <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
          </ul>
          <p>
            <strong><code>[hellToolbarItem]</code></strong> (<code>HellToolbarItem</code>) registers
            one consumer-owned control. Its <code>disabled</code> binding feeds roving-focus
            registration; the composed native or Hell control remains responsible for disabled
            semantics and activation.
          </p>

          <p>
            <strong><code>hell-overflow-toolbar</code></strong>
            (<code>HellOverflowToolbar</code>) inputs:
          </p>
          <ul>
            <li><code>label</code> / <code>labelledBy</code>: accessible name.</li>
            <li><code>orientation</code>: layout and arrow-key axis; default <code>'horizontal'</code>.</li>
            <li><code>size</code>: inline action and trigger size; default <code>'sm'</code>.</li>
            <li><code>overflowLabel</code>: per-instance trigger name override.</li>
            <li><code>ui</code>: <code>HellUiInput&lt;HellOverflowToolbarPart&gt;</code>.</li>
          </ul>
          <p><strong><code>ng-template[hellToolbarAction]</code></strong> inputs and output:</p>
          <ul>
            <li><code>label</code>: required button/menu-item label.</li>
            <li><code>disabled</code>: identical disabled state in both renderings.</li>
            <li><code>overflow</code>: <code>'never' | 'auto' | 'always'</code>; default <code>'auto'</code>.</li>
            <li><code>iconOnly</code> and <code>variant</code>: inline HellButton presentation.</li>
            <li><code>activated</code>: one output shared by inline and menu activation.</li>
          </ul>
          <p>Exports and labels:</p>
          <ul>
            <li>
              <code>HELL_TOOLBAR_IMPORTS</code> contains <code>HellToolbar</code>,
              <code>HellToolbarItem</code>, <code>HellOverflowToolbar</code>, and the three measured
              declaration directives.
            </li>
            <li>
              <code>HELL_OVERFLOW_TOOLBAR_LABELS</code>,
              <code>HellOverflowToolbarLabels</code>, and core's
              <code>provideHellLabels</code> own the overflow-trigger label contract and scoped
              overrides.
            </li>
            <li>
              <code>HellToolbarActionOverflow</code>, <code>HellOverflowToolbarPart</code>, and
              <code>HellOverflowToolbarUi</code> are the public policy and styling types.
            </li>
          </ul>

          <h2>Accessibility</h2>
          <ul>
            <li>Name every toolbar with <code>label</code> or <code>labelledBy</code>.</li>
            <li>Plain Toolbar delegates one tab stop plus Arrow/Home/End behavior to ng-primitives; disabled items are skipped.</li>
            <li>Overflow Toolbar preserves the same visible-control focus model and rescues focus to its trigger when a focused action moves into the menu.</li>
            <li>An open overflow menu updates from the same reactive membership during resize, so an action never appears in both placements at once.</li>
            <li>Icon-only consumer controls need their own accessible name; Tooltip content supplements rather than replaces it.</li>
          </ul>

          <h2>Do</h2>
          <ul class="hd-do">
            <li>Start with plain Toolbar when controls can stay in consumer-owned markup.</li>
            <li>Use Overflow Toolbar only for measured responsive placement.</li>
            <li>Use <code>never</code> sparingly and group related auto actions with separators.</li>
          </ul>

          <h2>Don't</h2>
          <ul class="hd-dont">
            <li>Don't use Overflow Toolbar as a wrapper for a fixed row of ordinary buttons.</li>
            <li>Don't duplicate click handlers or disabled state between inline and menu renderings.</li>
            <li>Don't rely on viewport width; Overflow Toolbar measures its own container.</li>
          </ul>
        </div>
      </article>
    }
  `,
})
export class ToolbarPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly showHarness = this.route.snapshot.queryParamMap.has('toolbarHarness');

  protected readonly basicCode = toolbarBasicExampleCodeRaw;
  protected readonly overflowPoliciesCode = toolbarOverflowPoliciesExampleCodeRaw;
  protected readonly iconOnlyCode = toolbarIconOnlyExampleCodeRaw;
  protected readonly tableCode = toolbarTableExampleCodeRaw;
  protected readonly stylingCode = toolbarStylingExampleCodeRaw;
}
