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
        <code>checkbox</code>.</p>

      <h2>Example</h2>
      <div class="hd-example grid gap-2">
        <label class="inline-flex items-center gap-3">
          <hell-switch
            [checked]="notify()"
            (checkedChange)="notify.set($event)"
          />
          Email notifications
        </label>
        <label class="inline-flex items-center gap-3 opacity-60">
          <hell-switch disabled />
          Disabled
        </label>
        <label class="inline-flex items-center gap-3">
          <hell-switch checked disabled />
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
