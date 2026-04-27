import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSwitch } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellSwitch],
  template: `
    <article class="hd-prose">
      <h1>Switch</h1>
      <p>
        Use for binary on/off settings whose effect is applied immediately. For deferred values that
        are committed on submit, prefer <code>checkbox</code>. The host is a
        <code>&lt;button&gt;</code>, so wrapping in a <code>&lt;label&gt;</code> toggles it
        natively.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="grid gap-2 max-w-md">
        <label class="inline-flex items-center gap-3">
          <button hellSwitch [checked]="notify()" (checkedChange)="notify.set($event)"></button>
          Email notifications
        </label>
        <label class="inline-flex items-center gap-3">
          <button hellSwitch disabled></button>
          Disabled
        </label>
        <label class="inline-flex items-center gap-3">
          <button hellSwitch checked disabled></button>
          Disabled, on
        </label>
      </hd-example-tabs>

      <p>
        Current value: <code>{{ notify() }}</code>
      </p>

      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code>, <code>disabled</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use switches for immediate on/off settings.</li>
        <li>Keep labels outside the control and always visible.</li>
        <li>Use disabled only when the reason is clear nearby.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use switches for submit-time choices; use Checkbox.</li>
        <li>Don't trigger destructive side effects without confirmation.</li>
      </ul>
    </article>
  `,
})
export class SwitchPage {
  protected readonly exampleCodes = [
    '<label class="inline-flex items-center gap-3">\n  <button hellSwitch></button>\n  Email notifications\n</label>\n<label class="inline-flex items-center gap-3">\n  <button hellSwitch [checked]="true"></button>\n  Weekly summary\n</label>\n<label class="inline-flex items-center gap-3">\n  <button hellSwitch disabled></button>\n  Locked setting\n</label>\n',
  ] as const;
  protected readonly notify = signal(true);
}
