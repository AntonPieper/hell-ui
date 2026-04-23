import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_TABS_DIRECTIVES } from 'hell';

@Component({
  selector: 'hd-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Tabs</h1>
      <p>Switch between sibling views inside a single region. Built on the
        <code>NgpTabset</code> primitive — keyboard navigation, ARIA
        attributes and focus management are all handled.</p>

      <h2>Example</h2>
      <div class="hd-example">
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
          <div hellTabPanel value="billing" class="pt-4">
            Plan, payment method and invoices.
          </div>
        </div>
      </div>

      <h2>Vertical</h2>
      <div class="hd-example">
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
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellTabset</code>: <code>value</code>, <code>valueChange</code>, <code>orientation</code>, <code>activateOnFocus</code></li>
        <li><code>hellTab</code>: <code>value</code>, <code>disabled</code></li>
        <li><code>hellTabPanel</code>: <code>value</code></li>
      </ul>
    </article>
  `,
})
export class TabsPage {}
