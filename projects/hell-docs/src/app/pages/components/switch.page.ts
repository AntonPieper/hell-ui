import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSwitch } from 'hell';

@Component({
  selector: 'hd-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <article class="hd-prose">
      <h1>Switch</h1>
      <p>Use for binary on/off settings whose effect is applied immediately.
        For deferred values that are committed on submit, prefer
        <code>checkbox</code>. The host is a <code>&lt;button&gt;</code>, so
        wrapping in a <code>&lt;label&gt;</code> toggles it natively.</p>

      <h2>Examples</h2>
      <div class="hd-example grid gap-2 max-w-md">
        <label class="inline-flex items-center gap-3">
          <button
            hellSwitch
            [checked]="notify()"
            (checkedChange)="notify.set($event)"
          ></button>
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
      </div>

      <p>Current value: <code>{{ notify() }}</code></p>

      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code>, <code>disabled</code></li>
      </ul>
    </article>
  `,
})
export class SwitchPage {
  protected readonly notify = signal(true);
}
