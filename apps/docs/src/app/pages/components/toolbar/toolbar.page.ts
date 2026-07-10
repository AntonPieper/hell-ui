import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ToolbarContractHarnessPage } from './toolbar-contract-harness.page';
import { ToolbarBasicExample } from './examples/basic.example';
import toolbarBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ToolbarPrioritiesExample } from './examples/priorities.example';
import toolbarPrioritiesExampleCodeRaw from './examples/priorities.example.ts?raw' with {
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
    ToolbarPrioritiesExample,
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
            A responsive action toolbar: declare each action once and the toolbar renders what fits
            as buttons and collapses the rest into a trailing overflow menu, following the WAI-ARIA
            toolbar keyboard pattern.
          </hd-page-header>
          <p>
            <code>hell-toolbar</code> projects <code>ng-template hellToolbarAction</code> children —
            one declaration per action carrying a <code>label</code>, optional icon template,
            <code>disabled</code> state, and <code>priority</code>. The toolbar measures its own
            container with a <code>ResizeObserver</code> and renders the actions that fit as inline
            Hell buttons, moving the overflow into a trailing Hell menu. There is one tab stop:
            arrow keys rove across the visible actions and the overflow trigger, so a dense toolbar
            never costs one Tab press per button.
          </p>
          <p>
            Because the same declaration drives both renderings, an action's label and disabled
            state stay identical whether it shows as a button or a menu item, and no action ever
            becomes unreachable as the container shrinks.
          </p>

          <h2>Basic</h2>
          <p>
            A handful of actions with icons. <code>New</code> is <code>primary</code> so it never
            collapses; <code>Settings</code> is <code>overflowOnly</code> so it always lives in the
            menu; everything in between overflows when space runs out. Resize the preview to watch
            the row recompute.
          </p>
        </div>

        <hd-example-tabs [code]="basicCode">
          <app-toolbar-basic-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Priorities</h2>
          <p>
            The three priorities in a deliberately narrow container. <code>primary</code> actions
            never overflow, <code>default</code> actions collapse last-declared first as width
            shrinks, and <code>overflowOnly</code> actions only ever appear in the menu. An optional
            <code>variant</code> lets a primary action read as the emphasized button.
          </p>
        </div>

        <hd-example-tabs [code]="prioritiesCode">
          <app-toolbar-priorities-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Standalone above a table</h2>
          <p>
            The toolbar is not tied to the page header — it works anywhere. Here it sits above a
            <code>@hell-ui/angular/table</code> as a table action bar: a primary “Invite member”, a
            few table controls that overflow on narrow screens, and a destructive
            <code>overflowOnly</code> action kept out of the way in the menu.
          </p>
        </div>

        <hd-example-tabs [code]="tableCode">
          <app-toolbar-table-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Styling</h2>
          <p>
            Toolbar follows Hell's Part Style Map contract. A <code>ui="..."</code> shorthand
            refines the default <code>root</code> part; a <code>[ui]</code> map refines named parts.
            The <code>action</code>, <code>overflowTrigger</code>, <code>overflowMenu</code>, and
            <code>overflowItem</code> refinements are forwarded to the inline buttons, the trigger,
            and the overflow menu respectively, so both renderings stay coherent.
          </p>
          <table class="hd-doc-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Styles</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>root</code></td>
                <td>The host <code>role="toolbar"</code> element and its layout.</td>
              </tr>
              <tr>
                <td><code>action</code></td>
                <td>Each inline action button (a <code>hellButton</code>).</td>
              </tr>
              <tr>
                <td><code>overflowTrigger</code></td>
                <td>The trailing “More actions” button that opens the overflow menu.</td>
              </tr>
              <tr>
                <td><code>overflowMenu</code></td>
                <td>The overflow menu panel (a <code>hellMenu</code>).</td>
              </tr>
              <tr>
                <td><code>overflowItem</code></td>
                <td>Each overflowed action rendered as a menu item.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <hd-example-tabs [code]="stylingCode">
          <app-toolbar-styling-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>API</h2>
          <p><strong><code>hell-toolbar</code></strong> (<code>HellToolbar</code>) inputs:</p>
          <ul>
            <li><code>label</code>: <code>string</code>. Accessible name (<code>aria-label</code>). Default <code>''</code>.</li>
            <li><code>labelledBy</code>: <code>string</code>. ID for <code>aria-labelledby</code>. Default <code>''</code>.</li>
            <li>
              <code>orientation</code>: <code>'horizontal' | 'vertical'</code>. Layout axis and
              arrow-key direction. Overflow collapsing applies to horizontal toolbars. Default
              <code>'horizontal'</code>.
            </li>
            <li><code>size</code>: <code>HellSize</code>. Applied to buttons and trigger. Default <code>'sm'</code>.</li>
            <li><code>overflowLabel</code>: <code>string</code>. Accessible label for the overflow trigger. Default <code>'More actions'</code>.</li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellToolbarPart&gt;</code> — a shorthand class
              string for the <code>root</code> part or a <code>HellToolbarUi</code> map.
            </li>
          </ul>
          <p>
            <strong><code>ng-template hellToolbarAction</code></strong>
            (<code>HellToolbarAction</code>) — one declaration, rendered inline or in the menu. The
            template's content is the optional leading icon.
          </p>
          <ul>
            <li><code>label</code>: <code>string</code> (required). Button text and menu-item text.</li>
            <li><code>disabled</code>: <code>boolean</code>. Disables both renderings. Default <code>false</code>.</li>
            <li>
              <code>priority</code>: <code>'primary' | 'default' | 'overflowOnly'</code>. Default
              <code>'default'</code>.
            </li>
            <li><code>variant</code>: <code>HellButtonVariant</code>. Inline button variant; ignored in the menu. Default <code>'default'</code>.</li>
            <li><code>activated</code>: <code>output&lt;void&gt;</code>. Emits from whichever rendering is activated.</li>
          </ul>
          <p>Content projection and exports:</p>
          <ul>
            <li><code>HELL_TOOLBAR_DIRECTIVES</code> — bulk-import tuple of <code>HellToolbar</code> and <code>HellToolbarAction</code>.</li>
            <li>
              <code>hellResolveToolbarOverflow</code> — the pure priority/overflow policy used
              internally and exported for testing.
            </li>
            <li>
              <code>HellToolbarPart</code> —
              <code>'root' | 'action' | 'overflowTrigger' | 'overflowMenu' | 'overflowItem'</code>;
              <code>HellToolbarUi</code> is <code>HellUi&lt;HellToolbarPart&gt;</code>.
            </li>
          </ul>

          <h2>Accessibility</h2>
          <ul>
            <li>The host is a <code>role="toolbar"</code> with <code>aria-orientation</code>; give it a name via <code>label</code> or <code>labelledBy</code>.</li>
            <li>
              A roving tabindex gives the toolbar a single tab stop: arrow keys move between the
              visible action buttons and the overflow trigger, and <code>Home</code>/<code>End</code>
              jump to the ends, per the WAI-ARIA toolbar pattern.
            </li>
            <li>
              Overflowed actions live in the standard Hell menu with the same labels and disabled
              states, so no action becomes unreachable at any width.
            </li>
            <li>Overflow recalculation is measured and committed outside change detection, once per resize frame, so the row does not flicker.</li>
          </ul>

          <h2>Do</h2>
          <ul class="hd-do">
            <li>Give every action a clear <code>label</code>; it names both the button and the menu item.</li>
            <li>Reserve <code>primary</code> for the one or two actions that must always stay visible.</li>
            <li>Use <code>overflowOnly</code> for rare or destructive actions that should stay tucked away.</li>
            <li>Name the toolbar with <code>label</code> or <code>labelledBy</code>.</li>
          </ul>

          <h2>Don't</h2>
          <ul class="hd-dont">
            <li>Don't put every action at <code>primary</code> — nothing overflows and the row clips on narrow screens.</li>
            <li>Don't wire separate handlers per rendering; the single <code>activated</code> output fires from both.</li>
            <li>Don't rely on the viewport width — the toolbar measures its own container.</li>
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
  protected readonly prioritiesCode = toolbarPrioritiesExampleCodeRaw;
  protected readonly tableCode = toolbarTableExampleCodeRaw;
  protected readonly stylingCode = toolbarStylingExampleCodeRaw;
}
