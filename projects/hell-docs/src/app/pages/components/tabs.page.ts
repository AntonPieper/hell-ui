import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_TABS_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_TABS_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Tabs</h1>
      <p>
        Switch between sibling views inside a single region. Built on the
        <code>NgpTabset</code> primitive — keyboard navigation, ARIA attributes and focus management
        are all handled.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <div hellTabset value="general">
          <div hellTabList>
            <button hellTab value="general">General</button>
            <button hellTab value="security">Security</button>
            <button hellTab value="billing">Billing</button>
          </div>
          <div hellTabPanel value="general" class="pt-4">
            Account name, language and timezone preferences.
          </div>
          <div hellTabPanel value="security" class="pt-4">
            Password, multi-factor authentication and active sessions.
          </div>
          <div hellTabPanel value="billing" class="pt-4">Plan, payment method and invoices.</div>
        </div>
      </hd-example-tabs>

      <h2>Vertical</h2>
      <p class="hd-note">
        Each vertical tab reserves space for the active indicator, so labels stay still when
        activation moves between tabs — no horizontal jitter.
      </p>
      <hd-example-tabs [code]="exampleCodes[1]">
        <div hellTabset value="a" orientation="vertical">
          <div hellTabList>
            <button hellTab value="a">Section A</button>
            <button hellTab value="b">Section B</button>
            <button hellTab value="c">Section C</button>
          </div>
          <div class="hd-fill">
            <div hellTabPanel value="a">Content A</div>
            <div hellTabPanel value="b">Content B</div>
            <div hellTabPanel value="c">Content C</div>
          </div>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellTabset</code>: <code>value</code>, <code>valueChange</code>,
          <code>orientation</code>, <code>activateOnFocus</code>
        </li>
        <li><code>hellTab</code>: <code>value</code>, <code>disabled</code></li>
        <li><code>hellTabPanel</code>: <code>value</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use tabs for peer sections at the same hierarchy level.</li>
        <li>Keep tab labels short and stable.</li>
        <li>Use vertical orientation when labels are long or numerous.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use tabs to step through a required sequence.</li>
        <li>Don't hide validation errors in inactive panels without summary.</li>
      </ul>
    </article>
  `,
})
export class TabsPage {
  protected readonly exampleCodes = [
    '<div hellTabset value="general">\n  <div hellTabList>\n    <button hellTab value="general">General</button>\n    <button hellTab value="security">Security</button>\n    <button hellTab value="billing">Billing</button>\n  </div>\n  <div hellTabPanel value="general" class="pt-4">\n    Account name, language and timezone preferences.\n  </div>\n  <div hellTabPanel value="security" class="pt-4">\n    Password, multi-factor authentication and active sessions.\n  </div>\n  <div hellTabPanel value="billing" class="pt-4">\n    Plan, payment method and invoices.\n  </div>\n</div>\n',
    '<div hellTabset value="a" orientation="vertical">\n  <div hellTabList>\n    <button hellTab value="a">Section A</button>\n    <button hellTab value="b">Section B</button>\n    <button hellTab value="c">Section C</button>\n  </div>\n  <div class="hd-fill">\n    <div hellTabPanel value="a">Content A</div>\n    <div hellTabPanel value="b">Content B</div>\n    <div hellTabPanel value="c">Content C</div>\n  </div>\n</div>\n',
  ] as const;
}
