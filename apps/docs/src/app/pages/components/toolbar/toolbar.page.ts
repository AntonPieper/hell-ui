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
    ToolbarPrioritiesExample,
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
          <h2>Icon-only actions and separators</h2>
          <p>
            Add <code>iconOnly</code> to an action to render a compact, square icon button inline:
            the label becomes the button's accessible name (<code>aria-label</code>) and a native
            <code>title</code> tooltip, and the visible text is hidden. The overflow menu still shows
            the full label, so the action stays legible once collapsed. Because the toolbar owns the
            inline button, richer tooltips are a native <code>title</code>; when you need a full
            <code>@hell-ui/angular/tooltip</code> popover, keep the action a labelled button or reach
            for a <code>hellToolbarWidget</code>.
          </p>
          <p>
            A <code>hellToolbarSeparator</code> template declares a group divider: it renders as an
            inline divider between two visible groups and as a menu separator between two overflowed
            groups. Collapse is group-aware — a group between separators overflows as a unit rather
            than stranding a half-cluster, and edge or doubled separators are dropped automatically.
          </p>
        </div>

        <hd-example-tabs [code]="iconOnlyCode">
          <app-toolbar-icon-only-example />
        </hd-example-tabs>

        <div class="hd-prose">
          <h2>Standalone above a table, with a widget</h2>
          <p>
            The toolbar is not tied to the page header — it works anywhere. Here it sits above a
            <code>@hell-ui/angular/table</code> as a table action bar: a primary “Invite member”, a
            separator, icon-only table controls that overflow on narrow screens, a
            <code>hellToolbarWidget</code> search field, and a destructive <code>overflowOnly</code>
            action kept out of the way in the menu. A widget projects arbitrary content that stays
            in the layout and the roving tab order but never collapses into the menu — the honest
            boundary between things that can menu-ify (actions) and things that cannot (widgets).
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
                <td><code>separator</code></td>
                <td>An inline group divider rendered from a <code>hellToolbarSeparator</code>.</td>
              </tr>
              <tr>
                <td><code>widget</code></td>
                <td>The wrapper around a <code>hellToolbarWidget</code>'s projected content.</td>
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
              <tr>
                <td><code>overflowSeparator</code></td>
                <td>A group divider between overflowed groups (a <code>hellMenuSeparator</code>).</td>
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
            <li>
              <code>overflowLabel</code>: <code>string</code>. Accessible label for the overflow
              trigger. Defaults to <code>''</code>, which falls back to the toolbar Label Contract's
              <code>overflowTrigger</code> string (<code>'More actions'</code>). Override the default
              globally with <code>HELL_TOOLBAR_LABELS</code> rather than hardcoding the input.
            </li>
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
            <li>
              <code>iconOnly</code>: <code>boolean</code>. Renders the inline button icon-only, taking
              its accessible name and <code>title</code> tooltip from <code>label</code>; the menu
              item still shows the label. Default <code>false</code>.
            </li>
            <li><code>variant</code>: <code>HellButtonVariant</code>. Inline button variant; ignored in the menu. Default <code>'default'</code>.</li>
            <li><code>activated</code>: <code>output&lt;void&gt;</code>. Emits from whichever rendering is activated.</li>
          </ul>
          <p>
            <strong><code>ng-template hellToolbarSeparator</code></strong>
            (<code>HellToolbarSeparator</code>) — a group divider. Renders inline between two visible
            groups and as a menu separator between two overflowed groups; makes collapse group-aware.
          </p>
          <p>
            <strong><code>ng-template hellToolbarWidget</code></strong>
            (<code>HellToolbarWidget</code>) — projected content (search field, select, toggle group)
            that stays inline and in the roving tab order but never collapses or menu-ifies. Place
            interactive widgets like a search field at the end: they capture their own arrow keys, so
            <code>Tab</code> (not arrows) moves out of the toolbar.
          </p>
          <p>Content projection and exports:</p>
          <ul>
            <li>
              <code>HELL_TOOLBAR_DIRECTIVES</code> — bulk-import tuple of <code>HellToolbar</code>,
              <code>HellToolbarAction</code>, <code>HellToolbarSeparator</code>, and
              <code>HellToolbarWidget</code>.
            </li>
            <li>
              <code>HELL_TOOLBAR_LABELS</code> / <code>HELL_TOOLBAR_LABELS</code> — the Label
              Contract for the overflow-trigger name and its English default.
            </li>
            <li>
              <code>hellResolveToolbarOverflow</code> — the pure priority/overflow policy used
              internally and exported for testing.
            </li>
            <li>
              <code>HellToolbarPart</code> —
              <code>'root' | 'action' | 'separator' | 'widget' | 'overflowTrigger' | 'overflowMenu' | 'overflowItem' | 'overflowSeparator'</code>;
              <code>HellToolbarUi</code> is <code>HellUi&lt;HellToolbarPart&gt;</code>.
            </li>
          </ul>

          <h2>Accessibility</h2>
          <ul>
            <li>The host is a <code>role="toolbar"</code> with <code>aria-orientation</code>; give it a name via <code>label</code> or <code>labelledBy</code>.</li>
            <li>
              A roving tabindex gives the toolbar a single tab stop: arrow keys move between the
              visible action buttons, widgets, and the overflow trigger, and
              <code>Home</code>/<code>End</code> jump to the ends, per the WAI-ARIA toolbar pattern.
            </li>
            <li>
              When the focused action collapses out of the row as the container narrows, focus moves
              to the overflow trigger (where the action now lives) instead of dropping to the page.
            </li>
            <li>
              Interactive widgets own their own keys: a focused text field or select consumes the
              arrow keys for editing, so use <code>Tab</code> to leave the toolbar from a widget.
            </li>
            <li>
              Icon-only actions keep an accessible name from <code>label</code> and expose it as a
              native <code>title</code> tooltip, so the button is never a nameless glyph.
            </li>
            <li>
              Overflowed actions live in the standard Hell menu with the same labels and disabled
              states, so no action becomes unreachable at any width.
            </li>
            <li>
              An open overflow menu stays in sync during resize: its items are driven by the same
              reactive membership as the inline row, so an action moving back inline drops out of
              the open menu in the same render — nothing is ever shown in both places at once, and
              the menu stays open as long as overflowed actions remain.
            </li>
            <li>Overflow recalculation is measured and committed outside change detection, once per resize frame, so the row does not flicker or flash a clipped first paint.</li>
          </ul>

          <h2>Do</h2>
          <ul class="hd-do">
            <li>Give every action a clear <code>label</code>; it names both the button and the menu item.</li>
            <li>Reserve <code>primary</code> for the one or two actions that must always stay visible.</li>
            <li>Use <code>overflowOnly</code> for rare or destructive actions that should stay tucked away.</li>
            <li>Group related actions with <code>hellToolbarSeparator</code> so clusters collapse together.</li>
            <li>Put interactive widgets (search, select) at the end, and keep them to things that should never menu-ify.</li>
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
  protected readonly iconOnlyCode = toolbarIconOnlyExampleCodeRaw;
  protected readonly tableCode = toolbarTableExampleCodeRaw;
  protected readonly stylingCode = toolbarStylingExampleCodeRaw;
}
