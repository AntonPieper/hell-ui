import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TabsBasicExample } from './examples/basic.example';
import tabsBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TabsDisabledExample } from './examples/disabled.example';
import tabsDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { TabsStylingExample } from './examples/styling.example';
import tabsStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { TabsVerticalExample } from './examples/vertical.example';
import tabsVerticalExampleCodeRaw from './examples/vertical.example.ts?raw' with {
  loader: 'text',
};
import { TabsWithCardExample } from './examples/with-card.example';
import tabsWithCardExampleCodeRaw from './examples/with-card.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TabsBasicExample,
    TabsDisabledExample,
    TabsVerticalExample,
    TabsWithCardExample,
    TabsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tabs"
        icon="faSolidFolderOpen"
        category="Styled primitive"
        importPath="@hell-ui/angular/tabs"
        stylesPath="@hell-ui/angular/tabs/styles.css"
      >
        Split one region into peer panels behind a roving-focus tab list, with disabled tabs and
        automatic ARIA wiring handled for you.
      </hd-page-header>
      <p>
        <code>hellTabset</code>, <code>hellTabList</code>, <code>hellTab</code> and
        <code>hellTabPanel</code> are four directives you attach to your own markup, built on the
        <code>NgpTabset</code> primitive family from <code>ng-primitives</code>. They wire up
        roving tabindex focus management, arrow-key navigation, tab/panel ARIA relationships, and
        selected-tab state, while leaving the DOM structure — including whether panels sit next to
        the list or somewhere else entirely — up to you.
      </p>
      <p>
        Reach for tabs when a dense view needs to show one of several peer sections at a time
        without navigating away: record detail panels, settings screens, or grouped filters in a
        toolbar. Because selection is just a string <code>value</code>, it is trivial to drive from
        a route param or a signal, and vertical orientation makes tabs a natural fit for settings
        navigation with long or numerous labels.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="tabsBasicExampleCode">
        <app-tabs-basic-example />
      </hd-example-tabs>

      <h2>Disabled tabs</h2>
      <p>
        Set <code>disabled</code> on a <code>hellTab</code> to remove it from selection and
        keyboard focus. Roving focus and <code>Home</code>/<code>End</code> skip disabled tabs
        automatically.
      </p>
      <hd-example-tabs [code]="tabsDisabledExampleCode">
        <app-tabs-disabled-example />
      </hd-example-tabs>

      <h2>Vertical orientation</h2>
      <p>
        Set <code>orientation="vertical"</code> to stack the tab list beside its panels and switch
        arrow-key navigation to the vertical axis. This example also sets
        <code>[activateOnFocus]="false"</code> for manual activation: arrow keys move roving focus
        between tabs, while <code>Enter</code>, <code>Space</code>, or a click selects the focused
        tab.
      </p>
      <hd-example-tabs [code]="tabsVerticalExampleCode">
        <app-tabs-vertical-example />
      </hd-example-tabs>

      <h2>With card and tag</h2>
      <p>
        Tabs commonly organize the detail sections of a record shown in a <code>hellCard</code>.
        Pairing it with a status <code>hellChip</code> in the header keeps the record's state
        visible no matter which tab is active.
      </p>
      <hd-example-tabs [code]="tabsWithCardExampleCode">
        <app-tabs-with-card-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        All four tabs directives follow the same Part Style Map: each owns exactly one Public
        Part, <code>root</code>, which is also its host element. Pass <code>ui="..."</code> as
        shorthand to refine that part, or the equivalent explicit map,
        <code>[ui]="&#123; root: '...' &#125;"</code>. Both forms merge on top of the directive's
        recipe through Hell's Tailwind merge, so refinements win deterministically over the
        defaults they conflict with.
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
            <td><code>HellTabset</code></td>
            <td><code>root</code></td>
            <td>
              The tabset wrapper — flex direction and gap between the list and its panels, and the
              horizontal/vertical layout switch.
            </td>
          </tr>
          <tr>
            <td><code>HellTabList</code></td>
            <td><code>root</code></td>
            <td>The tab list container — spacing, overflow, and the vertical pill background.</td>
          </tr>
          <tr>
            <td><code>HellTab</code></td>
            <td><code>root</code></td>
            <td>
              Each tab button — text color, the active indicator border/background, hover and
              disabled states.
            </td>
          </tr>
          <tr>
            <td><code>HellTabPanel</code></td>
            <td><code>root</code></td>
            <td>Each panel's content region — padding and the fade-in entrance animation.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Template <code>class</code> still works for layout hooks and non-conflicting utilities, but
        prefer <code>ui</code> whenever a refinement needs to win over a recipe class such as
        <code>border-b</code> or <code>px-hell-4</code>.
      </p>
      <hd-example-tabs [code]="tabsStylingExampleCode">
        <app-tabs-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellTabset</code>: <code>value: string | undefined</code> (the active tab),
          <code>valueChange: OutputEmitterRef&lt;string | undefined&gt;</code>,
          <code>orientation: HellOrientation</code> (<code>horizontal | vertical</code>, default
          <code>horizontal</code>), <code>activateOnFocus: boolean</code> (default
          <code>true</code> — selects a tab as soon as it receives focus, rather than waiting for
          activation), <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>hellTabList</code>: <code>ui: HellUiInput&lt;'root'&gt;</code>. No other
          inputs — orientation and ARIA wiring come from the parent tabset.
        </li>
        <li>
          <code>hellTab</code> (applied to <code>button[hellTab]</code>):
          <code>value: string</code> (required), <code>disabled: boolean</code> (default
          <code>false</code>), <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>hellTabPanel</code>: <code>value: string</code> (required),
          <code>ui: HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>HELL_TABS_IMPORTS</code>: array of all four directives, for bulk
          <code>imports</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Implements the WAI-ARIA Tabs pattern: <code>hellTabList</code> gets
          <code>role="tablist"</code> and <code>aria-orientation</code>; each <code>hellTab</code>
          gets <code>role="tab"</code>, <code>aria-selected</code>, and <code>aria-controls</code>
          pointing at its panel; each <code>hellTabPanel</code> gets <code>role="tabpanel"</code>
          and <code>aria-labelledby</code> pointing back at its tab.
        </li>
        <li>
          The tab list uses roving focus (one tab in the tab sequence at a time). Arrow keys move
          focus along the list's orientation axis, with <code>Home</code>/<code>End</code> jumping
          to the first/last enabled tab; disabled tabs are skipped.
        </li>
        <li>
          With the default <code>activateOnFocus</code>, moving focus to a tab selects it
          immediately. Set <code>[activateOnFocus]="false"</code> for manual activation, where
          <code>Enter</code>/<code>Space</code> or a click selects the focused tab instead.
        </li>
        <li>
          A disabled <code>hellTab</code> gets the native <code>disabled</code> attribute, is
          excluded from roving focus, and cannot be selected by click or keyboard.
        </li>
        <li>
          The active <code>hellTabPanel</code> is the only one with <code>tabindex="0"</code>;
          inactive panels get <code>aria-hidden="true"</code> and are hidden by the default
          recipe.
        </li>
        <li>
          Always set an accessible name on <code>hellTabList</code> (for example
          <code>aria-label="Account sections"</code>) so screen reader users know what the tabs
          apply to.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use tabs for peer sections at the same hierarchy level.</li>
        <li>Keep tab labels short, stable, and parallel in phrasing.</li>
        <li>Give every <code>hellTabList</code> an <code>aria-label</code> or <code>aria-labelledby</code>.</li>
        <li>Use vertical orientation when labels are long, numerous, or already read as a nav list.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use tabs to step through a required sequence — that's a wizard, not peer content.</li>
        <li>Don't hide validation errors in inactive panels without a visible summary or tab-level indicator.</li>
        <li>Don't nest an unrelated interactive widget's roving focus inside a tab list.</li>
      </ul>
    </article>
  `,
})
export class TabsPage {
  protected readonly tabsBasicExampleCode = tabsBasicExampleCodeRaw;
  protected readonly tabsDisabledExampleCode = tabsDisabledExampleCodeRaw;
  protected readonly tabsVerticalExampleCode = tabsVerticalExampleCodeRaw;
  protected readonly tabsWithCardExampleCode = tabsWithCardExampleCodeRaw;
  protected readonly tabsStylingExampleCode = tabsStylingExampleCodeRaw;
}
