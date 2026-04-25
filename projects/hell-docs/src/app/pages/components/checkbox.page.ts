import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellCheckbox } from 'hell';

@Component({
  selector: 'hd-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellCheckbox],
  template: `
    <article class="hd-prose">
      <h1>Checkbox</h1>
      <p>Two- or three-state checkbox. Bind <code>checked</code> and listen
        for <code>checkedChange</code>; <code>indeterminate</code> is also
        supported for parent/child group patterns. The host is a
        <code>&lt;button&gt;</code>, so wrapping in a <code>&lt;label&gt;</code>
        (or any <code>label[for]</code> mechanism) toggles it natively.</p>

      <h2>Examples</h2>
      <p>
        Wrap the checkbox in a <code>&lt;label&gt;</code> (directly or via
        <code>hellField</code>) — because the host is a real
        <code>&lt;button&gt;</code>, the browser handles label clicks for
        free.
      </p>
      <div class="hd-example grid gap-2 max-w-md">
        <label class="inline-flex items-center gap-2">
          <button
            hellCheckbox
            [checked]="agree()"
            (checkedChange)="agree.set($event)"
          ></button>
          I agree to the terms
        </label>
        <label class="inline-flex items-center gap-2">
          <button hellCheckbox indeterminate></button>
          Indeterminate (parent of mixed children)
        </label>
        <label class="inline-flex items-center gap-2">
          <button hellCheckbox disabled></button>
          Disabled
        </label>
        <label class="inline-flex items-center gap-2">
          <button hellCheckbox checked disabled></button>
          Disabled, checked
        </label>
      </div>

      <p>Current value: <code>{{ agree() }}</code></p>

      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code></li>
        <li><code>indeterminate</code>, <code>indeterminateChange</code></li>
        <li><code>disabled</code>, <code>required</code></li>
      </ul>
    </article>
  `,
})
export class CheckboxPage {
  protected readonly agree = signal(false);
}
