import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABS_DIRECTIVES } from '@hell-ui/angular/tabs';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TabsExampleExample } from './examples/example.example';
import tabsExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { TabsVerticalExample } from './examples/vertical.example';
import tabsVerticalExampleCodeRaw from './examples/vertical.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_TABS_DIRECTIVES, TabsExampleExample, TabsVerticalExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Tabs"
        icon="faSolidFolderOpen"
        category="Styled primitive"
        importPath="@hell-ui/angular/tabs"
        stylesPath="@hell-ui/angular/tabs/styles.css"
      >
        Switch between panels with automatic ARIA wiring — horizontal or vertical, with disabled tabs supported.
      </hd-page-header>
      <p>
        Switch between sibling views inside a single region. Built on the
        <code>NgpTabset</code> primitive — keyboard navigation, ARIA attributes and focus management
        are all handled.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="tabsExampleExampleCode">
        <app-tabs-example-example />
      </hd-example-tabs>

      <h2>Vertical</h2>
      <p class="hd-note">
        This example uses manual activation: arrow keys move focus, while Enter, Space, or click
        changes the selected panel.
      </p>
      <hd-example-tabs [code]="tabsVerticalExampleCode">
        <app-tabs-vertical-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellTabset</code>: <code>value</code>, <code>valueChange</code>,
          <code>orientation</code>, <code>activateOnFocus</code>, <code>ui</code>
        </li>
        <li><code>hellTabList</code>: local <code>root</code> <code>ui</code>.</li>
        <li><code>hellTab</code>: <code>value</code>, <code>disabled</code>, <code>ui</code>.</li>
        <li><code>hellTabPanel</code>: <code>value</code>, <code>ui</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Implements the ARIA tabs pattern: roving focus in the tab list, arrow-key movement, panel association via <code>aria-controls</code>.</li>
        <li>Vertical orientation switches arrow-key axis automatically.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use tabs for peer sections at the same hierarchy level.</li>
        <li>Keep tab labels short and stable.</li>
        <li>Use vertical orientation when labels are long or numerous.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use tabs to step through a required sequence.</li>
        <li>Don't hide validation errors in inactive panels without summary.</li>
      </ul>
    </article>
  `,
})
export class TabsPage {
  protected readonly tabsExampleExampleCode = tabsExampleExampleCodeRaw;
  protected readonly tabsVerticalExampleCode = tabsVerticalExampleCodeRaw;
}
